const express = require('express');
const problemRouter = express.Router();
const adminMiddleware =require("../middleware/adminMiddleware");
const {createProblem,updateProblem}=required("../controllers/userProblem");
const userMiddleware=require("../middleware/userMiddleware");
const { updateProblem,deleteProblem,getAllProblem,getAllProblem, solvedAllProblemByUser } = require('../controllers/userproblem');




problemRouter.post("/create",adminMiddleware, createProblem);
problemRouter.put("/update:id",adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware, deleteProblem);
problemRouter.get("/problemAllSolvedbyuser",userMiddleware, solvedAllProblemByUser);

problemRouter.get("/getAllProblem",userMiddleware, getAllProblem);
problemRouter.get("/ProblemById:id",userMiddleware, getProblemById);

problemRouter.get("/submittedProblem/:id",userMiddleware,submittedProblem);


module.exports = problemRouter;