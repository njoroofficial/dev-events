import { v2 as cloudinary } from "cloudinary";
import Event from "@/database/event.model";
import connectDB from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { error } from "console";

export async function POST(req: NextRequest) {
  try {
    // connect to the db
    await connectDB();

    // get access to form data
    const formData = await req.formData();

    let event;

    try {
      event = Object.fromEntries(formData.entries());
    } catch (e) {
      return NextResponse.json(
        { message: "Invalid JSON data format" },
        { status: 400 }
      );
    }

    // get uploaded files
    const file = formData.get("image");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { message: "Image file is required" },
        { status: 400 }
      );
    }

    // convert file into a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // pass to cloudinary
    const uploadedResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: "DevEvent",
          },
          (error, results) => {
            if (error) return reject(error);

            resolve(results);
          }
        )
        .end(buffer);
    });

    event.image = (uploadedResult as { secure_url: string }).secure_url;

    const createdEvent = await Event.create(event);

    return NextResponse.json(
      {
        message: "Event Created Successful",
        event: createdEvent,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Event Creation Failed",
        ...(process.env.NODE_ENV === "development"
          ? {
              error: e instanceof Error ? e.message : "unknown",
            }
          : {}),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const events = await Event.find().sort({ createdAt: -1 });

    return NextResponse.json(
      {
        message: "Events fetched successfully",
        events,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Event Fetching Failed",
        ...(process.env.NODE_ENV === "development"
          ? {
              error: e instanceof Error ? e.message : "unknown",
            }
          : {}),
      },
      { status: 500 }
    );
  }
}
