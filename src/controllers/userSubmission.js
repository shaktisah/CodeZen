const Submission = require("../models/submission");
const { getLanguageById, submitBatch } = require("../utils/ProblemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");

const submitCode = async (req, res) => {
    try {
        const userId = req.result ? req.result._id : (req.user ? req.user.id : null);
        const problemId = req.params.id || req.body.problemId;
        
        const { code } = req.body;
        const language = req.body.language || req.body.languageId;

        if (!userId || !code || !problemId || !language) {
            return res.status(400).send("some field missing");
        }

        // Fetch the problem from database
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).send("Problem not found");
        }

        const allTestCases = [...problem.visibleTestCases, ...problem.hiddenTestCases];
        if (allTestCases.length === 0) {
            return res.status(400).send("This problem has no test cases to evaluate.");
        }

        // Store the submission in database first with 'Pending' status
        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            testCasesPassed: 0,
            status: 'Pending',
            totalTestCases: allTestCases.length
        });

        // Submit code to OneCompiler
        const languageId = getLanguageById(language);

        const submissions = allTestCases.map((testCase) => {
            const ext = languageId === "javascript" ? "js" :
                        languageId === "python" ? "py" :
                        languageId === "java" ? "java" : "cpp";

            let driverCode = code;

            // Dynamically wrap code based on language
            if (languageId === "javascript") {
                let formattedInput = `const ${testCase.input.replace(/,\s*(?=[a-zA-Z_])/g, '; const ')}`;
                driverCode += `\n\n// Driver code\n${formattedInput};\nconsole.log(JSON.stringify(twoSum(nums, target)));`;
            } else if (languageId === "python") {
                let formattedInput = testCase.input.replace(/,\s*(?=[a-zA-Z_])/g, '\n');
                driverCode += `\n\n# Driver code\n${formattedInput}\nprint(twoSum(nums, target))`;
            } else if (languageId === "cpp") {
                let formattedInput = testCase.input;
                formattedInput = formattedInput.replace(/\[/g, '{').replace(/\]/g, '}');
                formattedInput = formattedInput.replace(/nums\s*=\s*/g, 'vector<int> nums = ');
                formattedInput = formattedInput.replace(/target\s*=\s*/g, 'int target = ');
                formattedInput = formattedInput.replace(/,\s*(?=int target)/g, '; ');

                // Support both standalone twoSum and Leetcode-style class Solution
                const hasSolutionClass = code.includes("class Solution");
                const solverCall = hasSolutionClass ? 
                    "Solution solver;\n    vector<int> res = solver.twoSum(nums, target);" :
                    "vector<int> res = twoSum(nums, target);";

                driverCode = `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\n${code}\n\nint main() {\n    ${formattedInput};\n    ${solverCall}\n    if (res.size() >= 2) {\n        cout << "[" << res[0] << "," << res[1] << "]";\n    }\n    return 0;\n}`;
            } else if (languageId === "java") {
                let formattedInput = testCase.input;
                formattedInput = formattedInput.replace(/\[/g, 'new int[]{').replace(/\]/g, '}');
                formattedInput = formattedInput.replace(/nums\s*=\s*/g, 'int[] nums = ');
                formattedInput = formattedInput.replace(/target\s*=\s*/g, 'int target = ');
                formattedInput = formattedInput.replace(/,\s*(?=int target)/g, '; ');

                driverCode = `import java.util.*;\n\npublic class Main {\n    ${code}\n\n    public static void main(String[] args) {\n        Main solver = new Main();\n        ${formattedInput};\n        int[] res = solver.twoSum(nums, target);\n        System.out.print(Arrays.toString(res).replace(" ", ""));\n    }\n}`;
            }

            return {
                language: languageId,
                stdin: "",
                files: [
                    {
                        name: `index.${ext}`,
                        content: driverCode
                    }
                ],
                expectedOutput: testCase.output
            };
        });

        const testResult = await submitBatch(submissions);

        // Update the submit result
        let testCasesPassed = 0;
        let finalStatus = "Accepted";
        let errorMessage = null;
        let runtime = 0;
        let memory = 0;

        for (let i = 0; i < testResult.length; i++) {
            const test = testResult[i];
            
            // Check for API errors, exceptions, or compilation/runtime errors in stderr
            if (test.status !== "success" || test.exception || test.stderr) {
                finalStatus = test.stderr ? "Compilation Error" : "Runtime Error";
                errorMessage = test.stderr || test.exception || "Execution failed";
                break;
            }

            const expected = submissions[i].expectedOutput.replace(/\s+/g, "");
            const actual = (test.stdout || "").replace(/\s+/g, "");

            if (actual === expected) {
                testCasesPassed++;
                runtime += test.executionTime || 0;
                memory = Math.max(memory, test.memoryUsed || 0);
            } else {
                finalStatus = "Wrong Answer";
                errorMessage = `Test case ${i + 1} failed. Expected: ${expected}, Got: ${actual}`;
                break;
            }
        }

        // Store the result in database
        submittedResult.status = finalStatus;
        submittedResult.testCasesPassed = testCasesPassed;
        submittedResult.errorMessage = errorMessage;
        submittedResult.runtime = runtime;
        submittedResult.memory = memory;

        await submittedResult.save();

        
        if (finalStatus === "Accepted") {
            const user = await User.findById(userId);
            if (user) {
                if (!user.problenSolved) {
                    user.problenSolved = [];
                }
                if (!user.problenSolved.includes(problemId.toString())) {
                    user.problenSolved.push(problemId.toString());
                    await user.save();
                }
            }
        }

        res.status(201).send(submittedResult);

    } catch (err) {
        console.error("Submission error:", err);
        res.status(500).send("internal server error");
    }
};



const runCode = async (req, res) => {
    try {
        const problemId = req.params.id || req.body.problemId;
        const { code } = req.body;
        const language = req.body.language || req.body.languageId;

        if (!code || !problemId || !language) {
            return res.status(400).send("some field missing");
        }

     
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).send("Problem not found");
        }

        const visibleTestCases = problem.visibleTestCases;
        if (visibleTestCases.length === 0) {
            return res.status(400).send("This problem has no visible test cases to run.");
        }

     
        const languageId = getLanguageById(language);

        const submissions = visibleTestCases.map((testCase) => {
            const ext = languageId === "javascript" ? "js" :
                        languageId === "python" ? "py" :
                        languageId === "java" ? "java" : "cpp";

            let driverCode = code;

            
            if (languageId === "javascript") {
                let formattedInput = `const ${testCase.input.replace(/,\s*(?=[a-zA-Z_])/g, '; const ')}`;
                driverCode += `\n\n// Driver code\n${formattedInput};\nconsole.log(JSON.stringify(twoSum(nums, target)));`;
            } else if (languageId === "python") {
                let formattedInput = testCase.input.replace(/,\s*(?=[a-zA-Z_])/g, '\n');
                driverCode += `\n\n# Driver code\n${formattedInput}\nprint(twoSum(nums, target))`;
            } else if (languageId === "cpp") {
                let formattedInput = testCase.input;
                formattedInput = formattedInput.replace(/\[/g, '{').replace(/\]/g, '}');
                formattedInput = formattedInput.replace(/nums\s*=\s*/g, 'vector<int> nums = ');
                formattedInput = formattedInput.replace(/target\s*=\s*/g, 'int target = ');
                formattedInput = formattedInput.replace(/,\s*(?=int target)/g, '; ');

               
                const hasSolutionClass = code.includes("class Solution");
                const solverCall = hasSolutionClass ? 
                    "Solution solver;\n    vector<int> res = solver.twoSum(nums, target);" :
                    "vector<int> res = twoSum(nums, target);";

                driverCode = `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\n${code}\n\nint main() {\n    ${formattedInput};\n    ${solverCall}\n    if (res.size() >= 2) {\n        cout << "[" << res[0] << "," << res[1] << "]";\n    }\n    return 0;\n}`;
            } else if (languageId === "java") {
                let formattedInput = testCase.input;
                formattedInput = formattedInput.replace(/\[/g, 'new int[]{').replace(/\]/g, '}');
                formattedInput = formattedInput.replace(/nums\s*=\s*/g, 'int[] nums = ');
                formattedInput = formattedInput.replace(/target\s*=\s*/g, 'int target = ');
                formattedInput = formattedInput.replace(/,\s*(?=int target)/g, '; ');

                driverCode = `import java.util.*;\n\npublic class Main {\n    ${code}\n\n    public static void main(String[] args) {\n        Main solver = new Main();\n        ${formattedInput};\n        int[] res = solver.twoSum(nums, target);\n        System.out.print(Arrays.toString(res).replace(" ", ""));\n    }\n}`;
            }

            return {
                language: languageId,
                stdin: "",
                files: [
                    {
                        name: `index.${ext}`,
                        content: driverCode
                    }
                ],
                expectedOutput: testCase.output
            };
        });

        const testResult = await submitBatch(submissions);

        // Process results
        const runResults = [];
        let allPassed = true;
        let overallStatus = "Accepted";
        let executionError = null;

        for (let i = 0; i < testResult.length; i++) {
            const test = testResult[i];
            const isError = test.status !== "success" || test.exception || test.stderr;
            
            let passed = false;
            const actual = (test.stdout || "").replace(/\s+/g, "");
            const expected = submissions[i].expectedOutput.replace(/\s+/g, "");

            if (isError) {
                allPassed = false;
                overallStatus = test.stderr ? "Compilation Error" : "Runtime Error";
                executionError = test.stderr || test.exception || "Execution failed";
                runResults.push({
                    input: visibleTestCases[i].input,
                    expectedOutput: visibleTestCases[i].output,
                    actualOutput: null,
                    passed: false,
                    stderr: test.stderr,
                    exception: test.exception
                });
            } else {
                passed = (actual === expected);
                if (!passed) {
                    allPassed = false;
                    overallStatus = "Wrong Answer";
                }
                runResults.push({
                    input: visibleTestCases[i].input,
                    expectedOutput: visibleTestCases[i].output,
                    actualOutput: test.stdout,
                    passed,
                    executionTime: test.executionTime || 0,
                    memoryUsed: test.memoryUsed || 0
                });
            }
        }

        return res.status(200).json({
            success: true,
            status: overallStatus,
            allPassed,
            error: executionError,
            results: runResults
        });

    } catch (err) {
        console.error("RunCode error:", err);
        return res.status(500).send("internal server error");
    }
};

module.exports = { submitCode,runCode };