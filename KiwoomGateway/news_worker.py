import time
import os

print(f"--- Simple Worker Started at {time.ctime()} ---")
print(f"RabbitMQ Host: {os.getenv('RABBITMQ_HOST')}")

count = 0
while True:
    print(f"[{time.ctime()}] Heartbeat: {count}")
    count += 1
    time.sleep(10)
