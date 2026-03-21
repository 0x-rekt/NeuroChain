# Enhanced Similarity & Continuous Re-evaluation

## Overview

This update adds two major improvements to NeuroChain:

1. **Full-Proof Similarity Checking**: Multi-method similarity detection beyond semantic embeddings
2. **Continuous Background Re-evaluation**: All nodes are re-evaluated when a new node is added

## Features

### 1. Enhanced Similarity Service

The new `enhanced_similarity_service.py` combines **6 different similarity methods** for robust duplicate detection:

| Method | Weight | Description |
|--------|--------|-------------|
| **Semantic** | 40% | Cosine similarity of embeddings (meaning) |
| **Keyword** | 15% | Jaccard similarity of meaningful keywords |
| **Fuzzy** | 15% | Character n-gram matching (handles typos) |
| **Edit Distance** | 10% | Levenshtein ratio (minor edits) |
| **Length Ratio** | 10% | Filters very different lengths |
| **Token Overlap** | 10% | Overall word similarity |

#### Confidence Levels:
- **Strong** (≥0.80): High confidence duplicate
- **Moderate** (≥0.65): Medium confidence duplicate
- **Weak** (≥0.50): Low confidence duplicate
- **None** (<0.50): Not a duplicate

### 2. Continuous Background Compute

When a new node is added via `/node`:

```
1. Node is created and immediate edges are formed
2. Background worker is triggered (Huey task queue)
3. ALL existing nodes are re-evaluated against the new node
4. Priority scheduling:
   - HIGH: Direct neighbors (existing connections)
   - MEDIUM: 2nd degree connections
   - LOW: All other nodes
5. Edges are created, updated, or removed based on current scores
```

This ensures the graph continuously evolves and optimizes connections.

### 3. Enhanced `/node` Endpoint

**New Behavior:**
- Checks for exact duplicates (fast path)
- Uses enhanced similarity for full-proof duplicate detection
- Returns **409 Conflict** if duplicate found
- Triggers background re-evaluation of entire graph

**Example Response (Duplicate):**
```json
{
  "detail": "Duplicate node detected (strong confidence): abc-123 (similarity: 0.87)"
}
```

### 4. Enhanced `/debate/transcription` Endpoint

**New Behavior:**
- Uses composite similarity score (not just semantic)
- More robust merge decisions
- Logs detailed similarity breakdown

**Similarity Threshold:** 0.70 (composite score)

## Setup

### 1. Install Dependencies

Dependencies are already in `requirements.txt`:
- `huey==2.6.0` (task queue)

### 2. Start the Huey Worker

The worker processes background re-evaluation tasks.

**Windows:**
```bash
cd backend
scripts\start_worker.bat
```

**Linux/Mac:**
```bash
cd backend
chmod +x scripts/start_worker.sh
./scripts/start_worker.sh
```

### 3. Start the API Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### 4. Verify It's Working

Check logs for:
```
[INFO] Triggering background re-evaluation for node xyz-789
[INFO] Full graph re-evaluation triggered: 5 high priority, 12 medium priority, 45 low priority tasks
[INFO] Re-evaluating connection: xyz-789 <-> abc-123
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        /node Endpoint                        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─── 1. Duplicate Check (enhanced similarity)
               │
               ├─── 2. Create Node + Immediate Edges
               │
               ├─── 3. Trigger CI Pipeline (async)
               │
               └─── 4. Trigger Background Re-evaluation
                          │
                          ▼
              ┌────────────────────────┐
              │   Huey Task Queue      │
              │  (Priority Scheduling) │
              └────────┬───────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    [HIGH]        [MEDIUM]        [LOW]
   Neighbors   2nd-Degree      All Others
         │             │             │
         └─────────────┴─────────────┘
                       │
                       ▼
         ┌──────────────────────────┐
         │ Re-evaluate Connection   │
         │ - Compute scores         │
         │ - Create/Update/Delete   │
         │ - Check duplicates       │
         └──────────────────────────┘
```

## Configuration

### Similarity Thresholds

Edit `app/services/enhanced_similarity_service.py`:

```python
# Individual method thresholds
SEMANTIC_THRESHOLD = 0.75
KEYWORD_THRESHOLD = 0.5
FUZZY_THRESHOLD = 0.8
EDIT_DISTANCE_THRESHOLD = 0.7
LENGTH_RATIO_MIN = 0.5
TOKEN_OVERLAP_THRESHOLD = 0.6

# Composite thresholds
STRONG_SIMILARITY_SCORE = 0.8
MODERATE_SIMILARITY_SCORE = 0.65
WEAK_SIMILARITY_SCORE = 0.5
```

### Worker Configuration

Edit `app/tasks/__init__.py`:

```python
huey = SqliteHuey(
    'neurochain',
    filename='huey.db',
    immediate=False,  # Set True for testing (no delay)
    results=True,
    store_none=False,
    utc=True,
)
```

### Priority Levels

Edit `app/tasks/workers.py`:

```python
PRIORITY_HIGH = 1    # Immediate neighbors
PRIORITY_MEDIUM = 5  # 2nd degree
PRIORITY_LOW = 10    # All others
```

## Monitoring

### Check Task Queue Status

```python
from app.tasks import huey

# Get pending tasks
pending = huey.pending_count()
print(f"Pending tasks: {pending}")

# Get scheduled tasks
scheduled = huey.scheduled_count()
print(f"Scheduled tasks: {scheduled}")
```

### View Logs

Worker logs: `backend/logs/huey.log`
API logs: Standard output

## API Changes

### POST /node

**Before:**
- Only checked vector similarity for edges
- No duplicate detection
- No background re-evaluation

**After:**
- ✅ Full-proof duplicate detection
- ✅ Returns 409 if duplicate found
- ✅ Triggers background re-evaluation
- ✅ Continuous graph optimization

**Error Responses:**
- `409 Conflict`: Duplicate detected
- `400 Bad Request`: Empty text
- `502 Bad Gateway`: Embedding service failed
- `500 Internal Error`: Other errors

### POST /debate/transcription

**Before:**
- Only semantic similarity (cosine)
- Threshold: 0.75

**After:**
- ✅ Enhanced multi-method similarity
- ✅ Composite score (6 methods)
- ✅ Threshold: 0.70 (composite)
- ✅ Detailed logging

## Performance

### Background Processing
- Tasks execute asynchronously (non-blocking)
- Priority scheduling (neighbors first)
- Configurable worker threads (default: 4)

### Storage
- Task queue: SQLite (`huey.db`)
- Persistent across restarts
- Automatic cleanup of completed tasks

### Scaling
Increase worker threads for higher throughput:
```bash
huey_consumer app.tasks.workers.huey -w 8 -k thread
```

## Troubleshooting

### Worker not starting
1. Check if `huey` is installed: `pip list | grep huey`
2. Check Python path: `which python`
3. Run directly: `huey_consumer app.tasks.workers.huey -w 4 -k thread -v`

### Tasks not executing
1. Check worker is running
2. Check `huey.db` exists
3. Set `immediate=True` for testing (no delay)
4. Check logs: `tail -f logs/huey.log`

### High memory usage
- Reduce worker threads: `-w 2`
- Use process workers: `-k process`
- Limit task batch size

## Testing

### Test Enhanced Similarity

```python
from app.services.enhanced_similarity_service import compute_enhanced_similarity

result = compute_enhanced_similarity(
    "The quick brown fox",
    "The fast brown fox",
    embedding_a,
    embedding_b,
)

print(result.to_dict())
# {
#   "semantic": 0.95,
#   "keyword": 0.75,
#   "fuzzy": 0.88,
#   "edit_distance": 0.90,
#   "length_ratio": 0.95,
#   "token_overlap": 0.75,
#   "composite_score": 0.87,
#   "is_duplicate": true,
#   "confidence": "strong"
# }
```

### Test Background Tasks

```python
from app.tasks.workers import trigger_full_graph_reevaluation

# Schedule immediate test
result = trigger_full_graph_reevaluation("test-node-id")
print(result)
```

## Future Enhancements

- [ ] WebSocket notifications for re-evaluation progress
- [ ] Graph evolution visualization
- [ ] Adaptive thresholds based on domain
- [ ] Distributed workers (Redis backend)
- [ ] Real-time cluster detection
- [ ] Trust score re-computation
- [ ] Consensus mechanism updates

## References

- Huey docs: https://huey.readthedocs.io/
- Task queue patterns: https://python-patterns.guide/
- Similarity methods: See `enhanced_similarity_service.py` docstrings
