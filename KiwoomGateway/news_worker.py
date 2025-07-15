import os
import requests
import json
import time
import aio_pika
import asyncio
import html
import logging
from dateutil import parser

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Naver News API ---
def fetch_naver_news(query='경제', display=30):
    client_id = os.getenv("NAVER_CLIENT_ID")
    client_secret = os.getenv("NAVER_CLIENT_SECRET")
    if not client_id or not client_secret:
        logging.error("Naver API credentials not found.")
        return []

    headers = {"X-Naver-Client-Id": client_id, "X-Naver-Client-Secret": client_secret}
    url = f"https://openapi.naver.com/v1/search/news.json?query={query}&display={display}&sort=date"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        articles = []
        for item in data.get("items", []):
            url = item.get("originallink") or item.get("link")
            pub_date_str = item.get("pubDate")
            if pub_date_str and url:
                try:
                    iso_date = parser.parse(pub_date_str).isoformat()
                    articles.append({
                        "title": html.unescape(item.get("title", "")),
                        "url": url,
                        "description": html.unescape(item.get("description", "")),
                        "published_at": iso_date,
                        "source": item.get("originallink")
                    })
                except parser.ParserError:
                    logging.warning(f"Could not parse date: {pub_date_str}")
        return articles
    except Exception as e:
        logging.error(f"Error in fetch_naver_news: {e}", exc_info=True)
        return []

# --- Main Worker Loop ---
async def main():
    logging.info("--- News Worker Started (Restored Logic) ---")
    connection_url = f"amqp://{os.getenv('RABBITMQ_USER', 'myuser')}:{os.getenv('RABBITMQ_PASSWORD', 'mypassword')}@{os.getenv('RABBITMQ_HOST', 'rabbitmq')}/"
    
    while True:
        try:
            connection = await aio_pika.connect_robust(connection_url)
            async with connection:
                channel = await connection.channel()
                # Declare the exchange
                exchange = await channel.declare_exchange('news_exchange', aio_pika.ExchangeType.DIRECT, durable=True)
                # Declare the queue
                queue = await channel.declare_queue('news_queue', durable=True)
                # Bind the queue to the exchange
                await queue.bind(exchange, routing_key='news_key')
                
                logging.info("--- Starting new fetch cycle ---")
                news_items = fetch_naver_news()
                
                if news_items:
                    logging.info(f"Fetched {len(news_items)} articles. Sending to RabbitMQ...")
                    await exchange.publish(
                        aio_pika.Message(body=json.dumps(news_items).encode()),
                        routing_key='news_key',
                    )
                else:
                    logging.info("No news articles found.")
            
            await asyncio.sleep(60)
        except Exception as e:
            logging.error(f"An error occurred in main loop: {e}", exc_info=True)
            await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(main())