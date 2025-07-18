import { NavLink } from "react-router-dom";
import { SOURCE_LIST } from "../../constants/SOURCE_LIST";

function Channels(){
    return (
        <div className="px-5 py-2.5">
            <div className="text-3xl font-semibold text-textPrimary pt-1 pb-2.5">
                Channels
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(175px,1fr))] gap-6 mt-2.5">
                {SOURCE_LIST.map((source) => (
                    <NavLink key={source.name.toLowerCase().replace(/\s+/g, "-")} to={`/source/${source.name.toLowerCase().replace(/\s+/g, "-")}`}  className="flex flex-col justify-center aspect-square items-center text-center p-4 bg-white shadow-md rounded-2xl hover:shadow-lg transition-shadow duration-300">
                        <img
                            src={source.icon}
                            alt={source.name}
                            className="w-20 h-20 rounded-full"
                        />
                        <h2 className="flex flex-row text-xl font-bold mt-2.5">{source.name}</h2>
                    </NavLink>
                ))}
            </div>
        </div>
    );
}

export default Channels;