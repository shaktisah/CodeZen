const userMiddleware = require("../middleware/userMiddleware");

const express=required('express');
const submitRouter=express.Router();
const userMiddleware=require("../middleware/userMiddleware");
const submitCode=require("../controllers/userSubmission");


submitRouter.post("./submit/:id",userMiddleware,submitCode);
submitRouter.post("/run/:id",userMiddleware,submitCode.runCode);