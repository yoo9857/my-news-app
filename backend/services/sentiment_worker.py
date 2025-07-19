import os
import json
import asyncio
import aio_pika
import logging
from transformers import BertTokenizer, BertForSequenceClassification
import torch
from concurrent.futures import ProcessPoolExecutor

# --- 로깅 설정 ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Model & Tokenizer Loading ---
MODEL_NAME = "klue/bert-base"
logging.info(f"Loading model: {MODEL_NAME}")
tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
model = BertForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3)
model.eval()
logging.info("Model loading complete.")

def analyze_sentiment_sync(text):
    """Synchronous function to be run in a separate process."""
    try:
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1)
        score = probs.max().item()
        label_id = torch.argmax(probs, dim=-1).item()
        
        labels = ["부정적", "중립적", "긍정적"]
        base_label = labels[label_id]
        
        # Detailed labeling based on score
        # Detailed labeling based on score
        if base_label == "긍정적":
            if score >= 0.95:
                label = "강한 긍정"
            elif score >= 0.85:
                label = "긍정적"
            elif score >= 0.60: # Threshold lowered to 60%
                label = "약한 긍정"
            else:
                label = "중립적"
        elif base_label == "부정적":
            if score >= 0.95:
                label = "강한 부정"
            elif score >= 0.85:
                label = "부정적"
            elif score >= 0.60: # Threshold lowered to 60%
                label = "약한 부정"
            else:
                label = "중립적"
        else: # base_label is "중립적"
            label = "중립적"

        return score, label
    except Exception as e:
        logging.error(f"Error during sentiment analysis for text '{text[:50]}...': {e}", exc_info=True)
        return None, None

async def main():
    logging.info("--- Sentiment Worker Started (Async Version) ---")
    loop = asyncio.get_running_loop()
    executor = ProcessPoolExecutor()

    connection_url = f"amqp://{os.getenv('RABBITMQ_DEFAULT_USER', 'myuser')}:{os.getenv('RABBITMQ_DEFAULT_PASS', 'mypassword')}@{os.getenv('RABBITMQ_HOST', 'rabbitmq')}/"
    
    while True:
        try:
            connection = await aio_pika.connect_robust(connection_url)
            async with connection:
                channel = await connection.channel()
                await channel.set_qos(prefetch_count=1)

                # Input queue
                in_exchange = await channel.declare_exchange('news_exchange', aio_pika.ExchangeType.DIRECT, durable=True)
                in_queue = await channel.declare_queue('news_queue', durable=True)
                await in_queue.bind(in_exchange, routing_key='news_key')

                # Output queue
                out_exchange = await channel.declare_exchange('news_analyzed_exchange', aio_pika.ExchangeType.DIRECT, durable=True)
                out_queue = await channel.declare_queue('news_analyzed_queue', durable=True)
                await out_queue.bind(out_exchange, routing_key='news_analyzed_key')

                logging.info("[*] Waiting for messages...")
                
                async with in_queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        async with message.process():
                            try:
                                articles = json.loads(message.body)
                                analyzed_articles = []
                                for article in articles:
                                    score, label = await loop.run_in_executor(executor, analyze_sentiment_sync, article['title'])
                                    if score is not None:
                                        article['sentiment_score'] = score
                                        article['sentiment_label'] = label
                                        analyzed_articles.append(article)
                                        logging.info(f"Analyzed: {article['title'][:30]}... -> {label} ({score:.2f})")
                                
                                if analyzed_articles:
                                    await out_exchange.publish(
                                        aio_pika.Message(body=json.dumps(analyzed_articles).encode()),
                                        routing_key='news_analyzed_key'
                                    )
                            except Exception as e:
                                logging.error(f"Failed to process message batch: {e}", exc_info=True)
            
        except Exception as e:
            logging.error(f"An error occurred in main loop: {e}", exc_info=True)
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())