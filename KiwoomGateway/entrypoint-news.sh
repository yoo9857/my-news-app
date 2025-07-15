#!/bin/bash

# Wait for RabbitMQ to be ready using wait-for-it.sh
echo "Waiting for rabbitmq..."
/usr/local/bin/wait-for-it.sh rabbitmq:5672 --timeout=60 --strict -- echo "RabbitMQ is up - executing command"

# Execute the original command
exec uvicorn news_service:app --host 0.0.0.0 --port 8002
