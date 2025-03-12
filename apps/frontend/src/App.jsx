import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import FeedLayout from "./layout/FeedLayout"
import Feed from "./components/Feed/Feed"
import LoginForm from "./components/AuthComponent/LoginForm"
import ProtectedRoute from "./contexts/ProtectedRoute"
import RegisterUserForm from "./components/AuthComponent/RegisterUserForm"
import Search from "./components/Search/Search"
import HomePage from "./pages/HomePage/Home";
import SubscriptionPage from "./pages/SubscriptionPage/SubscriptionPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import BookmarksPage from "./pages/BookmarksPage/BookmarksPage";
import LikesPage from "./pages/LikesPage/LikesPage";

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<FeedLayout />}>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<Search />} />
          <Route path="/:topic" element={<Feed />} />
          <Route path="/subscriptions" element={<SubscriptionPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/likes" element={<LikesPage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterUserForm />} />
    </Routes>
  )
}

export default App
