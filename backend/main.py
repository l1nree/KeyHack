from fastapi import FastAPI, WebSocket

app = FastAPI()

@app.get("/")
async def root():
    return {"status": "FastAPI Server is running!"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Эхо сервера: {data}")