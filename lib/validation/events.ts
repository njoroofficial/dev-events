/**
 * Event Validation Schemas
 * Zod schemas for runtime validation of event data
 */

import { z } from "zod";

/**
 * Event mode enum - matches Mongoose schema
 */
export const eventModeSchema = z.enum(["online", "offline", "hybrid"], {
  message: "Mode must be online, offline, or hybrid",
});

/**
 * Slug validation schema
 * Ensures slug is properly formatted
 */
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(200, "Slug must be 200 characters or less")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens"
  )
  .trim();

/**
 * Date validation schema
 * Validates date format (YYYY-MM-DD) and ensures it's not in the past
 */
export const dateSchema = z
  .string()
  .min(1, "Date is required")
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine(
    (date) => {
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    },
    { message: "Event date cannot be in the past" }
  );

/**
 * Time validation schema
 * Validates time format (HH:MM)
 */
export const timeSchema = z
  .string()
  .min(1, "Time is required")
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format");

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .toLowerCase()
  .trim();

/**
 * Create Event Schema
 * Validates all fields required to create a new event
 */
export const createEventSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less")
    .trim(),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be 1000 characters or less")
    .trim(),

  overview: z
    .string()
    .min(10, "Overview must be at least 10 characters")
    .max(5000, "Overview must be 5000 characters or less")
    .trim(),

  venue: z
    .string()
    .min(2, "Venue must be at least 2 characters")
    .max(200, "Venue must be 200 characters or less")
    .trim(),

  location: z
    .string()
    .min(2, "Location must be at least 2 characters")
    .max(200, "Location must be 200 characters or less")
    .trim(),

  date: dateSchema,

  time: timeSchema,

  mode: eventModeSchema,

  audience: z
    .string()
    .min(2, "Audience must be at least 2 characters")
    .max(200, "Audience must be 200 characters or less")
    .trim(),

  agenda: z
    .array(z.string().min(1, "Agenda item cannot be empty"))
    .min(1, "At least one agenda item is required")
    .max(20, "Maximum 20 agenda items allowed"),

  organizer: z
    .string()
    .min(2, "Organizer must be at least 2 characters")
    .max(200, "Organizer must be 200 characters or less")
    .trim(),

  tags: z
    .array(z.string().min(1, "Tag cannot be empty"))
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags allowed"),

  // Image will be validated separately as File object
});

/**
 * Image file validation
 * Validates uploaded image files
 */
export const imageFileSchema = z
  .instanceof(File, { message: "Image file is required" })
  .refine((file) => file.size > 0, "Image file cannot be empty")
  .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be less than 5MB")
  .refine(
    (file) =>
      ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
        file.type
      ),
    "Image must be JPEG, PNG, or WebP format"
  );

/**
 * Type exports for TypeScript inference
 */
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type EventMode = z.infer<typeof eventModeSchema>;
