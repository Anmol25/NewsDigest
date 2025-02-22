import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import FeedLayout from "./layout/FeedLayout"
import Feed from "./components/Feed/Feed"
import Login from "./pages/LoginPage"
import ProtectedRoute from "./contexts/ProtectedRoute"
import RegisterUser from "./pages/RegisterUserPage"
import Logout from "./components/logout"
import Search from "./components/Search/Search"

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<FeedLayout />}>
          <Route path="/" element={<Navigate to="/top-stories" />} />
          <Route path="/:topic" element={<Feed />} />
          <Route path="/search" element={<Search />} />
        </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterUser />} />
      <Route path="/logout" element={<Logout />} />
    </Routes>
  )
}

export default App
