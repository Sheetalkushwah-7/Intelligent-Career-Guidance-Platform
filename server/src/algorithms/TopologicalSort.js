/**
 * TopologicalSort.js
 * Implements Kahn's Algorithm (In-Degree BFS) and Stage-based dependency ordering.
 * Used for:
 *  - Personalized learning path generation
 *  - Prerequisite ordering for skills and concepts
 *  - Stage-by-stage learning plan grouping
 */

export class TopologicalSort {
  /**
   * Sort a Graph instance topologically using Kahn's algorithm
   * @param {import('./Graph.js').Graph} graph 
   * @returns {{ success: boolean, order: string[], stages: string[][], error?: string, cycleNodes?: string[] }}
   */
  static sort(graph) {
    const inDegree = new Map();
    const allNodes = graph.getAllNodes().map(n => n.id);

    // Initialize in-degree counts
    for (const id of allNodes) {
      inDegree.set(id, 0);
    }

    for (const id of allNodes) {
      for (const edge of graph.getNeighbors(id)) {
        inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      }
    }

    // Enqueue all nodes with in-degree 0
    let currentQueue = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        currentQueue.push(id);
      }
    }

    const order = [];
    const stages = [];

    while (currentQueue.length > 0) {
      stages.push([...currentQueue]);
      const nextQueue = [];

      for (const node of currentQueue) {
        order.push(node);

        for (const edge of graph.getNeighbors(node)) {
          const newDeg = inDegree.get(edge.to) - 1;
          inDegree.set(edge.to, newDeg);
          if (newDeg === 0) {
            nextQueue.push(edge.to);
          }
        }
      }

      currentQueue = nextQueue;
    }

    // If order length != total nodes, a cycle exists
    if (order.length !== allNodes.length) {
      const cycleNodes = allNodes.filter(id => (inDegree.get(id) || 0) > 0);
      return {
        success: false,
        order: [],
        stages: [],
        error: 'Cyclic prerequisite dependency detected',
        cycleNodes
      };
    }

    return {
      success: true,
      order,
      stages
    };
  }

  /**
   * Generate a filtered learning path targeting specific required skills
   * Only includes prerequisites that lead to target skills, topologically ordered.
   * @param {import('./Graph.js').Graph} graph Full prerequisite graph
   * @param {string[]} targetSkillIds Skills required by the target career
   * @param {Set<string>} masteredSkillIds Skills the student already mastered
   * @returns {{ path: Array<{ id: string, stage: number, data: object }>, totalSteps: number }}
   */
  static generateTargetedLearningPath(graph, targetSkillIds, masteredSkillIds = new Set()) {
    // 1. Identify all required prerequisites by backward traversal or subgraph extraction
    const needed = new Set();

    // Reverse graph or recursive prerequisite collector
    const collectPrereqs = (nodeId) => {
      if (needed.has(nodeId)) return;
      needed.add(nodeId);

      // Find predecessors
      for (const node of graph.getAllNodes()) {
        const neighbors = graph.getNeighbors(node.id);
        if (neighbors.some(e => e.to === nodeId)) {
          collectPrereqs(node.id);
        }
      }
    };

    for (const target of targetSkillIds) {
      collectPrereqs(target);
    }

    // Remove skills already mastered
    const remainingToLearn = new Set(
      Array.from(needed).filter(id => !masteredSkillIds.has(id))
    );

    if (remainingToLearn.size === 0) {
      return { path: [], totalSteps: 0, stages: [] };
    }

    // Build subgraph of remaining nodes
    const inDegree = new Map();
    for (const id of remainingToLearn) {
      inDegree.set(id, 0);
    }

    for (const id of remainingToLearn) {
      for (const edge of graph.getNeighbors(id)) {
        if (remainingToLearn.has(edge.to)) {
          inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
        }
      }
    }

    let queue = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    const path = [];
    const stages = [];
    let stageIndex = 1;

    while (queue.length > 0) {
      stages.push([...queue]);
      const nextQueue = [];

      for (const id of queue) {
        const nodeData = graph.getNode(id) || { id };
        path.push({
          id,
          stage: stageIndex,
          data: nodeData
        });

        for (const edge of graph.getNeighbors(id)) {
          if (remainingToLearn.has(edge.to)) {
            const newDeg = inDegree.get(edge.to) - 1;
            inDegree.set(edge.to, newDeg);
            if (newDeg === 0) {
              nextQueue.push(edge.to);
            }
          }
        }
      }

      queue = nextQueue;
      stageIndex++;
    }

    return {
      path,
      totalSteps: path.length,
      stages
    };
  }
}
