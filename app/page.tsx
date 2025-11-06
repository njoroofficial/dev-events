import EventCard from "@/components/EventCard";
import ExploreBtn from "@/components/ExploreBtn";
import { getAllEvents } from "@/lib/actions/events";

const Home = async () => {
  const result = await getAllEvents();

  // Handle error state
  if (!result.ok) {
    return (
      <section>
        <h1 className="text-center">
          The Hub for Every Dev <br /> Event You Can`t Miss
        </h1>
        <p className="text-center mt-5 text-red-500">
          Failed to load events. Please try again later.
        </p>
      </section>
    );
  }

  const { events } = result.data;

  return (
    <section>
      <h1 className="text-center">
        The Hub for Every Dev <br /> Event You Can`t Miss
      </h1>
      <p className="text-center mt-5">
        Hackathons, Meetups, and Conference, All in One Place
      </p>

      {/* explore button client component */}
      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events">
          {events && events.length > 0 ? (
            events.map((event) => (
              <li key={event._id}>
                <EventCard {...event} />
              </li>
            ))
          ) : (
            <li className="text-center text-gray-500">No events available</li>
          )}
        </ul>
      </div>
    </section>
  );
};

export default Home;
