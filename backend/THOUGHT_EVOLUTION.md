# Thought Evolution & Creativity Tracking

## Overview

NeuroChain now tracks **thought evolution and creativity** instead of blocking duplicates. This allows you to:

1. **Track how thoughts evolve over time**
2. **Measure creativity of each evolution**
3. **See who contributed to each thought**
4. **Analyze thought flow patterns**
5. **Understand collaborative thinking**

## Key Concepts

### 🧠 Thought Evolution

When similar thoughts are submitted, they're **merged together** rather than rejected:

```
Original Thought: "AI will change education"
   ↓
Evolution 1: "Artificial intelligence will transform how we teach"
   ↓
Evolution 2: "Machine learning can personalize student learning"
```

Each evolution is tracked with:
- **Similarity score** - How similar to existing thought
- **Creativity delta** - How novel this evolution is
- **Contributor** - Who added this evolution
- **Timestamp** - When it was added

### 📊 Creativity Scoring

**Creativity = 1 - Similarity**

| Similarity | Creativity | Meaning |
|------------|------------|---------|
| 0.9 - 1.0  | 0.0 - 0.1  | Nearly identical (repetitive) |
| 0.7 - 0.9  | 0.1 - 0.3  | Minor variations |
| 0.5 - 0.7  | 0.3 - 0.5  | Moderate evolution |
| 0.3 - 0.5  | 0.5 - 0.7  | Significant evolution |
| 0.0 - 0.3  | 0.7 - 1.0  | Highly creative |

### 📝 Accumulated Text

**IMPORTANT: `accumulated_text` stores ALL evolved thoughts, not just the last one!**

#### For `/node` endpoint:

```
primary_text: "AI will change education" (original)

accumulated_text:
"AI will change education

[user1] #1: Artificial intelligence will transform how we teach

[user2] #2: Machine learning can personalize student learning"
```

#### For `/debate/transcription` endpoint:

```
primary_text: "We should adopt AI in schools" (original)

accumulated_text:
"We should adopt AI in schools

[Speaker A]: We should definitely implement AI tools in education

[Speaker B]: AI can help teachers focus on what matters most"
```

**Each merge appends to `accumulated_text` with contributor attribution!**

## API Changes

### POST `/node` - Create or Evolve Thought

**Before (old behavior):**
- ❌ Blocked duplicates with 409 error
- ❌ No evolution tracking
- ❌ No creativity metrics

**After (new behavior):**
- ✅ Merges similar thoughts
- ✅ Tracks evolution history
- ✅ Calculates creativity scores
- ✅ Records contributors

#### Request

```json
{
  "text": "AI will transform education systems",
  "contributor": "alice@example.com"  // Optional
}
```

#### Response (New Thought)

```json
{
  "node": {
    "id": "abc-123",
    "text": "AI will transform education systems",
    "timestamp": 1710000000000
  },
  "edges": [...],
  "action": "created",
  "merge_count": 0,
  "creativity_score": 1.0,
  "contributors": ["alice@example.com"],
  "evolution_analysis": {
    "total_evolutions": 0,
    "average_creativity": 0.0,
    "overall_creativity": 1.0,
    "contributor_count": 1,
    "is_original": true,
    "evolution_trend": "new_thought"
  }
}
```

#### Response (Evolved Thought)

```json
{
  "node": {
    "id": "abc-123",  // Same ID - thought evolved
    "text": "Machine learning will revolutionize teaching",
    "timestamp": 1710000000000
  },
  "edges": [...],
  "action": "merged",
  "merge_count": 2,
  "creativity_score": 0.65,
  "contributors": ["alice@example.com", "bob@example.com"],
  "evolution_analysis": {
    "total_evolutions": 2,
    "average_creativity": 0.55,
    "overall_creativity": 0.65,
    "contributor_count": 2,
    "contributors": ["alice@example.com", "bob@example.com"],
    "is_original": false,
    "evolution_trend": "moderately_creative",
    "first_contribution": 1710000000000,
    "last_contribution": 1710002000000
  }
}
```

### POST `/debate/transcription` - Same Behavior

The debate endpoint **already** accumulates ALL merged texts:

```json
{
  "speaker": "Speaker A",
  "text": "AI can help personalize learning"
}
```

**Response shows:**
- `action`: "merged" or "created"
- `merge_count`: Number of times merged
- `accumulated_length`: Total length of all accumulated text

#### Viewing Accumulated Text

```http
GET /debate/node/:node_id
```

Response includes:
```json
{
  "id": "debate-xyz",
  "primary_text": "Original statement",
  "accumulated_text": "Original statement\n\n[Speaker A]: Evolution 1\n\n[Speaker B]: Evolution 2",
  "merge_count": 2,
  "merge_history": [...]
}
```

## Evolution Tracking Fields

### GraphNode (Regular Nodes)

```python
{
  # Core fields
  "id": str,
  "text": str,  # Current/latest text
  "timestamp": int,  # Original creation time
  "embedding": List[float],

  # Evolution tracking
  "primary_text": str,  # Original first text
  "accumulated_text": str,  # ALL evolutions combined
  "merge_count": int,  # Number of evolutions
  "evolution_history": List[ThoughtEvolution],
  "contributors": List[str],  # All contributors
  "creativity_score": float,  # Overall creativity [0-1]
  "last_updated": int  # Last evolution timestamp
}
```

### DebateNode (Debate Transcriptions)

```python
{
  # Core fields
  "id": str,
  "primary_text": str,  # First transcription
  "accumulated_text": str,  # ALL transcriptions combined
  "embedding": List[float],

  # Evolution tracking
  "created_at": int,
  "last_updated": int,
  "merge_count": int,
  "merge_history": List[MergeRecord],
  "speakers": List[str]  # All speakers
}
```

## Merge Decision Thresholds

### Regular Nodes (`/node`)

| Similarity | Action | Reason |
|------------|--------|--------|
| ≥ 0.80 | Merge | High similarity - same thought |
| ≥ 0.65 | Merge | Medium similarity - evolution |
| ≥ 0.50 | Merge | Low similarity - related thought |
| < 0.50 | Create New | Distinct thought |

### Debate Nodes (`/debate/transcription`)

| Similarity | Action | Reason |
|------------|--------|--------|
| ≥ 0.70 | Merge | Similar statements - track together |
| < 0.70 | Create New | Different topic/argument |

## Use Cases

### 1. Collaborative Brainstorming

Track how a team's ideas evolve:

```bash
# First team member
curl -X POST /node -d '{
  "text": "We should use microservices",
  "contributor": "alice"
}'
# Response: action="created", creativity=1.0

# Second team member adds to the thought
curl -X POST /node -d '{
  "text": "Microservices with event-driven architecture would work well",
  "contributor": "bob"
}'
# Response: action="merged", creativity=0.45 (moderately creative)

# Third team member expands further
curl -X POST /node -d '{
  "text": "Event-driven microservices using Kafka for message bus",
  "contributor": "charlie"
}'
# Response: action="merged", creativity=0.30 (incremental addition)
```

**Result:** One thought node with 3 evolutions, creativity score showing how ideas built on each other.

### 2. Debate Analysis

Track how arguments evolve during a debate:

```bash
# Speaker A's opening
POST /debate/transcription
{
  "speaker": "Speaker A",
  "text": "AI will eliminate jobs"
}

# Speaker A rephrases later
POST /debate/transcription
{
  "speaker": "Speaker A",
  "text": "Automation powered by AI will displace workers"
}
# Merged - same argument, different wording

# Speaker B counters
POST /debate/transcription
{
  "speaker": "Speaker B",
  "text": "AI will create new types of jobs"
}
# New node - different argument
```

### 3. Plagiarism Detection

Track if someone is repeating others' ideas uncreatively:

```bash
# Original idea
POST /node {"text": "Blockchain for supply chain", "contributor": "alice"}
# creativity=1.0

# Someone else repeats with minor changes
POST /node {"text": "Using blockchain technology for supply chain management", "contributor": "bob"}
# merged, creativity=0.15 (repetitive)

# Analysis shows bob's contribution was uncreative
GET /node/:id → evolution_analysis.trend = "repetitive"
```

### 4. Thought Flow Visualization

Track how ideas flow and evolve:

```bash
GET /node/:id

Response:
{
  "accumulated_text": "...",  // Full evolution history
  "evolution_history": [
    {
      "evolved_at": 1710000000,
      "similarity_score": 0.75,
      "creativity_delta": 0.25,
      "evolved_text": "...",
      "contributor": "alice"
    },
    {
      "evolved_at": 1710001000,
      "similarity_score": 0.60,
      "creativity_delta": 0.40,
      "evolved_text": "...",
      "contributor": "bob"
    }
  ]
}
```

## Database Schema

### Migration

Run the migration script to add evolution tracking fields:

```bash
cd backend
python scripts/migrate_schema.py
```

This adds to the `nodes` table:
- `primary_text` STRING
- `accumulated_text` STRING
- `merge_count` NUMBER
- `evolution_history` VARIANT (JSON)
- `contributors` VARIANT (JSON array)
- `creativity_score` FLOAT
- `last_updated` NUMBER

**Backward compatible:** Existing nodes will be backfilled with default values.

### Snowflake Schema

```sql
CREATE TABLE nodes (
    id STRING PRIMARY KEY,
    text STRING,
    timestamp NUMBER,
    embedding VECTOR(FLOAT, 768),
    -- Evolution tracking
    primary_text STRING,
    accumulated_text STRING,
    merge_count NUMBER DEFAULT 0,
    evolution_history VARIANT,
    contributors VARIANT,
    creativity_score FLOAT DEFAULT 0.0,
    last_updated NUMBER DEFAULT 0
);
```

## Querying Evolution Data

### Get Node with Full Evolution History

```sql
SELECT
    id,
    text,
    primary_text,
    accumulated_text,
    merge_count,
    creativity_score,
    contributors,
    evolution_history
FROM nodes
WHERE id = 'abc-123';
```

### Find Most Creative Thoughts

```sql
SELECT
    id,
    text,
    creativity_score,
    merge_count,
    contributors
FROM nodes
WHERE merge_count > 0
ORDER BY creativity_score DESC
LIMIT 10;
```

### Find Repetitive Thoughts (Low Creativity)

```sql
SELECT
    id,
    text,
    creativity_score,
    merge_count
FROM nodes
WHERE merge_count > 5
  AND creativity_score < 0.3
ORDER BY merge_count DESC;
```

### Find Top Contributors

```sql
-- This would require a UDF or application-level processing
-- since contributors is a JSON array
```

## Configuration

### Adjust Merge Thresholds

Edit `app/services/thought_evolution_service.py`:

```python
# Stricter merging (less merging, more distinct thoughts)
MERGE_THRESHOLD_HIGH = 0.85
MERGE_THRESHOLD_MEDIUM = 0.75
MERGE_THRESHOLD_LOW = 0.65

# Looser merging (more merging, track more evolutions)
MERGE_THRESHOLD_HIGH = 0.75
MERGE_THRESHOLD_MEDIUM = 0.55
MERGE_THRESHOLD_LOW = 0.40
```

### Adjust Creativity Calculation

Currently: `creativity = 1 - similarity`

You can implement more sophisticated calculations in:
`app/services/thought_evolution_service.py::calculate_creativity_delta()`

For example:
```python
def calculate_creativity_delta(similarity_score: float) -> float:
    """Custom creativity calculation."""
    if similarity_score > 0.9:
        return 0.0  # Nearly identical
    elif similarity_score > 0.7:
        return 0.2 + (0.9 - similarity_score) * 0.5  # Minor variation
    elif similarity_score > 0.5:
        return 0.4 + (0.7 - similarity_score) * 1.5  # Moderate evolution
    else:
        return 0.7 + (0.5 - similarity_score) * 0.6  # Highly creative
```

## Frontend Integration

### Display Evolution Timeline

```jsx
// Fetch node with evolution history
const node = await fetch(`/node/${nodeId}`).then(r => r.json());

// Display timeline
<Timeline>
  <TimelineItem>
    <Avatar>{node.contributors[0]}</Avatar>
    <Text>{node.primary_text}</Text>
    <Badge>Original (Creativity: 1.0)</Badge>
  </TimelineItem>

  {node.evolution_history.map((evolution, i) => (
    <TimelineItem key={i}>
      <Avatar>{evolution.contributor}</Avatar>
      <Text>{evolution.evolved_text}</Text>
      <Badge>Creativity: {evolution.creativity_delta.toFixed(2)}</Badge>
      <Time>{new Date(evolution.evolved_at).toLocaleString()}</Time>
    </TimelineItem>
  ))}
</Timeline>
```

### Creativity Meter

```jsx
<CreativityMeter score={node.creativity_score}>
  {node.creativity_score > 0.7 ? "🚀 Highly Creative" :
   node.creativity_score > 0.4 ? "💡 Moderately Creative" :
   node.creativity_score > 0.2 ? "🔄 Minor Variations" :
   "⚠️ Repetitive"}
</CreativityMeter>
```

### Contributor Badges

```jsx
<ContributorList>
  {node.contributors.map(contributor => (
    <Avatar key={contributor} name={contributor} />
  ))}
  <Badge>{node.merge_count} evolutions</Badge>
</ContributorList>
```

## API Examples

### Python

```python
import requests

# Create new thought
response = requests.post("http://localhost:8000/node", json={
    "text": "AI will transform healthcare",
    "contributor": "alice@example.com"
})

result = response.json()
print(f"Action: {result['action']}")
print(f"Creativity: {result['creativity_score']}")
print(f"Contributors: {result['contributors']}")

# Check evolution analysis
analysis = result['evolution_analysis']
print(f"Trend: {analysis['evolution_trend']}")
```

### JavaScript

```javascript
// Create or evolve thought
const response = await fetch('http://localhost:8000/node', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Machine learning will revolutionize medicine',
    contributor: 'bob@example.com'
  })
});

const result = await response.json();
console.log('Action:', result.action);  // "merged" or "created"
console.log('Creativity:', result.creativity_score);
console.log('Evolutions:', result.merge_count);
```

### cURL

```bash
# Create thought
curl -X POST http://localhost:8000/node \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Quantum computing will break encryption",
    "contributor": "charlie"
  }'

# View evolution history
curl http://localhost:8000/node/abc-123 | jq '.node.evolution_history'
```

## Comparison: Before vs After

### Before (Duplicate Blocking)

```bash
POST /node {"text": "AI will change education"}
→ 201 Created

POST /node {"text": "Artificial intelligence will transform education"}
→ 409 Conflict (Duplicate detected)
```

**Problem:** Can't track how thoughts evolve!

### After (Thought Evolution)

```bash
POST /node {"text": "AI will change education", "contributor": "alice"}
→ 201 Created (creativity=1.0)

POST /node {"text": "Artificial intelligence will transform education", "contributor": "bob"}
→ 200 OK (action="merged", creativity=0.45)

POST /node {"text": "ML will personalize student learning", "contributor": "charlie"}
→ 200 OK (action="merged", creativity=0.62)
```

**Result:** One thought node tracking 3 evolutions with creativity metrics!

## Summary

### ✅ What's New

1. **Thought evolution tracking** - Merge similar thoughts instead of blocking
2. **Creativity scoring** - Measure how novel each evolution is
3. **Contributor tracking** - See who contributed to each thought
4. **Full history** - `accumulated_text` stores ALL evolutions
5. **Evolution analysis** - Understand thought flow patterns

### 📊 Key Metrics

- **`action`**: "created" or "merged"
- **`merge_count`**: Number of evolutions
- **`creativity_score`**: Overall creativity [0-1]
- **`contributors`**: List of all contributors
- **`evolution_analysis`**: Detailed evolution insights

### 🎯 Use Cases

- Collaborative brainstorming
- Debate analysis
- Plagiarism detection
- Thought flow visualization
- Team creativity metrics
- Knowledge evolution tracking

### 🚀 Getting Started

1. Run schema migration: `python scripts/migrate_schema.py`
2. Start API server: `uvicorn app.main:app`
3. Create thoughts: `POST /node` with `contributor` field
4. View evolution: `GET /node/:id` to see full history

**The system now tracks creativity and thought flow instead of blocking duplicates!** 🎨🧠
