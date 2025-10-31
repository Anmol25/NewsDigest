import logo from "../../assets/logo.png";
import SearchBar from "./searchbar/searchbar";
import { NavLink } from "react-router-dom";

function NavBar2() {
  return (
    <div className="flex flex-row fixed bg-basePrimary items-center justify-between w-full h-16 pl-7 py-2.5 z-900">
      <div className="flex flex-row items-center gap-4">
        <NavLink to={"/home"}>
          <img
            className="h-10"
            src={logo}
            alt="News Digest"
            style={{ cursor: "pointer" }}
          />
        </NavLink>
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <SearchBar />
      </div>
      <div className="flex flex-row gap-10 px-6">
        <NavLink
          className={({ isActive }) =>
            `border-2 border-brandColor font-semibold bg-basePrimary px-5 py-2 rounded-3xl shadow-md hover:animate-hoverShadowEffect ${
              isActive
                ? "text-basePrimary bg-brandColor animate-hoverShadowEffect"
                : "text-brandColor"
            } transition duration-300 ease-in-out`
          }
          to="/chat"
        >
          AI Assistant
        </NavLink>
      </div>
    </div>
  );
}

export default NavBar2;
