import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
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
        "Unable to connect to LumiLex. Please try again."
      );
    } finally {
      setLoading(false);
    }
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
              WELCOME BACK
            </span>

            <h1>
              Continue
              <span> their story.</span>
            </h1>

            <p>
              Pick up where your child's reading journey
              left off.
            </p>

          </div>

        </div>


        <div className="auth-card">

          <div className="mobile-logo">
            <BookOpen size={22} />
          </div>

          <h2>Welcome back</h2>

          <p className="auth-description">
            Log in to your LumiLex account.
          </p>


          <form onSubmit={handleSubmit}>

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
                placeholder="Your password"
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
              {loading ? "Logging in..." : "Log in"}

              {!loading && <ArrowRight size={17} />}
            </button>

          </form>


          <div className="or-divider">
            <span>or</span>
          </div>


          <button
            className="google-button"
            onClick={() => {
              window.location.href =
                "http://localhost:5000/api/auth/google";
            }}
          >
            <span className="google-letter">G</span>
            Continue with Google
          </button>


          <p className="auth-switch">
            Don't have an account?

            <button onClick={() => navigate("/signup")}>
              Create one
            </button>
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;