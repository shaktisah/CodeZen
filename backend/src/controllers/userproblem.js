const mongoose = require('mongoose');
const Problem = require("../models/problem");
const { getLanguageById, submitBatch, extractFunctionName, buildDriverCode } = require("../utils/ProblemUtility");
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
            const funcName = extractFunctionName(completeCode, languageId);

            const submissions = allTestCases.map((testCase) => {
                const ext = languageId === "javascript" ? "js" :
                            languageId === "python" ? "py" :
                            languageId === "java" ? "java" : "cpp";

                const driverCode = buildDriverCode(languageId, completeCode, testCase.input, funcName);

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
