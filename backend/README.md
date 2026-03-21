# Cognitive Graph Engine - FastAPI Backend

A semantic knowledge graph powered by Snowflake Arctic Embed embeddings. The engine creates nodes from text input and automatically forms connections based on multi-factor scoring (semantic similarity + keyword overlap + temporal proximity).

## Features

- **768-dimensional embeddings** via Snowflake Arctic Embed
- **Multi-factor scoring**: 60% semantic + 20% keyword + 20% temporal
- **LRU caching** for deterministic embeddings
- **Vector similarity search** with Snowflake's native VECTOR type
- **Continuous Intelligence pipeline**: Auto-recomputes scores, detects clusters, applies time decay
- **Async API** with FastAPI for high performance

## Quick Start

### 1. Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Snowflake credentials
```

### 3. Run

```bash
# Start development server
uvicorn app.main:app --reload --port 3000

# Or with custom host/port
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:3000`

## API Endpoints

### POST /node
Create a new node from text input.

```bash
curl -X POST http://localhost:3000/node \
  -H "Content-Type: application/json" \
  -d '{"text": "Machine learning is a subset of artificial intelligence"}'
```

**Response:**
```json
{
  "node": {
    "id": "uuid-here",
    "text": "Machine learning is a subset of artificial intelligence",
    "timestamp": 1710000000000
  },
  "edges": [
    {
      "source": "uuid-here",
      "target": "other-node-uuid",
      "score": 0.8234,
      "semantic": 0.85,
      "keyword": 0.70,
      "time": 0.90
    }
  ]
}
```

### GET /graph
Retrieve the entire graph (all nodes and edges).

```bash
curl http://localhost:3000/graph
```

### GET /node/{id}
Retrieve a specific node with its connections.

```bash
curl http://localhost:3000/node/{node-id}
```

### GET /health
Health check endpoint.

```bash
curl http://localhost:3000/health
```

## API Documentation

FastAPI automatically generates interactive documentation:

- **Swagger UI**: http://localhost:3000/docs
- **ReDoc**: http://localhost:3000/redoc

## Architecture

```
Text Input
    ↓
Generate Embedding (Snowflake Arctic Embed 768)
    ↓
Store Node
    ↓
Vector Similarity Search (fetch candidates)
    ↓
Multi-Factor Scoring (semantic + keyword + time)
    ↓
Create Edges (threshold filter + max-3 constraint)
    ↓
Trigger CI Pipeline (async)
    • Recompute nearby edges
    • Detect clusters
    • Apply time decay
```

## Configuration

Environment variables in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `SCORE_THRESHOLD` | 0.7 | Minimum score for edge creation |
| `MAX_EDGES_PER_NODE` | 3 | Maximum outgoing edges per node |
| `TIME_DECAY_HALFLIFE` | 86400000 | Time decay half-life (24h in ms) |
| `CANDIDATE_LIMIT` | 20 | Max candidates from vector search |
| `EMBEDDING_CACHE_CAPACITY` | 500 | LRU cache size |

## Development

```bash
# Install dev dependencies
pip install pytest pytest-asyncio black ruff mypy

# Format code
black app/

# Lint
ruff check app/

# Type check
mypy app/
```

## License

MIT
