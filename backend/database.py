import aiosqlite
import redis.asyncio as redis
from typing import Optional
import logging

# Инициализация логгера для этого файла
logger = logging.getLogger(__name__)

sqlite_conn: Optional[aiosqlite.Connection] = None
redis_client: Optional[redis.Redis] = None

async def connect_dbs():
    global sqlite_conn, redis_client
    
    sqlite_conn = await aiosqlite.connect("keyhack.db")
    
    # Инициализация структуры БД
    await sqlite_conn.execute("""
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            nickname TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    await sqlite_conn.commit()
    
    logger.info("Успешно подключено к SQLite (keyhack.db) и проверена структура")

    redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)
    await redis_client.ping()
    logger.info("Успешно подключено к Redis")

async def close_dbs():
    global sqlite_conn, redis_client
    
    if sqlite_conn:
        await sqlite_conn.close()
        logger.info("Соединение с SQLite закрыто")

    if redis_client:
        await redis_client.close()
        logger.info("Соединение с Redis закрыто")

def get_sqlite() -> aiosqlite.Connection:
    if sqlite_conn is None:
        raise Exception("SQLite не инициализирована")
    return sqlite_conn

def get_redis() -> redis.Redis:
    if redis_client is None:
        raise Exception("Redis не инициализирован")
    return redis_client