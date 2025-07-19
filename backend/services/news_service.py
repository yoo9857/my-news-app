import asyncio
import aio_pika
import os
import logging
import json
import asyncpg
from fastapi import FastAPI

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logging.info("--- Simple Service (Async) Started ---")
    
    # PostgreSQL connection pool
    retries = 5
    delay = 5
    for i in range(retries):
        try:
            app.state.db_pool = await asyncpg.create_pool(
                user=os.getenv("POSTGRES_USER"),
                password=os.getenv("POSTGRES_PASSWORD"),
                database=os.getenv("POSTGRES_DB"),
                host=os.getenv("POSTGRES_HOST"),
                port=os.getenv("POSTGRES_PORT")
            )
            logging.info("PostgreSQL connection pool created successfully.")
            break
        except Exception as e:
            logging.error(f"Attempt {i+1}/{retries} to connect to PostgreSQL failed: {e}")
            if i < retries - 1:
                await asyncio.sleep(delay)
            else:
                raise

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

@app.on_event("shutdown")
async def shutdown_event():
    await app.state.db_pool.close()
    logging.info("PostgreSQL connection pool closed.")

@app.get("/api/news")
async def get_news(limit: int = 30):
    async with app.state.db_pool.acquire() as conn:
        news = await conn.fetch(
            "SELECT title, url, source, published_at, sentiment_score, sentiment_label FROM news_articles ORDER BY published_at DESC LIMIT $1",
            limit
        )
        return {"success": True, "data": [dict(n) for n in news]}