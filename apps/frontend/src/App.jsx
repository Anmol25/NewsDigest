import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import FeedLayout from "./layout/FeedLayout"
import Feed from "./components/Feed/Feed"
import Login from "./pages/LoginPage"
import ProtectedRoute from "./contexts/ProtectedRoute"
import RegisterUser from "./pages/RegisterUserPage"
import Logout from "./components/logout"

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
        <Route path="/register" element={<RegisterUser />} />
        <Route path="/logout" element={<Logout />} />
      </Routes>
    </Router>
  )
}

export default App
