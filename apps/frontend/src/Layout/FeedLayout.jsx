import Navbar from "../components/navbar"
import SideMenu from "../components/sidemenu"
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
