# NeuroChain Frontend

Real-time knowledge graph visualization built with Next.js, featuring AI-powered connections and blockchain integration.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **react-force-graph-2d** - Interactive graph visualization
- **FastAPI Backend** - Python backend with AI capabilities

## Features

- 🧠 **Real-time Graph Visualization** - Interactive force-directed graph
- 🔗 **AI-Powered Connections** - Semantic similarity between nodes
- ⛓️ **Blockchain Integration** - Algorand transaction tracking
- 🎬 **Replay Mode** - Animate graph building over time
- 📊 **Node Details Panel** - Inspect node metadata and embeddings
- ⚡ **Fast & Responsive** - Optimized rendering with Canvas API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Running FastAPI backend (see backend README)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your backend API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Main application page
│   └── globals.css      # Global styles
├── components/
│   ├── GraphCanvas.tsx  # Force graph visualization
│   ├── NodePanel.tsx    # Node details sidebar
│   └── InputBar.tsx     # Input form for new nodes
├── lib/
│   ├── api.ts           # API client functions
│   └── types.ts         # TypeScript interfaces
└── public/              # Static assets
```

## Usage

### Adding Nodes

1. Enter your thought or idea in the input bar at the bottom
2. Click "Add Node" or press Enter
3. The backend will generate embeddings and find connections
4. Watch the node appear and connect to related concepts

### Interacting with the Graph

- **Click on nodes** to view details in the side panel
- **Drag nodes** to rearrange the graph
- **Zoom** using mouse wheel
- **Pan** by dragging the background

### Replay Mode

Click the "Replay" button to watch your knowledge graph build up chronologically.

### Reset

Click "Reset" to clear the current graph.

## API Integration

The frontend communicates with the FastAPI backend via REST endpoints:

- `POST /node` - Create a new node with embeddings and connections
- `GET /graph` - Fetch the entire graph state
- `GET /node/{id}` - Get details for a specific node

## Customization

### Graph Appearance

Edit `components/GraphCanvas.tsx` to customize:
- Node colors and sizes
- Link colors and particle effects
- Physics simulation parameters

### Styling

Modify `tailwind.config.js` and `app/globals.css` for theme customization.

## Troubleshooting

### Graph not loading

- Ensure the backend is running on the correct port
- Check browser console for API errors
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Performance issues

- Reduce `linkDirectionalParticles` in GraphCanvas
- Adjust `d3AlphaDecay` and `d3VelocityDecay` values
- Limit the number of nodes displayed

## Contributing

This is a hackathon project. Contributions welcome!

## License

MIT
