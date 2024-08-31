// import React, { useContext, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import "./page7.css";
// import Navbar from "../Navbar/Navbar";

// export const TargetLockerView = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser, setUser } = useContext(usercontext);
//   const [parentUser, setParentUser] = useState(
//     location.state ? location.state.user : null
//   );
//   const [resources, setResources] = useState([]);
//   const [otherConnections, setOtherConnections] = useState([]);
//   const [locker, setLocker] = useState(
//     location.state ? location.state.locker : null
//   );
//   const [error, setError] = useState(null);
//   const [outgoingConnections, setOutgoingConnections] = useState([]); // State for outgoing connections

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }
//     if (parentUser && locker) {
//       fetchResources();
//       fetchOtherConnections();
//       fetchConnections(); // Fetch connections when component mounts
//     }
//   }, [curruser, navigate, parentUser, locker]);

//   const fetchResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         locker_name: locker.name,
//         username: parentUser.username,
//       });
//       const response = await fetch(
//         `http://localhost:8000/get-public-resources?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         setResources(data.resources);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching resources");
//     }
//   };

//   const fetchOtherConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         guest_username: parentUser.username,
//         guest_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `http://localhost:8000/get-other-connection-types/?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       console.log("other types", data);
//       if (data.success) {
//         setOtherConnections(data.connection_types);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching other connections");
//     }
//   };
//  const fetchConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         host_username: parentUser.username,
//         host_locker_name: locker.name,
//       });
//       const response = await fetch(`http://localhost:8000/get-outgoing-connections/?${params}`, {
//         method: "GET",
//         headers: {
//           Authorization: `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         throw new Error("Failed to fetch connections");
//       }

//       const data = await response.json();
//       if (data.success) {
//         console.log("Fetched connections:", data.connections); // Debugging output
//         setOutgoingConnections(data.connections);
//       } else {
//         setError(data.message || "Failed to fetch connections");
//       }
//     } catch (error) {
//       console.error("Error fetching connections:", error);
//       setError("An error occurred while fetching connections");
//     }
//   };


//   const handleClick = () => {
//     navigate("/make-connection", {
//       state: { hostuser: parentUser, hostlocker: locker },
//     });
//   };

//   const handleResourceClick = (filePath) => {
//     const url = `http://localhost:8000/media/${filePath}`;
//     window.open(url, "_blank");
//   };

//   const content = (
//     <>
//       <div className="navbarBrand">{locker?.name}</div>
//       <div className="description7">
//         Owner:<u>{parentUser?.username}</u>
//       </div>
//     </>
//   );

//   const handleConnectionClick = (connection) => {
//     console.log("Navigating to make-connection with:", connection);
//     navigate("/make-connection", {
//       state: {
//         hostuser: parentUser,
//         hostlocker: locker,
//         selectedConnectionType: connection,
//       },
//     });
//   };

//   return (
//     <div>
//       <Navbar content={content} />
//       <div className="page7description">
//         <div className="descriptionpage7">{locker?.description}</div>
//         <button onClick={handleClick} className="new-connection-btn">
//           Create New Connection
//         </button>
//       </div>
//       <div className="page7container">
//         <div className="notvisible">
//           <div className="page7publicresources">
//             <p>Public resources: Resources for all</p>
//             {resources.length > 0 ? (
//               resources.map((resource) => (
//                 <div className="page7resource" key={resource.id}>
//                   <div
//                     id="documentspage7"
//                     onClick={() => handleResourceClick(resource.i_node_pointer)}
//                   >
//                     {resource.document_name}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="page7nores">No resources found.</p>
//             )}
//           </div>

//           <div className="page7publicresources">
//             <p>Available Connection Types</p>
//             {otherConnections.length > 0 ? (
//               otherConnections.map((connection) => (
//                 <div
//                   className="page7connection"
//                   key={connection.connection_type_id}
//                 >
//                   <div id="connectionpage7">
//                     {/* <strong>{connection.connection_type_name}</strong> */}
//                     {/* <strong onClick={() => handleConnectionClick(connection)}>{connection.connection_type_name}</strong> */}
//                     {/* <span
//                       className="clickable-tag"
//                       onClick={() => handleConnectionClick(connection)}
//                     >
//                       {connection.connection_type_name}
//                     </span> */}

//                     <div
//                       // key={connection.connection_type_id}
//                       // className="viewlockerconnections"
//                       onClick={() => handleConnectionClick(connection)}
//                     >
//                       <h4 className="clickable-tag">
//                         <u>
//                           {connection.connection_type_name}
//                         </u>
//                       </h4>
//                     </div>
//                     <div id="availconntype">
//                       {connection.connection_description}
//                     </div>
//                     <div id="availconntype">
//                       Created On:{" "}
//                       {new Date(connection.created_time).toLocaleDateString()}
//                     </div>
//                     <div id="availconntype">
//                       Valid Until:{" "}
//                       {new Date(connection.validity_time).toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="noconnfound">No available connection type found.</p>
//             )}
//           </div>
//         </div>
//         <div className="page7containerB">
//           <p>
//           My connections:{locker?.name}::{parentUser?.username}
//           </p>
//           {outgoingConnections.length > 0 ? (
//             outgoingConnections.map((connection, index) => (
//               <div className="page7myconnections" key={index}>
//                 {/* <div id="conntent"><h2>{connection.connection_type_name}</2></div> */}
//                 <div id="conntent">
//                   <h2>{connection.connection_name}</h2>
//                 </div>

//                 <div id="conntent">
//                   {connection.host_locker.name} &lt;&gt;{" "}
//                   {connection.guest_locker.name}
//                 </div>
//                 <div id="conntent">
//                   Created On:{" "}
//                   {new Date(connection.created_time).toLocaleDateString()}
//                 </div>
//                 <div id="conntent">
//                   Valid Until:{" "}
//                   {new Date(connection.validity_time).toLocaleDateString()}
//                 </div>
//               </div>
//             ))
//           ) : (
//             <p id="noconnfound">No outgoing connections found.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };
// import React, { useContext, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import "./page7.css";
// import Navbar from "../Navbar/Navbar";

// export const TargetLockerView = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser, setUser } = useContext(usercontext);
//   const [parentUser, setParentUser] = useState(
//     location.state ? location.state.user : null
//   );
//   const [resources, setResources] = useState([]);
//   const [otherConnections, setOtherConnections] = useState([]);
//   const [locker, setLocker] = useState(
//     location.state ? location.state.locker : null
//   );
//   const [error, setError] = useState(null);
//   const [outgoingConnections, setOutgoingConnections] = useState([]); // State for outgoing connections
//   const [trackerData, setTrackerData] = useState({}); // State for tracker data

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }
//     if (parentUser && locker) {
//       fetchResources();
//       fetchOtherConnections();
//       fetchConnections(); // Fetch connections when component mounts
//     }
//   }, [curruser, navigate, parentUser, locker]);

//   const fetchResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         locker_name: locker.name,
//         username: parentUser.username,
//       });
//       const response = await fetch(
//         `http://localhost:8000/get-public-resources?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         setResources(data.resources);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching resources");
//     }
//   };

//   const fetchOtherConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         guest_username: parentUser.username,
//         guest_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `http://localhost:8000/get-other-connection-types/?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       console.log("other types", data);
//       if (data.success) {
//         setOtherConnections(data.connection_types);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching other connections");
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         host_username: parentUser.username,
//         host_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `http://localhost:8000/get-outgoing-connections/?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to fetch connections");
//       }

//       const data = await response.json();
//       if (data.success) {
//         console.log("Fetched connections:", data.connections); // Debugging output
//         setOutgoingConnections(data.connections);
//         data.connections.forEach((connection) => fetchTrackerData(connection)); // Fetch tracker data for each connection
//       } else {
//         setError(data.message || "Failed to fetch connections");
//       }
//     } catch (error) {
//       console.error("Error fetching connections:", error);
//       setError("An error occurred while fetching connections");
//     }
//   };

//   const fetchTrackerData = async (connection) => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         connection_name: connection.connection_name,
//         host_locker_name: connection.host_locker.name,
//         guest_locker_name: connection.guest_locker.name,
//         host_user_username: connection.host_user.username,
//         guest_user_username: connection.guest_user.username,
//       });
//       const response = await fetch(
//         `http://localhost:8000/get-terms-status/?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch tracker data");
//       }
//       const data = await response.json();
//       if (data.success) {
//         setTrackerData((prevState) => ({
//           ...prevState,
//           [connection.connection_id]: {
//             count_T: data.count_T,
//             count_F: data.count_F,
//             count_R: data.count_R,
//             filled: data.filled,
//             empty: data.empty,
//           },
//         }));
//       }
//     } catch (error) {
//       console.error("Error fetching tracker data:", error);
//     }
//   };

//   const handleClick = () => {
//     navigate("/make-connection", {
//       state: { hostuser: parentUser, hostlocker: locker },
//     });
//   };

//   const handleResourceClick = (filePath) => {
//     const url = `http://localhost:8000/media/${filePath}`;
//     window.open(url, "_blank");
//   };

//   const handleTracker = (connection) => {
//     navigate("/view-terms-by-type", {
//       state: {
//         connection_name: connection.connection_name,
//         host_locker_name: connection.host_locker.name,
//         guest_locker_name: connection.guest_locker.name,
//         host_user_username: connection.host_user.username,
//         guest_user_username: connection.guest_user.username,
//       },
//     });
//   };

//   const getStatusColor = (tracker) => {
//     const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
//     if (tracker.count_T === totalObligations && tracker.count_R === 0 ) {
//       return "green";
//     } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
//       return "red";
//     } else {
//       return "orange";
//     }
//   };

//   const calculateRatio = (tracker) => {
//     const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
//     return totalObligations > 0
//       ? `${tracker.filled}/${totalObligations}`
//       : "0/0";
//   };


//   const content = (
//     <>
//       <div className="navbarBrand">{locker?.name}</div>
//       <div className="description7">
//         Owner:<u>{parentUser?.username}</u>
//       </div>
//     </>
//   );

//   const handleConnectionClick = (connection) => {
//     console.log("Navigating to make-connection with:", connection);
//     navigate("/make-connection", {
//       state: {
//         hostuser: parentUser,
//         hostlocker: locker,
//         selectedConnectionType: connection,
//       },
//     });
//   };

//   return (
//     <div>
//       <Navbar content={content} />
//       <div className="page7description">
//         <div className="descriptionpage7">{locker?.description}</div>
//         <button onClick={handleClick} className="new-connection-btn">
//           Create New Connection
//         </button>
//       </div>
//       <div className="page7container">
//         <div className="notvisible">
//           <div className="page7publicresources">
//             <p>Public resources: Resources for all</p>
//             {resources.length > 0 ? (
//               resources.map((resource) => (
//                 <div className="page7resource" key={resource.id}>
//                   <div
//                     id="documentspage7"
//                     onClick={() => handleResourceClick(resource.i_node_pointer)}
//                   >
//                     {resource.document_name}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="page7nores">No resources found.</p>
//             )}
//           </div>

//           <div className="page7publicresources">
//             <p>Available Connection Types</p>
//             {otherConnections.length > 0 ? (
//               otherConnections.map((connection) => (
//                 <div
//                   className="page7connection"
//                   key={connection.connection_type_id}
//                 >
//                   <div id="connectionpage7">
//                     <div
//                       onClick={() => handleConnectionClick(connection)}
//                     >
//                       <h4 className="clickable-tag">
//                         <u>{connection.connection_type_name}</u>
//                       </h4>
//                     </div>
//                     <div id="availconntype">
//                       {connection.connection_description}
//                     </div>
//                     <div id="availconntype">
//                       Created On:{" "}
//                       {new Date(connection.created_time).toLocaleDateString()}
//                     </div>
//                     <div id="availconntype">
//                       Valid Until:{" "}
//                       {new Date(connection.validity_time).toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="noconnfound">No available connection type found.</p>
//             )}
//           </div>
//         </div>
//         <div className="page7containerB">
//           <p>
//             My connections: {locker?.name} :: {parentUser?.username}
//           </p>
//           {outgoingConnections.length > 0 ? (
//   outgoingConnections.map((connection, index) => {
//     const tracker = trackerData[connection.connection_id];
//     const color = tracker ? getStatusColor(tracker) : "gray";
//     const ratio = tracker ? calculateRatio(tracker) : "Loading...";

//     return (
//       <div className="page7myconnections" key={index}>
//         <div id="conntent">
//           <h2>{connection.connection_name}</h2>
//           <div>{connection.host_locker.name} &lt;&gt; {connection.guest_locker.name}</div>
//           <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
//           <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
//         </div>
//         <div className="tracker">
//           <button
//             onClick={() => handleTracker(connection)}
//             style={{ backgroundColor: color }}
//           >
//             {ratio}
//           </button>
//         </div>
//       </div>
//     );
//   })
// ) : (
//   <p id="noconnfound">No outgoing connections found.</p>
// )}

//         </div>
//       </div>
//     </div>
//   );
// };
import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./page7.css";
import Navbar from "../Navbar/Navbar";

export const TargetLockerView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);
  const [parentUser, setParentUser] = useState(
    location.state ? location.state.user : null
  );
  const [resources, setResources] = useState([]);
  const [otherConnections, setOtherConnections] = useState([]);
  const [locker, setLocker] = useState(
    location.state ? location.state.locker : null
  );
  const [error, setError] = useState(null);
  const [outgoingConnections, setOutgoingConnections] = useState([]);
  const [trackerData, setTrackerData] = useState({});

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
    if (parentUser && locker) {
      fetchResources();
      fetchOtherConnections();
      fetchConnections();
    }
  }, [curruser, navigate, parentUser, locker]);

  const fetchResources = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        locker_name: locker.name,
        username: parentUser.username,
      });
      const response = await fetch(
        `http://localhost:8000/get-public-resources?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setResources(data.resources);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching resources");
    }
  };

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        guest_username: parentUser.username,
        guest_locker_name: locker.name,
      });
      const response = await fetch(
        `http://172.16.192.201:8000/get-other-connection-types/?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setOtherConnections(data.connection_types);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching other connections");
    }
  };

  const fetchConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        host_username: parentUser.username,
        host_locker_name: locker.name,
      });
      const response = await fetch(
        `http://172.16.192.201:8000/get-outgoing-connections/?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }

      const data = await response.json();
      if (data.success) {
        setOutgoingConnections(data.connections);
        data.connections.forEach((connection) =>
          fetchTrackerData(connection)
        );
      } else {
        setError(data.message || "Failed to fetch connections");
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      setError("An error occurred while fetching connections");
    }
  };

  const fetchTrackerData = async (connection) => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        connection_name: connection.connection_name,
        host_locker_name: connection.host_locker.name,
        guest_locker_name: connection.guest_locker.name,
        host_user_username: connection.host_user.username,
        guest_user_username: connection.guest_user.username,
      });
      const response = await fetch(
        `http://172.16.192.201:8000/get-terms-status/?${params}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tracker data");
      }
      const data = await response.json();
      if (data.success) {
        setTrackerData((prevState) => ({
          ...prevState,
          [connection.connection_id]: {
            count_T: data.count_T,
            count_F: data.count_F,
            count_R: data.count_R,
            filled: data.filled,
            empty: data.empty,
          },
        }));
      } else {
        setError(data.message || "Failed to fetch tracker data");
      }
    } catch (error) {
      console.error("Error fetching tracker data:", error);
      setError("An error occurred while fetching tracker data");
    }
  };

  const handleClick = () => {
    navigate("/make-connection", {
      state: { hostuser: parentUser, hostlocker: locker },
    });
  };

  const handleResourceClick = (filePath) => {
    const url = `http://172.16.192.201:8000/media/${filePath}`;
    window.open(url, "_blank");
  };

  const handleTracker = (connection) => {
    navigate("/view-terms-by-type", {
      state: {
        connectionName: connection.connection_name,
        hostLockerName: connection.host_locker?.name,
        guestLockerName: connection.guest_locker?.name,
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        locker: locker,
      },
    });
  };

  const getStatusColor = (tracker) => {
    const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
    if (tracker.count_T === totalObligations && tracker.count_R === 0) {
      return "green";
    } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
      return "red";
    } else {
      return "orange";
    }
  };

  const calculateRatio = (tracker) => {
    const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
    return totalObligations > 0
      ? `${tracker.filled}/${totalObligations}`
      : "0/0";
  };

  const content = (
    <>
      <div className="navbarBrand">{locker?.name}</div>
      <div className="description7">
        Owner:<u>{parentUser?.username}</u>
      </div>
    </>
  );

  const handleConnectionClick = (connection) => {
    navigate("/make-connection", {
      state: {
        hostuser: parentUser,
        hostlocker: locker,
        selectedConnectionType: connection,
      },
    });
  };

  return (
    <div>
      <Navbar content={content} />
      <div className="page7description">
        <div className="descriptionpage7">{locker?.description}</div>
        <button onClick={handleClick} className="new-connection-btn">
          Create New Connection
        </button>
      </div>
      <div className="page7container">
        <div className="notvisible">
          <div className="page7publicresources">
            <p>Public resources: Resources for all</p>
            {resources.length > 0 ? (
              resources.map((resource) => (
                <div className="page7resource" key={resource.id}>
                  <div
                    id="documentspage7"
                    onClick={() => handleResourceClick(resource.i_node_pointer)}
                  >
                    {resource.document_name}
                  </div>
                </div>
              ))
            ) : (
              <p id="page7nores">No resources found.</p>
            )}
          </div>

          <div className="page7publicresources">
            <p>Available Connection Types</p>
            {otherConnections.length > 0 ? (
              otherConnections.map((connection) => (
                <div className="page7connection" key={connection.connection_type_id}>
                  <div id="connectionpage7">
                    <div onClick={() => handleConnectionClick(connection)}>
                      <h4 className="clickable-tag">
                        <u>{connection.connection_type_name}</u> 
                      </h4>
                    </div>
                    <div id="availconntype">
                      Created On: {new Date(connection.created_time).toLocaleDateString()}
                    </div>
                    <div id="availconntype">
                      Valid Until: {new Date(connection.validity_time).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p id="noconnfound">No available connection type found.</p>
            )}
          </div>
        </div>
        <div className="page7containerB">
          <p>
            My connections: {locker?.name} :: {parentUser?.username}
          </p>
          {outgoingConnections.length > 0 ? (
            outgoingConnections.map((connection, index) => {
              const tracker = trackerData[connection.connection_id];
              const color = tracker ? getStatusColor(tracker) : "gray";
              const ratio = tracker ? calculateRatio(tracker) : "Loading...";

              return (
                <div className="page7myconnections" key={index}>
                  <div id="conntent">
                    <h2>{connection.connection_name}</h2>
                    <div>{connection.host_locker.name} &lt;&gt; {connection.guest_locker.name}</div>
                    <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
                    <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
                  </div>
                  <div className="tracker">
                    <button
                      onClick={() => handleTracker(connection)}
                      style={{ backgroundColor: color }}
                    >
                      {ratio}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p id="noconnfound">No outgoing connections found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
