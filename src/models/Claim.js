import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      index: true,
    },
    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    finderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    evidence: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1500,
      select: false,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
      index: true,
    },
    handoverCodeHash: {
      type: String,
      select: false,
      default: null,
    },
    handoverCodeExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A claimant cannot create duplicate pending claims for one report.
claimSchema.index(
  { reportId: 1, claimantId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

const Claim = mongoose.models.Claim || mongoose.model("Claim", claimSchema);
export default Claim;