const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 20,
      trim: true
    },

    lastName: {
      type: String,
      minlength: 2,
      maxlength: 20,
      trim: true
    },

    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true
    },

    age: {
      type: Number,
      min: 6,
      max: 80
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    problemSolved: {
      type: [{
        type:Schema.Types.ObjectId,
        ref:"problem"
      }],
      unique:true
    },

    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;