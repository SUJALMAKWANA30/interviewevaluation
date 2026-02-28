import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import UserTimeDetails from "../src/models/UserTimeDetails.js";
import CandidateDetails from "../src/models/CandidateDetails.js";

await mongoose.connect(process.env.MONGODB_URI);

const timesNoDrive = await UserTimeDetails.find({
  $or: [{ driveId: null }, { driveId: { $exists: false } }],
}).lean();

console.log("Records with no driveId:", timesNoDrive.length);

let fixed = 0;
for (const t of timesNoDrive) {
  const cand = await CandidateDetails.findOne({
    email: t.email.toLowerCase(),
  }).lean();
  if (cand && cand.driveId) {
    await UserTimeDetails.updateOne(
      { _id: t._id },
      { $set: { driveId: cand.driveId } }
    );
    fixed++;
    console.log("Fixed:", t.email, "->", cand.driveId);
  }
}
console.log("Total fixed:", fixed);
await mongoose.disconnect();
