import SourceList from "../components/SourceList/SourceList";
import { Outlet} from "react-router-dom";

const SourceLayout = () => {

  return (
    <>
      <SourceList />
      <Outlet />
    </>
  );
};

export default SourceLayout;
