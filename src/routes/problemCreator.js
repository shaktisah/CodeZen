const express = require('express');
const problemRouter = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');

const {
    createProblem,
    getAllProblem,
    getproblembyId,
    updateProblem,
    deleteProblem,
    solvedProblem,
    solvedAllProblemByUser
} = require("../controllers/userproblem");

// Admin problem management routes
problemRouter.post("/create", adminMiddleware, createProblem);

// Update support for /problem/update/:id and /problem/:id using PUT or PATCH
problemRouter.patch("/update/:id", adminMiddleware, updateProblem);
problemRouter.put("/update/:id", adminMiddleware, updateProblem);
problemRouter.patch("/:id", adminMiddleware, updateProblem);
problemRouter.put("/:id", adminMiddleware, updateProblem);

// Delete support for /problem/delete/:id and /problem/:id
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem);
problemRouter.delete("/:id", adminMiddleware, deleteProblem);

// User-specific solved problems (Must be above /:id to avoid collision)
problemRouter.get("/problemAllSolvedbyuser", userMiddleware, solvedAllProblemByUser);
problemRouter.get("/user", userMiddleware, solvedProblem);

// Public get routes
problemRouter.get("/getAllProblem", userMiddleware, getAllProblem);
problemRouter.get("/", getAllProblem);
problemRouter.get("/ProblemById/:id", userMiddleware, getproblembyId);
problemRouter.get("/:id", getproblembyId);

module.exports = problemRouter;