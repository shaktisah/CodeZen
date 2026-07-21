const express = require('express');
const aiRouter = express.Router();
const optionalUserMiddleware = require('../middleware/optionalUserMiddleware');
const { chat } = require('../controllers/aiController');

aiRouter.post('/chat', optionalUserMiddleware, chat);

module.exports = aiRouter;
