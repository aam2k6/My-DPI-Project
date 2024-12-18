// import "./CreateConnectionTerms.css";
// import React, { useContext, useEffect, useState } from "react";
// import Cookies from 'js-cookie';
// import { useNavigate, useLocation } from "react-router-dom";
// import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
// import { usercontext } from "../../usercontext";
// // import res from "./object";

// export const CreateConnectionTerms = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser, setUser } = useContext(usercontext);
//   const [error, setError] = useState(null);
//   const [isOpen, setIsOpen] = useState(false);
//   const [Iagree, setIagree] = useState("0"); // Step 2: Create a state variable
//   const [message, setMessage] = useState("");
//   const [res, setRes] = useState(null);
//   const [consentData, setConsentData] = useState(null);
//   const { selectedConnectionType, selectedLocker, parentUser, locker } = location.state || {};

//   const capitalizeFirstLetter = (string) => {
//     if (!string) return '';
//     return string.charAt(0).toUpperCase() + string.slice(1);
//   };

//   useEffect(() => {
//     if (!curruser) {
//       navigate('/');
//       return;
//     }

//     //fetch terms from the api
//     const fetchTerms = async () => {
//       console.log("Inside fetch terms");
//       try {
//         const token = Cookies.get('authToken');
//         const response = await fetch(`localhost:8000/show_terms/?username=${curruser.username}&locker_name=${selectedLocker.name}&connection_name=Connection 1`, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Basic ${token}` // Adjust if using a different authentication method
//           },
//         });
//         if (!response.ok) {
//           throw new Error('Failed to fetch terms');
//         }
//         const data = await response.json();
//         if (data.success) {
//           setRes(data.terms);
//           console.log(data.terms);
//         } else {
//           setError(data.error || 'No terms found');
//         }
//       } catch (err) {
//         setError(err.message);
//       }
//     };

//     fetchTerms();
//   }, []);

//   const handleDPIDirectory = () => {
//     navigate('/dpi-directory');
//   };

//   const handleHomeClick = () => {
//     navigate('/home');
//   };

//   const handleAdmin = () => {
//     navigate('/admin');
//   };

//   const handleLogout = () => {
//     Cookies.remove('authToken');
//     localStorage.removeItem('curruser');
//     setUser(null);
//     navigate('/');
//   };

//   const toggleDropdown = () => {
//     setIsOpen(!isOpen);
//   };

//   const handleIagreebutton = async () => {
//     const token = Cookies.get('authToken');
//     const consent = true;

//     const formData = new FormData();
//     formData.append('connection_name', "Connection 1");
//     formData.append('connection_type_name', selectedConnectionType.connection_type_name);
//     formData.append('guest_username', curruser.username)
//     formData.append('guest_lockername', selectedLocker.name); //rohiths locker
//     formData.append('host_username', parentUser.username);
//     formData.append('host_lockername', locker.name); //logged in users locker(iiitb)
//     formData.append('consent', consent);

//     try {
//       const response = await fetch('localhost:8000/give_consent/', {
//         method: 'POST',
//         headers: {
//           // 'Content-Type': 'application/json',
//           'Authorization': `Basic ${token}`
//         },
//         body: formData,
//       });

//       const data = await response.json();
//       if (data.success) {
//         setMessage("Consent given successfully.");
//         console.log(message);
//         setConsentData(data);
//         setIagree("1");
//       } else {
//         setMessage(data.error || "An error occurred while giving consent.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setMessage("An error occurred while giving consent.");
//     }
//   };

//   const handleRevokebutton = async () => {
//     const token = Cookies.get('authToken');
//     const revoke_guest = false;
//     const revoke_host = false;

//     const formData = new FormData();
//     formData.append('connection_name', "Connection 1");
//     formData.append('connection_type_name', selectedConnectionType.connection_type_name);
//     formData.append('guest_username', curruser.username);
//     formData.append('guest_lockername', selectedLocker.name);
//     formData.append('host_username', parentUser.username);
//     formData.append('host_lockername', locker.name);
//     formData.append('revoke_host', revoke_host);
//     formData.append('revoke_guest', revoke_guest);

//     try {
//       const response = await fetch('localhost:8000/revoke_consent/', {
//         method: 'POST',
//         headers: {
//           // 'Content-Type': 'application/json',
//           'Authorization': `Basic ${token}`
//         },
//         body: formData,
//       });

//       const data = await response.json();
//       if (data.success) {
//         setMessage("Consent revoked successfully.");
//         console.log(message);
//         // setConsentData(data);
//         setIagree("0");
//       } else {
//         setMessage(data.error || "An error occurred while revoking consent.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setMessage("An error occurred while revoking consent.");
//     }

//   }

//   const renderObligations = () => {
//     if (res && res.obligations) {
//       return res.obligations.map((obligation, index) => (
//         <div key={index}>
//           <ul>
//             <li>{obligation.typeOfSharing}  {" "}  {obligation.labelName}</li>
//           </ul>
//         </div>
//       ));
//     } else {
//       return <p>No obligations available.</p>;
//     }
//   };

//   const renderPermissions = () => {
//     if (res && res.permissions) {
//       const { canShareMoreData, canDownloadData } = res.permissions;
//       return (
//         <div className="permissions">
//           <ul>
//             <li>{canShareMoreData && <div>You can share more data.</div>}</li>
//             <li>{canDownloadData && <div>You can download data.</div>}</li>
//           </ul>

//         </div>
//       );

//     }
//     return null;
//   };

//   return (
//     <div>
//       <nav className="navbar">
//         <div className="wrap">
//           <div className="navbarBrand">{capitalizeFirstLetter(selectedConnectionType.connection_type_name)} ({capitalizeFirstLetter(parentUser.username)}&lt; &gt;{capitalizeFirstLetter(curruser.username)})</div>
//           <div className="description"></div>
//         </div>

//         <div className="navbarLinks">
//           <ul className="navbarFirstLink">
//             <li>
//               <a href="#" onClick={handleDPIDirectory}>DPI Directory</a>
//             </li>
//           </ul>
//           <ul className="navbarSecondLink">
//             <li>
//               <a href="#" onClick={handleHomeClick}>Home</a>
//             </li>
//             <li>
//               <a href="" ></a>
//             </li>
//           </ul>

//           <ul className="navbarThirdLink">
//             <li>
//               <img src={userImage} alt="User Icon" onClick={toggleDropdown} className="dropdownImage" />
//               {isOpen && (
//                 <div className="dropdownContent">
//                   <div className="currusername">{capitalizeFirstLetter(curruser.username)}</div>
//                   <div className="curruserdesc">{curruser.description}</div>

//                   <button onClick={handleAdmin}>Settings</button>
//                   <button onClick={handleLogout}>Logout</button>
//                 </div>
//               )}
//             </li>
//           </ul>
//         </div >
//       </nav >

//       <div className="page13parent">
//         <div className="page13host1">Host : {capitalizeFirstLetter(parentUser.username)}</div>
//         <div className="page13requestor">Requestor :{capitalizeFirstLetter(curruser.username)}</div>

//       </div>

//       <div className="page13parent">
//         <div className="page13host2">Locker:{capitalizeFirstLetter(locker.name)}</div>
//         <div className="page13requestor">Locker :{capitalizeFirstLetter(selectedLocker.name)}</div>

//       </div>
//       <div className="page13container">

//         <p><u>Terms of connection</u></p>

//         <div className="page13subparent">
//           <div className="page13headterms">Your Obligations </div>
//           <div className="page13lowerterms">
//             {renderObligations()}
//           </div>

//           <div className="page13headterms">Your Rights </div>
//           <div className="page13lowerterms">{renderPermissions()}</div>

//         </div>
//       </div>

//       {
//         Iagree === "0" &&
//         <div >
//           <div className="page13button"> <button className="page13iagree0button" onClick={handleIagreebutton}> I  Agree </button></div>
//           <div>
//             {message && <div className="message">{message}</div>}
//           </div>
//         </div>
//       }

//       {
//         Iagree === "1" &&
//         <div className="page13parent13state1" >
//           <div className="page13consent">Consent Given on : {consentData.consent_given_date}
//             <br />
//             Consent valid Until : {consentData.valid_until}
//           </div>
//           <div className="page13button"> <button className="page13iagree1button" onClick={handleRevokebutton}> Revoke </button></div>

//         </div>
//       }

//     </div >

//   );
// }

// import "./CreateConnectionTerms.css";
// import React, { useContext, useEffect, useState } from "react";
// import Cookies from "js-cookie";
// import { useNavigate, useLocation } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Navbar from "../Navbar/Navbar";
// import Modal from "../Modal/Modal.jsx";
// import { frontend_host } from "../../config";
// // import res from "./object";

// export const CreateConnectionTerms = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser, setUser } = useContext(usercontext);
//   const [error, setError] = useState(null);
//   const [Iagree, setIagree] = useState("0"); // Step 2: Create a state variable
//   const [message, setMessage] = useState("");
//   const [res, setRes] = useState(null);
//   const [consentData, setConsentData] = useState(null);
//   const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const {
//     connectionName,
//     hostLockerName,
//     connectionTypeName,
//     hostUserUsername,
//     locker,
//   } = location.state || {};
//   console.log(
//     connectionName,
//     hostLockerName,
//     connectionTypeName,
//     hostUserUsername,
//     locker
//   );

//   const capitalizeFirstLetter = (string) => {
//     if (!string) return "";
//     return string.charAt(0).toUpperCase() + string.slice(1);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setModalMessage({ message: "", type: "" });
//   };

//   const checkConsentStatus = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const queryParams = new URLSearchParams({
//         connection_name: connectionName,
//         connection_type_name: connectionTypeName,
//         guest_username: curruser.username,
//         guest_lockername: locker.name,
//         host_username: hostUserUsername,
//         host_lockername: hostLockerName,
//       });

//       const response = await fetch(
//         `host/get-consent/?${queryParams.toString()}`.replace(
//           /host/,
//           frontend_host
//         ),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//           },
//         }
//       );

//       const data = await response.json();
//       if (data.success) {
//         setConsentData(data);
//         console.log(data);
//         setIagree(data.consent_status ? "1" : "0");
//       } else {
//         setMessage(data.error || "Failed to check consent status.");
//       }
//     } catch (error) {
//       setMessage("Error while checking consent status.");
//       console.error(error);
//     }
//   };

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }

//     //fetch terms from the api
//     const fetchTerms = async () => {
//       console.log("Inside fetch terms");
//       try {
//         const token = Cookies.get("authToken");
    
//         let apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${hostUserUsername}&host_locker_name=${hostLockerName}`;
//         console.log("Final API URL:", apiUrl);
    
//         const response = await fetch(apiUrl, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Basic ${token}`,
//           },
//         });
    
//         if (!response.ok) {
//           throw new Error("Failed to fetch terms");
//         }
    
//         const data = await response.json();
    
//         if (data.success) {
//           setRes(data.data); // Update to set data.data instead of data
//           console.log("Terms Response Data:", data.data);
//         } else {
//           setError(data.error || "No terms found");
//         }
//       } catch (err) {
//         setError(err.message);
//       }
//     };
    

//     fetchTerms();
//     checkConsentStatus();
//   }, []);

//   const handleIagreebutton = async () => {
//     const token = Cookies.get('authToken');
//     const consent = true;
//     const formData = new FormData();
//     formData.append('connection_name', connectionName);
//     formData.append('connection_type_name', connectionTypeName);
//     formData.append('guest_username', curruser.username);
//     formData.append('guest_lockername', locker.name); // Guest locker
//     formData.append('host_username', hostUserUsername);
//     formData.append('host_lockername', hostLockerName); // Host locker
//     formData.append('consent', consent);

//     try {
//         const response = await fetch('host/give-consent/'.replace(/host/, frontend_host), {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Basic ${token}`,
//             },
//             body: formData,
//         });

//         const data = await response.json();
//         console.log('Consent data:', data);

//         if (data.success) {
//             // Create connection after consent
//             await createConnection();

//             setModalMessage({
//                 message: 'Consent given and connection created successfully.',
//                 type: 'success',
//             });
//             setIagree("1");
//             setConsentData({
//                 consent_given: data.consent_given_date,
//                 valid_until: data.valid_until,
//             });
//         } else {
//             setModalMessage({
//                 message: data.error || 'An error occurred while giving consent.',
//                 type: 'failure',
//             });
//         }
//     } catch (error) {
//         console.error('Error:', error);
//         setModalMessage({
//             message: 'An error occurred while giving consent.',
//             type: 'failure',
//         });
//     }
//     setIsModalOpen(true);
// };

// const createConnection = async () => {
//     const token = Cookies.get('authToken');
//     const formData = new FormData();
//     formData.append('connection_type_name', connectionTypeName);
//     formData.append('connection_name', connectionName);
//     formData.append('connection_description', ''); // Add description if needed
//     formData.append('host_locker_name', hostLockerName);
//     formData.append('guest_locker_name', locker.name);
//     formData.append('host_user_username', hostUserUsername);
//     formData.append('guest_user_username', curruser.username);

//     try {
//         const response = await fetch('host/create-new-connection/'.replace(/host/, frontend_host), {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Basic ${token}`,
//             },
//             body: formData,
//         });

//         const data = await response.json();
//         console.log('Create connection response:', data);
//         if (!data.success) {
//             throw new Error(data.error || 'Failed to create connection.');
//         }
//     } catch (error) {
//         console.error('Error creating connection:', error);
//         setModalMessage({
//             message: 'An error occurred while creating the connection.',
//             type: 'failure',
//         });
//         setIsModalOpen(true);
//     }
// };


//   const handleRevokebutton = async () => {
//     const token = Cookies.get("authToken");
//     const revoke_guest = false;
//     const revoke_host = false;
//     const consent = false;
//     const formData = new FormData();
//     formData.append("connection_name", connectionName);
//     formData.append("connection_type_name", connectionTypeName);
//     formData.append("guest_username", curruser.username);
//     formData.append("guest_lockername", locker.name);
//     formData.append("host_username", hostUserUsername);
//     formData.append("host_lockername", hostLockerName);
//     formData.append("revoke_host", revoke_host);
//     formData.append("revoke_guest", revoke_guest);
//     formData.append("consent", consent);

//     try {
//       const response = await fetch(
//         "host/revoke-consent/".replace(/host/, frontend_host),
//         {
//           method: "POST",
//           headers: {
//             // 'Content-Type': 'application/json',
//             Authorization: `Basic ${token}`,
//           },
//           body: formData,
//         }
//       );

//       const data = await response.json();
//       console.log("revoke consent", data);
//       if (data.success) {
//         // setMessage("Consent revoked successfully.");
//         setModalMessage({
//           message: "Consent revoked successfully.",
//           type: "success",
//         });
//         // console.log(message);
//         // setConsentData(data);
//         setIagree("0");
//       } else {
//         setModalMessage({
//           message: data.error || "An error occurred while revoking consent.",
//           type: "failure",
//         });
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setModalMessage({
//         messgae: "An error occurred while revoking consent.",
//         type: "failure",
//       });
//     }
//     setIsModalOpen(true);
//     // navigate(`/target-locker-view`);
//   };

//   const renderObligations = () => {
//     if (res && res.obligations && Array.isArray(res.obligations)) {
//       return (
//         <div>
//           <ul>
//             {res.obligations.map((term, index) => (
//               <li key={index}>
//                 {term.typeOfSharing} - {term.labelName} ({term.labelDescription})
//               </li>
//             ))}
//           </ul>
//         </div>
//       );
//     }
//     return <p>No obligations available.</p>;
//   };
  
//   const renderPermissions = () => {
//     if (res && res.permissions) {
//       const { canShareMoreData, canDownloadData } = res.permissions;
//       return (
//         <div className="permissions">
//           <h3>Your Permissions</h3>
//           <ul>
//             {canShareMoreData ? <li>You can share more data.</li> : <li>You cannot share more data.</li>}
//             {canDownloadData ? <li>You can download data.</li> : <li>You cannot download data.</li>}
//           </ul>
//         </div>
//       );
//     }
//     return <p>No permissions available.</p>;
//   };
  



//   const content = (
//     // <>
//     // <div className="navbarBrand">{capitalizeFirstLetter(connectionTypeName)} ({capitalizeFirstLetter(hostUserUsername)}&lt; &gt;{capitalizeFirstLetter(curruser.username)})</div>
//     // <div className="navbarBrand">Connection name:: {capitalizeFirstLetter(connectionName)}   </div>
//     // {/* <div className="navbarBrand">{(connection_description)}   </div> */}
//     // <div className="description"></div>
//     // </>
//     <>
//       <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
//       <div className="description">
//         {curruser ? curruser.description : "None"}
//       </div>
//       <br></br>
//       <div className="connection-details">
//         Connection Name: {connectionName} <br></br>
//         {/* //{connection.description}<br></br> */}
//         Guest: {curruser.username} --&gt; Host: {hostUserUsername} 
//       </div>
//     </>
//   );

//   console.log("I agree", Iagree);
//   return (
//     <div>
//       <Navbar content={content} />
//       {/* 
//       <div className="page13parent">
//         <div className="page13host1">Host : {capitalizeFirstLetter(hostUserUsername)}</div>
//         <div className="page13requestor">Requestor :{capitalizeFirstLetter(curruser.username)}</div>

//       </div>

//       <div className="page13parent">
//         <div className="page13host2">Locker:{capitalizeFirstLetter(hostLockerName)}</div>
//         <div className="page13requestor">Locker :{capitalizeFirstLetter(locker.name)}</div>

//       </div> */}
//       <div className="page13container">
//         <p>
//           <u>Terms of connection</u>
//         </p>

//         <div className="page13subparent">
//           <div className="page13headterms">Your Obligations </div>
//           <div className="page13lowerterms">{renderObligations()}</div>

//           <div className="page13headterms">Your Rights </div>
//           <div className="page13lowerterms">{renderPermissions()}</div>
//         </div>
//       </div>
//       {isModalOpen && (
//         <Modal
//           message={modalMessage.message}
//           onClose={handleCloseModal}
//           type={modalMessage.type}
//         />
//       )}

//       {Iagree === "0" && (
//         <div>
//           <div className="page13button">
//             {" "}
//             <button
//               className="page13iagree0button"
//               onClick={handleIagreebutton}
//             >
//               {" "}
//               I Agree{" "}
//             </button>
//           </div>
//           {/* <div>
//             {message && <div className="message">{message}</div>}
//           </div> */}
//         </div>
//       )}

//       {Iagree === "1" && (
//         <div className="page13parent13state1">
//           <div className="page13consent">
//             Consent Given on : {consentData.consent_given}
//             <br />
//             Consent valid Until : {consentData.valid_until}
//           </div>
//           <div className="page13button">
//             {" "}
//             <button
//               className="page13iagree1button"
//               onClick={handleRevokebutton}
//             >
//               {" "}
//               Revoke{" "}
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
//connadjust
import "./CreateConnectionTerms.css";
import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import Modal from "../Modal/Modal.jsx";
import { frontend_host } from "../../config";import { FaArrowCircleRight, FaUserCircle, FaRegUserCircle } from 'react-icons/fa';
import { Grid } from '@mui/material'

// import res from "./object";

export const CreateConnectionTerms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [Iagree, setIagree] = useState("0"); // Step 2: Create a state variable
  const [message, setMessage] = useState("");
  const [res, setRes] = useState(null);
  const [consentData, setConsentData] = useState(null);
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [globalTemplates, setGlobalTemplates] = useState([]);
  const [terms, setTerms] = useState([]);
  const [activeTab, setActiveTab] = useState("guest");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showRevokeConfirmationModal, setShowRevokeConfirmationModal] = useState(false);
  const [showCloseConfirmationModal, setShowCloseConfirmationModal] = useState(false);
  // const [forbiddenContent, setForbiddenContent] = useState("null")

  const forbiddenContent =
  res?.forbidden?.host_to_guest?.[0]?.labelDescription ??
  res?.forbidden?.guest_to_host?.[0]?.labelDescription ??
  "You can unilaterally close the connection";

console.log("forbiddenContent",forbiddenContent);

  const {
    connectionName,
    hostLockerName,
    guestLockerName,
    connectionTypeName,
    hostUserUsername,
    connectionDescription,
    guestUserUsername,
    locker,
    showConsent,
    guest_locker_id,
    host_locker_id,
    connection_id,
    lockerComplete,
    hostLocker,
    guestLocker
    
  } = location.state || {};
  console.log("data",
    connectionName,
    hostLockerName,
    guestLockerName,
    connectionTypeName,
    connectionDescription,
    guestUserUsername,
    hostUserUsername,
    locker,
    guest_locker_id,
    host_locker_id,
    connection_id,
    lockerComplete,
    hostLocker,
    guestLocker
  );

  console.log("guest name",guestLocker,);


  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
    navigate(`/view-locker?param=${Date.now()}`, { state: { locker: lockerComplete } });
  };

  const checkConsentStatus = async () => {
    console.log("guestlocker",locker)
    console.log("host",hostLockerName)
    try {
      const token = Cookies.get("authToken");
      const queryParams = new URLSearchParams({
        connection_name: connectionName,
        connection_type_name: connectionTypeName,
        guest_username: curruser.username,
        guest_lockername: locker,
        host_username: hostUserUsername,
        host_lockername: hostLockerName,
      });

      const response = await fetch(
        `host/get-consent/?${queryParams.toString()}`.replace(
          /host/,
          frontend_host
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setConsentData(data);
        console.log(data);
        setIagree(data.consent_status ? "1" : "0");
      } else {
        setMessage(data.error || "Failed to check consent status.");
      }
    } catch (error) {
      setMessage("Error while checking consent status.");
      console.error(error);
    }
  };

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }

    const fetchGlobalTemplates = () => {
      const token = Cookies.get("authToken");
      fetch("host/get-template-or-templates/".replace(/host/, frontend_host), {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          // console.log("Fetched Templates:", data); // Log the fetched data
          setGlobalTemplates(data.data); // Store fetched templates
          // console.log("global data", data.data);
        })
        .catch((error) => {
          console.error("Error fetching templates:", error);
          setError("Failed to fetch templates");
        });
    };


    const fetchConnectionDetails = async () => {
    
      const connection_type_name = connectionTypeName;
      const host_locker_name = hostLockerName; 
      const guest_locker_name =  locker;
      const host_user_username = hostUserUsername; 
      const guest_user_username = curruser.username;
  
      const token = Cookies.get("authToken"); 
  
      try {
        const response = await fetch(
          `host/get-connection-details?connection_type_name=${connection_type_name}&host_locker_name=${host_locker_name}&guest_locker_name=${guest_locker_name}&host_user_username=${host_user_username}&guest_user_username=${guest_user_username}`.replace(/host/, frontend_host),
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
  
        const data = await response.json();
        console.log("data conn", data.connections);
        if (response.ok) {
          setConnectionDetails(data.connections);
        } else {
          setError(data.error || "Failed to fetch connection details.");
          console.log("fecth connection details",data.error)
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    console.log("datas",guestLockerName,hostLockerName)

    //fetch terms from the api
    const fetchTerms = async () => {
      console.log("Inside fetch terms");
      try {
        const token = Cookies.get("authToken");
    
        let apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${hostUserUsername}&host_locker_name=${hostLockerName}`;
        console.log("Final API URL:", apiUrl);
    
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
        });
    
        if (!response.ok) {
          throw new Error("Failed to fetch terms");
        }
    
        const data = await response.json();
    
        if (data.success) {
          setRes(data.data); 
          setTerms(data.data.obligations);
          console.log("Terms Response Data:", data.data);
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        setError(err.message);
      }
    };
    

    fetchTerms();
    checkConsentStatus();
    fetchConnectionDetails();
    fetchGlobalTemplates();

    console.log("details", connectionDetails);

 

  }, []);

  useEffect(() => {
    if (connectionDetails) {
      const { revoke_guest, revoke_host } = connectionDetails;

      if (revoke_guest === true && revoke_host === false) {
        setModalMessage({
          message: 'You have closed the connection, but the host is yet to approve your revoke.',
          type: 'info',
        });
        setIsModalOpen(true);
      }
    }
  }, [connectionDetails]);

  // Show loading while fetching connection details
  if (loading) {
    return <div>Loading...</div>; // Replace with a proper loading component if needed
  }

  // if (error) {
  //   return <div>Error: {error}</div>;
  // }

  
  // useEffect(() => {
    // Check the values of revoke_guest and revoke_host
    // if (connectionDetails && connectionDetails.revoke_guest === true && !connectionDetails.revoke_host === false) {
    //   setModalMessage({
    //     message: 'You have closed the connection, but the host is yet to approve your revoke.',
    //     type: 'info',
    //   });
    //   console.log("success");
    //   setIsModalOpen(true);
    // }
  // }, [connectionDetails]);


  const handleIagreebutton = async () => {
    const token = Cookies.get('authToken');
    const consent = true;
    console.log("Locker Name:", locker); // Verify locker details
    if (!locker ) {
      console.error("Locker is undefined or doesn't have a name.");
      setModalMessage({
        message: 'Locker information is missing.',
        type: 'failure',
      });
      setIsModalOpen(true);
      return;
    }
    try {
        // First, create the connection
        const createResponse = await fetch('host/create-new-connection/'.replace(/host/, frontend_host), {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${token}`,
            },
            body: new URLSearchParams({
                connection_type_name: connectionTypeName,
                connection_name: connectionName,
                connection_description: connectionDescription, 
                host_locker_name: hostLockerName,
                guest_locker_name: locker,
                host_user_username: hostUserUsername,
                guest_user_username: curruser.username
            })
        });

        const createData = await createResponse.json();
        if (!createData.success) {
            throw new Error(createData.error || 'Failed to create connection.');
        }

        // Now give consent
        const consentResponse = await fetch('host/give-consent/'.replace(/host/, frontend_host), {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${token}`,
            },
            body: new URLSearchParams({
                connection_name: connectionName,
                connection_type_name: connectionTypeName,
                guest_username: curruser.username,
                guest_lockername: locker,
                host_username: hostUserUsername,
                host_lockername: hostLockerName,
                consent: consent.toString()
            })
        });
        console.log("give-consent body", {
          connection_name: connectionName,
          connection_type_name: connectionTypeName,
          guest_username: curruser.username,
          guest_lockername: locker,
          host_username: hostUserUsername,
          host_lockername: hostLockerName,
          consent: consent.toString()
      });

        const consentData = await consentResponse.json();
        if (consentData.success) {
            setModalMessage({
                message: 'Consent given and connection created successfully.',
                type: 'success',
            });
            setIagree("1");
            setConsentData({
                consent_given: consentData.consent_given_date,
                valid_until: consentData.valid_until,
            });
        } else {
            setModalMessage({
                message: consentData.error || 'An error occurred while giving consent.',
                type: 'failure',
            });
        }
    } catch (error) {
        console.error('Error:', error);
        setModalMessage({
            message: 'An error occurred while giving consent.',
            type: 'failure',
        });
    }
    setIsModalOpen(true);
};

  const handleRevokebutton = async () => {
    const token = Cookies.get("authToken");
    const revoke_guest = false;
    const revoke_host = false;
    const consent = false;
    const formData = new FormData();
    // formData.append("connection_name", connectionName);
    // formData.append("connection_type_name", connectionTypeName);
    // formData.append("guest_username", curruser.username);
    // formData.append("guest_lockername", locker.name);
    // formData.append("host_username", hostUserUsername);
    // formData.append("host_lockername", hostLockerName);
    // formData.append("revoke_host", revoke_host);
    // formData.append("revoke_guest", revoke_guest);
    // formData.append("consent", consent);
    console.log(guest_locker_id);
    // formData.append("guest_locker_id", guest_locker_id);
    // formData.append("host_locker_id", host_locker_id);
    formData.append("connection_id", connection_id);


    try {
      const response = await fetch(
        "host/revoke-guest/".replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            // 'Content-Type': 'application/json',
            Authorization: `Basic ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("revoke consent", data);
      if (response.status === 200) {
        // setMessage("Consent revoked successfully.");
        setModalMessage({
          message: "Consent revoked successfully." + data.message,
          type: "success",
        });
        // console.log(message);
        // setConsentData(data);
        setIagree("0");
      } else {
        setModalMessage({
          message: data.message || "An error occurred while revoking consent.",
          type: "failure",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setModalMessage({
        messgae: "An error occurred while revoking consent.",
        type: "failure",
      });
    }
    setIsModalOpen(true);
    // navigate(`/target-locker-view`);
    
  };

  const handleClosebutton = async () => {
    const token = Cookies.get("authToken");
    const formData = new FormData();
    // formData.append("guest_username", curruser.username); 
    // formData.append("host_username", hostUserUsername); 
    // formData.append("guest_lockername", guestLockerName);
    // formData.append("host_lockername", hostLockerName); 
    // formData.append("connection_name", connectionName);
    // formData.append("connection_type_name", connectionTypeName);
    // formData.append("close_guest", "true");
    formData.append("connection_id", connection_id);
    console.log("formData", formData);
    try {
        const response = await fetch("host/close_connection_guest/".replace(/host/, frontend_host), {
            method: "POST",
            headers: {
                Authorization: `Basic ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (response.ok) {
            setModalMessage({
                message: "You have closed the connection!,"+ data.message,
                type: "success",
            });
            setIagree("0");
            
        } else {
            setModalMessage({
                message: data.error || "Failed to close the connection.",
                type: "failure",
            });
        }
    } catch (error) {
        console.error("Error:", error);
        setModalMessage({
            message: "An unexpected error occurred while closing the connection.",
            type: "failure",
        });
    }
    setIsModalOpen(true);
};

  const renderTermsSection = (terms, title, userType) => (
    <div className="terms-sections">
      <h3>{title}</h3>
      {terms && terms.length > 0 ? (
        <ul>
          {terms.map((term, index) => (
            <li key={index}>
              <strong>
                {userType === "guest"
                  ? term.typeOfSharing === "collateral"
                    ? `Guest shall provide ${term.labelName} as ${term.typeOfSharing} - ${term.labelDescription}`
                    : `Guest shall ${term.typeOfSharing} ${term.labelName}`
                  : term.typeOfSharing === "collateral"
                  ? `Host will provide ${term.labelName} as ${term.typeOfSharing} - ${term.labelDescription}`
                  : `Host will ${term.typeOfSharing} ${term.labelName} `}
              </strong> 
              - {term.labelDescription} 
              (Host Privilege: {term.hostPermissions && term.hostPermissions.length > 0 
                ? term.hostPermissions.join(", ") 
                : "None"})
            </li>
          ))}
        </ul>
      ) : (
        <p>No terms available.</p>
      )}
    </div>
  );
  
  const renderObligations = (userType) => {
    if (res && res.obligations) {
      return userType === "guest"
        ? renderTermsSection(res.obligations.guest_to_host, "", "guest")
        : renderTermsSection(res.obligations.host_to_guest, "", "host");
    }
    return <p>No obligations available.</p>;
  };
  
  const renderPermissions = (userType) => {
    if (res && res.permissions) {
      const permissionsData = userType === "guest"
        ? res.permissions.guest_to_host
        : res.permissions.host_to_guest;
      return (
        <div className="permissions">
          <ul>
            <li>{userType === "guest" ? "Guest" : "Host"} {permissionsData.canShareMoreData ? "Can share more data" : "Cannot share more data"}</li>
            {/* <li>{userType === "guest" ? "Guest" : "Host"} {permissionsData.canDownloadData ? "Can download data" : "Cannot download data"}</li> */}
          </ul>
        </div>
      );
    }
    return <p>No permissions available.</p>;
  };
  
  const renderForbidden = (userType) => {
    if (res && res.forbidden) {
      return (
        <div className="terms-sections">
          {res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"] &&
          res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"].length > 0 ? (
            <ul>
              {res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"].map(
                (term, index) => (
                  <li key={index}>
                    <strong>
                      {userType === "guest"
                        ? `Guest  ${term.labelName} - ${term.labelDescription}`
                        : `Host  ${term.labelName} - ${term.labelDescription}`}
                    </strong>
                    (Host Privilege:{" "}
                    {term.hostPermissions && term.hostPermissions.length > 0
                      ? term.hostPermissions.join(", ")
                      : "None"})
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>No forbidden terms available.</p>
          )}
        </div>
      );
    }
    return <p>No forbidden terms available.</p>;
  };
  
console.log(res);


const uniqueGlobalConnTypeIds = Array.isArray(terms)
    ? [...new Set(terms
      .filter(term => term.global_conn_type_id !== null)
      .map(term => term.global_conn_type_id)
    )]
    : [];


const globalTemplateNames = uniqueGlobalConnTypeIds.map(id => {
  const template = globalTemplates.find(template => template.global_connection_type_template_id === id);
  return template ? template : null;
});

const handleNavigation = (template) => {
  if (template) {
    console.log(template);
    navigate('/GlobalTermsView', {
      state: {
        connectionTypeName: template.global_connection_type_name,
        connectionTypeDescription: template.global_connection_type_description,
        template_Id: template.global_connection_type_template_id,
        hide: true,
      },
    });
  }
};


console.log("names", globalTemplateNames);


const userTooltips = {
  guest: "Guest",
  host: "Host",
};

const renderUserTooltip = (userType) => {
  return (
    <span className="tooltiptext small-tooltip">
      {userTooltips[userType] || "Hover over an icon to see user details."}
    </span>
  );
};

const handleGuestClick = () => {
  navigate('/view-locker', {
    state: {
      user: { username: curruser.username },
      locker: guestLocker,
    }
  });
};

const handleHostClick = () => {
  navigate('/target-locker-view', {
    state: {
      user:{username: hostUserUsername},
      locker:  hostLocker ,
    },
  });
};


const content = (
  <>
    <div className="navbarBrands">{connectionName}</div>
    {/* <br />
    <div className="connection-details">
      Connection Name: {connectionName} <br />
      <h3>
        {globalTemplateNames.length > 0 && "Connection has been imported from "}
        <span style={{ fontWeight: "bold" }}>
          {globalTemplateNames.filter(Boolean).map((template, index) => (
            <span key={index}>
              <span 
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => handleNavigation(template)}
              >
                {template.global_connection_type_name}
              </span>
              {index < globalTemplateNames.filter(Boolean).length - 1 && ", "}
            </span>
          ))}
        </span>
      </h3>
      {connectionDescription}<br />
      
      <div className="tooltip-container user-container">
        <div className="tooltip user-container">
          <FaUserCircle className="userIcon" /> &nbsp;
          <span className="userName">{renderUserTooltip('guest')} : {curruser.username} &nbsp;</span>
        </div>
        <i className="fa-solid fa-right-long"></i> &nbsp;
        <div className="tooltip user-container">
          <FaRegUserCircle className="userIcon" /> &nbsp;
          <span className="userName">{renderUserTooltip('host')} : {hostUserUsername}</span>
        </div>
      </div>

      <div className="tooltip-container user-container">
        <div className="tooltip user-container" onClick={() => navigate("/home")} style={{ cursor: 'pointer' }}>
          <i className="bi bi-person-fill-lock"></i> &nbsp;
          <span className="userName">{renderUserTooltip('guest')} : {locker} &nbsp;</span>
        </div>
        <i className="fa-solid fa-right-long"></i> &nbsp;
        <div className="tooltip user-container" onClick={() => handleuserclick(hostUserUsername)}>
          <i className="bi bi-person-lock"></i> &nbsp;
          <span className="userName">{renderUserTooltip('host')} : {hostLockerName}</span>
        </div>
      </div>
    </div> */}
  </>
);

console.log("I agree", Iagree);
console.log(res, "res");

const handledisagreebutton = () => {
  navigate('/target-locker-view', {
    state: {
      user:{username: hostUserUsername},
      locker:  hostLocker ,
    },
  });
}
const handleRevokeConfirm = () => {
  setShowRevokeConfirmationModal(false); // Close the modal
  handleRevokebutton(); // Execute revoke action
};
const handleCloseConfirm = () => {
  setShowCloseConfirmationModal(false); // Close the modal
  handleClosebutton(); // Execute revoke action
};

return (
  <div>
    <Navbar content={content} />
    <div style={{marginTop:"120px"}}>
      <div className="connection-details longconnectionDescription">
        Connection Name: {connectionName} <br />
        <h3>
          {globalTemplateNames.length > 0 && "Connection has been imported from "}
          <span style={{ fontWeight: "bold" }}>
            {globalTemplateNames.filter(Boolean).map((template, index) => (
              <span key={index}>
                <span 
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => handleNavigation(template)}
                >
                  {template.global_connection_type_name}
                </span>
                {index < globalTemplateNames.filter(Boolean).length - 1 && ", "}
              </span>
            ))}
          </span>
        </h3>
        {connectionDescription}<br />
        
        <div className="tooltip-container user-container">
          <div className="tooltips user-container">
            <FaUserCircle className="userIcon" /> &nbsp;
            <span className="userName">{renderUserTooltip('guest')} : {guestUserUsername} &nbsp;</span>
          </div>
          <i className="fa-solid fa-right-long"></i> &nbsp;
          <div className="tooltips user-container">
            <FaRegUserCircle className="userIcon" /> &nbsp;
            <span className="userName">{renderUserTooltip('host')} : {hostUserUsername}</span>
          </div>
        </div>

        <div className="tooltip-container user-container">
          <div className="tooltips user-container" onClick={() => handleGuestClick()} style={{ cursor: 'pointer' }}>
            <i className="bi bi-person-fill-lock"></i> &nbsp;
            <span className="userName">{renderUserTooltip('guest')} : {guestLockerName} &nbsp;</span>
          </div>
          <i className="fa-solid fa-right-long"></i> &nbsp;
          <div className="tooltips user-container" onClick={() => handleHostClick()}>
            <i className="bi bi-person-lock"></i> &nbsp;
            <span className="userName">{renderUserTooltip('host')} : {hostLockerName}</span>
          </div>
        </div>
      </div>
    </div>
   <div>
   <div className="view-container">
      <div className="b">
        <div className="tabs">
          <div
            className={`tab-header ${activeTab === "guest" ? "active" : ""}`}
            onClick={() => setActiveTab("guest")}
          >
            Guest Data
          </div>
          <div
            className={`tab-header ${activeTab === "host" ? "active" : ""}`}
            onClick={() => setActiveTab("host")}
          >
            Host Data
          </div>
        </div>
        <div className="tab-content">
          <div className="table-container">
            {activeTab === "guest" && (
              <div>
                <div className="page13headterms">Your Obligations</div>
                <div className="page13lowerterms" style={{marginLeft:"-40px"}}>{renderObligations("guest")}</div>
                <div className="page13headterms">Your Permissions</div>
                <div className="page13lowerterms">{renderPermissions("guest")}</div>
                <div className="page13headterms">Your Forbidden Terms</div>
                <div className="page13lowerterms" style={{marginLeft:"-40px"}}>{renderForbidden("guest")}</div>
                <div className="page13headterms">Default Host Privileges</div>
                By default Reshare,Download,Aggreagte are disabled unless otherwise mentioned in the terms
              </div>
            )}
            {activeTab === "host" && (
              <div>
                <div className="page13headterms">Host Obligations</div>
                <div className="page13lowerterms" style={{marginLeft:"-40px"}}>{renderObligations("host")}</div>
                <div className="page13headterms">Host Permissions</div>
                <div className="page13lowerterms">{renderPermissions("host")}</div>
                <div className="page13headterms" >Host Forbidden Terms</div>
                <div className="page13lowerterms" style={{marginLeft:"-40px"}}>{renderForbidden("host")}</div>
                <div className="page13headterms">Default Host Privileges</div>
                By default Reshare,Download,Aggreagte are disabled unless otherwise mentioned in the terms
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {
  isModalOpen && (
    <Modal
      message={modalMessage.message}
      onClose={handleCloseModal}
      type={modalMessage.type}
    />
  )
}
{showConfirmationModal && (
  <Modal
    message="Are you sure you want to agree?"
    type="confirmation"
    onClose={() => setShowConfirmationModal(false)} // Close on "No"
    onConfirm={() => {
      setShowConfirmationModal(false); // Close modal
      handleIagreebutton(); // Execute agree action
    }}
  />
)}
{showRevokeConfirmationModal && (
    <Modal
      message="Are you sure you want to revoke?"
      type="confirmation"
      onClose={() => setShowRevokeConfirmationModal(false)} // Close modal on "No"
      onConfirm={handleRevokeConfirm} // Call the confirmation action
    />
  )}

{showCloseConfirmationModal && (
    <Modal
     message={
    <>
      You will no longer be allowed to share data <br/>
      {forbiddenContent} <br />
      Are you sure you want to Close Connection? <br />
    </>
  }
      type="confirmation"
      onClose={() => setShowCloseConfirmationModal(false)} // Close modal on "No"
      onConfirm={handleCloseConfirm} // Call the confirmation action
    />
  )}

<div>
  {showConsent && Iagree === "0" && (
    <Grid container>
      <Grid item md={4} xs={1}></Grid>
      <Grid item xs={5.5} md={2} className="page13button">
        <button
          className="page13iagree0buttons"
          onClick={() => setShowConfirmationModal(true)} // Trigger confirmation modal
        >
          Agree
        </button>
      </Grid>
      <Grid item xs={5.5} md={2} className="page13button">
        <button
          className="page13iagree0buttons"
          onClick={() => handledisagreebutton()}
        >
          Disagree
        </button>
      </Grid>
      <Grid item md={4} xs={0}></Grid>
    </Grid>
  )}
</div>

<div>
  {showConsent && Iagree === "1" && (
    <Grid container className="page13parent13state1">
      <Grid item xs={12} md={1}></Grid>
      <Grid item xs={12} md={4} className="page13consent" mb={3}>
        Consent Given on : {consentData.consent_given}
        <br />
        Consent valid Until : {consentData.valid_until}
      </Grid>
      <Grid xs={2} md={2}></Grid>
      <Grid item xs={5} md={2} className="page13button" mb={3}>
      <button
          className="page13iagree1buttons"
          onClick={() => setShowRevokeConfirmationModal(true)} // Trigger confirmation modal
        >
          Revoke
        </button>
      </Grid>
      <Grid item xs={4} md={2} className="page13button" mb={3}>
      <button
          className="page13iagree1buttons"
          onClick={() => setShowCloseConfirmationModal(true)} // Trigger confirmation modal
        >
          Close Connection
        </button>
      </Grid>
    </Grid>
  )}
</div>

   </div>

    
  </div>
);
}