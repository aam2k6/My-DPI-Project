// import React, { useContext, useEffect, useState } from "react";
// import Cookies from 'js-cookie';
// import "./page1.css";
// import { useNavigate } from "react-router-dom";
// //import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 
// import { usercontext } from "../../usercontext";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";

// // Helper function to capitalize the first letter of a string
// const capitalizeFirstLetter = (string) => {
//   if (!string) return '';
//   return string.charAt(0).toUpperCase() + string.slice(1);
// };

// export const Home = () => {
//   const navigate = useNavigate();
//   const [lockers, setLockers] = useState([]);
//   const [notifications, setNotifications] = useState([]);  // New state for notifications
//   const [error, setError] = useState(null);
//   const [isOpen, setIsOpen] = useState(false);
//   const { curruser } = useContext(usercontext);
//   const [outgoingConnections, setOutgoingConnections] = useState([]);  // Add this state



//   useEffect(() => {
//     if (!curruser) {
//         navigate('/');
//         return;
//     }},[]);


//   useEffect(() => {
//     const fetchLockers = async () => {
//       try {
//         const token = Cookies.get('authToken');
//         console.log('Fetching lockers with token:', token);

//         const response = await fetch('host/get-lockers-user/'.replace(/host/, frontend_host), {
//           method: 'GET',
//           headers: {
//             'Authorization': `Basic ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         console.log('Response status:', response.status);

//         if (!response.ok) {
//           const errorData = await response.json();
//           setError(errorData.error || 'Failed to fetch lockers');
//           console.error('Error fetching lockers:', errorData);
//           return;
//         }

//         const data = await response.json();
//         console.log('Response data:', data);

//         if (data.success) {
//           setLockers(data.lockers || []);
//         } else {
//           setError(data.message || data.error);
//         }
//       } catch (error) {
//         setError("An error occurred while fetching this user's lockers.");
//         console.error("Error:", error);
//       }
//     };

//     if (curruser) {
//       fetchLockers();
//       fetchNotifications();  // Fetch notifications when fetching lockers
//     }
//   }, [curruser]);

//     // Fetch notifications for the user
//     const fetchNotifications = async () => {
//       try {
//         const token = Cookies.get('authToken');
//         const response = await fetch('host/get-notifications/'.replace(/host/, frontend_host), {
//           method: 'GET',
//           headers: {
//             'Authorization': `Basic ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });
  
//         if (!response.ok) {
//           const errorData = await response.json();
//           setError(errorData.error || 'Failed to fetch notifications');
//           return;
//         }
  
//         const data = await response.json();
//         if (data.success) {
//           setNotifications(data.notifications || []);
//         } else {
//           setError(data.message || data.error);
//         }
//       } catch (error) {
//         setError("An error occurred while fetching notifications.");
//       }
//     };  

//   const handleNewLockerClick = () => {
//     navigate('/create-locker');
//   };

//   const handleClick = (locker) => {
//     navigate('/view-locker', { state: { locker } });
//   };

//   const handleConsentDashboardClick = async () => {
//     try {
//       const token = Cookies.get('authToken');
//       const response = await fetch('host/get-outgoing-connections/'.replace(/host/, frontend_host), {
//         method: 'GET',
//         headers: {
//           'Authorization': `Basic ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         setError(errorData.error || 'Failed to fetch outgoing connections');
//         return;
//       }

//       const data = await response.json();
//       if (data.success) {
//         setOutgoingConnections(data.outgoing_connections || []);
//       } else {
//         setError(data.message || data.error);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching outgoing connections.");
//     }
//   };
//   const content = (
//     <>
//       <div className="navbarBrand">
//         {curruser ? capitalizeFirstLetter(curruser.username) : "None"}
//       </div>
//       <div className="description">
//         {curruser ? curruser.description : "None"}
//       </div>
//     </>
//   );

//   return (
//     <div>

//   <Navbar content = {content}/>

//       <div className="heroContainer">
//         <div className="newLocker">
//           <h3>My Lockers</h3>
//           <button id="newLockerBtn" onClick={handleNewLockerClick}>
//             Create New Locker
//           </button>
//           <button id="consentDashboardBtn" onClick={handleConsentDashboardClick}>
//         Consent Dashboard
//       </button>
//         </div>

//         <div className="allLockers">
//           {lockers.length > 0 ? (
//             lockers.map(locker => (
//               <div key={locker.locker_id} className="page1-locker">
//                 <h4>{locker.name}</h4>
                
//                 {locker.is_frozen === false && <button id="openLockerBtn" onClick={() => handleClick(locker)}>Open</button>}
//                 {locker.is_frozen === true && <button id="openLockerBtn">Frozen</button>}
    
//                 <p className="description2">{locker.description}</p>
               
//               </div>
//             ))
//           ) : (
//             <p>No lockers found.</p>
//           )}
//         </div>

//         {/* <div className="allLockers">
//         <h3>My Notifications</h3>
//           {notifications.length > 0 ? (
//             notifications.map(notification => (
//               <div key={notification.id} className="notification-box">
//                 <p>
//                   Notification from <b>{notification.guest_user}</b> 
//                   to <b>{notification.host_user}</b> 
//                   for connection <b>{notification.connection_name}</b>
//                 </p>
//                 <p>{new Date(notification.created_at).toLocaleString()}</p>
//               </div>
//             ))
//           ) : (
//             <p>No notifications found.</p>
//           )}
//         </div>         */}
//       </div>
//     </div>
//   );
// };
import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import "./page1.css";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";

// Helper function to capitalizeFirstLetter
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const Home = () => {
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [notifications, setNotifications] = useState([]); 
  const [outgoingConnections, setOutgoingConnections] = useState([]); 
  const [error, setError] = useState(null);
  const { curruser } = useContext(usercontext);
  const [showOutgoingConnections, setShowOutgoingConnections] = useState(false); // Toggle state

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, [curruser, navigate]);

  useEffect(() => {
    const fetchLockers = async () => {
      try {
        const token = Cookies.get('authToken');
        const response = await fetch('host/get-lockers-user/'.replace(/host/, frontend_host), {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch lockers');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setLockers(data.lockers || []);
        } else {
          setError(data.message || data.error);
        }
      } catch (error) {
        setError("An error occurred while fetching lockers.");
      }
    };

    if (curruser) {
      fetchLockers();
      fetchNotifications();
    }
  }, [curruser]);

  const fetchNotifications = async () => {
    try {
      const token = Cookies.get('authToken');
      const response = await fetch('host/get-notifications/'.replace(/host/, frontend_host), {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch notifications');
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

  const handleNewLockerClick = () => {
    navigate('/create-locker');
  };

  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
  };

  const handleConsentDashboardClick = async () => {
    setShowOutgoingConnections(!showOutgoingConnections); // Toggle the state

    if (!showOutgoingConnections) {
      // Fetch outgoing connections if showing them
      try {
        const token = Cookies.get('authToken');
        const guestUsername = curruser ? curruser.username : null; // Get the current user's username

        if (!guestUsername) {
          setError('Guest username is required to fetch outgoing connections.');
          return;
        }

        // Fetch outgoing connections
        const response = await fetch(`host/get-outgoing-connections-user/?guest_username=${guestUsername}`.replace(/host/, frontend_host), {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch outgoing connections');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setOutgoingConnections(data.outgoing_connections || []);
        } else {
          setError(data.message || data.error);
        }
      } catch (error) {
        setError('An error occurred while fetching outgoing connections.');
      }
    }
    
};
const navigateToViewTerms = (connection) => {
  const locker = connection.guest_locker;
  console.log("Connection ID:", connection.connection_id);
  console.log("Connection Name:", connection.connection_name);
  console.log("Connection Description:", connection.connection_description);
  console.log("Host Locker Name:", connection.host_locker);
  console.log("Guest Locker Name:", connection.guest_locker);
  console.log("Host User Username:", connection.host_user);
  console.log("Guest User Username:", curruser.username);
  console.log("Locker Details:",locker);

  navigate("/view-terms-by-type", {
    state: {
      connection_id: connection.connection_id,
      connectionName: connection.connection_name,
      connectionDescription: connection.connection_description,
      hostLockerName: connection.host_locker,  
      guestLockerName: connection.guest_locker, 
      hostUserUsername: connection.host_user, 
      guestUserUsername: curruser.username, 
      locker: locker, 
    },
  });
};


  const content = (
    <>
      <div className="navbarBrand">
        {curruser ? capitalizeFirstLetter(curruser.username) : "None"}
      </div>
      <div className="description">
        {curruser ? curruser.description : "None"}
      </div>
    </>
  );
  return (
    <div>
      <Navbar content={content} />
      <div className="heroContainer">
        <div className="newLocker">
          <h3>{showOutgoingConnections ? "Consent Dashboard" : "My Lockers"}</h3>

          {!showOutgoingConnections && (
            <button id="newLockerBtn" onClick={handleNewLockerClick}>
              Create New Locker
            </button>
          )}

          <button id="consentDashboardBtn" onClick={handleConsentDashboardClick}>
            {showOutgoingConnections ? "Lockers" : "Consent Dashboard"} {/* Change button text based on state */}
          </button>
        </div>
        {showOutgoingConnections ? (
  <div className="allOutgoingConnections">
    {outgoingConnections.length > 0 ? (
      <div className="tableContainer"> {/* Added a container for scrolling */}
        <table className="outgoingConnectionsTable">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Connection Type</th>
              <th>Host User</th>
              <th>Host Locker</th>
              <th>Guest Locker</th>
              <th>Created On</th>
              <th>Validity On</th>
            </tr>
          </thead>
          <tbody>
            {outgoingConnections.map((connection, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
  {/* Connection name clickable */}
  <button
    className="connection-name-button"
    onClick={() => navigateToViewTerms(connection)}
    style={{
      textDecoration: "underline",
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      color: "inherit",
      
      textAlign: "left", // Align text to the left
    }}
  >
  {connection.connection_name}
  </button>
    {connection.connection_description}
  
</td>

                <td>{connection.host_user}</td>
                <td>{connection.host_locker}</td>
                <td>{connection.guest_locker}</td>
                <td>{new Date(connection.created_on).toLocaleString()}</td>
                <td>{new Date(connection.validity_time).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <p>No outgoing connections found.</p>
    )}
  </div>

        ) : (
          <div className="allLockers">
            {lockers.length > 0 ? (
              lockers.map(locker => (
                <div key={locker.locker_id} className="page1-locker">
                  <h4>{locker.name}</h4>
                  {locker.is_frozen === false ? (
                    <button id="openLockerBtn" onClick={() => handleClick(locker)}>
                      Open
                    </button>
                  ) : (
                    <button id="openLockerBtn">Frozen</button>
                  )}
                  <p className="description2">{locker.description}</p>
                </div>
              ))
            ) : (
              <p>No lockers found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );}