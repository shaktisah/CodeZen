const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const submitCodeRateLimiter = require('../middleware/submitRateLimiter');
const { submitCode, runCode } = require('../controllers/userSubmission');

// POST /submission/submit/:id -> Protected by user auth
submitRouter.post('/submit/:id', userMiddleware, submitCodeRateLimiter, submitCode);

// POST /submission/runCode/:id -> Protected by user auth (Run code against sample tests)
submitRouter.post('/runCode/:id', userMiddleware, submitCodeRateLimiter, runCode);

module.exports = submitRouter;
