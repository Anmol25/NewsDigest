import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import PageLayout from "./layout/PageLayout"
import Feed from "./components/Feed/Feed"
import LoginForm from "./components/AuthComponent/LoginForm"
import ProtectedRoute from "./contexts/ProtectedRoute"
import RegisterUserForm from "./components/AuthComponent/RegisterUserForm"
import Search from "./components/Search/Search"
import HomePage from "./pages/HomePage/Home";
import SubscriptionsPage from "./pages/SubscritpionsPage/SubscriptionsPage"
import ProfilePage from "./pages/ProfileDetailsPage/ProfilePage";
import BookmarksPage from "./pages/BookmarksPage/BookmarksPage";
import LikesPage from "./pages/LikesPage/LikesPage";
import SourcePage from "./pages/SourcePage/SourcePage";
import UserHistoryPage from "./pages/UserHistoryPage/UserHistoryPage";

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<PageLayout />}>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<Search />} />
          <Route path="/:topic" element={<Feed />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/likes" element={<LikesPage />} />\
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/source/:source" element={<SourcePage />} />
          <Route path="/profile/details" element={<ProfilePage />} />
          <Route path="/profile/history" element={<UserHistoryPage />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterUserForm />} />
    </Routes>
  )
}

export default App
