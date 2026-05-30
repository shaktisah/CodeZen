const express = require('express');
const problemRouter = express.Router();

const {
    createProblem,
    getAllProblem,
    getproblembyId,
    updateProblem,
    deleteProblem,
    solvedProblem
} = require("../controllers/userproblem");

problemRouter.post("/create", createProblem);
problemRouter.patch("/:id", updateProblem);
problemRouter.delete("/:id", deleteProblem);

problemRouter.get("/user", solvedProblem);
problemRouter.get("/", getAllProblem);
problemRouter.get("/:id", getproblembyId);

module.exports = problemRouter;