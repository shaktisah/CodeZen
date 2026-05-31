const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = new Schema({
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    language: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Wrong Answer', 'Compilation Error', 'Runtime Error'],
        default: 'Pending'
    },
    testCasesPassed: {
        type: Number,
        default: 0
    },
    totalTestCases: {
        type: Number,
        default: 0
    },
    errorMessage: {
        type: String
    },
    runtime: {
        type: Number,
        default: 0
    },
    memory: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema, 'submissions');
module.exports = Submission;
