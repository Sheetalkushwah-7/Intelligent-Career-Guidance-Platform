/**
 * PriorityQueue.js
 * Binary Heap implementation supporting both Max-Heap and Min-Heap.
 * Used for:
 *  - Top-K Career recommendations (Max-Heap by compatibility score)
 *  - High-priority skill gap ranking (Max-Heap by gap weight)
 *  - Spaced practice decay urgency ranking
 */

export class PriorityQueue {
  /**
   * @param {string} type 'MAX' or 'MIN' (default: 'MAX')
   * @param {function} comparator Optional custom comparator: (a, b) => number. Returns >0 if a has higher priority than b.
   */
  constructor(type = 'MAX', comparator = null) {
    this.heap = [];
    this.type = type.toUpperCase();
    this.comparator = comparator || this._defaultComparator.bind(this);
  }

  _defaultComparator(a, b) {
    if (this.type === 'MAX') {
      return a.priority - b.priority;
    } else {
      return b.priority - a.priority;
    }
  }

  /**
   * Insert element with given priority
   * @param {*} item Value or payload
   * @param {number} priority Numerical priority
   */
  push(item, priority = 0) {
    const node = { item, priority };
    this.heap.push(node);
    this._bubbleUp(this.heap.length - 1);
  }

  /**
   * Remove and return the highest priority item
   * @returns {*} item payload or null if empty
   */
  pop() {
    if (this.isEmpty()) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._bubbleDown(0);
    }
    return top.item;
  }

  /**
   * Remove and return the full node { item, priority }
   */
  popWithPriority() {
    if (this.isEmpty()) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._bubbleDown(0);
    }
    return top;
  }

  /**
   * Inspect top element without removing
   */
  peek() {
    return this.isEmpty() ? null : this.heap[0].item;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  toArray() {
    return [...this.heap].map(n => n.item);
  }

  /**
   * Extract top K elements sorted in priority order
   * @param {number} k 
   * @returns {Array}
   */
  extractTopK(k) {
    const result = [];
    const count = Math.min(k, this.size());
    for (let i = 0; i < count; i++) {
      result.push(this.pop());
    }
    return result;
  }

  _parent(i) {
    return Math.floor((i - 1) / 2);
  }

  _left(i) {
    return 2 * i + 1;
  }

  _right(i) {
    return 2 * i + 2;
  }

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  _bubbleUp(index) {
    let current = index;
    while (current > 0) {
      const parentIdx = this._parent(current);
      if (this.comparator(this.heap[current], this.heap[parentIdx]) > 0) {
        this._swap(current, parentIdx);
        current = parentIdx;
      } else {
        break;
      }
    }
  }

  _bubbleDown(index) {
    let current = index;
    const length = this.heap.length;

    while (this._left(current) < length) {
      let candidate = this._left(current);
      const right = this._right(current);

      if (right < length && this.comparator(this.heap[right], this.heap[candidate]) > 0) {
        candidate = right;
      }

      if (this.comparator(this.heap[candidate], this.heap[current]) > 0) {
        this._swap(current, candidate);
        current = candidate;
      } else {
        break;
      }
    }
  }
}
