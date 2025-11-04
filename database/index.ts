/**
 * Database Models Export
 * Centralized export point for all Mongoose models
 * Simplifies imports throughout the application
 *
 * @example
 * import { Event, Booking } from '@/database';
 */

export { default as Event } from "./event.model";
export { default as Booking } from "./booking.model";

// Export types for TypeScript
export type { IEvent } from "./event.model";
export type { IBooking } from "./booking.model";
