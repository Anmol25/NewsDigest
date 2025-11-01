import NavBar from "../components/Navbar/Navbar";
import SideBar from "../components/Sidebar/Sidebar";
import Notification from "../components/Notification/Notification";
import { Outlet, useLocation } from "react-router-dom";
import MiniChatWidget from "../components/ChatMini/MiniChatWidget";

const FeedLayout = () => {
  const location = useLocation();
  const isChatRoute = /^\/chat(\/.*)?$/.test(location.pathname);
  return (
    <div className="flex ">
      <NavBar />
      <SideBar />
      <div className="mt-16 ml-22 h-[calc(100vh-4rem)] w-[calc(100%-5.5rem)]">
        <Outlet />
      </div>
      <Notification />
      {/* Floating mini chat available on all pages except full chat routes */}
      {!isChatRoute && <MiniChatWidget />}
    </div>
  );
};

export default FeedLayout;
