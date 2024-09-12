import React, { useState, useContext, useEffect } from "react";
import "./Navbar.css";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import { usercontext } from "../../usercontext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons'; // Importing the bell icon
import { frontend_host } from "../../config";

export default function Navbar({ content, lockerAdmin, lockerObj }) {
  // Helper function to capitalize the first letter of a string
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
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

  // Fetch notifications when component loads
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          "host/get-notifications/".replace(/host/, frontend_host),
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || "Failed to fetch notifications");
          return;
        }

        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        } else {
          setError(data.message || data.error);
        }
      } catch (error) {
        setError("An error occurred while fetching notifications.");
      }
    };

    fetchNotifications();
  }, []);

  const handleSettings = () => {
    navigate("/settings-page");
  };

  const handleConnection = () => {
    navigate("/admin", { state: lockerObj });
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleAdminSettings = () => {
    navigate("/create-global-connection-type");
  };

  const handleModeratorSettings = () => {
    navigate("/freeze-locker-connection");
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `host/mark-notification-read/${id}/`.replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotifications(notifications.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        ));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to mark notification as read");
      }
    } catch (error) {
      setError("An error occurred while marking notification as read.");
    }
  };

  return (
    <nav className="navbar">
      <div className="wrap">{content}</div>

      <div className="navbarLinks">
        {lockerAdmin && (
          <ul className="navbarFirstLink">
            <li>
              <a href="#" onClick={handleConnection}>
                Locker Admin
              </a>
            </li>
          </ul>
        )}

        {/* Notification Bell */}
        <ul className="navbarFirstLink">
          <li>
            <div className="notification-icon" onClick={toggleNotifications}>
            <FontAwesomeIcon icon={faBell} className="notification-bell" size="2x" />
            {notifications.some((n) => !n.read) && (
                <span className="notification-badge">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </div>

            {isNotificationsOpen && (
  <div className="notification-dropdown">
    <h3>Notifications</h3>
    {notifications.length > 0 ? (
      notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification-box ${notification.read ? 'read' : 'unread'}`}
          onClick={() => markNotificationAsRead(notification.id)}
        >
          <p>
            <b>{notification.guest_user} </b> 
            has requested for Locker <b>{notification.host_locker_name} </b>
            from the connection <b>{notification.connection_type_name}</b>
          </p>
          <p>
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
      ))
    ) : (
      <p>No notifications found.</p>
    )}
  </div>
)}
          </li>
        </ul>

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
            <a href="#" onClick={handleAdminSettings}></a>
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
            <div className="username" onClick={toggleDropdown}>
              {capitalizeFirstLetter(curruser.username)}
            </div>

            {isOpen && (
              <div className="dropdownContent">
                <div className="currusername">
                  {capitalizeFirstLetter(curruser.username)}
                </div>
                <div className="curruserdesc">{curruser.description}</div>

                {(curruser.user_type === "sys_admin" ||
                  curruser.user_type === "system_admin") && (
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

                <button onClick={handleSettings}>Settings</button>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
