

import React, { useState } from "react";
import { Home } from "../Home/Home2"; // adjust the path if needed
import Sidebar from "../Sidebar/sidebar_comp"; // adjust the path if needed
import { Menu } from "lucide-react";

const HomePage = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));

  return (
    <div className="app-container">
      <button
        className={`hamburger-menu ${isSidebarOpen ? "hidden" : ""}`}
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
      />

      <Home />
    </div>
  );
};

export default HomePage;
