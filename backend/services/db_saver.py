import os
import asyncio
import json
import aio_pika
import asyncpg
from asyncpg.pool import Pool
import logging
from dateutil.parser import parse as parse_datetime

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- 데이터베이스 연결 풀 ---
async def get_db_pool() -> Pool:
    return await asyncpg.create_pool(
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        database=os.getenv("POSTGRES_DB"),
        host=os.getenv("POSTGRES_HOST"),
        port=os.getenv("POSTGRES_PORT"),
        min_size=1,
        max_size=10
    )

# --- 데이터 처리 함수들 (비동기 버전) ---
async def upsert_news_articles(pool: Pool, articles: list):
    if not articles:
        return
    async with pool.acquire() as conn:
        values = [
            (
                a.get('title'), a.get('url'), a.get('source'),
                parse_datetime(a['published_at']) if a.get('published_at') else None, # Convert string to datetime
                a.get('sentiment_score'), a.get('sentiment_label')
            ) for a in articles
        ]
        await conn.executemany("""
            INSERT INTO news_articles (title, url, source, published_at, sentiment_score, sentiment_label)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (url) DO UPDATE SET
                title = EXCLUDED.title,
                source = EXCLUDED.source,
                published_at = EXCLUDED.published_at,
                sentiment_score = EXCLUDED.sentiment_score,
                sentiment_label = EXCLUDED.sentiment_label;
        """, values)
        logging.info(f"Successfully upserted {len(articles)} news articles.")

# --- 메인 로직 ---
async def main():
    logging.info("--- DB Saver Service Started (Async Version) ---")
    db_pool = await get_db_pool()
    
    connection_url = f"amqp://{os.getenv('RABBITMQ_DEFAULT_USER', 'myuser')}:{os.getenv('RABBITMQ_DEFAULT_PASS', 'mypassword')}@{os.getenv('RABBITMQ_HOST', 'rabbitmq')}/"
    
    while True:
        try:
            connection = await aio_pika.connect_robust(connection_url)
            async with connection:
                channel = await connection.channel()
                await channel.set_qos(prefetch_count=10)

                exchange = await channel.declare_exchange('news_analyzed_exchange', aio_pika.ExchangeType.DIRECT, durable=True)
                queue = await channel.declare_queue('news_analyzed_queue', durable=True)
                await queue.bind(exchange, routing_key='news_analyzed_key')

                logging.info("[*] Waiting for messages. To exit press CTRL+C")
                
                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        async with message.process():
                            try:
                                data = json.loads(message.body)
                                await upsert_news_articles(db_pool, data)
                            except Exception as e:
                                logging.error(f"Failed to process message: {e}", exc_info=True)
            
        except Exception as e:
            logging.error(f"An error occurred in main loop: {e}", exc_info=True)
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())