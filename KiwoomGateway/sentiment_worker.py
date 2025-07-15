import os
import json
import time
import pika
from transformers import BertTokenizer, BertForSequenceClassification
import torch

# --- Model & Tokenizer Loading ---
MODEL_NAME = "klue/bert-base"
tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
model = BertForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3) # 긍정, 부정, 중립
model.eval()

def analyze_sentiment(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512, padding=True)
    with torch.no_grad():
        outputs = model(**inputs)
    
    logits = outputs.logits
    probs = torch.softmax(logits, dim=-1)
    score = probs.max().item()
    label_id = torch.argmax(probs, dim=-1).item()
    
    labels = ["부정적", "중립적", "긍정적"]
    label = labels[label_id]
    
    return score, label

def get_rabbitmq_connection():
    credentials = pika.PlainCredentials(os.getenv("RABBITMQ_USER"), os.getenv("RABBITMQ_PASSWORD"))
    while True:
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=os.getenv("RABBITMQ_HOST"), credentials=credentials))
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            print(f"RabbitMQ 연결 실패: {e}. 5초 후 재시도합니다.")
            time.sleep(5)

def main():
    # RabbitMQ 연결 (입력 큐와 출력 큐 모두 선언)
    connection = get_rabbitmq_connection()
    channel = connection.channel()
    channel.queue_declare(queue='news_queue', durable=True)
    channel.queue_declare(queue='news_analyzed_queue', durable=True)

    def callback(ch, method, properties, body):
        try:
            articles = json.loads(body)
            analyzed_articles = []
            for article in articles:
                sentiment_score, sentiment_label = analyze_sentiment(article['title'])
                article['sentiment_score'] = sentiment_score
                article['sentiment_label'] = sentiment_label
                analyzed_articles.append(article)
                print(f"뉴스 분석 완료: {article['title']:.30}... -> {sentiment_label} ({sentiment_score:.2f})")

            # 분석된 결과를 다음 큐로 전송
            channel.basic_publish(
                exchange='',
                routing_key='news_analyzed_queue',
                body=json.dumps(analyzed_articles),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            print(f"감성 분석 중 오류 발생: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='news_queue', on_message_callback=callback)

    print('[*] 감성 분석을 위해 뉴스를 기다립니다...')
    channel.start_consuming()

if __name__ == '__main__':
    main()
