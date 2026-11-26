
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteNavbar from "@/components/SiteNavbar";
import PageHeading from "@/components/PageHeading";

const categories = [
  "Electronics",
  "Documents",
  "Accessories",
  "Bags",
  "Clothing",
  "Jewelry",
  "Pets",
  "Other",
];

export default function NewReportPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    type: "lost",
    title: "",
    description: "",
    category: "",
    city: "",
    state: "",
    incidentDate: "",
    privateDetails: "",
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageWarning, setImageWarning] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImageChange(event) {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length > 3) {
      setError("You can select a maximum of 3 images.");
      event.target.value = "";
      setImages([]);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, PNG and WEBP images are allowed.");
        event.target.value = "";
        setImages([]);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be 5 MB or smaller.");
        event.target.value = "";
        setImages([]);
        return;
      }
    }

    setError("");
    setImages(selectedFiles);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setImageWarning("");

    try {
      // Step 1: Create the report in MongoDB.
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create report.");
      }

      const reportId = data.report?.id;

      if (!reportId) {
        throw new Error("Report was created, but its ID was not returned.");
      }

      // Step 2: Upload images if the user selected any.
      if (images.length > 0) {
        const imageFormData = new FormData();

        images.forEach((image) => {
          imageFormData.append("images", image);
        });

        const uploadResponse = await fetch(
          `/api/reports/${reportId}/images`,
          {
            method: "POST",
            body: imageFormData,
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.success) {
          setImageWarning(
            uploadData.message ||
              "The report was created, but image upload failed."
          );
          setLoading(false);
          return;
        }
      }

      router.push(`/reports/${reportId}`);
      router.refresh();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <SiteNavbar />

      <section className="mx-auto max-w-3xl px-5 py-10">
        <PageHeading
          eyebrow="Community report"
          title="Report an item"
          description="Share the details so the community can help reunite an item with its owner."
        />

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* Report Type */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-800">
              What are you reporting?
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((previous) => ({ ...previous, type: "lost" }))
                }
                className={`rounded-lg border p-4 text-sm font-semibold ${
                  form.type === "lost"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                I Lost Something
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm((previous) => ({ ...previous, type: "found" }))
                }
                className={`rounded-lg border p-4 text-sm font-semibold ${
                  form.type === "found"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                I Found Something
              </button>
            </div>
          </div>

          {/* Item Information */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Item Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Example: Black Samsung phone"
              minLength={3}
              maxLength={100}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the item and where it was lost or found..."
              minLength={10}
              maxLength={1000}
              rows={4}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                City
              </label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter city"
                minLength={2}
                maxLength={80}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                State
              </label>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                placeholder="Enter state"
                minLength={2}
                maxLength={80}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Date Lost / Found
            </label>
            <input
              type="date"
              name="incidentDate"
              value={form.incidentDate}
              onChange={handleChange}
              max={new Date().toLocaleDateString("en-CA")}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Private Details */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <label className="mb-2 block text-sm font-semibold text-amber-900">
              Private Ownership Verification Details
            </label>

            <p className="mb-3 text-sm leading-6 text-amber-800">
              Provide details that only the genuine owner would know, such as
              a unique mark, sticker, hidden feature or identifying contents.
              These details are not shown publicly.
            </p>

            <textarea
              name="privateDetails"
              value={form.privateDetails}
              onChange={handleChange}
              placeholder="Enter private identifying details..."
              minLength={5}
              maxLength={1000}
              rows={3}
              required
              className="w-full rounded-lg border border-amber-300 bg-white px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          {/* Images */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Item Photos (Optional)
            </label>

            <p className="mb-3 text-sm text-slate-500">
              Upload up to 3 images. JPG, PNG or WEBP. Maximum 5 MB each.
            </p>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageChange}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm"
            />

            {images.length > 0 && (
              <p className="mt-2 text-sm text-green-700">
                {images.length} image(s) selected
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {imageWarning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Report created, but images failed to upload.</p>
              <p className="mt-1">{imageWarning}</p>
              <p className="mt-2">
                You can view your report from the dashboard. Do not submit the
                same report again.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || Boolean(imageWarning)}
            className="w-full rounded-lg bg-blue-600 px-6 py-3.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Submitting Report..." : "Submit Report"}
          </button>
        </form>
      </section>
    </main>
  );
}
