import React, { useState, useContext, useEffect } from "react";
import "./Navbar.css";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import { usercontext } from "../../usercontext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { frontend_host } from "../../config";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import { QrReader } from 'react-qr-reader'; // Corrected import statement



export default function Navbar({ content, lockerAdmin, lockerObj }) {
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false); // State for directory dropdown
  const { curruser, setUser } = useContext(usercontext);
  const [scanning, setScanning] = useState(false); // State to manage QR scanner visibility
  const [isQRModalOpen, setIsQRModalOpen] = useState(false); // State for QR modal
  const [qrData, setQrData] = useState(null); // State for QR data
  
 


  const handleDPIDirectory = () => {
    navigate("/dpi-directory");
  };

  const handleGlobalConnectionDirectory = () => {
    navigate("/create-global-connection-type");
  };

  const handleHomeClick = () => {
    navigate("/home");
  };

  const handleLogout = () => {
    Cookies.remove("authToken");
    localStorage.removeItem("curruser");
    setUser(null);
    navigate("/");
  };

  const toggleDirectoryDropdown = () => {
    setIsDirectoryOpen(!isDirectoryOpen); // Toggle directory dropdown
  };

  useEffect(() => {
    fetchNotifications();

    const handleStorageChange = (e) => {
      if (e.key === 'notifications') {
        const updatedNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
        setNotifications(updatedNotifications);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
        localStorage.setItem("notifications", JSON.stringify(data.notifications || []));
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching notifications.");
    }
  };

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

  const toggleNotifications = async () => {
    setIsNotificationsOpen(!isNotificationsOpen);

    if (!isNotificationsOpen) {
      await markAllNotificationsAsRead();
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        "host/mark-all-notifications-read/".replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedNotifications = notifications.map((notif) => ({ ...notif, read: true }));
        setNotifications(updatedNotifications);
        localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to mark notifications as read");
      }
    } catch (error) {
      setError("An error occurred while marking notifications as read.");
    }
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
        const updatedNotifications = notifications.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        );
        setNotifications(updatedNotifications);
        localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to mark notification as read");
      }
    } catch (error) {
      setError("An error occurred while marking notification as read.");
    }
  };

 
  const handleQRScanner = (event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    setIsQRModalOpen(true); // Open the QR modal
  };

  const handleQRModalClose = () => {
    setIsQRModalOpen(false); // Close the QR modal
    setQrData(null); // Clear QR data when closing
    setScanning(false);
    const videoElement = document.querySelector("video");
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop(); // Stop each track (both video and audio)
      });

      videoElement.srcObject = null; // Clear the video element source
    }

    // Refresh the page when closing the scanner
    window.location.reload();
  };
  

  const handleScan = (data) => {
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        console.log("Scanned QR Data:", parsedData);
  
        // Check for essential fields and handle optional ones
        if (
          parsedData.connection_name &&
          parsedData.connection_type_name &&
          parsedData.host_username &&
          parsedData.host_locker_name
        ) {
          // Navigate to CreateConnectionType page with the state data
          navigate("/create-connection-type", {
            state: {
              hostuser: { username: parsedData.host_username },
              hostlocker: { name: parsedData.host_locker_name },
              selectedConnectionType: {
                connection_type_name: parsedData.connection_type_name,
                connection_description: parsedData.connection_description || '',
              },
            },
          });
  
          // Stop scanning and reload the page
          setScanning(false);
          window.location.reload(); // This will reload the page after navigating
        } else {
          console.error("Parsed data is missing essential fields");
        }
      } catch (error) {
        console.error("Invalid QR Code:", error);
      }
    }
  };
  

  const handleError = (err) => {
    console.error(err); // Log any error during scanning
  };
  

  return (
    <nav className="navbar">
      <div className="wrap">{content}</div>

      <div className="navbarLinks">
        {lockerAdmin && (
          <ul>
            <li className="navLinks">
              <a href="#" onClick={handleConnection}>
                Locker Admin
              </a>
            </li>
          </ul>
        )}

        
{/* Directory dropdown */}
<ul className="navLinks">
  <li className="navLinks">
    <a href="#" onClick={(e) => { e.preventDefault(); toggleDirectoryDropdown(); }} className="dropdownTrigger">
      Directory
    </a>
    {isDirectoryOpen && (
      <div className="dropdownContent">
        <button onClick={handleDPIDirectory}>DPI Directory</button>
        <button onClick={handleGlobalConnectionDirectory}>Global Connection Directory</button>
      </div>
    )}
  </li>
</ul>



        <ul>
          <li className="navLinks">
            <a href="#" onClick={handleHomeClick}>
              Home
            </a>
          </li>
        </ul>

        {/* Notification Bell */}
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
                  className={`notification-box ${notification.read ? "read" : "unread"}`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <p>
                    <b>{notification.guest_user} </b> has requested for
                    Locker <b>{notification.host_locker_name} </b> from the
                    connection <b>{notification.connection_type_name}</b>
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

         {/* QR Scanner Button */}
      <ul className="navbarFirstLink">
        <li>
          <div className="qr-scanner-icon" onClick={handleQRScanner}>
            <MdOutlineQrCodeScanner size={24} />
          </div>
        </li>
      </ul>

      {/* QR Code Scanner Modal */}
      {isQRModalOpen && (
  <div className="qr-scanner-overlay">
    <div className="qr-scanner-box">
      <QrReader
        onResult={(result, error) => {
          if (result) {
            handleScan(result?.text);  // Directly call handleScan with the scanned text
          }
          if (error) {
            handleError(error);  // Call handleError for any errors
          }
        }}
        constraints={{ facingMode: "environment" }}  // Use the back camera
        style={{ width: "100%", height: "100%" }}
      />
      <button className="qr-scanner-close" onClick={handleQRModalClose}>Close</button>
    </div>
  </div>

        )}
        <ul className="navbarThirdLink">
          <li>
            <div className="profileContainer">
              <img
                src={userImage}
                alt="User Icon"
                onClick={toggleDropdown}
                className="dropdownImage"
                style={{ display: "block", margin: "0 auto" }}
              />
              <div className="username" onClick={toggleDropdown}>
                {capitalizeFirstLetter(curruser.username)}
              </div>
            </div>

            {isOpen && (
              <div className="dropdownContent">
                <div className="currusername">
                  {capitalizeFirstLetter(curruser.username)}
                </div>
                <div className="curruserdesc">{curruser.description}</div>

                {(curruser.user_type === "sys_admin" ||
                  curruser.user_type === "system_admin") && (
                  <button onClick={handleAdminSettings}>
                    System Admin Settings
                  </button>
                )}

                {curruser.user_type === "moderator" && (
                  <button onClick={handleModeratorSettings}>
                    Moderator Settings
                  </button>
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
