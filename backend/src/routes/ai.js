const express = require('express');
const aiRouter = express.Router();
const userMiddleware = require('../middleware/userMiddleware');
const { chat } = require('../controllers/aiController');

// All AI endpoints are protected by user middleware to ensure authenticated candidates
aiRouter.post('/chat', userMiddleware, chat);

module.exports = aiRouter;
