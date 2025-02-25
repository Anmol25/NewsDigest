import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import FeedLayout from "./layout/FeedLayout"
import Feed from "./components/Feed/Feed"
import LoginForm from "./components/AuthComponent/LoginForm"
import ProtectedRoute from "./contexts/ProtectedRoute"
import RegisterUserForm from "./components/AuthComponent/RegisterUserForm"
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
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterUserForm />} />
    </Routes>
  )
}

export default App
