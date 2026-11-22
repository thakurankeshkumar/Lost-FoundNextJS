import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import { requireUser } from "@/lib/permissions";

export const runtime = "nodejs";

const updateSchema = z.object({
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().min(10).max(1000).optional(),
    category: z.enum([
        "Electronics",
        "Documents",
        "Accessories",
        "Bags",
        "Clothing",
        "Jewelry",
        "Pets",
        "Other",
    ]).optional(),
    city: z.string().trim().min(2).max(80).optional(),
    state: z.string().trim().min(2).max(80).optional(),
    country: z.string().trim().min(2).max(80).optional(),
    incidentDate: z.coerce.date().optional(),
    privateDetails: z.string().trim().min(5).max(1000).optional(),
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field is required" }
);

async function getReportId(context) {
    const params = await context.params;
    return params.id;
}

// GET: View one active report.
export async function GET(request, context) {
    try {
        const id = await getReportId(context);

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid report ID" },
                { status: 400 }
            );
        }

        await connectDB();

        const report = await Report.findOne({
            _id: id,
            status: "active",
        })
            .select("-privateDetails -images.publicId")
            .populate("userId", "name")
            .lean();

        if (!report) {
            return NextResponse.json(
                { success: false, message: "Report not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("Get report error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch report" },
            { status: 500 }
        );
    }
}

// PATCH: Update your own active report.
export async function PATCH(request, context) {
    try {
        const auth = await requireUser();

        if (auth.error) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        const id = await getReportId(context);

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid report ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const result = updateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: "Invalid update information" },
                { status: 400 }
            );
        }

        if (
            result.data.incidentDate &&
            result.data.incidentDate > new Date()
        ) {
            return NextResponse.json(
                { success: false, message: "Incident date cannot be in the future" },
                { status: 400 }
            );
        }

        await connectDB();

        const report = await Report.findOneAndUpdate(
            {
                _id: id,
                userId: auth.user._id,
                status: "active",
            },
            { $set: result.data },
            { new: true, runValidators: true }
        ).select("-privateDetails -images.publicId");

        if (!report) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Report not found or you do not own it",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Report updated successfully",
            report,
        });
    } catch (error) {
        console.error("Update report error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to update report" },
            { status: 500 }
        );
    }
}

// DELETE: Soft-remove your own active report.
export async function DELETE(request, context) {
    try {
        const auth = await requireUser();

        if (auth.error) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        const id = await getReportId(context);

        if (!mongoose.isValidObjectId(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid report ID" },
                { status: 400 }
            );
        }

        await connectDB();

        const report = await Report.findOneAndUpdate(
            {
                _id: id,
                userId: auth.user._id,
                status: "active",
            },
            { $set: { status: "removed" } },
            { new: true }
        );

        if (!report) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Report not found or you do not own it",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Report removed successfully",
        });
    } catch (error) {
        console.error("Remove report error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to remove report" },
            { status: 500 }
        );
    }
}
