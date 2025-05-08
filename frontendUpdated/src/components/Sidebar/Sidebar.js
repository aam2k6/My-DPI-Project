import React, { useContext, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faArrowLeft, 
  faArrowRightFromBracket, 
} from '@fortawesome/free-solid-svg-icons';

// import {
//   Bell,
//   Home as HomeIcon,
//   FolderClosed as Folder,
//   Lock,
//   LayoutGrid,
//   Settings,
//   User,
//   LogOut,
//   ArrowLeft,
// } from "lucide-react";
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
  locker_on=false
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
    navigate("/");
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
  // --- NEW useEffect to fetch notifications on component mount ---
  useEffect(() => {
    if (curruser) {
      fetchNotifications();
    } else {
      console.error("fetchNotifications function is not available!");
    }
  }, [curruser]);


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
console.log("curruser", curruser)
console.log("typeof username:", typeof curruser?.username);
  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="user-info">
          <h2 className="sidebar-title">
            {capitalizeFirstLetter(curruser?.username)}
          </h2>
          <p className="sidebar-subtitle">
  {typeof curruser?.description === "string" ? curruser.description : "Invalid description"}
</p>
        </div>
        <div className="notification-container" ref={notificationsRef}>
          <button className="notification-btn" onClick={toggleNotifications}>
            <FontAwesomeIcon icon={faBell} style={{fontSize:"20px"}} />
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
                
                <div className="notification-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.read ? "read" : "unread"}`}
                      onClick={() => markNotificationAsRead(n.id)}
                    >
                      <p>{n.message}</p>
                      <small>{new Date(n.created_at).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No notifications.</p>
              )}
            </div>
          )}
        </div>
        <button className="notification-btn" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      </div>

     
      <nav className="sidebar-nav scrollable-nav-container">
        <ul>
          <li>
            <button
              className="nav-item"
              onClick={() => handleNavigate("Home", "/home")}
            >
              <i className="bi bi-house-door" style={{color:"#0D6EFD", fontSize:"20px"}}></i>
              <span>Home</span>
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${openSubmenus.directory ? "submenu-open" : ""}`}
              onClick={() => toggleSubmenu("directory")}
            >
              <i className="bi bi-folder2" style={{color:"#0D6EFD", fontSize:"20px"}}></i>
              <span>Directory</span>
            </button>
            <ul className={`submenu ${openSubmenus.directory ? "show" : ""}`}>
              <li
                 className="submenu-item" // Added class for potential styling
                onClick={() => handleNavigate("DPI Directory", "/dpi-directory")}
              >
                • DPI Directory
              </li>
              <li
                 className="submenu-item" // Added class for potential styling
                onClick={() =>
                  handleNavigate(
                    "Global Connection Directory",
                    "/create-global-connection-type"
                  )
                }
              >
                • Global Connection Directory
              </li>
            </ul>
          </li>
          {locker_on && (<li>
            <button
              className={`nav-item ${activeMenu === "Locker Admin" ? "active" : ""}`}
              onClick={handleLockerAdminNavigate}
            >
              <i className="bi bi-person-lock" style={{color:"#0D6EFD", fontSize:"22px"}}></i>
              <span>Locker Admin</span>
            </button>
          </li>)
}
          <li>
            <button
              className={`nav-item ${openSubmenus.settings ? "submenu-open nested-submenu" : ""}`}
              onClick={() => toggleSubmenu("settings")}
            >
              <i className="bi bi-gear" style={{color:"#0D6EFD", fontSize:"20px"}}></i>
              <span>Settings</span>
            </button>
            <ul className={`submenu ${openSubmenus.settings ? "show" : ""}`}>
              <li
                 className="submenu-item" // Added class for potential styling
                onClick={() => handleNavigate("User Settings", "/settings-page")}
              >
                • User Settings
              </li>

              {/* Conditional Rendering for Admin-specific Settings */}
              {(curruser.user_type === "sys_admin" ||
                curruser.user_type === "system_admin") ? (
                <>
                  <li
                    className={`submenu-item ${openSubmenus.lockerSettings ? "submenu-open" : ""}`}
                    onClick={() => toggleSubmenu("lockerSettings")}
                  >
                    • Locker Settings
                  </li>
                  {openSubmenus.lockerSettings && (
                    <>
                      <li
                         className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("Freeze Locker", "/freeze-locker")
                        }
                      >
                          • Freeze Locker
                      </li>
                      <li
                         className="submenu-item nested" // Added class for potential styling
                        onClick={() => handleNavigate("Locker", "/all-lockers")}
                      >
                          • Locker
                      </li>
                    </>
                  )}

                  <li
                    className={`submenu-item ${openSubmenus.lockerSettings1 ? "submenu-open" : ""}`}
                    onClick={() => toggleSubmenu("lockerSettings1")}
                  >
                    • Connection Settings
                  </li>
                  {openSubmenus.lockerSettings1 && (
                    <ul className={`submenu ${openSubmenus.lockerSettings1 ? "show" : ""} nested-submenu`}>
                  
                      <li
                         className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("Freeze Connection", "/freeze-connection")
                        }
                      >
                          • Freeze Connection
                      </li>
                      <li
                         className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("Connection Types", "/all-connection-types")
                        }
                      >
                          • Connection Types
                      </li>
                      
                    
                     
                      </ul>
                  )}

                  {/* NEW: Admin Settings Option */}
                  <li
                    className={`submenu-item ${openSubmenus.adminSettings ? "submenu-open" : ""}`}
                    onClick={() => toggleSubmenu("adminSettings")}
                  >
                    • System Admin Settings
                  </li>
                  {openSubmenus.adminSettings && (
                    <>
                      <li
                         className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("Manage Users", "/manage-admins")
                        }
                      >
                          • Manage Admin
                      </li>
                       <li
                         className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("System Configuration", "/manage-moderators")
                        }
                      >
                          • Manage Moderator
                      </li>
                       {/* Add more admin specific items here */}
                    </>
                  )}
                </>
              ) : (
                <>
                   {/* Non-admin user's view of Settings */}
                  <li
                     className="submenu-item" // Added class for potential styling
                    onClick={() => handleNavigate("Locker Settings", "/all-lockers")}
                  >
                    • Locker Settings
                  </li>
                   <li
                     className="submenu-item" // Added class for potential styling
                    onClick={() => handleNavigate("Connection Settings", "/all-connection-types")}
                  >
                   • Connection Settings
                 </li>
                </>
              )}
            </ul>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
          <i class="bi bi-person" style={{color:"#0D6EFD", fontSize:"20px"}}></i>
          </div>
          <span>{capitalizeFirstLetter(curruser?.username)}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
        <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;