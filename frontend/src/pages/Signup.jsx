import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  User,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/signup",
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

      navigate("/child-profile");

    } catch (error) {
      setError(
        "Unable to connect to LumiLex. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    window.location.href =
      "http://localhost:5000/api/auth/google";
  }

  return (
    <div className="auth-page">

      <div className="auth-layout">

        <div className="auth-intro">

          <div className="logo">
            <div className="logo-mark">
              <BookOpen size={21} />
            </div>

            <span>LumiLex</span>
          </div>

          <div className="auth-intro-content">

            <span className="small-label">
              YOUR CHILD'S READING JOURNEY
            </span>

            <h1>
              Let's create
              <span> something wonderful.</span>
            </h1>

            <p>
              Create a parent account and we'll help you
              build a reading experience around your child.
            </p>

          </div>

        </div>


        <div className="auth-card">

          <div className="mobile-logo">
            <BookOpen size={22} />
          </div>

          <h2>Create your account</h2>

          <p className="auth-description">
            You're one step closer to starting the journey.
          </p>


          <form onSubmit={handleSubmit}>

            <label>Parent / Guardian name</label>

            <div className="input-field">

              <User size={18} />

              <input
                type="text"
                name="fullName"
                placeholder="Your name"
                value={formData.fullName}
                onChange={handleChange}
              />

            </div>


            <label>Email address</label>

            <div className="input-field">

              <Mail size={18} />

              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />

            </div>


            <label>Password</label>

            <div className="input-field">

              <Lock size={18} />

              <input
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
              />

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
                ? "Creating account..."
                : "Create account"}

              {!loading && <ArrowRight size={17} />}
            </button>

          </form>


          <div className="or-divider">
            <span>or</span>
          </div>


          <button
            className="google-button"
            onClick={handleGoogleLogin}
          >
            <span className="google-letter">G</span>
            Continue with Google
          </button>


          <p className="auth-switch">
            Already have an account?

            <button onClick={() => navigate("/login")}>
              Log in
            </button>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Signup;