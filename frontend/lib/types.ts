export interface Node {
  id: string;
  text: string;
  embedding: number[];
  timestamp: number;
  hash?: string;
  txId?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface Link {
  source: string | Node;
  target: string | Node;
  score: number;
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export interface CreateNodeRequest {
  text: string;
}

export interface CreateNodeResponse {
  node: Node;
  connections: Link[];
}
