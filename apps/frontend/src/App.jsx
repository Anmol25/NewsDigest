import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import PageLayout from "./layout/PageLayout"
import ProtectedRoute from "./contexts/ProtectedRoute"
import LoginForm from "./pages/authentication/LoginForm"
import RegisterUserForm from "./pages/authentication/RegisterUserForm"
import Search from "./pages/search/Search"
import News from "./pages/news/News";
import Home from "./pages/home/Home";
import Subscriptions from "./pages/subscriptions/Subscriptions";
import Profile from "./pages/profile/Profile";
import Bookmarks from "./pages/bookmarks/Bookmarks";
import Source from "./pages/source/Source";
import UserHistory from "./pages/user-history/UserHistory";
import ForYou from "./pages/foryou/ForYou";
import Chat from "./pages/chat/chat";
import Channels from "./pages/channels/channel";

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
          <Route path="/news/:topic" element={<News />} />
          <Route path="/news" element={<Navigate to="/news/top-stories" replace />} />
          <Route path="/saved" element={<Bookmarks />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/source/:source" element={<Source />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<UserHistory />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Route>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterUserForm />} />
      <Route path="/test" element={<Test />} />
    </Routes>
  )
}

export default App
