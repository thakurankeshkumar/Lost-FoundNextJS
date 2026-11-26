import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: [
        "Electronics", "Documents",
        "Accessories", "Bags", "Clothing",
        "Jewelry", "Pets", "Other",
      ],
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    country: {
      type: String,
      default: "India",
      trim: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    // Private details used later during ownership verification.
    // Never expose this field in public report APIs.
    privateDetails: {
      type: String,
      required: true,
      select: false,
      maxlength: 1000,
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "resolved", "removed", "under_review"],
      default: "active",
      index: true,
    },
    acceptedClaimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Claim",
      default: null,
    },
  },
  { timestamps: true }
);

reportSchema.index({
  status: 1,
  type: 1,
  category: 1,
  city: 1,
});

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
export default Report;