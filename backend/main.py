import json
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from pydantic import BaseModel
from contextlib import asynccontextmanager
import logging

from database import connect_dbs, close_dbs, get_sqlite, get_redis

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

# --- МОДЕЛИ И РОУТ РЕГИСТРАЦИИ ---
class RegisterRequest(BaseModel):
    nickname: str

class RegisterResponse(BaseModel):
    player_id: str
    nickname: str

# Дублируем декораторы, чтобы Nginx гарантированно нашел путь
@app.post("/api/register", response_model=RegisterResponse)
@app.post("/register", response_model=RegisterResponse)
async def register_player(req: RegisterRequest):
    player_id = str(uuid.uuid4())
    db = get_sqlite()
    
    try:
        await db.execute(
            "INSERT INTO players (id, nickname) VALUES (?, ?)",
            (player_id, req.nickname)
        )
        await db.commit()
        logger.info(f"Зарегистрирован новый игрок: {req.nickname} ({player_id})")
        return RegisterResponse(player_id=player_id, nickname=req.nickname)
    except Exception as e:
        logger.error(f"Ошибка при регистрации игрока: {e}")
        return {"error": str(e)}

# --- МЕНЕДЖЕР СОЕДИНЕНИЙ ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, player_id: str):
        await websocket.accept()
        self.active_connections[player_id] = websocket
        logger.info(f"Игрок {player_id} подключен. Онлайн: {len(self.active_connections)}")

    def disconnect(self, player_id: str):
        if player_id in self.active_connections:
            del self.active_connections[player_id]
            logger.info(f"Игрок {player_id} отключен.")

    async def send_personal_message(self, message: dict, player_id: str):
        if player_id in self.active_connections:
            await self.active_connections[player_id].send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

# --- WEBSOCKET ЭНДПОИНТ ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, player_id: str = Query(...)):
    db = get_sqlite()
    
    # Проверяем, есть ли такой игрок в БД
    async with db.execute("SELECT nickname FROM players WHERE id = ?", (player_id,)) as cursor:
        row = await cursor.fetchone()
        
    if not row:
        logger.warning(f"Отказ: игрок {player_id} не найден в БД")
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
                await manager.send_personal_message({
                    "type": "error", "payload": {"message": "Invalid JSON"}
                }, player_id)
                continue
                
            msg_type = parsed_data.get("type")
            payload = parsed_data.get("payload", {})
            
            if msg_type == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "payload": {"message": f"Сервер видит тебя, {nickname}!"}
                }, player_id)
            else:
                await manager.send_personal_message({
                    "type": "error", "payload": {"message": "Unknown type"}
                }, player_id)
                
    except WebSocketDisconnect:
        manager.disconnect(player_id)
    except Exception as e:
        logger.error(f"Ошибка WS для {player_id}: {e}")
        manager.disconnect(player_id)

# --- РОУТЫ СТАТУСА ---
@app.get("/api/status")
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
        response["sqlite"] = f"error: {str(e)}"

    try:
        redis_db = get_redis()
        await redis_db.ping()
        response["redis"] = "ok"
    except Exception as e:
        response["redis"] = f"error: {str(e)}"

    return response