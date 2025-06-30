import NavBar2 from "../components/Navbar2/Navbar2";
import SideBar2 from "../components/Sidebar2/Sidebar2";
import Notification from "../components/Notification/Notification";
import { Outlet } from "react-router-dom";

const FeedLayout = () => {
  return (
    <div className="flex ">
      <NavBar2 />
      <SideBar2 />
      <div className="mt-16 ml-22 h-[calc(100vh-4rem)] w-[calc(100%-5.5rem)]">
        <Outlet />
      </div>
      <Notification />
    </div>
  );
};

export default FeedLayout;
