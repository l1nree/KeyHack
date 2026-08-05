import aiosqlite
import redis.asyncio as redis
from typing import Optional

# Глобальные переменные для хранения соединений
sqlite_conn: Optional[aiosqlite.Connection] = None
redis_client: Optional[redis.Redis] = None

async def connect_dbs():
    global sqlite_conn, redis_client
    
    # Подключаемся к SQLite (создаст файл keyhack.db, если его нет)
    sqlite_conn = await aiosqlite.connect("keyhack.db")
    print("Успешно подключено к SQLite (keyhack.db)")

    # Подключаемся к локальному Redis
    redis_client = redis.from_url("redis://localhost:6379", decode_responses=True)
    
    # Пингуем Redis для проверки соединения
    await redis_client.ping()
    print("Успешно подключено к Redis")

async def close_dbs():
    global sqlite_conn, redis_client
    
    # Закрываем SQLite
    if sqlite_conn:
        await sqlite_conn.close()
        print("Соединение с SQLite закрыто")

    # Закрываем Redis
    if redis_client:
        await redis_client.close()
        print("Соединение с Redis закрыто")

# Функции-хелперы для использования в других частях приложения
def get_sqlite() -> aiosqlite.Connection:
    if sqlite_conn is None:
        raise Exception("SQLite не инициализирована")
    return sqlite_conn

def get_redis() -> redis.Redis:
    if redis_client is None:
        raise Exception("Redis не инициализирован")
    return redis_client