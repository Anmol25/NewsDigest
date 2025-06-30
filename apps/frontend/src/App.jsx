import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import PageLayout from "./layout/PageLayout"
import ProtectedRoute from "./contexts/ProtectedRoute"
import LoginForm from "./pages/authentication/LoginForm"
import RegisterUserForm from "./pages/authentication/RegisterUserForm"
import Search from "./pages/search/Search"
import Feed from "./pages/feed/Feed";
import Home from "./pages/home/Home";
import Subscriptions from "./pages/subscriptions/Subscriptions";
import Profile from "./pages/profile/Profile";
import Bookmarks from "./pages/bookmarks/Bookmarks";
import Likes from "./pages/likes/Likes";
import Source from "./pages/source/Source";
import UserHistory from "./pages/user-history/UserHistory";
import ForYou from "./pages/foryou/ForYou";
import Test from "./components/test";

function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<PageLayout />}>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/for-you" element={<ForYou />} />
          <Route path="/:topic" element={<Feed />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/likes" element={<Likes />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/source/:source" element={<Source />} />
          <Route path="/profile/details" element={<Profile />} />
          <Route path="/profile/history" element={<UserHistory />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterUserForm />} />
      <Route path="/test" element={<Test />} />
    </Routes>
  )
}

export default App
