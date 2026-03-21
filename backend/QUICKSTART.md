# Quick Start Guide

## Starting NeuroChain with Continuous Background Compute

### Prerequisites

Ensure you have all dependencies installed:
```bash
cd backend
pip install -r requirements.txt
```

### Option 1: Run Both Services (Recommended)

Open **two separate terminals**:

#### Terminal 1: Start the API Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

#### Terminal 2: Start the Background Worker
```bash
cd backend
scripts\start_worker.bat        # Windows
# OR
./scripts/start_worker.sh       # Linux/Mac
```

### Option 2: Test Mode (Without Background Worker)

If you want to test without the background worker running:

1. Edit `app/tasks/__init__.py` and set `immediate=True`:
```python
huey = SqliteHuey(
    'neurochain',
    filename=os.path.join(os.path.dirname(__file__), '../../huey.db'),
    immediate=True,  # Tasks execute immediately (synchronous)
    results=True,
    store_none=False,
    utc=True,
)
```

2. Start only the API server:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Note:** In `immediate=True` mode, background tasks run synchronously, blocking the API response. This is only for testing.

### Verify Everything is Working

#### 1. Check API is Running
```bash
curl http://localhost:8000/graph
```

#### 2. Create a Test Node
```bash
curl -X POST http://localhost:8000/node \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"AI will transform education systems\"}"
```

#### 3. Check Logs

**API Logs (Terminal 1):**
```
[INFO] Creating node for text: "AI will transform education systems"
[INFO] Node stored: abc-123-def
[INFO] Triggering background re-evaluation for node abc-123-def
```

**Worker Logs (Terminal 2 or `logs/huey.log`):**
```
[INFO] Starting full graph re-evaluation for new node: abc-123-def
[INFO] Full graph re-evaluation triggered: 3 high priority, 8 medium priority, 25 low priority tasks
[INFO] Re-evaluating connection: abc-123-def <-> xyz-789
[INFO] Re-evaluation complete: {"status": "created", "score": 0.82}
```

#### 4. Check for Duplicates
```bash
# Try adding similar text - should get 409 Conflict
curl -X POST http://localhost:8000/node \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Artificial intelligence will transform education\"}"
```

Expected response:
```json
{
  "detail": "Duplicate node detected (strong confidence): abc-123-def (similarity: 0.87)"
}
```

### Running the Test Script

```bash
cd backend
python test_enhancements.py
```

This will test:
- Individual similarity methods
- Enhanced composite similarity
- Task queue configuration
- Embedding generation (requires Snowflake)

### Troubleshooting

**Issue: Worker won't start**
```bash
# Install huey if missing
pip install huey

# Try running directly
huey_consumer app.tasks.workers.huey -w 4 -k thread -v
```

**Issue: Tasks not executing**
```bash
# Check if worker is running
# Windows
tasklist | findstr python

# Linux/Mac
ps aux | grep huey
```

**Issue: "Duplicate node detected" for different content**
- Adjust threshold in `app/services/enhanced_similarity_service.py`
- Lower `MODERATE_SIMILARITY_SCORE` from 0.65 to 0.55

**Issue: Background tasks too slow**
- Increase worker threads: `huey_consumer app.tasks.workers.huey -w 8 -k thread`
- Reduce priority levels in `app/tasks/workers.py`

### Production Deployment

For production:

1. Use Redis instead of SQLite for task queue:
```python
from huey import RedisHuey

huey = RedisHuey('neurochain', host='localhost', port=6379)
```

2. Run worker as system service:
```bash
# Create systemd service (Linux)
sudo nano /etc/systemd/system/neurochain-worker.service
```

```ini
[Unit]
Description=NeuroChain Background Worker
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/backend
ExecStart=/path/to/venv/bin/huey_consumer app.tasks.workers.huey -w 4 -k thread
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable neurochain-worker
sudo systemctl start neurochain-worker
```

### Configuration

#### Adjust Similarity Thresholds
Edit `app/services/enhanced_similarity_service.py`:
```python
# For stricter duplicate detection (fewer false positives)
MODERATE_SIMILARITY_SCORE = 0.75  # Increase from 0.65

# For looser duplicate detection (more merging)
MODERATE_SIMILARITY_SCORE = 0.55  # Decrease from 0.65
```

#### Adjust Background Re-evaluation Priority
Edit `app/tasks/workers.py`:
```python
# Process all nodes with same priority
PRIORITY_HIGH = 5
PRIORITY_MEDIUM = 5
PRIORITY_LOW = 5

# Prioritize only immediate neighbors
PRIORITY_HIGH = 1
PRIORITY_MEDIUM = 10
PRIORITY_LOW = 10
```

#### Disable Periodic Maintenance
Comment out in `app/tasks/workers.py`:
```python
# @huey.periodic_task(crontab(minute='*/30'))
# def periodic_maintenance():
#     ...
```

### Next Steps

1. ✅ Start both API server and worker
2. ✅ Test creating nodes
3. ✅ Verify background re-evaluation in logs
4. ✅ Test duplicate detection
5. 🔄 Monitor performance
6. 🔄 Adjust thresholds if needed
7. 🔄 Scale to production (Redis + systemd)

### Need Help?

- Check `CONTINUOUS_COMPUTE.md` for detailed documentation
- Run `python test_enhancements.py` to diagnose issues
- Check logs: `tail -f logs/huey.log`
- Monitor task queue: `from app.tasks import huey; print(huey.pending_count())`
