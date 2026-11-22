import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/mongodb";
import Report from "@/models/Report";
import { requireUser } from "@/lib/permissions";

export const runtime = "nodejs";

const reportSchema = z.object({
    type: z.enum(["lost", "found"]),
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().min(10).max(1000),
    category: z.enum([
        "Electronics",
        "Documents",
        "Accessories",
        "Bags",
        "Clothing",
        "Jewelry",
        "Pets",
        "Other",
    ]),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80).default("India"),
    incidentDate: z.coerce.date(),
    privateDetails: z.string().trim().min(5).max(1000),
}).refine(
    (data) => data.incidentDate <= new Date(),
    { message: "Incident date cannot be in the future", path: ["incidentDate"] }
);

// GET: Browse and search active reports.
export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);

        const search = searchParams.get("search")?.trim();
        const type = searchParams.get("type");
        const category = searchParams.get("category");
        const city = searchParams.get("city")?.trim();

        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(
            30,
            Math.max(1, Number(searchParams.get("limit")) || 10)
        );

        const filter = { status: "active" };

        if (type && ["lost", "found"].includes(type)) {
            filter.type = type;
        } else if (type) {
            return NextResponse.json(
                { success: false, message: "Invalid report type" },
                { status: 400 }
            );
        }

        if (category) {
            filter.category = category;
        }

        if (city) {
            filter.city = { $regex: city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        }

        if (search) {
            const safeSearch = search.slice(0, 80).replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { title: { $regex: safeSearch, $options: "i" } },
                { description: { $regex: safeSearch, $options: "i" } },
            ];
        }

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .select("-privateDetails -images.publicId")
                .populate("userId", "name")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Report.countDocuments(filter),
        ]);

        return NextResponse.json({
            success: true,
            message: "Products Reports",
            reports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Fetch reports error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to fetch reports" },
            { status: 500 }
        );
    }
}

// POST: Create a lost or found report.
export async function POST(request) {
    try {
        const auth = await requireUser();

        if (auth.error) {
            return NextResponse.json(
                { success: false, message: auth.error },
                { status: auth.status }
            );
        }

        const body = await request.json();
        const result = reportSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid report information",
                    errors: result.error.flatten(),
                },
                { status: 400 }
            );
        }

        await connectDB();

        const report = await Report.create({
            ...result.data,
            userId: auth.user._id,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Report created successfully",
                report: {
                    id: report._id,
                    type: report.type,
                    title: report.title,
                    category: report.category,
                    city: report.city,
                    state: report.state,
                    status: report.status,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create report error:", error);

        return NextResponse.json(
            { success: false, message: "Unable to create report" },
            { status: 500 }
        );
    }
}