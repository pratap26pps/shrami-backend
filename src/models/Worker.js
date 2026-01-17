import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
 
  id: Number,
  name: String,
  age: Number,
  location: String,
  experience: Number,
  gender: String,
  skills: String,
  image: String,

  // NEW FIELDS
  workingHours: String,
  physicalAbility: String,
  language: String,
  price: Number,
  workType: String,
});

export default mongoose.model("Worker", workerSchema, "Worker");

 
 