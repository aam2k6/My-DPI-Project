import React, { useState } from "react";
import "./HoverMenu.css";

const HoverMenu = ({ icon, title, items, navigate }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="hover-menu"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="hover-btn">
        <span className="icon">{icon}</span>
        <span>{title}</span>
      </button>

      {open && (
        <div className="dropdown-box">
          {items.map((item, index) => (
            <div
              key={index}
              className="dropdown-item"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HoverMenu;