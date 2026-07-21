const Submission = require("../models/submission");
const { getLanguageById, submitBatch, extractFunctionName, buildDriverCode } = require("../utils/ProblemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");


const submitCode = async (req, res) => {
    try {
        const userId = req.result ? req.result._id : (req.user ? req.user.id : null);
        const body = req.body || {};
        const problemId = req.params.id || body.problemId;
        
        const { code } = body;
        const language = body.language || body.languageId;

        if (!userId || !code || !problemId || !language) {
            return res.status(400).send("some field missing");
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).send("Problem not found");
        }

        const allTestCases = [...problem.visibleTestCases, ...problem.hiddenTestCases];
        if (allTestCases.length === 0) {
            return res.status(400).send("This problem has no test cases to evaluate.");
        }

        const submittedResult = await Submission.create({
            userId,
            problemId,
            code,
            language,
            testCasesPassed: 0,
            status: 'Pending',
            totalTestCases: allTestCases.length
        });

        const languageId = getLanguageById(language);
        const funcName = extractFunctionName(problem, languageId);

        const submissions = allTestCases.map((testCase) => {
            const ext = languageId === "javascript" ? "js" :
                        languageId === "python" ? "py" :
                        languageId === "java" ? "java" : "cpp";

            const driverCode = buildDriverCode(languageId, code, testCase.input, funcName);

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

        let testCasesPassed = 0;
        let finalStatus = "Accepted";
        let errorMessage = null;
        let runtime = 0;
        let memory = 0;

        for (let i = 0; i < testResult.length; i++) {
            const test = testResult[i];
            
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

        submittedResult.status = finalStatus;
        submittedResult.testCasesPassed = testCasesPassed;
        submittedResult.errorMessage = errorMessage;
        submittedResult.runtime = runtime;
        submittedResult.memory = memory;

        await submittedResult.save();

        if (finalStatus === "Accepted") {
            const user = await User.findById(userId);
            if (user) {
                if (!user.problemSolved) {
                    user.problemSolved = [];
                }
                if (!user.problemSolved.includes(problemId.toString())) {
                    user.problemSolved.push(problemId.toString());
                    await user.save();
                }
            }
        }

        res.status(201).send(submittedResult);

    } catch (err) {
        console.error("Submission error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};

const runCode = async (req, res) => {
    try {
        const body = req.body || {};
        const problemId = req.params.id || body.problemId;
        const { code } = body;
        const language = body.language || body.languageId;

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
        const funcName = extractFunctionName(problem, languageId);

        const submissions = visibleTestCases.map((testCase) => {
            const ext = languageId === "javascript" ? "js" :
                        languageId === "python" ? "py" :
                        languageId === "java" ? "java" : "cpp";

            const driverCode = buildDriverCode(languageId, code, testCase.input, funcName);

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
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};

const getMySubmissions = async (req, res) => {
    try {
        const userId = req.result._id;
        const submissions = await Submission.find({ userId })
            .populate('problemId', 'title difficulty')
            .sort({ createdAt: -1 });
        return res.status(200).json({ success: true, submissions });
    } catch (err) {
        console.error("GetMySubmissions error:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};

module.exports = { submitCode, runCode, getMySubmissions };