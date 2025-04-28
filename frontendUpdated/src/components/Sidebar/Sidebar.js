import React, { useContext, useEffect, useRef, useState } from "react";
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
import "./Sidebar.css";
import Cookies from "js-cookie";
import { frontend_host } from "../../config";
import { usercontext } from "../../usercontext";

// const frontend_host = "http://your-backend-api.com"; // Replace with actual host

const Sidebar = ({
  isSidebarOpen,
  toggleSidebar,
  activeMenu,
  setActiveMenu,
  openSubmenus,
  toggleSubmenu,
  lockerObj = null,
}) => {
  const navigate = useNavigate();
  const { curruser, setUser } = useContext(usercontext);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const notificationsRef = useRef(null);

  const handleLogout = () => {
    Cookies.remove("authToken");
    localStorage.removeItem("curruser");
    console.log("Logged out");
    window.history.pushState(null, null, "/");
    navigate("/", { replace: true });
    window.location.reload();
    setUser(null);
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleNavigate = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
  };

  const handleLockerAdminNavigate = () => {
    if (lockerObj) {
      navigate(`/admin`, { state: lockerObj });
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`${frontend_host}/get-notifications/`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch notifications");
        return;
      }

      const data = await response.json();
      if (data.success) {
        console.log(data);    
        setNotifications(data.notifications || []);
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching notifications.");
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`${frontend_host}/mark-notification-read/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const toggleNotifications = async () => {
    setIsNotificationsOpen((prev) => !prev);
    if (!isNotificationsOpen) {
      await fetchNotifications();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationsOpen]);

  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="user-info">
          <h2 className="sidebar-title">{capitalizeFirstLetter(curruser.username)}</h2>
          <p className="sidebar-subtitle">{curruser.description}</p>
        </div>
        <div className="notification-container" ref={notificationsRef}>
          <button className="notification-btn" onClick={toggleNotifications}>
            <Bell size={20} />
            {notifications.some((n) => !n.read) && (
              <span className="notification-badge">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="notification-modal right">
              <h4>Notifications</h4>
              {error && <p className="error">{error}</p>}
              {notifications.length > 0 ? (
                // --- This part handles rendering the list ---
                notifications.map((n) => (
                  <div
                    key={n.id} // Unique key for each item - Good!
                    className={`notification-item ${n.read ? "read" : "unread"}`}
                    onClick={() => markNotificationAsRead(n.id)}
                  >
                    <p>{n.message}</p>
                    <small>{new Date(n.created_at).toLocaleString()}</small>
                  </div>
                ))
                // --- End of list rendering ---
              ) : (
                <p>No notifications.</p>
              )}
            </div>
          )}
        </div>
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
              <li onClick={() => handleNavigate("DPI Directory", "/dpi-directory")}>
                • DPI Directory
              </li>
              <li onClick={() => handleNavigate("Global Connection Directory", "/create-global-connection-type")}>
                • Global Connection Directory
              </li>
            </ul>
          </li>
          <li>
            <button
              className={`nav-item ${activeMenu === "Locker Admin" ? "active" : ""}`}
              onClick={handleLockerAdminNavigate}
            >
              <Lock size={20} />
              <span>Locker Admin</span>
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
              <li onClick={() => handleNavigate("User Settings", "/settings-page")}>
                • User Settings
              </li>
              {(curruser.user_type === "sys_admin" || curruser.user_type === "system_admin") ? (
                <>
                  <li onClick={() => toggleSubmenu("lockerSettings")}>• Locker Settings</li>
                  {openSubmenus.lockerSettings && (
                    <>
                      <li onClick={() => handleNavigate("Freeze Locker", "/freeze-locker")}>
                          • Freeze Locker
                      </li>
                      <li onClick={() => handleNavigate("Locker", "/all-lockers")}>
                          • Locker
                      </li>
                    </>
                  )}
                </>
              ) : (
                <li onClick={() => handleNavigate("Locker Settings", "/all-lockers")}>
                  • Locker Settings
                </li>
              )}
               {(curruser.user_type === "sys_admin" || curruser.user_type === "system_admin") ? (
                <>
                  <li onClick={() => toggleSubmenu("lockerSettings1")}> • Connection Settings</li>
                  {openSubmenus.lockerSettings1 && (
                    <>
                      <li onClick={() => handleNavigate("Freeze Connection", "/freeze-connection")}>
                          • Freeze Connection
                      </li>
                      <li onClick={() => handleNavigate("Connection Types", "/all-connection-types")}>
                          • Connection Types
                      </li>
                    </>
                  )}
                </>
              ) : (
                <li onClick={() => handleNavigate("Connection Settings", "/all-connection-types")}>
                • Connection Settings
              </li>
              )}
            
            </ul>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <User size={16} />
          </div>
          <span>{capitalizeFirstLetter(curruser.username)}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;