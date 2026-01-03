// models/Worker.js
import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  experience: Number,
  rating: Number,
  skills: [String],
  languages: [String],
  workType: String,
  hours: Number,
});

export default mongoose.model("Worker", workerSchema);
