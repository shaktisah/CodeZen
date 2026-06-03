const mongoose = require('mongoose');
const Problem = require("../models/problem");
const { getLanguageById, submitBatch } = require("../utils/ProblemUtility");
const User = require("../models/user");

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
        const creatorId = problemCreator || (req.user && req.user.id);
        if (!creatorId) {
            return res.status(400).json({
                success: false,
                message: "Failed to create problem: problemCreator is required."
            });
        }

        const allTestCases = [...visibleTestCases, ...hiddenTestCases];

        for (const { language, completeCode } of referenceSolution) {
            const languageId = getLanguageById(language);

            const submissions = allTestCases.map((testCase) => {
                const ext = languageId === "javascript" ? "js" :
                            languageId === "python" ? "py" :
                            languageId === "java" ? "java" : "cpp";

                let driverCode = completeCode;

                if (languageId === "javascript") {
                    let formattedInput = `const ${testCase.input.replace(/,\s*(?=[a-zA-Z_])/g, '; const ')}`;
                    driverCode += `\n\n${formattedInput};\nconsole.log(JSON.stringify(twoSum(nums, target)));`;
                } else if (languageId === "python") {
                    let formattedInput = testCase.input.replace(/,\s*(?=[a-zA-Z_])/g, '\n');
                    driverCode += `\n\n${formattedInput}\nprint(twoSum(nums, target))`;
                } else if (languageId === "cpp") {
                    let formattedInput = testCase.input;
                    formattedInput = formattedInput.replace(/\[/g, '{').replace(/\]/g, '}');
                    formattedInput = formattedInput.replace(/nums\s*=\s*/g, 'vector<int> nums = ');
                    formattedInput = formattedInput.replace(/target\s*=\s*/g, 'int target = ');
                    formattedInput = formattedInput.replace(/,\s*(?=int target)/g, '; ');

                    driverCode = `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\n${completeCode}\n\nint main() {\n    ${formattedInput};\n    vector<int> res = twoSum(nums, target);\n    if (res.size() >= 2) {\n        cout << "[" << res[0] << "," << res[1] << "]";\n    }\n    return 0;\n}`;
                } else if (languageId === "java") {
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

            const results = await submitBatch(submissions);

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

        const problem = await Problem.create({
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases,
            startCode,
            referenceSolution,
            problemCreator: creatorId
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

const getAllProblem = async (req, res) => {
    try {
        const problems = await Problem.find({})
            .select('_id title difficulty tags');

        return res.status(200).json(problems);
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

const getproblembyId = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid problem ID format" });
        }
        const problem = await Problem.findById(req.params.id).select("-hiddenTestCases -referenceSolution");
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }
        return res.status(200).json({ success: true, problem });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

const updateProblem = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid problem ID format" });
        }
        const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }
        return res.status(200).json({ success: true, problem });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

const deleteProblem = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid problem ID format" });
        }
        const problem = await Problem.findByIdAndDelete(req.params.id);
        if (!problem) {
            return res.status(404).json({ success: false, message: "Problem not found" });
        }
        return res.status(200).json({ success: true, message: "Problem deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

const solvedProblem = async (req, res) => {
    try {
        const user = req.result;
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: User context missing" });
        }
        return res.status(200).json({ success: true, solved: user.problemSolved || [] });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

const solvedAllProblemByUser = async (req, res) => {
    try {
        const userId = req.result._id;
        const user = await User.findById(userId).populate("problemSolved");
        return res.status(200).send(user);
    } catch (err) {
        return res.status(500).send("Server Error");
    }
};

module.exports = {
    createProblem,
    getAllProblem,
    getproblembyId,
    updateProblem,
    deleteProblem,
    solvedProblem,
    solvedAllProblemByUser
};
