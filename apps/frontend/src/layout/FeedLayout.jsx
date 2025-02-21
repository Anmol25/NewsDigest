import Navbar from "../components/Navbar/Navbar"
import SideMenu from "../components/SideMenu/SideMenu";
import { Outlet } from "react-router-dom";

const FeedLayout = () => {
  return (
    <>
      <Navbar />
      <SideMenu />
      <Outlet />
    </>
  );
};

export default FeedLayout;
