import asyncio
import aio_pika
import os
import logging
import json
from fastapi import FastAPI

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logging.info("--- Simple Service (Async) Started ---")
    
    rabbitmq_user = os.getenv("RABBITMQ_USER", "myuser")
    rabbitmq_password = os.getenv("RABBITMQ_PASSWORD", "mypassword")
    rabbitmq_host = os.getenv("RABBITMQ_HOST", "rabbitmq")
    connection_url = f"amqp://{rabbitmq_user}:{rabbitmq_password}@{rabbitmq_host}/"

    async def consume():
        while True:
            try:
                logging.info("Connecting to RabbitMQ...")
                connection = await aio_pika.connect_robust(connection_url)
                async with connection:
                    channel = await connection.channel()
                    queue = await channel.declare_queue('news_queue', durable=True)
                    
                    logging.info("Waiting for messages...")
                    async with queue.iterator() as queue_iter:
                        async for message in queue_iter:
                            async with message.process():
                                body = message.body.decode()
                                logging.info(f"Received: {body}")
            except Exception as e:
                logging.error(f"An error occurred: {e}", exc_info=True)
                await asyncio.sleep(5)

    asyncio.create_task(consume())

@app.get("/api/news")
def get_news():
    return {"success": True, "data": ["This is a test endpoint."]}