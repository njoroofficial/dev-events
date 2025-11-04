import Event from "@/database/event.model";
import connectDB from "@/database/mongodb";
import { NextRequest, NextResponse } from "next/server";

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
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 }
    );
  }
}
