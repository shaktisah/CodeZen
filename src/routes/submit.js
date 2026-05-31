const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const { submitCode } = require('../controllers/userSubmission');

// POST /submission/submit/:id -> Protected by user auth
submitRouter.post('/submit/:id', userMiddleware, submitCode);

module.exports = submitRouter;
