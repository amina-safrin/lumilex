import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Brain,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      <nav className="main-nav">

        <div className="logo">
          <div className="logo-mark">
            <BookOpen size={21} />
          </div>

          <span>LumiLex</span>
        </div>

        <div className="nav-links">
          <button onClick={() => navigate("/login")}>
            Log in
          </button>

          <button
            className="nav-cta"
            onClick={() => navigate("/signup")}
          >
            Get started
          </button>
        </div>

      </nav>


      <main className="hero-section">

        <section className="hero-text">

          <div className="hero-label">
            <Sparkles size={15} />
            A new way to discover reading
          </div>

          <h1>
            Reading should feel
            <span> like an adventure.</span>
          </h1>

          <p>
            LumiLex is an adaptive reading companion designed
            to make reading more comfortable, engaging and
            personal for every child.
          </p>

          <div className="hero-actions">

            <button
              className="primary-button"
              onClick={() => navigate("/signup")}
            >
              Start your journey
              <ArrowRight size={18} />
            </button>

            <button
              className="text-button"
              onClick={() => navigate("/login")}
            >
              Already have an account?
            </button>

          </div>

        </section>


        <section className="hero-art">

          <div className="floating-note note-one">
            ✨
          </div>

          <div className="floating-note note-two">
            Aa
          </div>

          <div className="hero-book">

            <div className="book-sun">
              ☀
            </div>

            <div className="book-tree">
              🌳
            </div>

            <div className="book-ground"></div>

          </div>

          <div className="hero-mini-card">

            <div className="mini-icon">
              <Brain size={17} />
            </div>

            <div>
              <strong>Personalized</strong>
              <span>learning journey</span>
            </div>

          </div>

        </section>

      </main>


      <section className="home-bottom">

        <div>
          <strong>01</strong>
          <span>Discover</span>
        </div>

        <div>
          <strong>02</strong>
          <span>Read</span>
        </div>

        <div>
          <strong>03</strong>
          <span>Grow</span>
        </div>

      </section>

    </div>
  );
}

export default Home;