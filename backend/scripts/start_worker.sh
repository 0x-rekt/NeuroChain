#!/bin/bash

# Start the Huey worker for background task processing
# This worker processes the continuous re-evaluation tasks

echo "Starting NeuroChain Huey Worker..."

cd "$(dirname "$0")/.."

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d "kenv" ]; then
    source kenv/bin/activate
fi

# Start Huey consumer
# -w: number of worker threads (adjust based on your needs)
# -k: worker type (thread, process, or greenlet)
# -l: log file location
# -v: verbose logging

huey_consumer app.tasks.workers.huey \
    -w 4 \
    -k thread \
    -l logs/huey.log \
    -v

echo "Huey worker stopped."
