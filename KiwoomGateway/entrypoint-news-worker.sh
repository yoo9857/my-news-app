#!/bin/bash

# Wait for RabbitMQ to be ready
echo "Waiting for rabbitmq..."
/usr/local/bin/wait-for-it.sh rabbitmq:5672 --timeout=60 --strict -- echo "RabbitMQ is up - executing command"

# Execute the original command
exec python news_worker.py