import Navbar from "../components/Navbar/Navbar";
import SourceList from "../components/SourceList/SourceList";
import { Outlet} from "react-router-dom";

const SourceLayout = () => {

  return (
    <>
      <Navbar />
      <SourceList />
      <Outlet />
    </>
  );
};

export default SourceLayout;
