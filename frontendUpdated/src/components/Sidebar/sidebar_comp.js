import React from "react";
import {
  Bell,
  Home as HomeIcon,
  FolderClosed as Folder,
  Lock,
  LayoutGrid,
  Settings,
  User,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import "./Sidebar.css";
import Cookies from "js-cookie";
import { usercontext } from "../../usercontext";



const Sidebar = ({
  isSidebarOpen,
  toggleSidebar,
  activeMenu,
  setActiveMenu,
  openSubmenus,
  toggleSubmenu,
}) => {
  const navigate = useNavigate();
const handleLogout = () => {
  Cookies.remove("authToken");
  localStorage.removeItem("curruser");
  console.log("gfds");
  // setUser(null);
  navigate("/");
};
const capitalizeFirstLetter = (string) => {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
};
const { curruser, setUser } = useContext(usercontext);

  const handleNavigate = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
  };
 

  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="user-info">
          <h2 className="sidebar-title"> {capitalizeFirstLetter(curruser.username)}</h2>
          <p className="sidebar-subtitle">Student at IIT-Bangalore</p>
        </div>
        <button className="notification-btn">
          <Bell size={20} />
        </button>
        <button className="notification-btn" onClick={toggleSidebar}>
          <ArrowLeft size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <button
              className={`nav-item ${activeMenu === "Home" ? "active" : ""}`}
              onClick={() => handleNavigate("Home", "/home")}
            >
              <HomeIcon size={20} />
              <span>Home</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-item ${openSubmenus.directory ? "submenu-open" : ""}`}
              onClick={() => toggleSubmenu("directory")}
            >
              <Folder size={20} />
              <span>Directory</span>
            </button>
            <ul className={`submenu ${openSubmenus.directory ? "show" : ""}`}>
              <li onClick={() => handleNavigate("DPI Directory", "/dpi-directory")}>• DPI Directory</li>
              <li onClick={() => handleNavigate("Global Connection Directory", "/connectionTermsGlobal")}>• Global Connection Directory</li>
            </ul>
          </li>

          <li>
            <button
              className={`nav-item ${activeMenu === "My Lockers" ? "active" : ""}`}
              // onClick={() => handleNavigate("My Lockers", "/view-locker")}
            >
              <Lock size={20} />
              <span>My Lockers</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-item ${activeMenu === "Consent Dashboard" ? "active" : ""}`}
              onClick={() => handleNavigate("Consent Dashboard", "/connectionTerms")}
            >
              <LayoutGrid size={20} />
              <span>Consent Dashboard</span>
            </button>
          </li>

          <li>
            <button
              className={`nav-item ${openSubmenus.settings ? "submenu-open" : ""}`}
              onClick={() => toggleSubmenu("settings")}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
            <ul className={`submenu ${openSubmenus.settings ? "show" : ""}`}>
              <li onClick={() => handleNavigate("User Settings", "/settings-page")}>• User Settings</li>
              <li onClick={() => handleNavigate("Locker Settings", "/all-lockers")}>• Locker Settings</li>
              <li onClick={() => handleNavigate("Connection Settings", "/all-connection-types")}>• Connection Settings</li>
            </ul>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <span>Rohith</span>
        </div>
        <button className="logout-btn" 
        onClick={handleLogout}>
          <LogOut size={20}
           
          />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;