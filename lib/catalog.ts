/**
 * The problem catalog.
 *
 * Static content -- it never changes, so it ships in the bundle rather than
 * costing a round trip. Only per-user state lives in Postgres.
 *
 * NeetCode 150 is a superset of the (NeetCode-curated) Blind 75, so every
 * problem is listed once and flagged for Blind 75 membership. Solving a
 * problem therefore counts in whichever list you happen to be viewing.
 *
 * Tuple shape keeps the list scannable:
 *   [ name, difficulty, leetcode-slug, inBlind75, isPremium ]
 */

export type Difficulty = "Easy" | "Medium" | "Hard";
export type ListId = "blind75" | "neetcode150";

export interface Problem {
  id: string; // leetcode slug -- stable, and the progress key
  name: string;
  topic: string;
  difficulty: Difficulty;
  blind75: boolean;
  premium: boolean; // paywalled on leetcode
  url: string;
  videoUrl: string;
}

type Row = [string, "E" | "M" | "H", string, 0 | 1, 0 | 1];

const RAW: Array<[string, Row[]]> = [
  ["Arrays & Hashing", [
    ["Contains Duplicate", "E", "contains-duplicate", 1, 0],
    ["Valid Anagram", "E", "valid-anagram", 1, 0],
    ["Two Sum", "E", "two-sum", 1, 0],
    ["Group Anagrams", "M", "group-anagrams", 1, 0],
    ["Top K Frequent Elements", "M", "top-k-frequent-elements", 1, 0],
    ["Encode and Decode Strings", "M", "encode-and-decode-strings", 1, 1],
    ["Product of Array Except Self", "M", "product-of-array-except-self", 1, 0],
    ["Valid Sudoku", "M", "valid-sudoku", 0, 0],
    ["Longest Consecutive Sequence", "M", "longest-consecutive-sequence", 1, 0],
  ]],
  ["Two Pointers", [
    ["Valid Palindrome", "E", "valid-palindrome", 1, 0],
    ["Two Sum II - Input Array Is Sorted", "M", "two-sum-ii-input-array-is-sorted", 0, 0],
    ["3Sum", "M", "3sum", 1, 0],
    ["Container With Most Water", "M", "container-with-most-water", 1, 0],
    ["Trapping Rain Water", "H", "trapping-rain-water", 0, 0],
  ]],
  ["Sliding Window", [
    ["Best Time to Buy and Sell Stock", "E", "best-time-to-buy-and-sell-stock", 1, 0],
    ["Longest Substring Without Repeating Characters", "M", "longest-substring-without-repeating-characters", 1, 0],
    ["Longest Repeating Character Replacement", "M", "longest-repeating-character-replacement", 1, 0],
    ["Permutation in String", "M", "permutation-in-string", 0, 0],
    ["Minimum Window Substring", "H", "minimum-window-substring", 1, 0],
    ["Sliding Window Maximum", "H", "sliding-window-maximum", 0, 0],
  ]],
  ["Stack", [
    ["Valid Parentheses", "E", "valid-parentheses", 1, 0],
    ["Min Stack", "M", "min-stack", 0, 0],
    ["Evaluate Reverse Polish Notation", "M", "evaluate-reverse-polish-notation", 0, 0],
    ["Generate Parentheses", "M", "generate-parentheses", 0, 0],
    ["Daily Temperatures", "M", "daily-temperatures", 0, 0],
    ["Car Fleet", "M", "car-fleet", 0, 0],
    ["Largest Rectangle in Histogram", "H", "largest-rectangle-in-histogram", 0, 0],
  ]],
  ["Binary Search", [
    ["Binary Search", "E", "binary-search", 0, 0],
    ["Search a 2D Matrix", "M", "search-a-2d-matrix", 0, 0],
    ["Koko Eating Bananas", "M", "koko-eating-bananas", 0, 0],
    ["Find Minimum in Rotated Sorted Array", "M", "find-minimum-in-rotated-sorted-array", 1, 0],
    ["Search in Rotated Sorted Array", "M", "search-in-rotated-sorted-array", 1, 0],
    ["Time Based Key-Value Store", "M", "time-based-key-value-store", 0, 0],
    ["Median of Two Sorted Arrays", "H", "median-of-two-sorted-arrays", 0, 0],
  ]],
  ["Linked List", [
    ["Reverse Linked List", "E", "reverse-linked-list", 1, 0],
    ["Merge Two Sorted Lists", "E", "merge-two-sorted-lists", 1, 0],
    ["Reorder List", "M", "reorder-list", 1, 0],
    ["Remove Nth Node From End of List", "M", "remove-nth-node-from-end-of-list", 1, 0],
    ["Copy List With Random Pointer", "M", "copy-list-with-random-pointer", 0, 0],
    ["Add Two Numbers", "M", "add-two-numbers", 0, 0],
    ["Linked List Cycle", "E", "linked-list-cycle", 1, 0],
    ["Find the Duplicate Number", "M", "find-the-duplicate-number", 0, 0],
    ["LRU Cache", "M", "lru-cache", 0, 0],
    ["Merge k Sorted Lists", "H", "merge-k-sorted-lists", 1, 0],
    ["Reverse Nodes in k-Group", "H", "reverse-nodes-in-k-group", 0, 0],
  ]],
  ["Trees", [
    ["Invert Binary Tree", "E", "invert-binary-tree", 1, 0],
    ["Maximum Depth of Binary Tree", "E", "maximum-depth-of-binary-tree", 1, 0],
    ["Diameter of Binary Tree", "E", "diameter-of-binary-tree", 0, 0],
    ["Balanced Binary Tree", "E", "balanced-binary-tree", 0, 0],
    ["Same Tree", "E", "same-tree", 1, 0],
    ["Subtree of Another Tree", "E", "subtree-of-another-tree", 1, 0],
    ["Lowest Common Ancestor of a Binary Search Tree", "M", "lowest-common-ancestor-of-a-binary-search-tree", 1, 0],
    ["Binary Tree Level Order Traversal", "M", "binary-tree-level-order-traversal", 1, 0],
    ["Binary Tree Right Side View", "M", "binary-tree-right-side-view", 0, 0],
    ["Count Good Nodes in Binary Tree", "M", "count-good-nodes-in-binary-tree", 0, 0],
    ["Validate Binary Search Tree", "M", "validate-binary-search-tree", 1, 0],
    ["Kth Smallest Element in a BST", "M", "kth-smallest-element-in-a-bst", 1, 0],
    ["Construct Binary Tree from Preorder and Inorder Traversal", "M", "construct-binary-tree-from-preorder-and-inorder-traversal", 1, 0],
    ["Binary Tree Maximum Path Sum", "H", "binary-tree-maximum-path-sum", 1, 0],
    ["Serialize and Deserialize Binary Tree", "H", "serialize-and-deserialize-binary-tree", 1, 0],
  ]],
  ["Heap / Priority Queue", [
    ["Kth Largest Element in a Stream", "E", "kth-largest-element-in-a-stream", 0, 0],
    ["Last Stone Weight", "E", "last-stone-weight", 0, 0],
    ["K Closest Points to Origin", "M", "k-closest-points-to-origin", 0, 0],
    ["Kth Largest Element in an Array", "M", "kth-largest-element-in-an-array", 0, 0],
    ["Task Scheduler", "M", "task-scheduler", 0, 0],
    ["Design Twitter", "M", "design-twitter", 0, 0],
    ["Find Median from Data Stream", "H", "find-median-from-data-stream", 1, 0],
  ]],
  ["Backtracking", [
    ["Subsets", "M", "subsets", 0, 0],
    ["Combination Sum", "M", "combination-sum", 1, 0],
    ["Permutations", "M", "permutations", 0, 0],
    ["Subsets II", "M", "subsets-ii", 0, 0],
    ["Combination Sum II", "M", "combination-sum-ii", 0, 0],
    ["Word Search", "M", "word-search", 1, 0],
    ["Palindrome Partitioning", "M", "palindrome-partitioning", 0, 0],
    ["Letter Combinations of a Phone Number", "M", "letter-combinations-of-a-phone-number", 0, 0],
    ["N-Queens", "H", "n-queens", 0, 0],
  ]],
  ["Tries", [
    ["Implement Trie (Prefix Tree)", "M", "implement-trie-prefix-tree", 1, 0],
    ["Design Add and Search Words Data Structure", "M", "design-add-and-search-words-data-structure", 1, 0],
    ["Word Search II", "H", "word-search-ii", 1, 0],
  ]],
  ["Graphs", [
    ["Number of Islands", "M", "number-of-islands", 1, 0],
    ["Max Area of Island", "M", "max-area-of-island", 0, 0],
    ["Clone Graph", "M", "clone-graph", 1, 0],
    ["Walls and Gates", "M", "walls-and-gates", 0, 1],
    ["Rotting Oranges", "M", "rotting-oranges", 0, 0],
    ["Pacific Atlantic Water Flow", "M", "pacific-atlantic-water-flow", 1, 0],
    ["Surrounded Regions", "M", "surrounded-regions", 0, 0],
    ["Course Schedule", "M", "course-schedule", 1, 0],
    ["Course Schedule II", "M", "course-schedule-ii", 0, 0],
    ["Graph Valid Tree", "M", "graph-valid-tree", 1, 1],
    ["Number of Connected Components in an Undirected Graph", "M", "number-of-connected-components-in-an-undirected-graph", 1, 1],
    ["Redundant Connection", "M", "redundant-connection", 0, 0],
    ["Word Ladder", "H", "word-ladder", 0, 0],
  ]],
  ["Advanced Graphs", [
    ["Reconstruct Itinerary", "H", "reconstruct-itinerary", 0, 0],
    ["Min Cost to Connect All Points", "M", "min-cost-to-connect-all-points", 0, 0],
    ["Network Delay Time", "M", "network-delay-time", 0, 0],
    ["Swim in Rising Water", "H", "swim-in-rising-water", 0, 0],
    ["Alien Dictionary", "H", "alien-dictionary", 1, 1],
    ["Cheapest Flights Within K Stops", "M", "cheapest-flights-within-k-stops", 0, 0],
  ]],
  ["1-D Dynamic Programming", [
    ["Climbing Stairs", "E", "climbing-stairs", 1, 0],
    ["Min Cost Climbing Stairs", "E", "min-cost-climbing-stairs", 0, 0],
    ["House Robber", "M", "house-robber", 1, 0],
    ["House Robber II", "M", "house-robber-ii", 1, 0],
    ["Longest Palindromic Substring", "M", "longest-palindromic-substring", 1, 0],
    ["Palindromic Substrings", "M", "palindromic-substrings", 1, 0],
    ["Decode Ways", "M", "decode-ways", 1, 0],
    ["Coin Change", "M", "coin-change", 1, 0],
    ["Maximum Product Subarray", "M", "maximum-product-subarray", 1, 0],
    ["Word Break", "M", "word-break", 1, 0],
    ["Longest Increasing Subsequence", "M", "longest-increasing-subsequence", 1, 0],
    ["Partition Equal Subset Sum", "M", "partition-equal-subset-sum", 0, 0],
  ]],
  ["2-D Dynamic Programming", [
    ["Unique Paths", "M", "unique-paths", 1, 0],
    ["Longest Common Subsequence", "M", "longest-common-subsequence", 1, 0],
    ["Best Time to Buy and Sell Stock with Cooldown", "M", "best-time-to-buy-and-sell-stock-with-cooldown", 0, 0],
    ["Coin Change II", "M", "coin-change-ii", 0, 0],
    ["Target Sum", "M", "target-sum", 0, 0],
    ["Interleaving String", "M", "interleaving-string", 0, 0],
    ["Longest Increasing Path in a Matrix", "H", "longest-increasing-path-in-a-matrix", 0, 0],
    ["Distinct Subsequences", "H", "distinct-subsequences", 0, 0],
    ["Edit Distance", "M", "edit-distance", 0, 0],
    ["Burst Balloons", "H", "burst-balloons", 0, 0],
    ["Regular Expression Matching", "H", "regular-expression-matching", 0, 0],
  ]],
  ["Greedy", [
    ["Maximum Subarray", "M", "maximum-subarray", 1, 0],
    ["Jump Game", "M", "jump-game", 1, 0],
    ["Jump Game II", "M", "jump-game-ii", 0, 0],
    ["Gas Station", "M", "gas-station", 0, 0],
    ["Hand of Straights", "M", "hand-of-straights", 0, 0],
    ["Merge Triplets to Form Target Triplet", "M", "merge-triplets-to-form-target-triplet", 0, 0],
    ["Partition Labels", "M", "partition-labels", 0, 0],
    ["Valid Parenthesis String", "M", "valid-parenthesis-string", 0, 0],
  ]],
  ["Intervals", [
    ["Insert Interval", "M", "insert-interval", 1, 0],
    ["Merge Intervals", "M", "merge-intervals", 1, 0],
    ["Non-overlapping Intervals", "M", "non-overlapping-intervals", 1, 0],
    ["Meeting Rooms", "E", "meeting-rooms", 1, 1],
    ["Meeting Rooms II", "M", "meeting-rooms-ii", 1, 1],
    ["Minimum Interval to Include Each Query", "H", "minimum-interval-to-include-each-query", 0, 0],
  ]],
  ["Math & Geometry", [
    ["Rotate Image", "M", "rotate-image", 1, 0],
    ["Spiral Matrix", "M", "spiral-matrix", 1, 0],
    ["Set Matrix Zeroes", "M", "set-matrix-zeroes", 1, 0],
    ["Happy Number", "E", "happy-number", 0, 0],
    ["Plus One", "E", "plus-one", 0, 0],
    ["Pow(x, n)", "M", "powx-n", 0, 0],
    ["Multiply Strings", "M", "multiply-strings", 0, 0],
    ["Detect Squares", "M", "detect-squares", 0, 0],
  ]],
  ["Bit Manipulation", [
    ["Single Number", "E", "single-number", 0, 0],
    ["Number of 1 Bits", "E", "number-of-1-bits", 1, 0],
    ["Counting Bits", "E", "counting-bits", 1, 0],
    ["Reverse Bits", "E", "reverse-bits", 1, 0],
    ["Missing Number", "E", "missing-number", 1, 0],
    ["Sum of Two Integers", "M", "sum-of-two-integers", 1, 0],
    ["Reverse Integer", "M", "reverse-integer", 0, 0],
  ]],
];

const DIFFICULTY: Record<"E" | "M" | "H", Difficulty> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

export const TOPICS: string[] = RAW.map(([topic]) => topic);

export const PROBLEMS: Problem[] = RAW.flatMap(([topic, rows]) =>
  rows.map(([name, d, slug, blind, premium]) => ({
    id: slug,
    name,
    topic,
    difficulty: DIFFICULTY[d],
    blind75: blind === 1,
    premium: premium === 1,
    url: `https://leetcode.com/problems/${slug}/`,
    // neetcode.io renames problems, so its slugs can't be derived reliably.
    // A scoped YouTube search lands on the right walkthrough every time.
    videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `neetcode ${name}`,
    )}`,
  })),
);

export const PROBLEM_BY_ID: Record<string, Problem> = Object.fromEntries(
  PROBLEMS.map((p) => [p.id, p]),
);

export function problemsInList(list: ListId): Problem[] {
  return list === "blind75" ? PROBLEMS.filter((p) => p.blind75) : PROBLEMS;
}

export const LIST_LABELS: Record<ListId, string> = {
  blind75: "Blind 75",
  neetcode150: "NeetCode 150",
};

/**
 * The pre-2.0 version of this app stored progress keyed by problem *name* in
 * localStorage. Several of those names have since been corrected to match
 * LeetCode, so importing old progress needs these bridges.
 */
export const LEGACY_NAME_ALIASES: Record<string, string> = {
  "build tree from preorder and inorder traversal":
    "construct-binary-tree-from-preorder-and-inorder-traversal",
  "add and search word data structure design":
    "design-add-and-search-words-data-structure",
  "palindromic partitioning": "palindrome-partitioning",
  "lowest common ancestor of a binary search tree":
    "lowest-common-ancestor-of-a-binary-search-tree",
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const BY_NORMALIZED_NAME: Record<string, string> = Object.fromEntries(
  PROBLEMS.map((p) => [normalize(p.name), p.id]),
);

/** Resolves a legacy problem name to a catalog id, or null if it's gone. */
export function resolveLegacyName(name: string): string | null {
  const key = normalize(name);
  return LEGACY_NAME_ALIASES[key] ?? BY_NORMALIZED_NAME[key] ?? null;
}
