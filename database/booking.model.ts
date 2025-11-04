import mongoose, { Document, Model, Schema } from "mongoose";
import Event from "./event.model";

/**
 * TypeScript interface for Booking document
 * Extends Document to include Mongoose document properties
 */
export interface IBooking extends Document {
  eventId: mongoose.Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking Schema Definition
 * Links users to events via email with reference validation
 */
const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true, // Index for faster queries
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      validate: {
        validator: function (email: string): boolean {
          // RFC 5322 compliant email validation regex
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        message: "Please provide a valid email address",
      },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

/**
 * Pre-save hook to validate that the referenced event exists
 * Prevents orphaned bookings by verifying event existence before save
 */
BookingSchema.pre("save", async function (next) {
  // Only validate eventId if it's new or modified
  if (this.isModified("eventId")) {
    try {
      const eventExists = await Event.findById(this.eventId);

      if (!eventExists) {
        return next(
          new Error(
            `Event with ID ${this.eventId} does not exist. Cannot create booking for non-existent event.`
          )
        );
      }
    } catch (error) {
      return next(
        new Error(
          `Failed to validate event: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        )
      );
    }
  }

  next();
});

// Create index on eventId for optimized queries
BookingSchema.index({ eventId: 1 });

// Composite index for querying bookings by event and email
BookingSchema.index({ eventId: 1, email: 1 });

/**
 * Booking Model
 * Use mongoose.models to prevent model recompilation during hot reloading in development
 */
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
