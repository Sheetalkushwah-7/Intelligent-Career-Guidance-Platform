/**
 * SearchSort.js
 * Explicit Searching and Sorting Algorithms.
 * Used for:
 *  - Binary search for threshold lookups, difficulty ranges, and time windows
 *  - Multi-attribute QuickSort / MergeSort for ranking careers and problems
 *  - Inverted-index searching
 */

export class SearchSort {
  /**
   * Binary Search on sorted array of objects by numerical key
   * Returns index of exact match or lower-bound index
   * @param {Array<object>} array Sorted ascending by key
   * @param {string} key Property name
   * @param {number} target Target value
   * @returns {number} Index of element or insertion point
   */
  static binarySearchBy(array, key, target) {
    let low = 0;
    let high = array.length - 1;

    while (low <= high) {
      const mid = Math.floor(low + (high - low) / 2);
      const val = array[mid][key];

      if (val === target) {
        return mid;
      } else if (val < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return low; // Lower bound insertion position
  }

  /**
   * Range search using Binary Search to find all items where min <= item[key] <= max
   * @param {Array<object>} array Sorted ascending by key
   * @param {string} key Property name
   * @param {number} min 
   * @param {number} max 
   * @returns {Array<object>}
   */
  static binarySearchRange(array, key, min, max) {
    const startIdx = this.binarySearchBy(array, key, min);
    const results = [];

    for (let i = startIdx; i < array.length; i++) {
      if (array[i][key] > max) break;
      if (array[i][key] >= min) {
        results.push(array[i]);
      }
    }

    return results;
  }

  /**
   * QuickSort implementation with custom comparator
   * @param {Array} array 
   * @param {function} comparator (a, b) => number. Returns <0 if a before b.
   * @returns {Array} New sorted array
   */
  static quickSort(array, comparator = (a, b) => a - b) {
    if (array.length <= 1) return [...array];

    const arr = [...array];

    const partition = (items, left, right) => {
      const pivot = items[Math.floor((right + left) / 2)];
      let i = left;
      let j = right;

      while (i <= j) {
        while (comparator(items[i], pivot) < 0) i++;
        while (comparator(items[j], pivot) > 0) j--;
        if (i <= j) {
          const temp = items[i];
          items[i] = items[j];
          items[j] = temp;
          i++;
          j--;
        }
      }
      return i;
    };

    const sortHelper = (items, left, right) => {
      if (items.length > 1) {
        const index = partition(items, left, right);
        if (left < index - 1) sortHelper(items, left, index - 1);
        if (index < right) sortHelper(items, index, right);
      }
    };

    sortHelper(arr, 0, arr.length - 1);
    return arr;
  }

  /**
   * Multi-key comparator for careers
   * Primary: Compatibility Score (DESC)
   * Secondary: Market Demand (DESC)
   * Tertiary: Skill Gap Count (ASC)
   */
  static careerComparator(a, b) {
    if (b.compatibilityScore !== a.compatibilityScore) {
      return b.compatibilityScore - a.compatibilityScore;
    }
    if (b.marketDemand !== a.marketDemand) {
      return (b.marketDemand || 0) - (a.marketDemand || 0);
    }
    return (a.gapCount || 0) - (b.gapCount || 0);
  }

  /**
   * Multi-key comparator for problem recommendations
   * Primary: Priority/Relevance (DESC)
   * Secondary: Difficulty fit (how close to student's current level)
   */
  static problemComparator(a, b) {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return a.estimatedMinutes - b.estimatedMinutes;
  }
}
