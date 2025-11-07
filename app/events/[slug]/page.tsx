import { notFound } from "next/navigation";
import {
  getAllEvents,
  getEventBySlug,
  getSimilarEventsBySlug,
} from "@/lib/actions/events";
import Image from "next/image";
import BookEvent from "@/components/BookEvent";
import EventCard from "@/components/EventCard";
import { Suspense } from "react";

const EventDetailItem = ({
  icon,
  alt,
  label,
}: {
  icon: string;
  alt: string;
  label: string;
}) => (
  <div className="flex-row-gap-2 items-center">
    <Image src={icon} alt={alt} width={17} height={17} />

    <p>{label}</p>
  </div>
);

// event agenda component
const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
  <div className="agenda">
    <h2>Agenda</h2>
    <ul>
      {agendaItems.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  </div>
);

// tags
const EventTags = ({ tags }: { tags: string[] }) => (
  <div className="flex flex-row gap-1.5 flex-wrap">
    {tags.map((tag) => (
      <div className="pill" key={tag}>
        {tag}
      </div>
    ))}
  </div>
);

// Separate async component for event content
const EventContent = async ({ slug }: { slug: string }) => {
  const result = await getEventBySlug(slug);

  // Handle not found
  if (!result.ok) {
    if (result.code === "NOT_FOUND") {
      notFound();
    }
    // Handle other errors
    return (
      <div>
        <h1>Error</h1>
        <p className="text-red-500">{result.message}</p>
      </div>
    );
  }

  const event = result.data;
  const bookings = 10;

  return (
    <>
      <div className="header">
        <h1>Event Description</h1>

        <p>{event.description}</p>
      </div>

      <div className="details">
        {/* left side - event content */}

        <div className="content">
          <Image
            src={event.image}
            alt="Event Banner"
            width={800}
            height={800}
            className="banner"
          />

          <section className="flex-col-gap-2">
            <h2>Overview</h2>
            <p>{event.overview}</p>
          </section>

          <section className="flex-col-gap-2">
            <h2>Event Details</h2>

            <EventDetailItem
              icon="/icons/calendar.svg"
              alt="calender"
              label={event.date}
            />
            <EventDetailItem
              icon="/icons/clock.svg"
              alt="clock"
              label={event.time}
            />
            <EventDetailItem
              icon="/icons/pin.svg"
              alt="location"
              label={event.location}
            />
            <EventDetailItem
              icon="/icons/mode.svg"
              alt="mode"
              label={event.mode}
            />
            <EventDetailItem
              icon="/icons/audience.svg"
              alt="audience"
              label={event.audience}
            />
          </section>

          <EventAgenda agendaItems={event.agenda} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{event.organizer}</p>
          </section>

          <EventTags tags={event.tags} />
        </div>

        {/* right side - booking form */}

        <aside className="booking">
          <div className="signup-card">
            <h2>Book Your Spot</h2>

            {bookings > 0 ? (
              <p className="text-sm">
                Join {bookings} people who have already booked their spot!
              </p>
            ) : (
              <p className="text-sm">Be the first to book your spot!</p>
            )}

            <BookEvent />
          </div>
        </aside>
      </div>
    </>
  );
};

// Separate async component for similar events
const SimilarEvents = async ({ slug }: { slug: string }) => {
  const similarEvents = await getSimilarEventsBySlug(slug);

  // Handle not found
  if (!similarEvents.ok) {
    if (similarEvents.code === "NOT_FOUND") {
      return null;
    }
    // Handle other errors
    return (
      <div>
        <p className="text-red-500">{similarEvents.message}</p>
      </div>
    );
  }

  // destructure similar events
  const { events: allSimilarEvents, total } = similarEvents.data;

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4 pt-20">
      <h2>Similar Events</h2>

      <div className="events">
        {allSimilarEvents.map((similarEvent) => (
          <EventCard key={similarEvent._id} {...similarEvent} />
        ))}
      </div>
    </div>
  );
};

const EventDetails = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;

  return (
    <section id="event">
      <Suspense fallback={<div>Loading event details...</div>}>
        <EventContent slug={slug} />
      </Suspense>

      <Suspense fallback={<div>Loading similar events...</div>}>
        <SimilarEvents slug={slug} />
      </Suspense>
    </section>
  );
};

export default EventDetails;
