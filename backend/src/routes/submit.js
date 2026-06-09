const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const { submitCodeRateLimiter, runCodeRateLimiter } = require('../middleware/submitRateLimiter');
const { submitCode, runCode, getMySubmissions } = require('../controllers/userSubmission');

submitRouter.post('/submit/:id', userMiddleware, submitCodeRateLimiter, submitCode);
submitRouter.post('/runCode/:id', userMiddleware, runCodeRateLimiter, runCode);
submitRouter.get('/my-submissions', userMiddleware, getMySubmissions);

module.exports = submitRouter;

