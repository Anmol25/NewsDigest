import Navbar from "../components/Navbar/Navbar";
import SideMenu from "../components/SideMenu/SideMenu";
import { Outlet, useLocation } from "react-router-dom";

const FeedLayout = () => {
  const location = useLocation();
  const isSearchPage = location.pathname.startsWith("/search"); // Hide SideMenu on search

  return (
    <>
      <Navbar />
      {/* {!isSearchPage && <SideMenu />} */} {/* SideMenu is NOT rendered for search */}
      <Outlet />
    </>
  );
};

export default FeedLayout;
