import dotenv from "dotenv";
dotenv.config(); // 👈 MUST be at the very top

import mongoose from "mongoose";
import XLSX from "xlsx";
import connectDB from "./src/config/db.js";
import Worker from "./src/models/Worker.js";

await connectDB(); // ensure DB connected first

const workbook = XLSX.readFile("./workers.xlsx");
const sheetName = workbook.SheetNames[0];
const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

const formattedData = sheetData.map(item => ({
  name: item.name,
  age: Number(item.age),
  gender: item.gender,
  experience: Number(item.experience),
  rating: Number(item.rating),
  skills: item.skills?.split(",").map(s => s.trim()) || [],
  languages: item.languages?.split(",").map(l => l.trim()) || [],
  workType: item.workType,
  hours: Number(item.hours),
}));

await Worker.insertMany(formattedData);
console.log("✅ Excel data imported successfully");

await mongoose.connection.close();
process.exit(0);
