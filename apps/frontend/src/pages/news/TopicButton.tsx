import { NavLink } from "react-router-dom";


export default function TopicButton({ name, to }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => (isActive ? 'flex flex-row items-center whitespace-nowrap justify-center w-full h-12 py-0 border border-brandColor text-textMedium text-basePrimary bg-brandColor rounded-2xl shadow-md' : "flex flex-row justify-center items-center whitespace-nowrap  border w-full h-12 border-borderPrimary text-textMedium text-textSecondary rounded-2xl shadow-md hover:border-brandColor hover:text-basePrimary hover:bg-brandColor transition duration-300 ease-in-out")}
        >
            {name}
        </NavLink>
    );
}