import json
import uuid
import random
import string
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from contextlib import asynccontextmanager
import logging

from database import connect_dbs, close_dbs, get_sqlite, get_redis

# Настройка логов
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Инициализация баз данных...")
    await connect_dbs()
    yield
    logger.info("Закрытие соединений с базами данных...")
    await close_dbs()

app = FastAPI(lifespan=lifespan)

class RegisterRequest(BaseModel):
    nickname: str

class RegisterResponse(BaseModel):
    player_id: str
    nickname: str

@app.post("/api/register", response_model=RegisterResponse)
@app.post("/register", response_model=RegisterResponse)
async def register_player(req: RegisterRequest):
    player_id = str(uuid.uuid4())
    db = get_sqlite()
    try:
        await db.execute("INSERT INTO players (id, nickname) VALUES (?, ?)", (player_id, req.nickname))
        await db.commit()
        return RegisterResponse(player_id=player_id, nickname=req.nickname)
    except Exception as e:
        return {"error": str(e)}

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = websocket

    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]

    async def send_personal_message(self, message: dict, player_id: str):
        if player_id in self.active_connections:
            await self.active_connections[player_id].send_text(json.dumps(message))

    async def broadcast_to_players(self, message: dict, player_ids: list):
        for pid in player_ids:
            if pid in self.active_connections:
                await self.active_connections[pid].send_text(json.dumps(message))

manager = ConnectionManager()

def generate_lobby_code(length=4):
    letters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(letters) for i in range(length))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, player_id: str = Query(...)):
    db = get_sqlite()
    redis_db = get_redis()
    
    async with db.execute("SELECT nickname FROM players WHERE id = ?", (player_id,)) as cursor:
        row = await cursor.fetchone()
        
    if not row:
        await websocket.close(code=1008)
        return
        
    nickname = row[0]
    await manager.connect(websocket, player_id)
    
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                parsed_data = json.loads(raw_data)
            except json.JSONDecodeError:
                continue
                
            msg_type = parsed_data.get("type")
            payload = parsed_data.get("payload", {})
            
            if msg_type == "ping":
                await manager.send_personal_message({"type": "pong", "payload": {"message": f"Сервер видит тебя, {nickname}!"}}, player_id)
                
            elif msg_type == "create_lobby":
                max_players = payload.get("max_players", 4)
                lobby_code = generate_lobby_code()
                
                lobby_data = {
                    "host_id": player_id,
                    "max_players": max_players,
                    "status": "waiting",
                    "players": {
                        player_id: {"nickname": nickname, "is_ready": False}
                    }
                }
                await redis_db.set(f"lobby:{lobby_code}", json.dumps(lobby_data), ex=3600)
                await manager.send_personal_message({
                    "type": "lobby_update",
                    "payload": {"lobby_code": lobby_code, "lobby_data": lobby_data}
                }, player_id)
                
            elif msg_type == "join_lobby":
                lobby_code = payload.get("lobby_code", "").upper()
                lobby_key = f"lobby:{lobby_code}"
                
                lobby_json = await redis_db.get(lobby_key)
                if not lobby_json:
                    await manager.send_personal_message({"type": "error", "payload": {"message": "Сессия не найдена"}}, player_id)
                    continue
                    
                lobby_data = json.loads(lobby_json)
                
                if lobby_data["status"] != "waiting":
                    await manager.send_personal_message({"type": "error", "payload": {"message": "Игра уже началась"}}, player_id)
                    continue
                    
                if len(lobby_data["players"]) >= lobby_data["max_players"] and player_id not in lobby_data["players"]:
                    await manager.send_personal_message({"type": "error", "payload": {"message": "Сессия заполнена"}}, player_id)
                    continue
                    
                if player_id not in lobby_data["players"]:
                    lobby_data["players"][player_id] = {"nickname": nickname, "is_ready": False}
                    await redis_db.set(lobby_key, json.dumps(lobby_data), ex=3600)
                
                player_ids = list(lobby_data["players"].keys())
                await manager.broadcast_to_players({
                    "type": "lobby_update",
                    "payload": {"lobby_code": lobby_code, "lobby_data": lobby_data}
                }, player_ids)
                
            # --- ШАГ 5: ИЗМЕНЕНИЕ ГОТОВНОСТИ И СТАРТ ---
            elif msg_type == "set_ready":
                lobby_code = payload.get("lobby_code", "").upper()
                is_ready = payload.get("is_ready", True)
                
                lobby_key = f"lobby:{lobby_code}"
                lobby_json = await redis_db.get(lobby_key)
                
                if lobby_json:
                    lobby_data = json.loads(lobby_json)
                    if player_id in lobby_data["players"]:
                        # Обновляем статус готовности игрока
                        lobby_data["players"][player_id]["is_ready"] = is_ready
                        await redis_db.set(lobby_key, json.dumps(lobby_data), ex=3600)
                        
                        player_ids = list(lobby_data["players"].keys())
                        
                        # Рассылаем всем новый статус лобби
                        await manager.broadcast_to_players({
                            "type": "lobby_update",
                            "payload": {"lobby_code": lobby_code, "lobby_data": lobby_data}
                        }, player_ids)
                        
                        # ПРОВЕРКА СТАРТА: Все готовы и игроков минимум 2
                        all_ready = all(p["is_ready"] for p in lobby_data["players"].values())
                        if all_ready and len(lobby_data["players"]) >= 2:
                            lobby_data["status"] = "playing"
                            await redis_db.set(lobby_key, json.dumps(lobby_data), ex=3600)
                            
                            # Рассылаем команду начала игры
                            await manager.broadcast_to_players({
                                "type": "match_start",
                                "payload": {"message": "ВНИМАНИЕ! Соединение установлено. Начинаем взлом!"}
                            }, player_ids)

    except WebSocketDisconnect:
        manager.disconnect(player_id)
    except Exception as e:
        manager.disconnect(player_id)

@app.get("/api/status")
@app.get("/status")
async def status():
    return {"status": "ok"}

@app.get("/api/db-status")
@app.get("/db-status")
async def check_db_status():
    response = {"sqlite": "disconnected", "redis": "disconnected"}
    try:
        sqlite_db = get_sqlite()
        async with sqlite_db.execute("SELECT 1") as cursor:
            await cursor.fetchone()
        response["sqlite"] = "ok"
    except Exception as e:
        pass
    try:
        redis_db = get_redis()
        await redis_db.ping()
        response["redis"] = "ok"
    except Exception as e:
        pass
    return response