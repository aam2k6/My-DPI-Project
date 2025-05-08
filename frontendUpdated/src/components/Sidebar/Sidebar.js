// import React, { useContext, useEffect, useRef, useState } from "react";
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
// import { useNavigate } from "react-router-dom";
// import "./Sidebar.css";
// import Cookies from "js-cookie";
// import { frontend_host } from "../../config";
// import { usercontext } from "../../usercontext";

// // const frontend_host = "http://your-backend-api.com"; // Replace with actual host

// const Sidebar = ({
//   isSidebarOpen,
//   toggleSidebar,
//   activeMenu,
//   setActiveMenu,
//   openSubmenus,
//   toggleSubmenu,
//   lockerObj = null,
//   locker_on=false
// }) => {
//   const navigate = useNavigate();
//   const { curruser, setUser } = useContext(usercontext);

//   const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
//   const [notifications, setNotifications] = useState([]);
//   const [error, setError] = useState(null);
//   const notificationsRef = useRef(null);

//   const handleLogout = () => {
//     Cookies.remove("authToken");
//     localStorage.removeItem("curruser");
//     console.log("Logged out");
//     navigate("/");
//     window.location.reload();
//     setUser(null);
//   };

//   const capitalizeFirstLetter = (string) => {
//     if (!string) return "";
//     return string.charAt(0).toUpperCase() + string.slice(1);
//   };

//   const handleNavigate = (menuName, path) => {
//     setActiveMenu(menuName);
//     navigate(path);
//   };

//   const handleLockerAdminNavigate = () => {
//     if (lockerObj) {
//       navigate(`/admin`, { state: lockerObj });
//     }
//   };

//   const fetchNotifications = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const response = await fetch(`${frontend_host}/get-notifications/`, {
//         method: "GET",
//         headers: {
//           Authorization: `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         setError(errorData.error || "Failed to fetch notifications");
//         return;
//       }

//       const data = await response.json();
//       if (data.success) {
//         console.log(data);    
//         setNotifications(data.notifications || []);
//       } else {
//         setError(data.message || data.error);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching notifications.");
//     }
//   };

//   const markNotificationAsRead = async (id) => {
//     try {
//       const token = Cookies.get("authToken");
//       const response = await fetch(`${frontend_host}/mark-notification-read/${id}`, {
//         method: "POST",
//         headers: {
//           Authorization: `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (response.ok) {
//         setNotifications((prev) =>
//           prev.map((n) => (n.id === id ? { ...n, read: true } : n))
//         );
//       }
//     } catch (err) {
//       console.error("Failed to mark notification as read", err);
//     }
//   };
//   // --- NEW useEffect to fetch notifications on component mount ---
//   useEffect(() => {
//     if (curruser) {
//       fetchNotifications();
//     } else {
//       console.error("fetchNotifications function is not available!");
//     }
//   }, [curruser]);


//   const toggleNotifications = async () => {
//     setIsNotificationsOpen((prev) => !prev);
//     if (!isNotificationsOpen) {
//       await fetchNotifications();
//     }
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         notificationsRef.current &&
//         !notificationsRef.current.contains(event.target)
//       ) {
//         setIsNotificationsOpen(false);
//       }
//     };

//     if (isNotificationsOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//     } else {
//       document.removeEventListener("mousedown", handleClickOutside);
//     }

//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isNotificationsOpen]);
// console.log("curruser", curruser)
// console.log("typeof username:", typeof curruser?.username);
//   return (
//     <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
//       <div className="sidebar-header">
//         <div className="user-info">
//           {/* <h2 className="sidebar-title">
//             {capitalizeFirstLetter(curruser?.username)}
//           </h2> */}
//           <p className="sidebar-subtitle">
//   {typeof curruser?.description === "string" ? curruser.description : "Invalid description"}
// </p>
//         </div>
//         <div className="notification-container" ref={notificationsRef}>
//           <button className="notification-btn" onClick={toggleNotifications}>
//             <Bell size={20} />
//             {notifications.some((n) => !n.read) && (
//               <span className="notification-badge">
//                 {notifications.filter((n) => !n.read).length}
//               </span>
//             )}
//           </button>
//           {isNotificationsOpen && (
//             <div className="notification-modal right">
//               <h4>Notifications</h4>
//               {error && <p className="error">{error}</p>}
//               {notifications.length > 0 ? (
                
//                 <div className="notification-list">
//                   {notifications.map((n) => (
//                     <div
//                       key={n.id}
//                       className={`notification-item ${n.read ? "read" : "unread"}`}
//                       onClick={() => markNotificationAsRead(n.id)}
//                     >
//                       <p>{n.message}</p>
//                       <small>{new Date(n.created_at).toLocaleString()}</small>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p>No notifications.</p>
//               )}
//             </div>
//           )}
//         </div>
//         <button className="notification-btn" onClick={toggleSidebar}>
//           <ArrowLeft size={20} />
//         </button>
//       </div>

     
//       <nav className="sidebar-nav scrollable-nav-container">
//         <ul>
//           <li>
//             <button
//               className="nav-item"
//               onClick={() => handleNavigate("Home", "/home")}
//             >
//               <HomeIcon size={20} />
//               <span>Home</span>
//             </button>
//           </li>
//           <li>
//             <button
//               className={`nav-item ${openSubmenus.directory ? "submenu-open" : ""}`}
//               onClick={() => toggleSubmenu("directory")}
//             >
//               <Folder size={20} />
//               <span>Directory</span>
//             </button>
//             <ul className={`submenu ${openSubmenus.directory ? "show" : ""}`}>
//               <li
//                  className="submenu-item" // Added class for potential styling
//                 onClick={() => handleNavigate("DPI Directory", "/dpi-directory")}
//               >
//                 • DPI Directory
//               </li>
//               <li
//                  className="submenu-item" // Added class for potential styling
//                 onClick={() =>
//                   handleNavigate(
//                     "Global Connection Directory",
//                     "/create-global-connection-type"
//                   )
//                 }
//               >
//                 • Global Connection Directory
//               </li>
//             </ul>
//           </li>
//           {locker_on && (<li>
//             <button
//               className={`nav-item ${activeMenu === "Locker Admin" ? "active" : ""}`}
//               onClick={handleLockerAdminNavigate}
//             >
//               <Lock size={20} />
//               <span>Locker Admin</span>
//             </button>
//           </li>)
// }
//           <li>
//             <button
//               className={`nav-item ${openSubmenus.settings ? "submenu-open nested-submenu" : ""}`}
//               onClick={() => toggleSubmenu("settings")}
//             >
//               <Settings size={20} />
//               <span>Settings</span>
//             </button>
//             <ul className={`submenu ${openSubmenus.settings ? "show" : ""}`}>
//               <li
//                  className="submenu-item" // Added class for potential styling
//                 onClick={() => handleNavigate("User Settings", "/settings-page")}
//               >
//                 • User Settings
//               </li>

//               {/* Conditional Rendering for Admin-specific Settings */}
//               {(curruser.user_type === "sys_admin" ||
//                 curruser.user_type === "system_admin") ? (
//                 <>
//                   <li
//                     className={`submenu-item ${openSubmenus.lockerSettings ? "submenu-open" : ""}`}
//                     onClick={() => toggleSubmenu("lockerSettings")}
//                   >
//                     • Locker Settings
//                   </li>
//                   {openSubmenus.lockerSettings && (
//                     <>
//                       <li
//                          className="submenu-item nested" // Added class for potential styling
//                         onClick={() =>
//                           handleNavigate("Freeze Locker", "/freeze-locker")
//                         }
//                       >
//                           • Freeze Locker
//                       </li>
//                       <li
//                          className="submenu-item nested" // Added class for potential styling
//                         onClick={() => handleNavigate("Locker", "/all-lockers")}
//                       >
//                           • Locker
//                       </li>
//                     </>
//                   )}

//                   <li
//                     className={`submenu-item ${openSubmenus.lockerSettings1 ? "submenu-open" : ""}`}
//                     onClick={() => toggleSubmenu("lockerSettings1")}
//                   >
//                     • Connection Settings
//                   </li>
//                   {openSubmenus.lockerSettings1 && (
//                     <ul className={`submenu ${openSubmenus.lockerSettings1 ? "show" : ""} nested-submenu`}>
                  
//                       <li
//                          className="submenu-item nested" // Added class for potential styling
//                         onClick={() =>
//                           handleNavigate("Freeze Connection", "/freeze-connection")
//                         }
//                       >
//                           • Freeze Connection
//                       </li>
//                       <li
//                          className="submenu-item nested" // Added class for potential styling
//                         onClick={() =>
//                           handleNavigate("Connection Types", "/all-connection-types")
//                         }
//                       >
//                           • Connection Types
//                       </li>
                      
                    
                     
//                       </ul>
//                   )}

//                   {/* NEW: Admin Settings Option */}
//                   <li
//                     className={`submenu-item ${openSubmenus.adminSettings ? "submenu-open" : ""}`}
//                     onClick={() => toggleSubmenu("adminSettings")}
//                   >
//                     • System Admin Settings
//                   </li>
//                   {openSubmenus.adminSettings && (
//                     <>
//                       <li
//                          className="submenu-item nested" // Added class for potential styling
//                         onClick={() =>
//                           handleNavigate("Manage Users", "/manage-admins")
//                         }
//                       >
//                           • Manage Admin
//                       </li>
//                        <li
//                          className="submenu-item nested" // Added class for potential styling
//                         onClick={() =>
//                           handleNavigate("System Configuration", "/manage-moderators")
//                         }
//                       >
//                           • Manage Moderator
//                       </li>
//                        {/* Add more admin specific items here */}
//                     </>
//                   )}
//                 </>
//               ) : (
//                 <>
//                    {/* Non-admin user's view of Settings */}
//                   <li
//                      className="submenu-item" // Added class for potential styling
//                     onClick={() => handleNavigate("Locker Settings", "/all-lockers")}
//                   >
//                     • Locker Settings
//                   </li>
//                    <li
//                      className="submenu-item" // Added class for potential styling
//                     onClick={() => handleNavigate("Connection Settings", "/all-connection-types")}
//                   >
//                    • Connection Settings
//                  </li>
//                 </>
//               )}
//             </ul>
//           </li>
//         </ul>
//       </nav>

//       <div className="sidebar-footer">
//         <div className="user-profile">
//           <div className="user-avatar">
//             <User size={16} />
//           </div>
//           <span>{capitalizeFirstLetter(curruser?.username)}</span>
//         </div>
//         <button className="logout-btn" onClick={handleLogout}>
//           <LogOut size={20} />
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Sidebar;

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
import { frontend_host } from "../../config"; // Ensure this is correctly configured for server
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
  locker_on = false,
}) => {
  // --- DEBUG: Log when Sidebar component function is called ---
  console.log("SERVER SIDEBAR: Component function called. isSidebarOpen:", isSidebarOpen, "locker_on:", locker_on);

  const navigate = useNavigate();
  const { curruser, setUser } = useContext(usercontext);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null); // For notification errors
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
    // --- DEBUG: Check type of string being passed to capitalizeFirstLetter ---
    // console.log("SERVER SIDEBAR: capitalizeFirstLetter input type:", typeof string, "value:", string);
    if (typeof string !== 'string') {
        // console.warn("SERVER SIDEBAR: capitalizeFirstLetter received non-string:", string);
        return "Invalid Name"; // Or handle as appropriate
    }
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
    // --- DEBUG: Log before fetching notifications ---
    console.log("SERVER SIDEBAR: Attempting to fetch notifications. Token exists:", !!Cookies.get("authToken"));
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        // console.warn("SERVER SIDEBAR: No auth token for fetchNotifications");
        // setError("Authentication token not found."); // Optionally set error
        return; // Don't fetch if no token
      }
      const response = await fetch(`${frontend_host}/get-notifications/`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: `Server responded with ${response.status}` };
        }
        // console.error("SERVER SIDEBAR: Failed to fetch notifications, status:", response.status, "errorData:", errorData);
        setError(errorData.error || "Failed to fetch notifications");
        return;
      }

      const data = await response.json();
      if (data.success) {
        // console.log("SERVER SIDEBAR: Notifications fetched successfully:", data.notifications);
        setNotifications(data.notifications || []);
      } else {
        // console.error("SERVER SIDEBAR: Fetch notifications API error:", data.message || data.error);
        setError(data.message || data.error);
      }
    } catch (error) {
      // console.error("SERVER SIDEBAR: Catch block error fetching notifications:", error);
      setError("An error occurred while fetching notifications.");
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `${frontend_host}/mark-notification-read/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  useEffect(() => {
    // --- DEBUG: Log inside useEffect for fetchNotifications ---
    // console.log("SERVER SIDEBAR: useEffect for fetchNotifications triggered. curruser exists:", !!curruser);
    if (curruser) { // Ensure curruser is available before fetching
      fetchNotifications();
    } else {
      // console.warn("SERVER SIDEBAR: fetchNotifications not called because curruser is not available yet.");
    }
  }, [curruser]); // Only run when curruser changes

  const toggleNotifications = async () => {
    setIsNotificationsOpen((prev) => !prev);
    if (!isNotificationsOpen) { // This condition is based on the state *before* the update
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

  // --- EXTENSIVE DEBUG LOGS BEFORE RETURN ---
  console.log("------------------------------------------------------");
  console.log("SERVER SIDEBAR DEBUG: RENDERING - Props & Context");
  console.log("SERVER SIDEBAR DEBUG: isSidebarOpen:", isSidebarOpen);
  console.log("SERVER SIDEBAR DEBUG: activeMenu:", activeMenu);
  // console.log("SERVER SIDEBAR DEBUG: openSubmenus:", JSON.stringify(openSubmenus)); // Can be verbose
  console.log("SERVER SIDEBAR DEBUG: lockerObj provided:", lockerObj !== null && lockerObj !== undefined);
  console.log("SERVER SIDEBAR DEBUG: locker_on:", locker_on);
  
  console.log("SERVER SIDEBAR DEBUG: typeof curruser:", typeof curruser);
  // Use try-catch for JSON.stringify if curruser might be complex or circular
  try {
    console.log("SERVER SIDEBAR DEBUG: curruser value:", JSON.stringify(curruser, null, 2));
  } catch (e) {
    console.log("SERVER SIDEBAR DEBUG: curruser (could not stringify):", curruser);
  }

  if (curruser) {
    console.log("SERVER SIDEBAR DEBUG: curruser.username:", curruser.username);
    console.log("SERVER SIDEBAR DEBUG: typeof curruser.username:", typeof curruser.username);
    console.log("SERVER SIDEBAR DEBUG: curruser.description:", curruser.description);
    console.log("SERVER SIDEBAR DEBUG: typeof curruser.description:", typeof curruser.description);
    console.log("SERVER SIDEBAR DEBUG: curruser.user_type:", curruser.user_type);
    console.log("SERVER SIDEBAR DEBUG: typeof curruser.user_type:", typeof curruser.user_type);
  } else {
    console.log("SERVER SIDEBAR DEBUG: curruser is null or undefined.");
  }

  console.log("SERVER SIDEBAR DEBUG: notifications state (first 2):", JSON.stringify(notifications.slice(0,2), null, 2));
  console.log("SERVER SIDEBAR DEBUG: notifications error state:", error);
  console.log("------------------------------------------------------");

  // --- Potential quick fix/check: If curruser is not an object, render minimally or null ---
  // if (typeof curruser !== 'object' || curruser === null) {
  //   console.warn("SERVER SIDEBAR: curruser is not a valid object, rendering null or placeholder.");
  //   // return null; // Or a loading indicator, or a minimal sidebar
  //   // This is a temporary diagnostic step. The real fix is to ensure curruser is correctly populated.
  // }

  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="user-info">
          {/* Removed h2 for username, assuming it's in the footer now */}
          <p className="sidebar-subtitle">
            {curruser && typeof curruser.description === "string"
              ? curruser.description
              : "User description not available"}
          </p>
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
                <div className="notification-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${
                        n.read ? "read" : "unread"
                      }`}
                      onClick={() => markNotificationAsRead(n.id)}
                    >
                      <p>{n.message /* Ensure n.message is a string or valid React child */}</p>
                      <small>
                        {new Date(n.created_at).toLocaleString() /* Ensure this is valid */}
                      </small>
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
          <ArrowLeft size={20} />
        </button>
      </div>

      <nav className="sidebar-nav scrollable-nav-container">
        <ul>
          <li>
            <button
              className="nav-item"
              onClick={() => handleNavigate("Home", "/home")}
            >
              <HomeIcon size={20} />
              <span>Home</span>
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${
                openSubmenus.directory ? "submenu-open" : ""
              }`}
              onClick={() => toggleSubmenu("directory")}
            >
              <Folder size={20} />
              <span>Directory</span>
            </button>
            <ul className={`submenu ${openSubmenus.directory ? "show" : ""}`}>
              <li
                className="submenu-item"
                onClick={() => handleNavigate("DPI Directory", "/dpi-directory")}
              >
                • DPI Directory
              </li>
              <li
                className="submenu-item"
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
          {locker_on && (
            <li>
              <button
                className={`nav-item ${
                  activeMenu === "Locker Admin" ? "active" : ""
                }`}
                onClick={handleLockerAdminNavigate}
              >
                <Lock size={20} />
                <span>Locker Admin</span>
              </button>
            </li>
          )}
          <li>
            <button
              className={`nav-item ${
                openSubmenus.settings ? "submenu-open nested-submenu" : ""
              }`}
              onClick={() => toggleSubmenu("settings")}
            >
              <Settings size={20} />
              <span>Settings</span>
            </button>
            <ul className={`submenu ${openSubmenus.settings ? "show" : ""}`}>
              <li
                className="submenu-item"
                onClick={() =>
                  handleNavigate("User Settings", "/settings-page")
                }
              >
                • User Settings
              </li>

              {/* Conditional Rendering for Admin-specific Settings */}
              {curruser && (curruser.user_type === "sys_admin" || curruser.user_type === "system_admin") ? (
                <>
                  <li
                    className={`submenu-item ${
                      openSubmenus.lockerSettings ? "submenu-open" : ""
                    }`}
                    onClick={() => toggleSubmenu("lockerSettings")}
                  >
                    • Locker Settings
                  </li>
                  {openSubmenus.lockerSettings && (
                    <>
                      <li
                        className="submenu-item nested"
                        onClick={() =>
                          handleNavigate("Freeze Locker", "/freeze-locker")
                        }
                      >
                          • Freeze Locker
                      </li>
                      <li
                        className="submenu-item nested"
                        onClick={() =>
                          handleNavigate("Locker", "/all-lockers")
                        }
                      >
                          • Locker
                      </li>
                    </>
                  )}

                  <li
                    className={`submenu-item ${
                      openSubmenus.lockerSettings1 ? "submenu-open" : ""
                    }`}
                    onClick={() => toggleSubmenu("lockerSettings1")}
                  >
                    • Connection Settings
                  </li>
                  {openSubmenus.lockerSettings1 && (
                    <ul
                      className={`submenu ${
                        openSubmenus.lockerSettings1 ? "show" : ""
                      } nested-submenu`}
                    >
                      <li
                        className="submenu-item nested"
                        onClick={() =>
                          handleNavigate(
                            "Freeze Connection",
                            "/freeze-connection"
                          )
                        }
                      >
                          • Freeze Connection
                      </li>
                      <li
                        className="submenu-item nested"
                        onClick={() =>
                          handleNavigate(
                            "Connection Types",
                            "/all-connection-types"
                          )
                        }
                      >
                          • Connection Types
                      </li>
                    </ul>
                  )}

                  <li
                    className={`submenu-item ${
                      openSubmenus.adminSettings ? "submenu-open" : ""
                    }`}
                    onClick={() => toggleSubmenu("adminSettings")}
                  >
                    • System Admin Settings
                  </li>
                  {openSubmenus.adminSettings && (
                    <>
                      <li
                        className="submenu-item nested"
                        onClick={() =>
                          handleNavigate("Manage Users", "/manage-admins")
                        }
                      >
                          • Manage Admin
                      </li>
                      <li
                        className="submenu-item nested"
                        onClick={() =>
                          handleNavigate(
                            "System Configuration",
                            "/manage-moderators"
                          )
                        }
                      >
                          • Manage Moderator
                      </li>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Non-admin user's view of Settings */}
                  { curruser && // Add guard for curruser here as well
                    <>
                      <li
                        className="submenu-item"
                        onClick={() =>
                          handleNavigate("Locker Settings", "/all-lockers")
                        }
                      >
                        • Locker Settings
                      </li>
                      <li
                        className="submenu-item"
                        onClick={() =>
                          handleNavigate(
                            "Connection Settings",
                            "/all-connection-types"
                          )
                        }
                      >
                        • Connection Settings
                      </li>
                    </>
                  }
                </>
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
          {/* Make sure curruser and curruser.username are valid before calling capitalizeFirstLetter */}
          <span>
            {curruser && typeof curruser.username === 'string'
              ? capitalizeFirstLetter(curruser.username)
              : "User"}
          </span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;