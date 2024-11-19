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
//         `localhost:8000/get-public-resources?${params}`,
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
//         `localhost:8000/get-other-connection-types/?${params}`,
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
//         `localhost:8000/get-outgoing-connections/?${params}`,
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
//         `localhost:8000/get-terms-status/?${params}`,
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
//     const url = `localhost:8000/media/${filePath}`;
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
//recentcode
// import React, { useContext, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import "./page7.css";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";
// import Modal from '../Modal/Modal.jsx';

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
//   const [modalMessage, setModalMessage] = useState({message: "", type: ""});
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }
//     if (parentUser && locker) {
//       fetchResources();
//       fetchOtherConnections();
//       fetchConnections();
//     }
//   }, [curruser, navigate, parentUser, locker]);

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setModalMessage({message: "", type: ""});
//   };

//   const fetchResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         locker_name: locker.name,
//         username: parentUser.username,
//       });
//       const response = await fetch(
//         `host/get-public-resources?${params}`.replace(/host/, frontend_host),
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
//         `host/get-other-connection-types/?${params}`.replace(/host/, frontend_host),
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
//         `host/get-outgoing-connections/?${params}`.replace(/host/, frontend_host),
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
//         `host/get-terms-status/?${params}`.replace(/host/, frontend_host),
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
//        else {
//         setError(data.message || "Failed to fetch tracker data");
//       }
//     } catch (error) {
//       console.error("Error fetching tracker data:", error);
//       setError("An error occurred while fetching tracker data");

//     }
//   };

//   const handleClick = () => {
//     if(otherConnections.length > 0){
//       navigate("/make-connection", {
//         state: { hostuser: parentUser, hostlocker: locker, selectedConnectionType: null, },
//       });
//     }
//     else{
//       setModalMessage({ message: "No available connection types found. Cannot create a new connection.", type: 'info' });
//       setIsModalOpen(true);
//     }
//   };

//   const handleResourceClick = (filePath) => {
//     const url = `host/media/${filePath}`.replace(/host/, frontend_host);
//     window.open(url, "_blank");
//   };

//   const handleTracker = (connection) => {

//     navigate("/view-terms-by-type", {
//       state: {
//         connectionName: connection.connection_name,
//         hostLockerName: connection.host_locker?.name,
//         guestLockerName: connection.guest_locker?.name,
//         hostUserUsername: connection.host_user?.username,
//         guestUserUsername: connection.guest_user?.username,
//         locker: locker,
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

//   const handleInfo = (connection) => {
//     const connectionTypeName = connection.connection_name.split('-').pop().trim();
//     navigate("/show-connection-terms", {
//       state: {
//         //connectionId: connection.connection_id,
//         connectionName: connection.connection_name,
//         hostLockerName: connection.host_locker?.name,
//         guestLockerName: connection.guest_locker?.name,
//         hostUserUsername: connection.host_user?.username,
//         guestUserUsername: connection.guest_user?.username,
//         locker: locker,
//         connectionTypeName,
//       },
//     });
//   };

//   const handleConnectionClick = (connection) => {
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
//       <>{isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}</>
//       <Navbar content={content} />
//       <div className="page7description">
//         <div className="descriptionpage7">{locker?.description}</div>
//         <button onClick={handleClick} className="new-connection-btn-1">
//           Create New Connection
//         </button>
//       </div>
//       <div className="page7container">
//         <div className="notvisible">
//           <div className="page7publicresources">
//             <p>Public resources: Resources for all</p>
//             {resources.length > 0 ? (
//               resources.map((resource) => (
//                 <div className="page7resource" key={resource.resource_id}>
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
//                 <div className="page7connection" key={connection.connection_type_id}>
//                   <div id="connectionpage7">
//                     <div
//                       onClick={() => handleConnectionClick(connection)}
//                     >
//                       <h4 className="clickable-tag">
//                         <u>{connection.connection_type_name}</u>

//                       </h4>
//                     </div>
//                     <div id="availconntype">
//                       Description: {connection.connection_description}
//                     </div>
//                     <div id="availconntype">
//                       Created On: {new Date(connection.created_time).toLocaleDateString()}
//                     </div>
//                     <div id="availconntype">
//                       Valid Until: {new Date(connection.validity_time).toLocaleDateString()}
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
//             {/* My connections: {locker?.name} :: {parentUser?.username} */}
//             My connections with {locker?.name} locker of {parentUser?.username}: 
//           </p>
//           {outgoingConnections.length > 0 ? (
//   outgoingConnections.map((connection, index) => {
//     const tracker = trackerData[connection.connection_id];
//     const color = tracker ? getStatusColor(tracker) : "gray";
//     const ratio = tracker ? calculateRatio(tracker) : "Loading...";

//     return (
//       <div className="page7myconnections" key={index}>
//         <div id="conntent">
//           <h2
//             onClick={() => handleTracker(connection)}
//             style={{ textDecoration: "underline", cursor: "pointer" }}
//           >
//             {connection.connection_name}
//           </h2>
//           <div>
//             {connection.host_user.username} &lt;&gt;{" "}
//             {connection.guest_user.username}
//           </div>
//           <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
//           <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
//         </div>
//         <div className="tracker">
//         <button className="info-button1" onClick={() => handleInfo(connection)}> i </button>

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
// import React, { useContext, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import "./page7.css";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";
// import Modal from '../Modal/Modal.jsx';
// import QRCode from "react-qr-code";

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
//   const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [qrData, setQrData] = useState("");  // State for QR code data

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }
//     if (parentUser && locker) {
//       fetchResources();
//       fetchOtherConnections();
//       fetchConnections();
//     }
//   }, [curruser, navigate, parentUser, locker]);

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setModalMessage({ message: "", type: "" });
//     setQrData("");  // Reset QR code data when modal is closed
//   };

//   const fetchResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         locker_name: locker.name,
//         username: parentUser.username,
//       });
//       const response = await fetch(
//         `host/get-public-resources?${params}`.replace(/host/, frontend_host),
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
//         `host/get-other-connection-types/?${params}`.replace(/host/, frontend_host),
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
//         `host/get-outgoing-connections/?${params}`.replace(/host/, frontend_host),
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
//         `host/get-terms-status/?${params}`.replace(/host/, frontend_host),
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
//        else {
//         setError(data.message || "Failed to fetch tracker data");
//       }
//     } catch (error) {
//       console.error("Error fetching tracker data:", error);
//       setError("An error occurred while fetching tracker data");

//     }
//   };

//   const handleClick = () => {
//     if(otherConnections.length > 0){
//       navigate("/make-connection", {
//         state: { hostuser: parentUser, hostlocker: locker, selectedConnectionType: null, },
//       });
//     }
//     else{
//       setModalMessage({ message: "No available connection types found. Cannot create a new connection.", type: 'info' });
//       setIsModalOpen(true);
//     }
//   };

//   const handleResourceClick = (filePath) => {
//     const url = `host/media/${filePath}`.replace(/host/, frontend_host);
//     window.open(url, "_blank");
//   };

//   const handleTracker = (connection) => {

//     navigate("/view-terms-by-type", {
//       state: {
//         connectionName: connection.connection_name,
//         hostLockerName: connection.host_locker?.name,
//         guestLockerName: connection.guest_locker?.name,
//         hostUserUsername: connection.host_user?.username,
//         guestUserUsername: connection.guest_user?.username,
//         locker: locker,
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

//   const handleInfo = (connection) => {
//         const connectionTypeName = connection.connection_name.split('-').pop().trim();
//         navigate("/show-connection-terms", {
//           state: {
//             //connectionId: connection.connection_id,
//             connectionName: connection.connection_name,
//             hostLockerName: connection.host_locker?.name,
//             guestLockerName: connection.guest_locker?.name,
//             hostUserUsername: connection.host_user?.username,
//             guestUserUsername: connection.guest_user?.username,
//             locker: locker,
//             connectionTypeName,
//           },
//         });
//       };

//   const handleConnectionClick = (connection) => {
//     navigate("/make-connection", {
//       state: {
//         hostuser: parentUser,
//         hostlocker: locker,
//         selectedConnectionType: connection,
//       },
//     });
//   };

//   // Function to handle showing the QR code
//   const handleShowQrCode = (connection) => {
//     const qrContent = JSON.stringify({
//       connection_type_name: connection.connection_type_name,
//       connection_description: connection.connection_description,
//       host_username: parentUser.username,
//       host_locker_name: locker.name,
//     });

//     setQrData(qrContent); // Set the QR code data with relevant information
//     setIsModalOpen(true); // Open the modal with QR code
//   };
//   const handleQrScan = (qrData) => {
//     try {
//       const parsedData = JSON.parse(qrData); // Parse the QR content

//       // Navigate to the terms page with the parsed data
//       navigate('/show-connection-terms', {
//         state: {
//           connectionTypeName: parsedData.connection_type_name,
//           connectionDescription: parsedData.connection_description,
//           locker: locker,
//           hostUserUsername: parsedData.host_username,
//           hostLockerName: parsedData.host_locker_name,
//           connectionName: `${parsedData.connection_type_name}-${curruser.username}:${parsedData.host_username}`,
//         }
//       });
//     } catch (error) {
//       console.error("Error parsing QR data:", error);
//     }
//   };



//   return (
//     <div>
//       {isModalOpen && (
//         <Modal message={modalMessage.message || <QRCode value={qrData} />} onClose={handleCloseModal} type={modalMessage.type || "info"} />
//       )}
//       <Navbar content={<>
//         <div className="navbarBrand">{locker?.name}</div>
//         <div className="description7">Owner:<u>{parentUser?.username}</u></div>
//       </>} />

//       <div className="page7description">
//         <div className="descriptionpage7">{locker?.description}</div>
//         <button onClick={handleClick} className="new-connection-btn-1">Create New Connection</button>
//       </div>

//       <div className="page7container">
//         <div className="notvisible">
//           <div className="page7publicresources">
//             <p>Public resources: Resources for all</p>
//             {resources.length > 0 ? (
//               resources.map((resource) => (
//                 <div className="page7resource" key={resource.resource_id}>
//                   <div id="documentspage7" onClick={() => handleResourceClick(resource.i_node_pointer)}>
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
//                 <div className="page7connection" key={connection.connection_type_id}>
//                   <div id="connectionpage7">
//                     <div onClick={() => handleConnectionClick(connection)}>
//                       <h4 className="clickable-tag"><u>{connection.connection_type_name}</u></h4>
//                     </div>
//                     <div id="availconntype">
//                       Description: {connection.connection_description}
//                     </div>
//                     <div id="availconntype">
//                       Created On: {new Date(connection.created_time).toLocaleDateString()}
//                     </div>
//                     <div id="availconntype">
//                       Valid Until: {new Date(connection.validity_time).toLocaleDateString()}
//                     </div>
//                     {/* "Scan QR" link to show QR code */}
//                     <div id="availconntype">
//                       <button onClick={() => handleShowQrCode(connection)}>Scan QR</button>

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
//           <p>My connections with {locker?.name} locker of {parentUser?.username}: </p>
//           {outgoingConnections.length > 0 ? (
//             outgoingConnections.map((connection, index) => {
//               const tracker = trackerData[connection.connection_id];
//               const color = tracker ? getStatusColor(tracker) : "gray";
//               const ratio = tracker ? calculateRatio(tracker) : "Loading...";

//               return (
//                 <div className="page7myconnections" key={index}>
//                   <div id="conntent">
//                     <h2 onClick={() => handleTracker(connection)} style={{ textDecoration: "underline", cursor: "pointer" }}>
//                       {connection.connection_name}
//                     </h2>
//                     <div>{connection.host_user.username} &lt;&gt; {connection.guest_user.username}</div>
//                     <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
//                     <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
//                   </div>
//                   <div className="tracker">
//                     <button className="info-button1" onClick={() => handleInfo(connection)}> i </button>
//                     <button onClick={() => handleTracker(connection)} style={{ backgroundColor: color }}>
//                       {ratio}
//                     </button>
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <p id="noconnfound">No outgoing connections found.</p>
//           )}
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
import { frontend_host } from "../../config";
import Modal from '../Modal/Modal.jsx';
import QRCode from "react-qr-code";
import { Grid, Box } from '@mui/material'

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

  const [outgoingConnections, setOutgoingConnections] = useState([]); // State for outgoing connections
  const [trackerData, setTrackerData] = useState({}); // State for tracker data
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrData, setQrData] = useState("");  // State for QR code data
  const [xnodes, setXnodes] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(null);

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
    if (parentUser && locker) {
      fetchResources();
      fetchOtherConnections();
      fetchConnections();
      fetchXnodes();
    }
  }, [curruser, navigate, parentUser, locker]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
    setQrData("");  // Reset QR code data when modal is closed
  };

  const fetchXnodes = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_id: locker.locker_id });

      const response = await fetch(
        `host/get-all-xnodes-for-locker/?${params}`.replace(
          /host/,
          frontend_host
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Xnodes");
      }

      const data = await response.json();
      console.log("xnode data", data);

      if (data.xnode_list) {
        setXnodes(data.xnode_list);

      } else {
        setError(data.message || "Failed to fetch Xnodes");
      }
    } catch (error) {
      console.error("Error fetching Xnodes:", error);
      setError("An error occurred while fetching Xnodes");
    }
  };


  const fetchResources = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        locker_name: locker.name,
        username: parentUser.username,
      });
      const response = await fetch(
        `host/get-public-resources?${params}`.replace(/host/, frontend_host),
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
        `host/get-other-connection-types/?${params}`.replace(/host/, frontend_host),
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
  console.log(locker)

  const fetchConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        host_username: parentUser.username,
        host_locker_name: locker.name,
      });
      const response = await fetch(
        `host/get-outgoing-connections/?${params}`.replace(/host/, frontend_host),
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

        data.connections.forEach((connection) => fetchTrackerData(connection)); // Fetch tracker data for each connection

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
        `host/get-terms-status/?${params}`.replace(/host/, frontend_host),
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

      }
      else {
        setError(data.message || "Failed to fetch tracker data");
      }
    } catch (error) {
      console.error("Error fetching tracker data:", error);
      setError("An error occurred while fetching tracker data");

    }
  };

  const handleClick = () => {
    if (otherConnections.length > 0) {
      navigate("/make-connection", {
        state: { hostuser: parentUser, hostlocker: locker, selectedConnectionType: null, },
      });
    }
    else {
      setModalMessage({ message: "No available connection types found. Cannot create a new connection.", type: 'info' });
      setIsModalOpen(true);
    }
  };

  const handleResourceClick = (filePath) => {
    const url = `host/media/${filePath}`.replace(/host/, frontend_host);
    window.open(url, "_blank");
  };

  const handleTracker = (connection) => {

    navigate("/view-terms-by-type", {
      state: {
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
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

  const handleInfo = (connection) => {
    console.log("conn in i", connection);
    const connectionTypeName = connection.connection_name.split('-').shift().trim();
    console.log(connectionTypeName)
    console.log("lock", connection.guest_locker?.name);
    navigate("/show-connection-terms", {
      state: {
        //connectionId: connection.connection_id,
        connectionName: connection.connection_name,
        hostLockerName: connection.host_locker?.name,
        guestLockerName: connection.guest_locker?.name,
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        locker: connection.guest_locker?.name,
        connectionTypeName,
        connectionDescription: connection.connection_description,
        lockerComplete: connection.guest_locker,
      },
    });
  };
  console.log()
  const handleConnectionClick = (connection) => {
    navigate("/make-connection", {
      state: {
        hostuser: parentUser,
        hostlocker: locker,
        selectedConnectionType: connection,
      },
    });
  };

  const handleShowQrCode = (connection) => {
    const connectionName = `${connection.connection_type_name}-${curruser.username}:${parentUser.username}`;
    console.log("show qr", connection);
    const qrContent = JSON.stringify({
      connection_name: connectionName,
      connection_type_name: connection.connection_type_name,
      connection_description: connection.connection_description,
      host_username: parentUser.username,
      host_locker_name: locker.name,
    });

    console.log("QR Content Generated:", qrContent); // Debugging

    setQrData(qrContent);
    setIsModalOpen(true);
  };



  const handleQrScan = (qrData) => {
    try {
      const parsedData = JSON.parse(qrData); // Parse the QR content

      // Navigate to the "Make Connection" page with the parsed data
      navigate("/make-connection", {
        state: {
          hostuser: { username: parsedData.host_username },
          hostlocker: { name: parsedData.host_locker_name },
          selectedConnectionType: {
            connection_type_name: parsedData.connection_type_name,
            connection_description: parsedData.connection_description,
          },
        },
      });
    } catch (error) {
      console.error("Error parsing QR data:", error);
    }
  };

  const handleXnodeClick = async (xnode_id) => {

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`host/access-resource/?xnode_id=${xnode_id}`.replace(
        /host/,
        frontend_host
      ), {
        method: 'GET',
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to access the resource');
      }

      const data = await response.json();
      console.log(data);
      const { link_To_File } = data;

      if (link_To_File) {
        console.log("link to file", link_To_File);
        window.open(link_To_File, '_blank');
        // setPdfUrl(link_To_File);
      } else {
        setError('Unable to retrieve the file link.');
        console.log(error);
      }
    } catch (err) {
      // setError(`Error: ${err.message}`);
      console.log(err);
    } finally {
      // setLoading(false);
    }
  };

  const firstTwoWords = locker?.description?.split(' ').slice(0, 2).join(' ') || '';


  const content = (
    <>
      <div className="navbarBrands">{locker?.name}</div>
      <div>Owner:<u>{parentUser?.username}</u></div>



      <div>
        <div>
          {isExpanded ? (
            // Show full content when expanded
            <span>{locker?.description}</span>
          ) : (
            // Show only the first word with ellipsis when collapsed
            <span>
              {firstTwoWords}...
              <button
                onClick={() => setIsExpanded(true)} // Expand on click
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'blue',
                  textDecoration: 'underline',
                  marginLeft: '-10px',
                }}
              >
                Read more
              </button>
            </span>
          )}
        </div>

        {isExpanded && (
          // Show "Show less" button when content is expanded
          <button
            onClick={() => setIsExpanded(false)} // Collapse on click
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'blue',
              textDecoration: 'underline',
              marginTop: '5px',
            }}
          >
            Read less
          </button>
        )}
      </div>
    </>
  )

  const handleToggle = (id) => {
    setShowInfo(showInfo === id ? null : id); // Toggle visibility
  };


  return (
    <div>
      {isModalOpen && (
        <Modal message={modalMessage.message || <QRCode value={qrData} />} onClose={handleCloseModal} type={modalMessage.type || "info"} />
      )}
      <Navbar content={content} />
      <div style={{ marginTop: "140px" }}>
        <Grid container className="page7description" justifyContent="center" alignItems="center">
          <Grid item md={10} sm={12} >

          </Grid>
          <Grid item md={1.5} sm={12}>
            {/* <Box display="flex" justifyContent="center" textAlign="center"> */}
            <button onClick={handleClick} className="new-connection-btns-1">Create New Connection</button>
            {/* </Box> */}
          </Grid>
        </Grid>

        <Grid container className="page7containers" padding={{ md: "4rem" }}>
          <Grid container md={5} className="notvisible">
            <Grid item md={12} className="page7publicresource">
              <p>Resources</p>
              {/* {resources.length > 0 ? (
                resources.map((resource) => (
                  <div className="page7resource" key={resource.resource_id}>
                    <div id="documentspage7" onClick={() => handleResourceClick(resource.i_node_pointer)}>
                      {resource.document_name}
                    </div>
                  </div>
                ))
              ) : (
                <p id="page7nores">No resources found.</p>
              )} */}
              {xnodes.length > 0 ? (
                <ul>
                  {xnodes.map((xnode, index) => (
                    <div
                      key={xnode.id}
                      className="resource-item"
                    // style={{
                    //   color: xnode.xnode_Type === 'INODE' ? 'blue' : 'red',}}
                    >
                      <div className="resource-details">
                        <div
                          id={
                            xnode.xnode_Type === "INODE"
                              ? "documents"
                              : "documents-byShare"
                          }
                          onClick={() =>
                            handleXnodeClick(xnode.id)
                          }
                        >
                          {xnode.resource_name}
                        </div>
                        {/* <div className="public-private">
                              {xnode.type === "private" ? <>Private</> : "Public"}
                            </div> */}
                      </div>
                    </div>
                  ))}
                </ul>
              ) : (
                <p className="not-found">No Resources found.</p>
              )}
            </Grid>

            <Grid item md={12} className="page7publicresource" marginTop={"3rem"}>
              <p>Available Connection Types</p>
              {otherConnections.length > 0 ? (
                otherConnections.map((connection) => (
                  <div className="page7connection" key={connection.connection_type_id} style={{ paddingBottom: "20px", cursor: "pointer" }}>
                    <div id="connectionpage7">
                      <div onClick={() => handleConnectionClick(connection)}>
                        <h4 className="clickable-tag"><u>{connection.connection_type_name}</u></h4>
                      </div>
                      <>
                        <div style={{marginTop:"-12px"}}>
                          <button onClick={() => handleToggle(connection.connection_type_id)} style={{
                            textDecoration: "underline",
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: "blue",
                            fontSize: "14px",
                            
                          }}>
                            {showInfo === connection.connection_type_id ? "Info" : "Info"}
                          </button>
                        </div>

                        {/* Only show details for the expanded connection */}
                        {showInfo === connection.connection_type_id && (
                          <div>
                            <div id="availconntype">
                              Description: {connection.connection_description}
                            </div>
                            <div id="availconntype">
                              Created On: {new Date(connection.created_time).toLocaleDateString()}
                            </div>
                            <div id="availconntype">
                              Valid Until: {new Date(connection.validity_time).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </>
                      {/* "Scan QR" link to show QR code */}
                      <div id="availconntype">
                        <button onClick={() => handleShowQrCode(connection)}>Scan QR</button>

                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p id="noconnfound">No available connection type found.</p>
              )}
            </Grid>
          </Grid>
          <Grid item md={1} sm={12}></Grid>
          <Grid item md={6} xs={12} className="page7containersB" marginTop={{ xs: "3rem", md: "0" }}>
            <p>My connections with {locker?.name} locker of {parentUser?.username}: </p>
            {outgoingConnections.length > 0 ? (
              outgoingConnections.map((connection, index) => {
                const tracker = trackerData[connection.connection_id];
                const color = tracker ? getStatusColor(tracker) : "gray";
                const ratio = tracker ? calculateRatio(tracker) : "Loading...";

                return (
                  <Grid container className="page7myconnection" key={index}>
                    <Grid item id="conntent" md={7.9} xs={12}>
                      <h4 onClick={() => handleTracker(connection)} style={{ textDecoration: "underline", cursor: "pointer" }}>
                        {connection.connection_name}
                      </h4>
                      <div>{connection.host_user.username} &lt;&gt; {connection.guest_user.username}</div>
                      <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
                      <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
                    </Grid>
                    <Grid item paddingTop={{ md: "50px", xs: "" }} md={4.1} xs={12}>
                      <button className="info-button" onClick={() => handleInfo(connection)}> i </button>
                      <button onClick={() => handleTracker(connection)} style={{ backgroundColor: color, padding: "0px", fontSize: "22px" }}>
                        {ratio}
                      </button>
                    </Grid>
                  </Grid>
                );
              })
            ) : (
              <p id="noconnfound">No outgoing connections found.</p>
            )}
          </Grid>
        </Grid>
      </div>
    </div>
  );
};


