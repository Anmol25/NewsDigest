import NavBar from "../components/Navbar/Navbar";
import SideBar from "../components/Sidebar/Sidebar";
import Notification from "../components/Notification/Notification";
import { Outlet } from "react-router-dom";

const FeedLayout = () => {
  return (
    <div className="flex ">
      <NavBar />
      <SideBar />
      <div className="mt-16 ml-22 h-[calc(100vh-4rem)] w-[calc(100%-5.5rem)]">
        <Outlet />
      </div>
      <Notification />
    </div>
  );
};

export default FeedLayout;
