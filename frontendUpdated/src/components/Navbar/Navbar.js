import React, { useState, useContext } from "react";
import "./Navbar.css";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import { usercontext } from "../../usercontext";

export default function Navbar({content}) {
  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { curruser, setUser } = useContext(usercontext);

  const handleDPIDirectory = () => {
    navigate("/dpi-directory");
  };

  const handleHomeClick = () => {
    navigate("/home");
  };

  const handleLogout = () => {
    // Clear cookies
    Cookies.remove("authToken");
    // Clear local storage
    localStorage.removeItem("curruser");
    // Set user context to null
    setUser(null);
    // Redirect to login page
    navigate("/");
  };

  const handleAdmin = () => {
    navigate("/admin");
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // const handleCreateGlobalConnectionType = () => {
  //   navigate("/create-global-connection-type");
  // };
  const handleAdminSettings = () => {
    navigate("/create-global-connection-type");
  };

  const handleModeratorSettings = () => {
    navigate("/freeze-locker-connection");
  };

  return (
    <nav className="navbar">
      <div className="wrap">
        {content}
      </div>

      <div className="navbarLinks">
        <ul className="navbarFirstLink">
          <li>
            <a href="#" onClick={handleDPIDirectory}>
              DPI Directory
            </a>
          </li>
        </ul>

        <ul className="navbarSecondLink">
          <li>
            <a href="#" onClick={handleHomeClick}>
              Home
            </a>
          </li>
          <li>
            <a href="#" onClick={handleAdmin}></a>
          </li>
        </ul>

        <ul className="navbarThirdLink">
          <li>
            <img
              src={userImage}
              alt="User Icon"
              onClick={toggleDropdown}
              className="dropdownImage"
            />
            {isOpen && (
              <div className="dropdownContent">
                <div className="currusername">
                  {capitalizeFirstLetter(curruser.username)}
                </div>
                <div className="curruserdesc">{curruser.description}</div>

                {(curruser.user_type === "sys_admin" || curruser.user_type === "system_admin") && (
                  <>
                    <button onClick={handleAdminSettings}>
                      System Admin Settings
                    </button>
                  </>
                )}

                {curruser.user_type === "moderator" && (
                  <>
                    <button onClick={handleModeratorSettings}>
                      Moderator Settings
                    </button>
                  </>
                )}

                <button onClick={handleAdmin}>Settings</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
