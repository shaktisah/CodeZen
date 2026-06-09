const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const main = require('./src/config/db');
const User = require('./src/models/user');
const Problem = require('./src/models/problem');

const problemTitles = [
  "Reverse Words in a String", "Valid Palindrome", "Merge Sorted Arrays", "Maximum Subarray",
  "Longest Substring Without Repeating Characters", "Three Sum", "Container With Most Water",
  "Valid Parentheses", "Merge Two Sorted Lists", "Search in Rotated Sorted Array",
  "Find First and Last Position of Element in Sorted Array", "Climbing Stairs", "Merge Intervals",
  "Unique Paths", "Edit Distance", "Minimum Window Substring", "Subsets", "Word Search",
  "Remove Nth Node From End of List", "Letter Combinations of a Phone Number", "Generate Parentheses",
  "Group Anagrams", "Maximum Depth of Binary Tree", "Binary Tree Level Order Traversal",
  "Symmetric Tree", "Validate Binary Search Tree", "Same Tree", "Flatten Binary Tree to Linked List",
  "Populating Next Right Pointers in Each Node", "Best Time to Buy and Sell Stock",
  "Binary Tree Maximum Path Sum", "Word Ladder", "Single Number", "Copy List with Random Pointer",
  "Linked List Cycle", "LRU Cache", "Sort List", "Maximum Product Subarray",
  "Find Minimum in Rotated Sorted Array", "Intersection of Two Linked Lists", "Majority Element",
  "Excel Sheet Column Title", "Excel Sheet Column Number", "Repeated DNA Sequences",
  "Binary Tree Right Side View", "Number of Islands", "Happy Number", "Reverse Linked List",
  "Course Schedule", "Implement Trie (Prefix Tree)"
];

const tagsList = [
  ["String", "Two Pointers"], ["String", "Two Pointers"], ["Array", "Sorting"], ["Array", "Dynamic Programming"],
  ["Hash Table", "String", "Sliding Window"], ["Array", "Two Pointers", "Sorting"], ["Array", "Two Pointers"],
  ["String", "Stack"], ["Linked List", "Recursion"], ["Array", "Binary Search"],
  ["Array", "Binary Search"], ["Dynamic Programming"], ["Array", "Sorting"],
  ["Dynamic Programming", "Math"], ["String", "Dynamic Programming"], ["String", "Sliding Window"],
  ["Backtracking", "Bit Manipulation"], ["Array", "Backtracking", "Matrix"], ["Linked List", "Two Pointers"],
  ["String", "Backtracking"], ["String", "Backtracking"], ["Array", "Hash Table", "String", "Sorting"],
  ["Tree", "Depth-First Search", "Binary Tree"], ["Tree", "Breadth-First Search", "Binary Tree"],
  ["Tree", "Depth-First Search", "Binary Tree"], ["Tree", "Depth-First Search", "Binary Search Tree"],
  ["Tree", "Depth-First Search", "Binary Tree"], ["Tree", "Depth-First Search", "Binary Tree"],
  ["Tree", "Breadth-First Search", "Binary Tree"], ["Array", "Dynamic Programming"],
  ["Tree", "Depth-First Search", "Binary Tree"], ["Breadth-First Search", "Hash Table"],
  ["Bit Manipulation", "Array"], ["Hash Table", "Linked List"], ["Linked List", "Two Pointers"],
  ["Design", "Hash Table", "Linked List", "Doubly-Linked List"], ["Linked List", "Sorting", "Two Pointers"],
  ["Array", "Dynamic Programming"], ["Array", "Binary Search"], ["Linked List", "Two Pointers"],
  ["Array", "Hash Table", "Divide and Conquer", "Sorting"], ["Math", "String"], ["Math", "String"],
  ["Hash Table", "String", "Sliding Window"], ["Tree", "Depth-First Search", "Binary Tree"],
  ["Array", "Depth-First Search", "Breadth-First Search", "Union Find"], ["Hash Table", "Math", "Two Pointers"],
  ["Linked List", "Recursion"], ["Depth-First Search", "Breadth-First Search", "Graph", "Topological Sort"],
  ["Design", "Trie", "Hash Table", "String"]
];

async function seed() {
  try {
    await main();
    console.log("Connected to MongoDB successfully!");

    // 1. Find or create an admin user to own these problems
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('adminpassword123', 10);
      admin = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        emailId: 'admin@codezen.com',
        age: 30,
        role: 'admin',
        password: hashedPassword
      });
      console.log("Created system admin user: admin@codezen.com / adminpassword123");
    }

    // 2. Build array of 100 problems
    const problemsToInsert = [];
    for (let i = 0; i < 100; i++) {
      const baseIndex = i % 50;
      const titleSuffix = i >= 50 ? " II" : "";
      const title = problemTitles[baseIndex] + titleSuffix;
      const tags = tagsList[baseIndex];
      
      // Alternate difficulty
      let difficulty = 'easy';
      if (i % 3 === 1) difficulty = 'medium';
      else if (i % 3 === 2) difficulty = 'hard';

      problemsToInsert.push({
        title: `${i + 1}. ${title}`,
        description: `Given the constraints of ${title}, write an efficient algorithm to solve the problem.\n\n### Input Constraints\n- Array length between 1 and 10^5.\n- Values fit in standard 32-bit integers.`,
        difficulty: difficulty,
        tags: tags,
        visibleTestCases: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'First sample test case explanation.' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'Second sample test case explanation.' }
        ],
        hiddenTestCases: [
          { input: 'nums = [3,3], target = 6', output: '[0,1]' }
        ],
        startCode: [
          { language: 'javascript', initialCode: 'function solve(nums, target) {\n    // Write your JavaScript code here\n}' },
          { language: 'python', initialCode: 'def solve(nums, target):\n    # Write your Python code here\n    pass' },
          { language: 'c++', initialCode: 'class Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        // Write your C++ code here\n    }\n};' },
          { language: 'java', initialCode: 'class Solution {\n    public int[] solve(int[] nums, int target) {\n        // Write your Java code here\n    }\n}' }
        ],
        referenceSolution: [
          { language: 'javascript', completeCode: 'function solve(nums, target) {\n    return [0, 1];\n}' }
        ],
        problemCreator: admin._id
      });
    }

    // Clear existing problems to start clean with exactly 100 problems
    await Problem.deleteMany({});
    console.log("Cleared existing problems collection.");

    // Bulk insert the 100 problems
    const inserted = await Problem.insertMany(problemsToInsert);
    console.log(`Successfully seeded ${inserted.length} problems!`);

    mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
