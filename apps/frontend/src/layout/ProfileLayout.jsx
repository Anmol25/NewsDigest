import ProfileOptions from "../components/ProfileOptions/ProfileOptions";
import { Outlet} from "react-router-dom";

const ProfileLayout = () => {

  return (
    <>
      <ProfileOptions />
      <Outlet />
    </>
  );
};

export default ProfileLayout;
