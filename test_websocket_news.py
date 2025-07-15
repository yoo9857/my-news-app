import asyncio
import websockets

async def test_news_websocket():
    uri = "ws://localhost:8000/ws/realtime-news"
    try:
        async with websockets.connect(uri) as websocket:
            print(f"Connected to {uri}")
            while True:
                message = await websocket.recv()
                print(f"Received: {message}")
    except Exception as e:
        print(f"WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_news_websocket())