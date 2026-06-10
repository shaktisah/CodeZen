const { GoogleGenerativeAI } = require("@google/generative-ai");

const chat = async (req, res) => {
  try {
    console.log("AI Chat Request Received! Body:", JSON.stringify(req.body, null, 2));
    const { message, code, language, problemTitle, problemDescription, history = [], runResult, submitResult, customApiKey } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    // Build execution context info for prompting or fallback
    let resultContext = "";
    let compileErrorDetail = "";
    let runtimeErrorDetail = "";
    let wrongAnswerDetail = "";
    let lastStatus = "";

    if (runResult) {
      lastStatus = runResult.status;
      resultContext += `\nCandidate's Last "Run Code" Result:\n- Status: ${runResult.status}\n`;
      if (runResult.error) {
        resultContext += `- Error message: ${runResult.error}\n`;
        if (runResult.status === 'Compilation Error') compileErrorDetail = runResult.error;
        else if (runResult.status === 'Runtime Error') runtimeErrorDetail = runResult.error;
      }
      if (runResult.results && runResult.results.length > 0) {
        resultContext += `- Test Case Details:\n`;
        runResult.results.forEach((r, idx) => {
          resultContext += `  * Case ${idx + 1}: ${r.passed ? 'Passed' : 'Failed'}\n`;
          resultContext += `    Input: ${r.input}\n`;
          resultContext += `    Expected: ${r.expectedOutput}\n`;
          resultContext += `    Got: ${r.actualOutput || 'N/A'}\n`;
          if (r.stderr) {
            resultContext += `    Error Output: ${r.stderr}\n`;
          }
          if (!r.passed && !wrongAnswerDetail) {
            wrongAnswerDetail = `Input: ${r.input}, Expected: ${r.expectedOutput}, Got: ${r.actualOutput || 'N/A'}`;
            if (r.stderr) wrongAnswerDetail += ` (Stderr: ${r.stderr})`;
          }
        });
      }
    } else if (submitResult) {
      lastStatus = submitResult.status;
      resultContext += `\nCandidate's Last "Submit Code" Result:\n- Status: ${submitResult.status}\n`;
      resultContext += `- Test Cases Passed: ${submitResult.testCasesPassed || 0} / ${submitResult.totalTestCases || 0}\n`;
      if (submitResult.errorMessage) {
        resultContext += `- Error/Failure details: ${submitResult.errorMessage}\n`;
        if (submitResult.status === 'Compilation Error') compileErrorDetail = submitResult.errorMessage;
        else if (submitResult.status === 'Runtime Error') runtimeErrorDetail = submitResult.errorMessage;
        else if (submitResult.status === 'Wrong Answer') wrongAnswerDetail = submitResult.errorMessage;
      }
    }

    if (!apiKey) {
      // Graceful offline/simulated fallback
      let fallbackResponse = "";

      const lowerMsg = message.toLowerCase();

      // If the user's message is asking about a failure or error, or if we just detect a recent error, we prioritize that context
      const isAskingAboutError = lowerMsg.includes("fail") || lowerMsg.includes("bug") || lowerMsg.includes("error") || lowerMsg.includes("wrong") || lowerMsg.includes("why");

      if (lowerMsg.startsWith("hello") || lowerMsg.startsWith("hi") || lowerMsg.startsWith("hey")) {
        fallbackResponse += `👋 Hello! I'm your **CodeZen AI Assistant** (currently in offline fallback mode).\n\nI can help you step-by-step with **${problemTitle || 'this challenge'}**. Try asking for a **"hint"**, **"explanation"**, **"debugging check"**, or **"optimization tip"**!`;
      } else if (lowerMsg.includes("solution") || lowerMsg.includes("code") || lowerMsg.includes("solve")) {
        fallbackResponse += `🔑 **Conceptual guidance for "${problemTitle || 'this challenge'}":**\n\nI cannot write the complete solution code for you directly (per coding tutor guidelines), but here is how you can approach it:\n1. Break the problem into sub-problems.\n2. Write down helper functions or pseudocode first.\n3. Think about edge cases such as empty input, single element, or extreme limits.\n\nTry asking for a **"hint"** or **"explanation"** for specific steps!`;
      } else if (lastStatus === "Compilation Error" && (isAskingAboutError || lowerMsg.includes("hint") || lowerMsg.includes("help"))) {
        fallbackResponse += `⚠️ **I see your code has a Compilation Error:**\n\n\`\`\`text\n${compileErrorDetail || 'Unknown compiler error'}\n\`\`\`\n\n💡 **Tips to resolve this compilation error:**\n1. Read the error message carefully: it usually points to the exact file, line number, and token that caused the issue.\n2. Check for missing semi-colons, brackets, or misspelled variables/function names.\n3. Make sure any language-specific headers (like C++ vector imports or Java packages) are correctly used.`;
      } else if (lastStatus === "Runtime Error" && (isAskingAboutError || lowerMsg.includes("hint") || lowerMsg.includes("help"))) {
        fallbackResponse += `⚠️ **I see your code encountered a Runtime Error:**\n\n\`\`\`text\n${runtimeErrorDetail || 'Execution timeout or exception'}\n\`\`\`\n\n💡 **Tips to resolve this runtime error:**\n1. Double-check your loop termination criteria to prevent infinite loops or stack overflow errors.\n2. Look out for references to \`null\` or undefined variables/objects.\n3. Verify that index boundaries are respected and you do not access indices out of bounds (e.g. \`arr[arr.length]\`).`;
      } else if (lastStatus === "Wrong Answer" && (isAskingAboutError || lowerMsg.includes("hint") || lowerMsg.includes("help"))) {
        fallbackResponse += `❌ **I see your code failed a test case:**\n\n💡 **Failed Case Context:**\n> ${wrongAnswerDetail || 'Expected output does not match actual output.'}\n\n💡 **Tips to fix your logic:**\n1. Trace the input through your code manually. Create a dry-run table to keep track of variable states at each loop iteration.\n2. Identify if there are any edge cases being missed, such as negative integers, duplicate numbers, empty arrays, or single-element arrays.\n3. Ensure that your output format matches exactly (e.g. check array return indices vs values).`;
      } else if (lastStatus === "Accepted" && (lowerMsg.includes("optimize") || lowerMsg.includes("complexity") || lowerMsg.includes("better"))) {
        fallbackResponse += `🎉 **Congratulations! Your code passed all test cases successfully.**\n\n💡 **Tips for further optimization:**\n1. **Analyze Time Complexity**: If you have nested loops, can you replace them with a Hash Map (O(N) time)?\n2. **Analyze Space Complexity**: Can you optimize your memory usage? For instance, can you do the operation in-place instead of creating extra arrays?\n3. **Refactor**: Clean up any console logs, rename variables to be descriptive, and ensure the code structure is clean and readable.`;
      } else if (lowerMsg.includes("explain") || lowerMsg.includes("understand")) {
        fallbackResponse += `📚 **Problem Explanation for "${problemTitle || 'this challenge'}":**\n\n`;
        fallbackResponse += `To solve this challenge, you need to understand the relationship between the inputs and outputs. Try writing down a few small examples on paper, noting how inputs transform into outputs. Identify:\n- What is the input type and constraint (e.g., array size up to $10^5$)?\n- What is the brute-force approach, and why might it be slow (e.g., $O(N^2)$)?\n- Can we leverage dynamic programming, sorting, two pointers, or a hash map to speed it up?`;
      } else if (lowerMsg.includes("hint") || lowerMsg.includes("help")) {
        if (problemTitle && problemTitle.toLowerCase().includes("two sum")) {
          fallbackResponse += `🔑 **Hint for Two Sum:**\n\n- The brute-force solution checks all pairs using nested loops ($O(N^2)$ time).\n- To improve to $O(N)$ time complexity, use a **Hash Map**.\n- As you iterate through the array, compute the complement needed for each element: \`complement = target - nums[i]\`.\n- Check if the complement is already in the map. If it is, you've found your pair! Otherwise, insert the current number and its index into the map.`;
        } else if (problemTitle && problemTitle.toLowerCase().includes("palindrome")) {
          fallbackResponse += `🔑 **Hint for Palindrome:**\n\n- Use the **Two Pointers** technique.\n- Set one pointer at the beginning of the string and another at the end.\n- Compare the characters. If they are equal, move the pointers closer to the middle (increment start, decrement end) and repeat.\n- Remember to clean the input by removing spaces, punctuation, and ignoring letter case.`;
        } else {
          fallbackResponse += `🔑 **Hint for "${problemTitle || 'this challenge'}":**\n\n`;
          fallbackResponse += `Check the problem constraints! If the input size $N$ is up to $10^5$, an $O(N^2)$ algorithm will likely time out (Time Limit Exceeded). Aim for:\n- An $O(N \\log N)$ sorting-based approach.\n- An $O(N)$ time complexity using a Hash Map or sliding window/two pointers.`;
        }
      } else if (lowerMsg.includes("bug") || lowerMsg.includes("error") || lowerMsg.includes("fail")) {
        fallbackResponse += `🐛 **Debugging checklist for your code:**\n\n1. Double-check your loop boundaries (off-by-one errors) and index access.\n2. Make sure you handle edge cases (empty lists, negative numbers, single element arrays).\n3. Print intermediate values to console/stdout to trace where the logic diverges.`;
      } else if (lowerMsg.includes("optimize") || lowerMsg.includes("complexity")) {
        fallbackResponse += `⚡ **Optimization advice:**\n\n1. Are you allocating extra arrays/objects? Can you solve it in-place to reduce Space Complexity to $O(1)$?\n2. Can you replace nested loops with a single loop using a Hash Table or sorting to reduce Time Complexity to $O(N)$ or $O(N \\log N)$?`;
      } else {
        fallbackResponse += `💬 **How can I help you today?**\n\nSince Gemini connection is offline, you can ask for a **"hint"**, **"explanation"**, **"debugging check"**, or **"optimization tip"** to get contextual guidance for **${problemTitle || 'this challenge'}**.`;
      }

      return res.status(200).json({ response: fallbackResponse, isFallback: true });
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);

    // Build context-rich prompt
    let prompt = `You are CodeZen AI, an expert programming tutor and interview assistant.
Your goal is to help the candidate solve the coding challenge step-by-step.
CRITICAL RULE: Do NOT directly output the full, complete copy-paste solution code. Always guide them with hints, concepts, edge cases, and code snippets of small helper blocks only. Let the candidate write the core algorithm themselves.

Challenge Information:
- Title: ${problemTitle || "Coding Challenge"}
- Description: ${problemDescription || "N/A"}
- Language Selected: ${language || "javascript"}
- Candidate's Current Code:
\`\`\`${language || "javascript"}
${code || "// No code written yet"}
\`\`\`
`;

    if (resultContext) {
      prompt += `\nCandidate's Code Execution Context:${resultContext}\n`;
    }

    prompt += `
Conversation History:
${history.map(m => `${m.role === 'user' ? 'Candidate' : 'CodeZen AI'}: ${m.text}`).join('\n')}

New message from Candidate: ${message}

Instructions for your response:
1. Keep it concise, professional, and friendly.
2. Structure your output clearly using markdown headers, lists, and bold text.
3. Highlight edge cases or logical errors in their current code if applicable.
4. Encourage the candidate to think about time/space complexity.
5. Do NOT give them the full solution.

Response:`;

    // Try multiple models to ensure compatibility with different API environments/dates
    const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-flash-latest"];
    let lastError = null;
    let responseText = "";
    let success = false;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting to generate content using model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        success = true;
        console.log(`Successfully generated content using model: ${modelName}`);
        break;
      } catch (err) {
        console.warn(`Failed to generate content with ${modelName}:`, err.message);
        lastError = err;
        // If the API key itself is invalid or has blocked access, trying other models won't help
        if (err.message.includes("API key not valid") || err.message.includes("API_KEY_INVALID")) {
          throw err;
        }
      }
    }

    if (!success) {
      throw lastError || new Error("All generative models failed to respond");
    }

    return res.status(200).json({ response: responseText });

  } catch (err) {
    console.error("AI Assistant Error:", err);
    return res.status(500).json({ error: "Failed to communicate with AI: " + err.message });
  }
};

module.exports = { chat };
