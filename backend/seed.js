const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const main = require('./src/config/db');
const User = require('./src/models/user');
const Problem = require('./src/models/problem');

async function seed() {
  try {
    await main();
    console.log("Connected to MongoDB successfully!");

   
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
    } else {
      console.log(`Found existing admin user: ${admin.emailId}`);
    }

 
    const existingProblem = await Problem.findOne({ title: 'Two Sum' });
    if (!existingProblem) {
      const sampleProblem = await Problem.create({
        title: 'Two Sum',
        description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        difficulty: 'easy',
        tags: ['Array', 'Hash Table', 'Algorithms'],
        visibleTestCases: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: 'nums[1] + nums[2] == 6, we return [1, 2].' }
        ],
        hiddenTestCases: [
          { input: 'nums = [3,3], target = 6', output: '[0,1]' }
        ],
        startCode: [
          { language: 'javascript', initialCode: 'function twoSum(nums, target) {\n    // Write your code here\n}' },
          { language: 'python', initialCode: 'def twoSum(nums, target):\n    # Write your code here\n    pass' },
          { language: 'c++', initialCode: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your C++ code here\n    }\n};' },
          { language: 'java', initialCode: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n    }\n}' }
        ],
        referenceSolution: [
          { language: 'javascript', completeCode: 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}' }
        ],
        problemCreator: admin._id
      });
      console.log(`Created sample problem: "${sampleProblem.title}"`);
    } else {
      console.log('Sample problem "Two Sum" already exists.');
    }

    mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
