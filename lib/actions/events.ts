"use server";

/**
 * Event Server Actions
 * Production-grade, type-safe server actions for event operations
 */

import "server-only";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { v2 as cloudinary } from "cloudinary";
import { ZodError } from "zod";
import connectDB from "@/database/mongodb";
import { Event } from "@/database";
import type { ActionResult } from "@/lib/types/actions";
import type { EventDTO, EventsListDTO } from "@/lib/types/dtos";
import {
  slugSchema,
  createEventSchema,
  imageFileSchema,
} from "@/lib/validation/events";

/**
 * Configure Cloudinary
 * Uses CLOUDINARY_URL which contains all configuration
 * Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 */
if (!process.env.CLOUDINARY_URL) {
  throw new Error(
    "Missing CLOUDINARY_URL environment variable. Please check your .env file."
  );
}

cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

/**
 * Utility: Transform Mongoose document to EventDTO
 * Removes Mongoose-specific fields and ensures clean serialization
 */
function toEventDTO(doc: any): EventDTO {
  return {
    _id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    overview: doc.overview,
    image: doc.image,
    venue: doc.venue,
    location: doc.location,
    date: doc.date,
    time: doc.time,
    mode: doc.mode,
    audience: doc.audience,
    agenda: doc.agenda,
    organizer: doc.organizer,
    tags: doc.tags,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Get All Events
 * Retrieves all events sorted by creation date (newest first)
 *
 * @returns ActionResult with events list or error
 */
export const getAllEvents = cache(
  async (): Promise<ActionResult<EventsListDTO>> => {
    try {
      await connectDB();

      const events = await Event.find().sort({ createdAt: -1 }).lean().exec();

      const eventDTOs = events.map(toEventDTO);

      return {
        ok: true,
        data: {
          events: eventDTOs,
          total: eventDTOs.length,
        },
      };
    } catch (error) {
      console.error("[getAllEvents] Error:", error);

      return {
        ok: false,
        code: "UNKNOWN",
        message: "Failed to fetch events",
      };
    }
  }
);

/**
 * Get Event By Slug
 * Retrieves a single event by its slug
 *
 * @param slug - Event slug (URL-friendly identifier)
 * @returns ActionResult with event data or error
 */
export const getEventBySlug = cache(
  async (slug: string): Promise<ActionResult<EventDTO>> => {
    try {
      // Validate and normalize slug
      const validatedSlug = slugSchema.parse(slug.toLowerCase().trim());

      await connectDB();

      const event = await Event.findOne({ slug: validatedSlug }).lean().exec();

      if (!event) {
        return {
          ok: false,
          code: "NOT_FOUND",
          message: `Event with slug '${validatedSlug}' not found`,
        };
      }

      return {
        ok: true,
        data: toEventDTO(event),
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Invalid slug format",
          issues: error.issues,
        };
      }

      console.error("[getEventBySlug] Error:", error);

      return {
        ok: false,
        code: "UNKNOWN",
        message: "Failed to fetch event",
      };
    }
  }
);

/**
 * Get similar events by slag
 * Retrieves a similar events by its slug
 */

export const getSimilarEventsBySlug = cache(
  async (slug: string): Promise<ActionResult<EventsListDTO>> => {
    try {
      // Validate and normalize slug
      const validatedSlug = slugSchema.parse(slug.toLowerCase().trim());

      await connectDB();

      const event = await Event.findOne({ slug: validatedSlug }).lean().exec();
      const similarEvents = await Event.find({
        _id: { $ne: event?._id },
        tags: { $in: event?.tags },
      }).lean();

      const eventDTOs = similarEvents.map(toEventDTO);

      return {
        ok: true,
        data: {
          events: eventDTOs,
          total: eventDTOs.length,
        },
      };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          ok: false,
          code: "VALIDATION_ERROR",
          message: "Invalid slug format",
          issues: error.issues,
        };
      }

      console.error("[getEventBySlug] Error:", error);

      return {
        ok: false,
        code: "UNKNOWN",
        message: "Failed to fetch event",
      };
    }
  }
);

/**
 * Upload Image to Cloudinary
 * Internal helper for image upload
 *
 * @param file - File object to upload
 * @returns Cloudinary secure URL
 */
async function uploadImageToCloudinary(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: "DevEvent",
          transformation: [
            { width: 1200, height: 630, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error("Upload failed"));
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

/**
 * Create Event
 * Creates a new event with image upload to Cloudinary
 *
 * @param prevState - Previous state (for useActionState compatibility)
 * @param formData - FormData containing event fields and image
 * @returns ActionResult with created event or error
 */
export async function createEvent(
  prevState: ActionResult<EventDTO> | null,
  formData: FormData
): Promise<ActionResult<EventDTO>> {
  return createEventDirect(formData);
}

/**
 * Create Event Direct
 * Direct version of createEvent without state parameter
 * Use this with useTransition or from Server Components
 *
 * @param formData - FormData containing event fields and image
 * @returns ActionResult with created event or error
 */
export async function createEventDirect(
  formData: FormData
): Promise<ActionResult<EventDTO>> {
  try {
    // Extract and validate image first
    const imageFile = formData.get("image");

    if (!(imageFile instanceof File)) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Image file is required",
      };
    }

    // Validate image
    const imageValidation = imageFileSchema.safeParse(imageFile);
    if (!imageValidation.success) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: imageValidation.error.issues[0].message,
        issues: imageValidation.error.issues,
      };
    }

    // Parse and validate event data
    const rawData = {
      title: formData.get("title"),
      description: formData.get("description"),
      overview: formData.get("overview"),
      venue: formData.get("venue"),
      location: formData.get("location"),
      date: formData.get("date"),
      time: formData.get("time"),
      mode: formData.get("mode"),
      audience: formData.get("audience"),
      organizer: formData.get("organizer"),
      // Parse JSON arrays for agenda and tags
      agenda: JSON.parse((formData.get("agenda") as string) || "[]"),
      tags: JSON.parse((formData.get("tags") as string) || "[]"),
    };

    const validated = createEventSchema.parse(rawData);

    // Upload image to Cloudinary
    const imageUrl = await uploadImageToCloudinary(imageFile);

    // Connect to DB and create event
    await connectDB();

    const eventData = {
      ...validated,
      image: imageUrl,
    };

    const createdEvent = await Event.create(eventData);

    // Revalidate events list and homepage
    revalidatePath("/");
    revalidatePath("/events");

    return {
      ok: true,
      data: toEventDTO(createdEvent.toObject()),
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        issues: error.issues,
      };
    }

    // Check for duplicate slug error (MongoDB E11000)
    if (error instanceof Error && error.message.includes("E11000")) {
      return {
        ok: false,
        code: "CONFLICT",
        message: "An event with this title already exists",
      };
    }

    console.error("[createEvent] Error:", error);

    return {
      ok: false,
      code: "UNKNOWN",
      message: "Failed to create event",
    };
  }
}

/**
 * Create Event (Alternative signature for direct object input)
 * Useful when called programmatically from Server Components
 *
 * @param data - Event data object
 * @param imageFile - File object for event image
 * @returns ActionResult with created event or error
 */
export async function createEventFromObject(
  data: {
    title: string;
    description: string;
    overview: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: "online" | "offline" | "hybrid";
    audience: string;
    agenda: string[];
    organizer: string;
    tags: string[];
  },
  imageFile: File
): Promise<ActionResult<EventDTO>> {
  const formData = new FormData();

  // Populate FormData from object
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value.toString());
    }
  });

  formData.append("image", imageFile);

  return createEventDirect(formData);
}
