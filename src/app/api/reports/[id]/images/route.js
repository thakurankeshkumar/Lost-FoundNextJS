import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import { requireUser } from "@/lib/permissions";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_IMAGES = 3;

function getImageFormat(buffer) {
    // JPEG
    if (
        buffer.length >= 3 &&
        buffer[0] === 0xff &&
        buffer[1] === 0xd8 &&
        buffer[2] === 0xff
    ) {
        return "jpg";
    }

    // PNG
    if (
        buffer.length >= 8 &&
        buffer.subarray(0, 8).equals(
            Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        )
    ) {
        return "png";
    }

    // WEBP
    if (
        buffer.length >= 12 &&
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
        return "webp";
    }

    return null;
}

function uploadToCloudinary(buffer, format) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "lost-found/reports",
                resource_type: "image",
                format,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        stream.end(buffer);
    });
}

export async function POST(request, context) {
    try {
        const auth = await requireUser();

        if (auth.error) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        const { id } = await context.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid report ID" },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const files = formData.getAll("images");

        if (files.length === 0) {
            return NextResponse.json(
                { success: false, message: "Please select at least one image" },
                { status: 400 }
            );
        }

        if (files.length > MAX_IMAGES) {
            return NextResponse.json(
                { success: false, message: "You can upload up to 3 images at a time" },
                { status: 400 }
            );
        }

        await connectDB();

        const report = await Report.findOne({
            _id: id,
            userId: auth.user._id,
            status: "active",
        });

        if (!report) {
            return NextResponse.json(
                { success: false, message: "Report not found or access denied" },
                { status: 404 }
            );
        }

        if (report.images.length + files.length > MAX_IMAGES) {
            return NextResponse.json(
                { success: false, message: "A report can have a maximum of 3 images" },
                { status: 400 }
            );
        }

        const uploadedAssets = [];

        try {
            for (const file of files) {
                if (
                    !file ||
                    typeof file.arrayBuffer !== "function" ||
                    file.size === 0
                ) {
                    throw new Error("Invalid image file");
                }

                if (file.size > MAX_FILE_SIZE) {
                    throw new Error("Each image must be 5 MB or smaller");
                }

                const buffer = Buffer.from(await file.arrayBuffer());
                const format = getImageFormat(buffer);

                if (!format) {
                    throw new Error("Only valid JPG, PNG, and WEBP images are allowed");
                }

                const result = await uploadToCloudinary(buffer, format);

                uploadedAssets.push({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }

            report.images.push(...uploadedAssets);
            await report.save();

            return NextResponse.json(
                {
                    success: true,
                    message: "Images uploaded successfully",
                    images: uploadedAssets.map((image) => ({
                        url: image.url,
                    })),
                },
                { status: 201 }
            );
        } catch (error) {
            // Remove uploaded files if the database save or another upload fails.
            await Promise.all(
                uploadedAssets.map((asset) =>
                    cloudinary.uploader.destroy(asset.publicId).catch(() => null)
                )
            );

            throw error;
        }
    } catch (error) {
        console.error("Image upload error:", error);

        const knownErrors = [
            "Invalid image file",
            "Each image must be 5 MB or smaller",
            "Only valid JPG, PNG, and WEBP images are allowed",
        ];

        if (knownErrors.includes(error.message)) {
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: "Image upload failed" },
            { status: 500 }
        );
    }
}
