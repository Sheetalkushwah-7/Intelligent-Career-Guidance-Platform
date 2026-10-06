/**
 * Graph.js
 * Directed Adjacency List Graph implementation.
 * Used for:
 *  - Prerequisite graph modeling (Skill A -> Skill B)
 *  - Concept dependency trees
 *  - BFS reachability (shortest prerequisite path to target career)
 *  - DFS exploration (sub-graph of unlockable careers/skills)
 *  - Cycle detection for dependency safety
 */

export class Graph {
  constructor() {
    // Map of nodeId => Node data
    this.nodes = new Map();
    // Map of nodeId => Array of { to: nodeId, weight: number, metadata: object }
    this.adjacencyList = new Map();
    // In-degree tracking for Kahn's algorithm
    this.inDegree = new Map();
  }

  /**
   * Add a node to the graph
   * @param {string} id 
   * @param {object} data 
   */
  addNode(id, data = {}) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, ...data });
      this.adjacencyList.set(id, []);
      this.inDegree.set(id, 0);
    }
  }

  /**
   * Add a directed edge: from -> to
   * Meaning: 'from' is a prerequisite or predecessor of 'to'
   * @param {string} from 
   * @param {string} to 
   * @param {number} weight 
   * @param {object} metadata 
   */
  addEdge(from, to, weight = 1, metadata = {}) {
    this.addNode(from);
    this.addNode(to);

    const neighbors = this.adjacencyList.get(from);
    // Prevent duplicate edges
    if (!neighbors.some(edge => edge.to === to)) {
      neighbors.push({ to, weight, metadata });
      this.inDegree.set(to, (this.inDegree.get(to) || 0) + 1);
    }
  }

  getNode(id) {
    return this.nodes.get(id) || null;
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getNeighbors(id) {
    return this.adjacencyList.get(id) || [];
  }

  getInDegree(id) {
    return this.inDegree.get(id) || 0;
  }

  /**
   * Detect cycle in directed graph using 3-color DFS (0=White, 1=Gray, 2=Black)
   * @returns {{ hasCycle: boolean, cyclePath: string[] }}
   */
  detectCycle() {
    const visitedState = new Map(); // 0: unvisited, 1: visiting (in current path), 2: fully processed
    for (const nodeId of this.nodes.keys()) {
      visitedState.set(nodeId, 0);
    }

    const path = [];
    let cyclePath = [];

    const dfsVisit = (u) => {
      visitedState.set(u, 1);
      path.push(u);

      for (const edge of this.adjacencyList.get(u) || []) {
        const v = edge.to;
        if (visitedState.get(v) === 1) {
          // Cycle found!
          const cycleStartIdx = path.indexOf(v);
          cyclePath = path.slice(cycleStartIdx).concat(v);
          return true;
        }
        if (visitedState.get(v) === 0) {
          if (dfsVisit(v)) return true;
        }
      }

      path.pop();
      visitedState.set(u, 2);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (visitedState.get(nodeId) === 0) {
        if (dfsVisit(nodeId)) {
          return { hasCycle: true, cyclePath };
        }
      }
    }

    return { hasCycle: false, cyclePath: [] };
  }

  /**
   * Breadth-First Search (BFS) starting from a node or set of source nodes
   * @param {string|string[]} startNodes
   * @returns {Array<{ id: string, level: number, parent: string|null }>}
   */
  bfs(startNodes) {
    const queue = [];
    const visited = new Set();
    const traversal = [];

    const sources = Array.isArray(startNodes) ? startNodes : [startNodes];
    for (const src of sources) {
      if (this.nodes.has(src)) {
        queue.push({ id: src, level: 0, parent: null });
        visited.add(src);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift();
      traversal.push(current);

      for (const edge of this.adjacencyList.get(current.id) || []) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({
            id: edge.to,
            level: current.level + 1,
            parent: current.id
          });
        }
      }
    }

    return traversal;
  }

  /**
   * Find shortest path (unweighted BFS) from startId to targetId
   * @param {string} startId 
   * @param {string} targetId 
   * @returns {string[] | null} Path array or null if unreachable
   */
  findShortestPath(startId, targetId) {
    if (!this.nodes.has(startId) || !this.nodes.has(targetId)) return null;
    if (startId === targetId) return [startId];

    const queue = [startId];
    const visited = new Set([startId]);
    const parentMap = new Map();

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === targetId) {
        // Reconstruct path
        const path = [targetId];
        let curr = targetId;
        while (parentMap.has(curr)) {
          curr = parentMap.get(curr);
          path.unshift(curr);
        }
        return path;
      }

      for (const edge of this.adjacencyList.get(current) || []) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          parentMap.set(edge.to, current);
          queue.push(edge.to);
        }
      }
    }

    return null; // Unreachable
  }

  /**
   * Depth-First Search (DFS) reachability from startId
   * @param {string} startId 
   * @returns {string[]} Reachable node IDs
   */
  dfs(startId) {
    const reachable = [];
    const visited = new Set();

    const dfsHelper = (u) => {
      visited.add(u);
      reachable.push(u);
      for (const edge of this.adjacencyList.get(u) || []) {
        if (!visited.has(edge.to)) {
          dfsHelper(edge.to);
        }
      }
    };

    if (this.nodes.has(startId)) {
      dfsHelper(startId);
    }
    return reachable;
  }
}
