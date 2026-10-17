import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Clock, BookOpen } from "lucide-react";
import "./StoryLibrary.css";

function StoryLibrary() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("All");

  // Stories will now come from the database
  const [stories, setStories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Categories used for filtering
  const categories = [
    "All",
    "Animals",
    "Adventure",
    "Friendship",
    "Nature",
    "Space",
    "Fantasy",
  ];

// Get stories from the backend
// Backend automatically identifies the logged-in user
useEffect(() => {
  const fetchStories = async () => {
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

      setStories(
  data.filter((story) => story.story_type === "library")
);

    } catch (error) {
      console.error("Error loading stories:", error);

      setError(
        "Unable to load stories. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  fetchStories();
}, []);

  // Filter stories according to selected category
  const filteredStories =
    selectedCategory === "All"
      ? stories
      : stories.filter(
          (story) => story.topic === selectedCategory
        );

  // Open Story Reader
  const openStory = (story) => {
    navigate(`/story/${story.id}`);
  };

  return (
    <div className="story-library">

      {/* HEADER */}
      <header className="story-header">

        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="story-header-title">

          <BookOpen size={25} />

          <div>
            <h1>Story Library</h1>

            <p>
              Choose a story and start your reading adventure.
            </p>
          </div>

        </div>

        {/* CREATE MY STORY BUTTON */}
        <button
          className="create-story-link"
          onClick={() => navigate("/create-story")}
        >
          <Sparkles size={18} />
          Create My Story
        </button>

      </header>


      {/* INTRO */}
      <section className="story-intro">

        <h2>📖 Explore Stories</h2>

        <p>
          Discover stories made for young readers and enjoy
          reading at your own pace.
        </p>

      </section>


      {/* STORY LIBRARY */}
      <main className="story-content">

        <div className="section-heading">

          <div>
            <h2>Story Library</h2>

            <p>
              Pick a story that sounds interesting to you.
            </p>
          </div>

        </div>


        {/* CATEGORY FILTERS */}
        <div className="category-filters">

          {categories.map((category) => (

            <button
              key={category}
              className={
                selectedCategory === category
                  ? "category-button active"
                  : "category-button"
              }
              onClick={() =>
                setSelectedCategory(category)
              }
            >
              {category}
            </button>

          ))}

        </div>


        {/* LOADING MESSAGE */}
        {loading && (

          <div className="no-stories">

            <BookOpen size={35} />

            <h3>Loading stories...</h3>

            <p>
              Getting your stories ready.
            </p>

          </div>

        )}


        {/* ERROR MESSAGE */}
        {!loading && error && (

          <div className="no-stories">

            <BookOpen size={35} />

            <h3>Oops!</h3>

            <p>{error}</p>

          </div>

        )}


        {/* STORY CARDS */}
        {!loading && !error && (

          <div className="story-grid">

            {filteredStories.map((story) => (

              <div
                key={story.id}
                className="story-card"
                onClick={() => openStory(story)}
              >

                {/* STORY ICON */}
                <div className="story-card-icon">
                  {story.icon}
                </div>


                <div className="story-card-content">

                  {/* TITLE */}
                  <h3>{story.title}</h3>


                  {/* CATEGORY + LEVEL */}
                  <div className="story-details">

                    <span className="story-category">
                      {story.topic}
                    </span>

                    <span className="story-level">
                      {story.difficulty}
                    </span>

                  </div>


                  {/* READING TIME */}
                  <div className="story-time">

                    <Clock size={14} />

                    {story.reading_time} min

                  </div>

                </div>


                {/* READ STORY BUTTON */}
                <button
                  className="read-story-button"
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


        {/* NO STORIES */}
        {!loading &&
          !error &&
          filteredStories.length === 0 && (

            <div className="no-stories">

              <BookOpen size={35} />

              <h3>No stories found</h3>

              <p>
                Try selecting a different category.
              </p>

            </div>

          )}


        {/* CREATE MY STORY CARD */}
        <section className="create-story-card">

          <div className="create-story-icon">
            <Sparkles size={28} />
          </div>


          <div className="create-story-info">

            <h2>Create My Story</h2>

            <p>
              Want a story made especially for you?
              Choose your interests, reading level, and
              story length. LumiLex AI will create a
              personalized story for you.
            </p>

          </div>


          <button
            className="create-story-main-button"
            onClick={() => navigate("/create-story")}
          >
            <Sparkles size={17} />
            Create My Story
          </button>

        </section>

      </main>

    </div>
  );
}

export default StoryLibrary;