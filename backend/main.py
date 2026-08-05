from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
import logging

from database import connect_dbs, close_dbs, get_sqlite, get_redis

# Включаем логирование
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

@app.get("/")
async def root():
    return {"status": "FastAPI Server is running!"}

# Убедитесь, что здесь НЕТ слэша на конце!
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.info("Попытка подключения по WebSocket...")
    await websocket.accept()
    logger.info("Клиент успешно подключен!")
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Получено сообщение: {data}")
            await websocket.send_text(f"Эхо сервера: {data}")
    except WebSocketDisconnect:
        logger.info("Клиент отключился штатно.")
    except Exception as e:
        logger.error(f"Ошибка WebSocket: {e}")


# Проверка состояния сервера
@app.get("/api/status")
async def status():
    return {"status": "ok", "service": "KeyHack Backend"}

# Проверка обращения к Redis и SQLite
# Двойной декоратор с правильными путями
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
        logger.error(f"Ошибка SQLite: {e}")

    try:
        redis_db = get_redis()
        await redis_db.ping()
        response["redis"] = "ok"
    except Exception as e:
        response["redis"] = f"error: {str(e)}"
        logger.error(f"Ошибка Redis: {e}")

    return response