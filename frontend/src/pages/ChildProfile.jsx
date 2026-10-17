import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  ArrowRight,
} from "lucide-react";

function ChildProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    childName: "",
    age: "",
    interests: [],
    readingLevel: "beginner",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const interests = [
    "Animals",
    "Space",
    "Adventure",
    "Nature",
    "Fantasy",
    "Science",
  ];

  function toggleInterest(interest) {
    setFormData((previous) => {

      if (previous.interests.includes(interest)) {
        return {
          ...previous,
          interests: previous.interests.filter(
            (item) => item !== interest
          ),
        };
      }

      return {
        ...previous,
        interests: [
          ...previous.interests,
          interest,
        ],
      };

    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!formData.childName || !formData.age) {
      setError(
        "Please enter your child's name and age."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/profile",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      navigate("/dashboard");

    } catch (error) {
      setError(
        "Unable to save the profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="profile-page">

      <div className="profile-container">

        <div className="profile-header">

          <div className="profile-icon">
            <Heart size={23} />
          </div>

          <span className="small-label">
            STEP 1 OF YOUR JOURNEY
          </span>

          <h1>
            Tell us about
            <span> your little reader.</span>
          </h1>

          <p>
            We'll use these details to make LumiLex feel
            more personal to your child.
          </p>

        </div>


        <form
          className="profile-form"
          onSubmit={handleSubmit}
        >

          <div className="form-section">

            <label>Child's name</label>

            <input
              className="large-input"
              type="text"
              placeholder="What should we call them?"
              value={formData.childName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  childName: e.target.value,
                })
              }
            />

          </div>


          <div className="form-section">

            <label>Age</label>

            <input
              className="large-input"
              type="number"
              min="4"
              max="16"
              placeholder="Age"
              value={formData.age}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  age: e.target.value,
                })
              }
            />

          </div>


          <div className="form-section">

            <label>
              What does your child love?
            </label>

            <p className="field-hint">
              Choose as many as you'd like.
            </p>

            <div className="interest-grid">

              {interests.map((interest) => (

                <button
                  type="button"
                  key={interest}
                  className={
                    formData.interests.includes(interest)
                      ? "interest-chip selected"
                      : "interest-chip"
                  }
                  onClick={() =>
                    toggleInterest(interest)
                  }
                >
                  {interest}
                </button>

              ))}

            </div>

          </div>


          <div className="form-section">

            <label>
              How would you describe their reading?
            </label>

            <select
              className="large-input"
              value={formData.readingLevel}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  readingLevel: e.target.value,
                })
              }
            >
              <option value="beginner">
                Just getting started
              </option>

              <option value="developing">
                Developing confidence
              </option>

              <option value="confident">
                Comfortable reader
              </option>
            </select>

          </div>


          {error && (
            <div className="form-error">
              {error}
            </div>
          )}


          <button
            type="submit"
            className="primary-button full-button"
            disabled={loading}
          >
            {loading
              ? "Creating profile..."
              : "Continue to LumiLex"}

            {!loading && <ArrowRight size={17} />}
          </button>

        </form>

      </div>

    </div>
  );
}

export default ChildProfile;