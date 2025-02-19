import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import FeedLayout from "./Layout/FeedLayout"
import Feed from "./components/feed"

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<FeedLayout />}>
          <Route path="/" element={<Navigate to="/top-stories" />} />
          <Route path="/:topic" element={<Feed />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
