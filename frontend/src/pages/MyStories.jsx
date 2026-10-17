import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, Sparkles } from "lucide-react";
import "./MyStories.css";

function MyStories() {
  const navigate = useNavigate();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyStories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/stories",
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch stories");
        }

        const data = await response.json();

        // Only show stories created by the user
        const generatedStories = data.filter(
          (story) => story.story_type === "ai_generated"
        );

        setStories(generatedStories);

      } catch (error) {
        console.error("Error loading my stories:", error);

        setError(
          "Unable to load your stories. Please try again."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchMyStories();
  }, []);

  const openStory = (story) => {
    navigate(`/story/${story.id}`);
  };

  return (
    <div className="my-stories-page">

      {/* HEADER */}
      <header className="my-stories-header">

        <button
          className="my-stories-back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="my-stories-header-title">

          <Sparkles size={25} />

          <div>
            <h1>My Stories</h1>

            <p>
              Stories created especially for you.
            </p>
          </div>

        </div>

        <button
          className="new-story-button"
          onClick={() => navigate("/create-story")}
        >
          <Sparkles size={17} />
          Create New Story
        </button>

      </header>


      {/* INTRO */}
      <section className="my-stories-intro">

        <h2>✨ Your Story Collection</h2>

        <p>
          Here are all the stories LumiLex AI has created
          just for you.
        </p>

      </section>


      {/* CONTENT */}
      <main className="my-stories-content">

        <div className="my-stories-section-heading">

          <div>
            <h2>My Stories</h2>

            <p>
              Choose a story and continue your reading adventure.
            </p>
          </div>

          <span className="story-count">
            {stories.length}{" "}
            {stories.length === 1 ? "story" : "stories"}
          </span>

        </div>


        {/* LOADING */}
        {loading && (
          <div className="my-stories-empty">

            <BookOpen size={35} />

            <h3>Loading your stories...</h3>

            <p>
              Getting your story collection ready.
            </p>

          </div>
        )}


        {/* ERROR */}
        {!loading && error && (
          <div className="my-stories-empty">

            <BookOpen size={35} />

            <h3>Oops!</h3>

            <p>{error}</p>

          </div>
        )}


        {/* STORY CARDS */}
        {!loading &&
          !error &&
          stories.length > 0 && (

            <div className="my-stories-grid">

              {stories.map((story) => (

                <div
                  key={story.id}
                  className="my-story-card"
                  onClick={() => openStory(story)}
                >

                  {/* ICON */}
                  <div className="my-story-card-icon">
                    {story.icon || "✨"}
                  </div>


                  {/* CONTENT */}
                  <div className="my-story-card-content">

                    <h3>{story.title}</h3>


                    <div className="my-story-details">

                      <span className="my-story-category">
                        {story.topic}
                      </span>

                      <span className="my-story-level">
                        {story.difficulty}
                      </span>

                    </div>


                    <div className="my-story-time">

                      <Clock size={14} />

                      {story.reading_time || 5} min

                    </div>

                  </div>


                  {/* BUTTON */}
                  <button
                    className="my-story-read-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openStory(story);
                    }}
                  >
                    Read Story
                  </button>

                </div>

              ))}

            </div>
          )}


        {/* EMPTY STATE */}
        {!loading &&
          !error &&
          stories.length === 0 && (

            <div className="my-stories-empty">

              <div className="empty-story-icon">
                <Sparkles size={32} />
              </div>

              <h3>No stories yet</h3>

              <p>
                Create your first personalized story
                and it will appear here.
              </p>

              <button
                className="empty-create-button"
                onClick={() => navigate("/create-story")}
              >
                <Sparkles size={17} />
                Create My First Story
              </button>

            </div>
          )}

      </main>

    </div>
  );
}

export default MyStories;