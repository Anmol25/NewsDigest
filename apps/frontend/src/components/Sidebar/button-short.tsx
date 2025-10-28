import React from 'react';
import { NavLink } from "react-router-dom";

interface ButtonShortProps {
  image: string;
  image_fill: string; 
  name: string;  
  to: string;
  onClick?: () => void;
}


const ButtonShort: React.FC<ButtonShortProps> = (props) =>{
    return(
        <NavLink className="flex flex-col items-center w-22 py-2 "
        to={props.to}
        onClick={(e) => {
        if (props.onClick) {
          e.preventDefault();
          props.onClick();
        }
      }}
        >
            {({ isActive }) => ( // Using the render prop to access isActive
                <>
                    <div className="text-3xl">
                        {/* Conditionally render based on isActive */}
                        <i className={isActive ? props.image_fill : props.image}></i>
                    </div>
                    <div className="text-textSmall">
                        {props.name}
                    </div>
                </>
            )}
        </NavLink>
    );
}

export default ButtonShort;