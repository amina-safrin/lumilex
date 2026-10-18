import { BrowserRouter, Routes, Route } from "react-router-dom";

import StoryLibrary from "./pages/StoryLibrary";
import StoryReader from "./pages/StoryReader";
import CreateStory from "./pages/CreateStory";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ChildProfile from "./pages/ChildProfile";
import Dashboard from "./pages/Dashboard";
import MyStories from "./pages/MyStories";
import LearningJourney from "./pages/LearningJourney";
import Settings from "./pages/Settings";

import ProtectedRoute from "./components/ProtectedRoute";
import { ChildProvider } from "./context/ChildContext";

function App() {
  return (
    <ChildProvider>
      <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/login" element={<Login />} />

        <Route path="/stories" element={<StoryLibrary />} />
        <Route path="/create-story" element={<CreateStory />} />
        <Route path="/story/:id" element={<StoryReader />} />
        <Route path="/my-stories" element={<MyStories />} />
        <Route path="/learning-journey" element={<ProtectedRoute><LearningJourney /></ProtectedRoute>} />

        <Route
          path="/child-profile"
          element={
            <ProtectedRoute>
              <ChildProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
    </ChildProvider>
  );
}

export default App;