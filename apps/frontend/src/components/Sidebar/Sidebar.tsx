import ButtonShort from "./button-short";
import { SIDEBAR_TOP_LIST, SIDEBAR_BOTTOM_LIST } from "../../constants/SIDEBAR_LIST";

function SideBar2(){
    return(<div className="fixed mt-16 flex flex-col justify-between h-[calc(100vh-4rem)] w-22 z-800">
        <div>
            {SIDEBAR_TOP_LIST.map((item, index) => (
                <ButtonShort
                    key={index}
                    image={item.image}
                    name={item.name}
                    to={item.to}
                    image_fill={item.image_fill}
                />
            ))}
        </div>
        <div>
            {SIDEBAR_BOTTOM_LIST.map((item, index) => (
                <ButtonShort
                    key={index}
                    image={item.image}
                    name={item.name}
                    to={item.to}
                    image_fill={item.image_fill}
                />
            ))}
        </div>
    </div>);
}

export default SideBar2;