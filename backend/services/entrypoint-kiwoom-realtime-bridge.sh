#!/bin/bash

# Wait for Redis to be ready
echo "Waiting for redis..."
/usr/local/bin/wait-for-it.sh redis:6379 --timeout=60 --strict -- echo "Redis is up - executing command"

# Execute the original command
exec python kiwoom_realtime_server.py