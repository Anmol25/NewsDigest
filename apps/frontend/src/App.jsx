import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import FeedLayout from "./Layout/FeedLayout"
import Feed from "./components/feed"
import Login from "./pages/login"
import ProtectedRoute from "./components/protectedroute"

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<FeedLayout />}>
            <Route path="/" element={<Navigate to="/top-stories" />} />
            <Route path="/:topic" element={<Feed />} />
          </Route>
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App
