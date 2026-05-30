const Problem = require("../models/problem");
const { getLanguageById, submitBatch } = require("../utils/ProblemUtility");

// 1. Create Problem (with OneCompiler verification)
const createProblem = async (req, res) => {
    const {
        title,
        description,
        difficulty,
        tags,
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution,
        problemCreator
    } = req.body;

    try {
        const allTestCases = [...visibleTestCases, ...hiddenTestCases];

        for (const { language, completeCode } of referenceSolution) {
            const languageId = getLanguageById(language); // "javascript", "cpp", "python", "java"

            // Map test cases to OneCompiler payload structure
            const submissions = allTestCases.map((testCase) => {
                const ext = languageId === "javascript" ? "js" :
                            languageId === "python" ? "py" :
                            languageId === "java" ? "java" : "cpp";

                let driverCode = completeCode;

                // Dynamically wrap the reference code to execute the testcase and print result
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

                    driverCode = `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\n${completeCode}\n\nint main() {\n    ${formattedInput};\n    vector<int> res = twoSum(nums, target);\n    if (res.size() >= 2) {\n        cout << "[" << res[0] << "," << res[1] << "]";\n    }\n    return 0;\n}`;
                } else if (languageId === "java") {
                    // For java, wrap it inside a class with a main method
                    let formattedInput = testCase.input;
                    formattedInput = formattedInput.replace(/\[/g, 'new int[]{').replace(/\]/g, '}');
                    formattedInput = formattedInput.replace(/nums\s*=\s*/g, 'int[] nums = ');
                    formattedInput = formattedInput.replace(/target\s*=\s*/g, 'int target = ');
                    formattedInput = formattedInput.replace(/,\s*(?=int target)/g, '; ');

                    driverCode = `import java.util.*;\n\npublic class Main {\n    ${completeCode}\n\n    public static void main(String[] args) {\n        Main solver = new Main();\n        ${formattedInput};\n        int[] res = solver.twoSum(nums, target);\n        System.out.print(Arrays.toString(res).replace(" ", ""));\n    }\n}`;
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

            // Submit all test cases to OneCompiler API in parallel
            const results = await submitBatch(submissions);

            // Verify results
            for (let i = 0; i < results.length; i++) {
                const result = results[i];
                if (result.status !== "success" || result.exception) {
                    return res.status(400).json({
                        success: false,
                        message: `Verification failed: Compilation or Runtime Error in ${language}.`,
                        error: result.stderr || result.exception
                    });
                }

                const expected = submissions[i].expectedOutput.replace(/\s+/g, "");
                const actual = result.stdout.replace(/\s+/g, "");

                if (actual !== expected) {
                    return res.status(400).json({
                        success: false,
                        message: `Verification failed for ${language} reference solution.`,
                        detail: `Test case ${i + 1} failed. Expected: ${expected}, Got: ${actual}`
                    });
                }
            }
        }

        // If verified, save problem to MongoDB
        const problem = await Problem.create({
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases,
            startCode,
            referenceSolution,
            problemCreator
        });

        return res.status(201).json({
            success: true,
            message: "Problem verified and created successfully!",
            problem
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to create problem",
            error: err.message
        });
    }
};

// 2. Get All Problems
const getAllProblem = async (req, res) => {
    try {
        const problems = await Problem.find().select("-hiddenTestCases -referenceSolution");
        return res.status(200).json({ success: true, problems });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 3. Get Problem by ID
const getproblembyId = async (req, res) => {
    try {
        const problem = await Problem.findById(req.params.id).select("-hiddenTestCases -referenceSolution");
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }
        return res.status(200).json({ success: true, problem });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 4. Update Problem
const updateProblem = async (req, res) => {
    try {
        const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }
        return res.status(200).json({ success: true, problem });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 5. Delete Problem
const deleteProblem = async (req, res) => {
    try {
        const problem = await Problem.findByIdAndDelete(req.params.id);
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }
        return res.status(200).json({ success: true, message: "Problem deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// 6. Get User Solved Problems
const solvedProblem = async (req, res) => {
    try {
        // Implement solved problem listing depending on your UserSchema solved list
        return res.status(200).json({ success: true, message: "Solved problems route" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    createProblem,
    getAllProblem,
    getproblembyId,
    updateProblem,
    deleteProblem,
    solvedProblem
};
