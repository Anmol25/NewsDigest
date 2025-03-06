import Navbar from "../components/Navbar/Navbar";
import { Outlet, useLocation } from "react-router-dom";

const FeedLayout = () => {

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default FeedLayout;
