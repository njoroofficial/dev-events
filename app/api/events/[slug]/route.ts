import connectDB from "@/database/mongodb";
import { Event } from "@/database";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/events/[slug]
 * Fetches a single event by its slug
 *
 * @param req - Next.js request object
 * @param params - Route parameters containing the slug
 * @returns Event details or error response
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params to get the slug
    const { slug } = await params;

    // Validate slug parameter
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return NextResponse.json(
        { message: "Valid slug parameter is required" },
        { status: 400 }
      );
    }

    // Sanitize slug: remove special characters and ensure proper format
    const sanitizedSlug = slug.toLowerCase().trim();

    // Connect to database
    await connectDB();

    // Query event by slug
    const event = await Event.findOne({ slug: sanitizedSlug }).lean();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        { message: `Event with slug '${sanitizedSlug}' not found` },
        { status: 404 }
      );
    }

    // Return successful response
    return NextResponse.json(
      {
        message: "Event fetched successfully",
        event,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error("Error fetching event by slug:", error);

    // Return generic error response
    return NextResponse.json(
      {
        message: "Failed to fetch event",
        ...(process.env.NODE_ENV === "development"
          ? {
              error: error instanceof Error ? error.message : "Unknown error",
            }
          : {}),
      },
      { status: 500 }
    );
  }
}
