const mongoose = require('mongoose');
const { Schema } = mongoose;

const problemSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    visibleTestCases: [{
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String }
    }],
    hiddenTestCases: [{
        input: { type: String, required: true },
        output: { type: String, required: true }
    }],
    startCode: [{
        language: { type: String, required: true },
        initialCode: { type: String, required: true }
    }],
    referenceSolution: [{
        language: { type: String, required: true },
        completeCode: { type: String, required: true }
    }],
    problemCreator: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, {
    timestamps: true
});

const Problem = mongoose.model('Problem', problemSchema, 'problems');
module.exports = Problem;
