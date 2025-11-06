/**
 * Data Transfer Objects (DTOs)
 * Clean, stable types for API responses without Mongoose-specific fields
 */

/**
 * Event DTO
 * Public-facing event data structure
 */
export interface EventDTO {
  _id: string;
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: "online" | "offline" | "hybrid";
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Events List DTO
 * Response for listing multiple events
 */
export interface EventsListDTO {
  events: EventDTO[];
  total: number;
}
