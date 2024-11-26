// import React, { useContext, useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import "./ViewTermsByType.css";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";

// export const ViewTermsByType = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { curruser } = useContext(usercontext);
//     const [showResources, setShowResources] = useState(false);
//     const [selectedLocker, setSelectedLocker] = useState(null);
//     const [error, setError] = useState(null);
//     const [res, setRes] = useState(null);
//     const [resources, setResources] = useState([]);
//     const [termValues, setTermValues] = useState({});
//     const [selectedResources, setSelectedResources] = useState({});
//     const [currentLabelName, setCurrentLabelName] = useState(null);
//     const [VnodeResources, setVnodeResources] = useState([]);
//     const [statuses, setStatuses] = useState({}); // To store the statuses
//     // const [resourcesData, setResourcesData] = useState({
//     //     share: [],
//     //     transfer: [],
//     // });

//     const {
//         connectionName,
//         connectionDescription,
//         hostLockerName,
//         guestLockerName,
//         hostUserUsername,
//         guestUserUsername,
//         locker,
//     } = location.state || {};

//     useEffect(() => {
//         if (!curruser) {
//             navigate("/");
//             return;
//         }

//         const fetchTerms = async () => {
//             try {
//                 const token = Cookies.get("authToken");
//                 const response = await fetch(
//                     `host/get-terms-value/?username=${hostUserUsername}&locker_name=${guestLockerName}&connection_name=${connectionName}`.replace(/host/, frontend_host),
//                     {
//                         method: "GET",
//                         headers: {
//                             "Content-Type": "application/json",
//                             Authorization: `Basic ${token}`,
//                         },
//                     }
//                 );
//                 if (!response.ok) {
//                     throw new Error("Failed to fetch terms");
//                 }

//                 const data = await response.json();
//                 // console.log("data", data);
//                 if (data.success) {
//                     const initialValues = {};
//                     const initialResources = {};
//                     const statusMap = {};
//                     // const resourceMap = {
//                     //     share: [],
//                     //     transfer: []
//                     // };

//                     data.terms.obligations.forEach((obligation) => {
//                         initialValues[obligation.labelName] = obligation.value || "";
//                         statusMap[obligation.labelName] =
//                             obligation.value.endsWith("T")
//                                 ? "Approved"
//                                 : obligation.value.endsWith("R")
//                                     ? "Rejected"
//                                     : "Pending";

//                         if (obligation.typeOfAction === "file" && obligation.value) {
//                             const [document_name] = obligation.value.split(";");
//                             initialResources[obligation.labelName] = {
//                                 document_name,
//                                 i_node_pointer: obligation.i_node_pointer,
//                                 typeOfSharing: obligation.typeOfSharing
//                             };

//                             // if (obligation.typeOfSharing === "transfer") {
//                             //     resourceMap.transfer.push(document_name);
//                             // } else if (obligation.typeOfSharing === "share") {
//                             //     resourceMap.share.push(document_name);
//                             // }
//                         }
//                     });

//                     setRes(data.terms);
//                     setTermValues(initialValues);
//                     setSelectedResources(initialResources);
//                     setStatuses(statusMap);
//                     // setResourcesData({
//                     //     share: Object.values(initialResources).filter(res => res.typeOfSharing === "share").map(res => res.document_name),
//                     //     transfer: Object.values(initialResources).filter(res => res.typeOfSharing === "transfer").map(res => res.document_name),
//                     // });

//                     // console.log("resourceMap", resourceMap);
//                     console.log("initialResources", initialResources);
//                     // console.log(resourcesData);
//                 } else {
//                     setError(data.error || "No terms found");
//                 }
//             } catch (err) {
//                 setError(err.message);
//             }
//         };

//         fetchTerms();
//     }, [curruser, navigate, hostUserUsername, guestLockerName, connectionName]);

//     const handleInputChange = (labelName, value) => {
//         setTermValues((prev) => ({
//             ...prev,
//             [labelName]: value,
//         }));
//     };

//     const renderInputField = (obligation) => {
//         const strippedValue = termValues[obligation.labelName]
//             // ?.replace(/;[TFR]$/, "");
//             ?.replace(/;[ ]?[TFR]$/, "");
//         switch (obligation.typeOfAction) {
//             case "text":
//                 return (
//                     <input
//                         type="text"
//                         placeholder="Enter value"
//                         value={strippedValue || ""}
//                         onChange={(e) =>
//                             handleInputChange(obligation.labelName, e.target.value)
//                         }
//                     />
//                 );
//             case "file":
//                 console.log("name", selectedResources[obligation.labelName]?.document_name);
//                 console.log("name 2", selectedResources);
//                 return (
//                     <button onClick={() => handleButtonClick(obligation.labelName)}>
//                         {selectedResources[obligation.labelName]?.document_name ||
//                             "Upload File"}
//                     </button>
//                 );
//             case "date":
//                 return (
//                     <input
//                         type="date"
//                         value={strippedValue || ""}
//                         onChange={(e) =>
//                             handleInputChange(obligation.labelName, e.target.value)
//                         }
//                     />
//                 );
//             default:
//                 return null;
//         }
//     };

//     const handleButtonClick = (labelName) => {
//         setSelectedLocker(guestLockerName);
//         setShowResources(true);
//         setCurrentLabelName(labelName);
//     };

//     const handleResourceSelection = (resource) => {
//         setSelectedResources((prev) => ({
//             ...prev,
//             [currentLabelName]: resource,
//         }));
//         setShowResources(false);
//     };

//     useEffect(() => {
//         if (selectedLocker) {
//             const fetchResources = async () => {
//                 try {
//                     const token = Cookies.get("authToken");
//                     const response = await fetch(
//                         `host/get-resources-user-locker/?locker_name=${selectedLocker}`.replace(/host/, frontend_host),
//                         {
//                             method: "GET",
//                             headers: {
//                                 Authorization: `Basic ${token}`,
//                                 "Content-Type": "application/json",
//                             },
//                         }
//                     );
//                     if (!response.ok) {
//                         throw new Error("Failed to fetch resources");
//                     }

//                     const data = await response.json();
//                     if (data.success) {
//                         setResources(data.resources);
//                     } else {
//                         setError(data.message || "Failed to fetch resources");
//                     }
//                 } catch (error) {
//                     setError("An error occurred while fetching resources");
//                 }
//             };

//             const fetchVnodeResources = async () => {
//                 try {
//                   const token = Cookies.get("authToken");
//                   const params = new URLSearchParams({ host_locker_id: locker.locker_id });

//                   const response = await fetch(
//                     `host/get-vnodes/?${params}`.replace(/host/, frontend_host),
//                     {
//                       method: "GET",
//                       headers: {
//                         Authorization: `Basic ${token}`,
//                         "Content-Type": "application/json",
//                       },
//                     }
//                   );
//                   if (!response.ok) {
//                     throw new Error("Failed to fetch resources");
//                   }

//                   const data = await response.json();
//                   console.log("data", data);
//                   console.log("vnodes", data.data);

//                   //if (data.success) {
//                   setVnodeResources(data.data);
//                   //} else {
//                   //setError(data.message || "Failed to fetch resources");
//                   //}
//                   //}
//                 } catch (error) {
//                   console.error("Error fetching resources:", error);
//                   setError("An error occurred while fetching resources");
//                 }
//               };

//             fetchResources();
//             fetchVnodeResources();
//         }
//     }, [selectedLocker]);

//       const combinedResources = [...resources];
//       VnodeResources.forEach(vnode => {
//         combinedResources.push(vnode.resource);
//       });

//     // const fetchCombinedResources = async () => {
//     //     try {
//     //         const token = Cookies.get("authToken");
//     //         const lockerResponse = await fetch(
//     //             `host/get-resource-by-user-by-locker/?locker_name=${selectedLocker}`.replace(/host/, frontend_host),
//     //             {
//     //                 method: "GET",
//     //                 headers: {
//     //                     "Content-Type": "application/json",
//     //                     Authorization: `Basic ${token}`,
//     //                 },
//     //             }
//     //         );
//     //         const vnodeResponse = await fetch(
//     //             `host/get-vnodes/?host_locker_id=${locker.locker_id}`.replace(/host/, frontend_host),
//     //             {
//     //                 method: "GET",
//     //                 headers: {
//     //                     "Content-Type": "application/json",
//     //                     Authorization: `Basic ${token}`,
//     //                 },
//     //             }
//     //         );

//     //         if (!lockerResponse.ok || !vnodeResponse.ok) {
//     //             throw new Error("Failed to fetch resources");
//     //         }

//     //         const lockerData = await lockerResponse.json();
//     //         const vnodeData = await vnodeResponse.json();
//     //         if (lockerData.success && vnodeData.data) {
//     //             console.log(vnodeData.data);
//     //             const combinedResources = [
//     //                 ...lockerData.resources,
//     //                 ...vnodeData.data
//     //             ];
//     //             setResources(combinedResources);
//     //         } else {
//     //             setError("Failed to fetch combined resources");
//     //         }
//     //     } catch (error) {
//     //         setError("An error occurred while fetching resources");
//     //     }
//     // };

//     // useEffect(() => {
//     //     if (selectedLocker) {
//     //         fetchCombinedResources();
//     //     }
//     // }, [selectedLocker]);

//     const handleSubmit = async () => {
//         try {
//             const newResourcesData = {
//                 Transfer: [],
//                 Share: [],
//             };

//             console.log("res", res);
//             const termsValuePayload = {
//                 ...Object.fromEntries(
//                     Object.entries(termValues).map(([key, value]) => {
//                         const obligation = res.obligations.find(ob => ob.labelName === key);
//                         const initialValue = obligation?.value || "";

//                         if (obligation.typeOfAction === "file") {
//                             const resource = selectedResources[key];
//                             console.log("resource in payload", resource);
//                             const initialResourcePointer = initialValue.split(";")[0];

//                             if (resource && resource.i_node_pointer && resource.i_node_pointer !== initialResourcePointer) {
//                                 // if (obligation.typeOfSharing === "transfer" && obligation.value.endsWith('T')) {
//                                     if (obligation.typeOfSharing === "transfer" ) {
//                                         //if (!updatedResourcesData.transfer.includes(resource.i_node_pointer)) {
//                                             // newResourcesData.Transfer.push(resource.i_node_pointer);
//                                        // }
//                                 // } else if (obligation.typeOfSharing === "share" && obligation.value.endsWith('T')) {
//                                 } else if (obligation.typeOfSharing === "share" ) {
//                                     //if (!updatedResourcesData.share.includes(resource.i_node_pointer)) {
//                                         // newResourcesData.Share.push(resource.i_node_pointer);
//                                     //}
//                                 }

//                                 return [key, `${resource.i_node_pointer.replace(/;[ ]?[TFR]$/, "")}; F`];
//                             } else {
//                                 return [key, initialValue];
//                             }
//                         } else if (value !== initialValue) {
//                             return [key, `${value.replace(/;[ ]?[TFR]$/, "")}; F`];
//                         } else {
//                             return [key, initialValue];
//                         }
//                     })
//                 ),
//             };
//             // setResourcesData(updatedResourcesData);
//             const payload = {
//                 connection_name: connectionName,
//                 host_locker_name: hostLockerName,
//                 guest_locker_name: guestLockerName,
//                 host_user_username: hostUserUsername,
//                 guest_user_username: guestUserUsername,
//                 terms_value: termsValuePayload,
//                 resources: newResourcesData,
//             };
//             // console.log("resourcesData", payload.resources);
//             // console.log("resources", resources);
//             // console.log("termsValue", payload.terms_value);
//             console.log("payload", payload);
//             const token = Cookies.get("authToken");

//             // if (resourcesData.Transfer.length > 0) {
//             //     const transferResponse = await fetch(`localhost:8000/transfer-resource/`, {
//             //         method: "POST",
//             //         headers: {
//             //             "Content-Type": "application/json",
//             //             Authorization: `Basic ${token}`,
//             //         },
//             //         body: JSON.stringify({ ...payload, resources: resourcesData.Transfer }),
//             //     });

//             //     if (!transferResponse.ok) {
//             //         throw new Error("Failed to transfer resources");
//             //     }
//             // }

//             // if (resourcesData.Share.length > 0) {
//             //     const shareResponse = await fetch(`localhost:8000/share-resource/`, {
//             //         method: "POST",
//             //         headers: {
//             //             "Content-Type": "application/json",
//             //             Authorization: `Basic ${token}`,
//             //         },
//             //         body: JSON.stringify({ ...payload, resources: resourcesData.Share }),
//             //     });

//             //     if (!shareResponse.ok) {
//             //         throw new Error("Failed to share resources");
//             //     }
//             // }

//             const updateResponse = await fetch(
//                 `host/update-connection-terms/`.replace(/host/, frontend_host),
//                 {
//                     method: "PATCH",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Basic ${token}`,
//                     },
//                     body: JSON.stringify(payload),
//                 }
//             );

//             if (!updateResponse.ok) {
//                 throw new Error("Failed to update terms");
//             }

//             const data = await updateResponse.json();
//             if (data.success) {
//                 navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
//             } else {
//                 throw new Error(data.error || "Failed to update terms");
//             }
//         } catch (err) {
//             console.error("Error during submission:", err);
//             setError(err.message);
//         }
//     };

//     console.log("resources list", resources);

//     const content = (
//         <>
//             <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
//             <div className="description">
//                 {curruser ? curruser.description : "None"}</div>
//                 <br></br>
//             <div className="connection-details">Connection Name: {connectionName} <br></br>
//             {connectionDescription}<br></br>
//                 Guest: {guestUserUsername} --&gt;Host: {hostUserUsername}</div>

//         </>
//     );
//     console.log("res without submit", res);
//     console.log("resources normal", resources);
//     console.log("combined", resources);
//     // console.log("resourcesData", resourcesData);
//     return (
//         <div>
//             <Navbar content={content} />

//             <div className={showResources ? "split-view" : ""}>
//                 <div className="table-container">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Sno</th>
//                                 <th>Name</th>
//                                 <th>purpose</th>
//                                 <th>Enter value</th>
//                                 <th>Host Privileges</th>
//                                 <th>Status</th> {/* New column for Status */}
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {res?.obligations.map((obligation, index) => (
//                                 <tr key={index}>
//                                     <td>{index + 1}</td>
//                                     <td>{obligation.labelName}</td>
//                                     <td>{obligation.purpose}</td>
//                                     <td>{renderInputField(obligation)}</td>
//                                     {/* <td>{obligation.labelDescription}</td> */}
//                                     <td>{obligation.hostPermissions ? obligation.hostPermissions.join(", ") : "None"}</td>
//                                     <td>{statuses[obligation.labelName] || "Pending"}</td> {/* Display status */}
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>

//                 {showResources && (
//                     <div className="resource-container">
//                         <h3>Select Resource for {currentLabelName}</h3>
//                         {error && <p className="error">{error}</p>}

//                         <ul>
//                             {combinedResources.map((resource, index) => (
//                                 <li key={index}>
//                                     <div>
//                                         <label>
//                                             <input
//                                                 type="radio"
//                                                 name="selectedResource"
//                                                 value={resource.document_name} //i changed here
//                                                 checked={
//                                                     selectedResources[currentLabelName]
//                                                         ?.i_node_pointer === resource.i_node_pointer
//                                                 }
//                                                 onChange={() => handleResourceSelection(resource)}
//                                             />
//                                             {resource.document_name}
//                                         </label>
//                                     </div>
//                                 </li>
//                             ))}
//                         </ul>
//                         <button onClick={() => setShowResources(false)}>Select</button>
//                     </div>
//                 )}
//             </div>

//             <div>
//                 {<button onClick={handleSubmit}>Submit</button>}
//             </div>
//         </div>
//     );
// };

//permission table

import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./ViewTermsByType.css";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import Modal from "../Modal/Modal.jsx";
import { FaArrowCircleRight, FaUserCircle, FaRegUserCircle } from 'react-icons/fa';


export const ViewTermsByType = () => {

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [showResources, setShowResources] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [error, setError] = useState(null);
  const [res, setRes] = useState(null);
  const [resources, setResources] = useState([]);
  const [termValues, setTermValues] = useState({});
  const [selectedResources, setSelectedResources] = useState({});
  const [currentLabelName, setCurrentLabelName] = useState(null);
  const [VnodeResources, setVnodeResources] = useState([]);
  const [permissions, setPermissions] = useState({}); // New state for permissions
  const [statuses, setStatuses] = useState({}); // To store the statuses
  // const [resourcesData, setResourcesData] = useState({
  //     share: [],
  //     transfer: [],
  // });
  const [permissionsData, setPermissionsData] = useState([]);
  const [globalTemplates, setGlobalTemplates] = useState([]);
  const [terms, setTerms] = useState([]);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [moreDataTerms, setMoreDataTerms] = useState([]);
  const [xnodes, setXnodes] = useState([]);
  // const [correspondingNames, setCorrespondingNames] = useState([]);
  const [showPageInput, setShowPageInput] = useState(false);
  const [fromPage, setFromPage] = useState('');
  const [toPage, setToPage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [selection, setSelection] = useState({});

  const [selectedResourceId2, setSelectedResourceId2] = useState(null);
  const [selection2, setSelection2] = useState({});
  const [selectedResources2, setSelectedResources2] = useState({});
  const [showPageInput2, setShowPageInput2] = useState(false);
  const [showResources2, setShowResources2] = useState(false);
  const [statuses2, setStatuses2] = useState({});

  // const [currentLabelName2, setCurrentLabelName2] = useState(null);

  const [hostObligationMessage, setHostObligationMessage] = useState('');
  const [activeTab, setActiveTab] = useState("guest");
  const [guestToHostTerms, setGuestToHostTerms] = useState([]);
  const [hostToGuestTerms, setHostToGuestTerms] = useState([]);
  const [guestToHostObligations, setGuestToHostObligations] = useState([]);
  const [hostToGuestObligations, setHostToGuestObligations] = useState([]);
  const [showRevokeConsentModal, setShowRevokeConsentModal] = useState(false);

  const {
    connectionName,
    connectionDescription,
    hostLockerName,
    guestLockerName,
    hostUserUsername,
    guestUserUsername,
    hostLocker,
    locker,
    connection_id,
    guest_locker_id,
    host_locker_id,
    connection,
    guestLocker
  } = location.state || {};


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
    navigate(`/view-locker?param=${Date.now()}`, { state: { locker: locker } });
  };

  // console.log("start", guest_locker_id, host_locker_id, locker);
  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }

    const fetchConnectionDetails = async () => {
      const connectionTypeName = connectionName?.split("-").shift().trim();

      const connection_type_name = connectionTypeName;
      const host_locker_name = hostLockerName;
      const guest_locker_name = locker.name;
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
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };


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

    //fetch terms from the api
    const fetchObligations = async () => {
      try {
        const token = Cookies.get("authToken");
        const connectionTypeName = connectionName.split("-").shift().trim();
        const apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${hostUserUsername}&host_locker_name=${hostLockerName}`;

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
          console.log("Fetched data by connection type:", data.data); // Log to confirm structure

          // Access nested obligations arrays
          const guestToHostObligations = data.data.obligations?.guest_to_host || [];
          const hostToGuestObligations = data.data.obligations?.host_to_guest || [];

          if (guestToHostObligations.length || hostToGuestObligations.length) {
            // Combine obligations if you need a single array, or set them separately as needed
            setTerms({ guestToHost: guestToHostObligations, hostToGuest: hostToGuestObligations });
            console.log("Guest to Host Obligations 1: terms", guestToHostObligations);
            console.log("Host to Guest Obligations 1: terms", hostToGuestObligations);

            setGuestToHostTerms(guestToHostObligations);
            setHostToGuestTerms(hostToGuestObligations);

          } else {
            console.error("No obligations found in data.data.obligations");
            setError("No obligations available in the fetched data");
          }
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        console.error("Error fetching obligations:", err.message);
        setError(err.message);
      }
    };


    const fetchTerms = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          `${frontend_host}/get-terms-value/?host_user_username=${hostUserUsername}&guest_user_username=${guestUserUsername}&host_locker_name=${hostLockerName}&connection_name=${connectionName}&guest_locker_name=${guestLockerName}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch terms");
        }

        const data = await response.json();
        console.log("Fetched data:", data); // Log entire data to check its structure

        if (data.success) {
          const obligations = data.terms.obligations || [];

          // const guestObligations = obligations.filter(
          //   (obligation) => obligation.from === "GUEST" && obligation.to === "HOST"
          // );

          // const hostObligations = obligations.filter(
          //   (obligation) => obligation.from === "HOST" && obligation.to === "GUEST"
          // );
          const hostObligations = obligations.host_to_guest;
          const guestObligations = obligations.guest_to_host;

          // // Check if obligations exist in data.data
          // if (data && data.terms.obligations) {
          //   console.log("Obligations found:", data.terms.obligations); // Confirm obligations structure
          //   console.log("data.data.terms", data.terms);
          //   // Access guest_to_host and host_to_guest arrays
          //   const guestObligations = data.data.obligations.guest_to_host || [];
          //   const hostObligations = data.data.obligations.host_to_guest || [];

          // Log obligations arrays to verify
          console.log("Guest to Host Obligations 2:", guestObligations);
          console.log("Host to Guest Obligations 2:", hostObligations);

          setGuestToHostObligations(guestObligations);
          setHostToGuestObligations(hostObligations);

          // Initialize additional states based on obligations
          const initialValues = {};
          const initialResources = {};
          const statusMap = {};

          // Loop through guest and host obligations
          // [...guestObligations, ...hostObligations].forEach((obligation) => {
          guestObligations.forEach((obligation) => {
            initialValues[obligation.labelName] = obligation.value || "";
            statusMap[obligation.labelName] = obligation.value?.endsWith("T")
              ? "Approved"
              : obligation.value?.endsWith("R")
                ? "Rejected"
                : "Pending";

            if (obligation.typeOfAction === "file" && obligation.value) {
              const [id] = obligation.value.split(";");
              initialResources[obligation.labelName] = {
                id,
                i_node_pointer: obligation.i_node_pointer,
                typeOfSharing: obligation.typeOfSharing,
              };
            }
          });

          setRes(data.terms);
          setTermValues(initialValues);
          setSelectedResources(initialResources);
          setStatuses(statusMap);
          setPermissions(data.terms.permissions.guest_to_host);
          console.log("check", data.terms.permissions.guest_to_host?.canShareMoreData);
        } else {
          console.error("No obligations found in data.data.obligations");
          setError("No obligations available in the fetched data");
        }
      } catch (err) {
        console.error("Error fetching terms:", err.message);
        setError(err.message);
      }
    };



    // const fetchPermissionsData = async () => {
    //   // Placeholder for future implementation
    // };
    const fetchPermissionsData = async () => {
      try {
        const token = Cookies.get("authToken");
        const connectionId = connection_id;
        const response = await fetch(
          `host/get-extra-data?connection_id=${connectionId}`.replace(
            /host/,
            frontend_host
          ),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("");
        }
        const data = await response.json();
        if (data.success) {
          // Create an array from the shared_more_data_terms object
          console.log(data.shared_more_data_terms);
          const sharedData = Object.entries(data.shared_more_data_terms).map(
            ([key, value], index) => ({
              sno: index + 1,
              labelName: key,
              dataElement: value.enter_value,
              purpose: value.purpose,
              action: value.typeOfValue,
              share: value.typeOfShare,
            })
          );
          setPermissionsData(sharedData);
          console.log("permissionData", sharedData);
          const statusMap2 = {}
          sharedData.forEach((permission) => {
            console.log("perm,", permission);

            statusMap2[permission.labelName] = permission.dataElement.endsWith("T")
              ? "Approved"
              : permission.dataElement.endsWith("R")
                ? "Rejected"
                : "Pending";

          });
          setStatuses2(statusMap2);
          console.log(statusMap2, "map");
        } else {
          setError(data.error || "No permissions data found");
        }
      } catch (err) {
        setError(err.message);
      }
    };


    const fetchResources = async () => {
      if (selectedLocker) {
        try {
          const token = Cookies.get("authToken");
          const response = await fetch(
            `host/get-resources-user-locker/?locker_name=${selectedLocker}`.replace(
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
            throw new Error("Failed to fetch resources");
          }

          const data = await response.json();
          if (data.success) {
            setResources(data.resources);
          } else {
            setError(data.message || "Failed to fetch resources");
          }
        } catch (error) {
          setError("An error occurred while fetching resources");
        }
      }
    };

    const fetchVnodeResources = async () => {
      if (selectedLocker) {
        try {
          const token = Cookies.get("authToken");
          const params = new URLSearchParams({
            host_locker_id: locker.locker_id,
          });

          const response = await fetch(
            `host/get-vnodes/?${params}`.replace(/host/, frontend_host),
            {
              method: "GET",
              headers: {
                Authorization: `Basic ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch resources");
          }

          const data = await response.json();
          //   console.log("data", data);
          //   console.log("vnodes", data.data);

          //if (data.success) {
          setVnodeResources(data.data);
          //} else {
          //setError(data.message || "Failed to fetch resources");
          //}
          //}
        } catch (error) {
          console.error("Error fetching resources:", error);
          setError("An error occurred while fetching resources");
        }
      }
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
        // console.log("xnode data", data);

        if (data.xnode_list) {
          setXnodes(data.xnode_list);
          // setCorrespondingNames(data.corresponding_document_name_list);
        } else {
          setError(data.message || "Failed to fetch Xnodes");
        }
      } catch (error) {
        console.error("Error fetching Xnodes:", error);
        setError("An error occurred while fetching Xnodes");
      }
    };

    fetchPermissionsData();
    fetchTerms();
    fetchGlobalTemplates();
    fetchObligations();
    fetchConnectionDetails();
    fetchResources();
    fetchXnodes();
    fetchVnodeResources();
  }, [curruser, navigate, hostUserUsername, guestLockerName, connectionName, selectedLocker]);

  useEffect(() => {
    if (connectionDetails) {
      const { revoke_guest, revoke_host } = connectionDetails;
      // console.log(revoke_host, revoke_guest);
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

  const handleInputChange = (labelName, value) => {
    setTermValues((prev) => ({
      ...prev,
      [labelName]: value,
    }));
  };

  // console.log("permissionsData", permissionsData);
  const renderInputField = (obligation) => {
    const strippedValue = termValues[obligation.labelName]
      // ?.replace(/;[TFR]$/, "");
      ?.replace(/;[ ]?[TFR]$/, "");
    // console.log(strippedValue, "strippedValue", termValues);
    switch (obligation.typeOfAction) {
      case "text":
        return (
          <input
            type="text"
            placeholder="Enter value"
            value={strippedValue || ""}
            onChange={(e) =>
              handleInputChange(obligation.labelName, e.target.value)
            }
          />
        );
      case "file":
        // console.log("name", selectedResources[obligation.labelName]);
        // console.log("name 2", selectedResources);
        // console.log("selection name", selection);
        return (
          <button onClick={() => handleButtonClick(obligation.labelName)}>
            {termValues[obligation.labelName]?.split(";")[0]?.split("|")[0] ||
              "Select Resource"}
          </button>
        );
      case "date":
        return (
          <input
            type="date"
            value={strippedValue || ""}
            onChange={(e) =>
              handleInputChange(obligation.labelName, e.target.value)
            }
          />
        );
      default:
        return null;
    }
  };

  const handleButtonClick = (labelName) => {
    setSelectedLocker(guestLockerName);
    setShowResources(true);
    setCurrentLabelName(labelName);
  };

  const handleResourceSelection = (resource) => {
    // console.log("inside",resource);
    // initialResources[obligation.labelName] = {
    //                 document_name,
    //                 i_node_pointer: obligation.i_node_pointer,
    //                 typeOfSharing: obligation.typeOfSharing,
    //               };

    setSelection((prev) => ({
      ...prev,
      [currentLabelName]: { id: resource.id, resource_name: resource.resource_name, }
    }));
    setSelectedResources((prev) => ({
      ...prev,
      [currentLabelName]: resource,
    }));
    setShowResources(true);
    setSelectedResourceId(resource.id);
    setShowPageInput(true);
    // console.log("resources selected", selectedResources);
    // console.log("selection", selection);
  };


  //********************************************************** */
  const handleButtonClick2 = (labelName) => {
    setSelectedLocker(guestLockerName);
    setShowResources2(true);
    setCurrentLabelName(labelName);
  };

  const handleResourceSelection2 = (resource) => {
    // console.log("inside",resource);
    // initialResources[obligation.labelName] = {
    //                 document_name,
    //                 i_node_pointer: obligation.i_node_pointer,
    //                 typeOfSharing: obligation.typeOfSharing,
    //               };

    setSelection2((prev) => ({
      ...prev,
      [currentLabelName]: { id: resource.id, resource_name: resource.resource_name, }
    }));
    setSelectedResources2((prev) => ({
      ...prev,
      [currentLabelName]: resource,
    }));
    setShowResources2(false);
    setSelectedResourceId2(resource.id);
    setShowPageInput2(true);
    // console.log("resources selected", selectedResources);
    // console.log("selection", selection);
  };

  const handlePageSubmit2 = async () => {
    if (!fromPage || !toPage) {
      setErrorMessage("Both from_page and to_page are required.");
      return;
    }
    const token = Cookies.get("authToken");
    try {
      const response = await fetch('host/get-total-pages/'.replace(
        /host/,
        frontend_host
      ), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${token}`,

        },
        body: JSON.stringify({
          xnode_id: selectedResourceId2,
          from_page: parseInt(fromPage, 10),
          to_page: parseInt(toPage, 10)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {

        const resource = selection2[currentLabelName]; // Current selected resource
        // console.log("in page res", resource);
        const termValue = `${resource.resource_name}|${resource.id},(${fromPage}:${toPage}); F`;
        // console.log(termValue, "termValue");


        appendPagesToTerms2(termValue);


        setShowPageInput2(false);
        setErrorMessage(null);
        setFromPage('');
        setToPage('');
      } else {

        setErrorMessage(data.error);
      }
    } catch (error) {
      setErrorMessage("An error occurred while validating pages.");
    }
  };

  // const appendPagesToTerms2 = (termValue) => {
  // console.log("more", currentLabelName, termValue)
  // console.log(moreDataTerms, "before update more term values")
  // setMoreDataTerms((prevTerms) =>
  //   prevTerms.map((term) =>
  //     term.labelName === currentLabelName
  //       ? { ...term, enter_value: termValue } // Update only 'enter_value'
  //       : term // Keep all other terms and fields intact
  //   )
  // );
  // console.log("updated more term values", moreDataTerms);
  // };

  const appendPagesToTerms2 = (newValue) => {
    console.log("Label to update:", currentLabelName);
    console.log("New value:", newValue);

    setMoreDataTerms((prevTerms) => {
      const updatedTerms = prevTerms.map((term) => {
        console.log("Checking term:", term);
        if (term.labelName.trim().toLowerCase() === currentLabelName.trim().toLowerCase()) {
          console.log("Match found, updating enter_value for:", term.labelName);
          return { ...term, enter_value: newValue }; // Update only 'enter_value'
        }
        return term; // Keep all other terms and fields intact
      });

      console.log("Updated Terms:", updatedTerms);
      return updatedTerms;
    });
  };

  //******************************************************** */
  // useEffect(() => {

  // }, [selectedLocker]);

  const combinedResources = [...resources];
  VnodeResources.forEach((vnode) => {
    combinedResources.push(vnode.resource);
  });

  const handlePageSubmit = async () => {
    if (!fromPage || !toPage) {
      setErrorMessage("Both from_page and to_page are required.");
      return;
    }
    const token = Cookies.get("authToken");
    try {
      const response = await fetch('host/get-total-pages/'.replace(
        /host/,
        frontend_host
      ), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${token}`,

        },
        body: JSON.stringify({
          xnode_id: selectedResourceId,
          from_page: parseInt(fromPage, 10),
          to_page: parseInt(toPage, 10)
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {

        const resource = selection[currentLabelName]; // Current selected resource
        // console.log("in page res", resource);
        const termValue = `${resource.resource_name}|${resource.id},(${fromPage}:${toPage}); F`;
        // console.log(termValue, "termValue");


        appendPagesToTerms(termValue);


        setShowPageInput(false);
        setErrorMessage(null);
        setShowResources(false)
        setFromPage('');
        setToPage('');
      } else {

        setErrorMessage(data.error);
      }
    } catch (error) {
      setErrorMessage("An error occurred while validating pages.");
    }
  };

  const appendPagesToTerms = (termValue) => {
    // console.log("in append", termValue);
    setTermValues((prevTerms) => ({
      ...prevTerms,
      [currentLabelName]: termValue,
    }));
    // console.log("updated term values", termValues);
  };


  // const fetchCombinedResources = async () => {
  //     try {
  //         const token = Cookies.get("authToken");
  //         const lockerResponse = await fetch(
  //             `host/get-resource-by-user-by-locker/?locker_name=${selectedLocker}`.replace(/host/, frontend_host),
  //             {
  //                 method: "GET",
  //                 headers: {
  //                     "Content-Type": "application/json",
  //                     Authorization: `Basic ${token}`,
  //                 },
  //             }
  //         );
  //         const vnodeResponse = await fetch(
  //             `host/get-vnodes/?host_locker_id=${locker.locker_id}`.replace(/host/, frontend_host),
  //             {
  //                 method: "GET",
  //                 headers: {
  //                     "Content-Type": "application/json",
  //                     Authorization: `Basic ${token}`,
  //                 },
  //             }
  //         );

  //         if (!lockerResponse.ok || !vnodeResponse.ok) {
  //             throw new Error("Failed to fetch resources");
  //         }

  //         const lockerData = await lockerResponse.json();
  //         const vnodeData = await vnodeResponse.json();
  //         if (lockerData.success && vnodeData.data) {
  //             console.log(vnodeData.data);
  //             const combinedResources = [
  //                 ...lockerData.resources,
  //                 ...vnodeData.data
  //             ];
  //             setResources(combinedResources);
  //         } else {
  //             setError("Failed to fetch combined resources");
  //         }
  //     } catch (error) {
  //         setError("An error occurred while fetching resources");
  //     }
  // };

  // useEffect(() => {
  //     if (selectedLocker) {
  //         fetchCombinedResources();
  //     }
  // }, [selectedLocker]);

  const handleSubmit = async () => {
    try {
      const newResourcesData = {
        Transfer: [],
        Share: [],
        Confer:[]
      };

      // Traverse through permissionsData
      const canShareMoreData = termValues["canShareMoreData"] || {};
      permissionsData.forEach((permission) => {
        const { labelName, dataElement, purpose, action, share } = permission;

        canShareMoreData[labelName] = {
          enter_value: dataElement,
          purpose: purpose,
          typeOfValue: action,
          typeOfSharing: share,
        };
      });


      console.log("check2");
      // console.log("updated term values in submit", termValues);
      const termsValuePayload = {

        ...Object.fromEntries(
          Object.entries(termValues).map(([key, value]) => {
            // console.log("updated term values in submit", termValues);
            const obligation = guestToHostObligations.find(
              (ob) => ob.labelName === key
            );
            const initialValue = obligation?.value || "";
            // console.log(initialValue, "initial Value");

            if (obligation.typeOfAction === "file") {
              const initialVal = initialValue?.split("|")[1]?.split(",")[0] || "";

              // console.log("initialVal", initialVal, initialValue);
              const resource = selection[key];
              // const v = `${resource?.resource_name+"|"+resource?.id,fromPage+":"+toPage}`;
              // console.log("resource in payload", resource);
              //   const initialResourcePointer = initialValue.split(";")[0];
              //   console.log(initialResourcePointer);
              // if (
              //   resource &&
              //   resource.id && resource.resource_name && 
              //   v !== initialValue?.split(";")[0]
              // ) {
              //     // if (obligation.typeOfSharing === "transfer" && obligation.value.endsWith('T')) {
              //     if (obligation.typeOfSharing === "transfer") {
              //       //if (!updatedResourcesData.transfer.includes(resource.i_node_pointer)) {
              //       // newResourcesData.Transfer.push(resource.i_node_pointer);
              //       // }
              //       // } else if (obligation.typeOfSharing === "share" && obligation.value.endsWith('T')) {
              //     } else if (obligation.typeOfSharing === "share") {
              //       //if (!updatedResourcesData.share.includes(resource.i_node_pointer)) {
              //       // newResourcesData.Share.push(resource.i_node_pointer);
              //       //}
              //     }
              // return [
              //   key,
              //   `${resource.resource_name+"|"+resource.id,fromPage+":"+toPage}; F`,
              // ];
              // } else {
              return [key, value];
              //  }
            } else if (value !== initialValue) {
              return [key, `${value.replace(/;[ ]?[TFR]$/, "")}; F`];
            } else {
              return [key, initialValue];
            }
          })
        ),
      };

      const updatedTermsValue = {
        ...termsValuePayload, // Update all the terms that have changed
        canShareMoreData: canShareMoreData, // Keep canShareMoreData intact
      };

      const token = Cookies.get("authToken");
      // setResourcesData(updatedResourcesData);
      const payload = {
        connection_name: connectionName,
        host_locker_name: hostLockerName,
        guest_locker_name: guestLockerName,
        host_user_username: hostUserUsername,
        guest_user_username: guestUserUsername,
        terms_value: updatedTermsValue,
        resources: newResourcesData,
      };
      // console.log("resourcesData", payload.resources);
      // console.log("resources", resources);
      // console.log("termsValue", payload.terms_value);
      console.log("payload", payload);

      // if (resourcesData.Transfer.length > 0) {
      //     const transferResponse = await fetch(`localhost:8000/transfer-resource/`, {
      //         method: "POST",
      //         headers: {
      //             "Content-Type": "application/json",
      //             Authorization: `Basic ${token}`,
      //         },
      //         body: JSON.stringify({ ...payload, resources: resourcesData.Transfer }),
      //     });

      //     if (!transferResponse.ok) {
      //         throw new Error("Failed to transfer resources");
      //     }
      // }

      // if (resourcesData.Share.length > 0) {
      //     const shareResponse = await fetch(`localhost:8000/share-resource/`, {
      //         method: "POST",
      //         headers: {
      //             "Content-Type": "application/json",
      //             Authorization: `Basic ${token}`,
      //         },
      //         body: JSON.stringify({ ...payload, resources: resourcesData.Share }),
      //     });

      //     if (!shareResponse.ok) {
      //         throw new Error("Failed to share resources");
      //     }
      // }

      const updateResponse = await fetch(
        `host/update-connection-terms/`.replace(/host/, frontend_host),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Failed to update terms");
      }

      const data = await updateResponse.json();
      if (data.success) {
        navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
      } else {
        throw new Error(data.error || "Failed to update terms");
      }
    } catch (err) {
      console.error("Error during submission:", err);
      setError(err.message);
    }
  };

  // console.log("resources list", resources);
  // State for storing user inputs for moreDataTerms

  // Function to handle changes in the permission table
  const handleMoreDataInputChange = (index, field, value) => {
    // Copy the current state of moreDataTerms
    const updatedMoreDataTerms = [...moreDataTerms];

    // Update the specific field (labelName, purpose, or enter_value) for the given index
    updatedMoreDataTerms[index] = {
      ...updatedMoreDataTerms[index],
      [field]: value,
    };

    // Update the state
    setMoreDataTerms(updatedMoreDataTerms);
  };

  // Function to handle action type change
  const handleActionTypeChange = (index, newType) => {
    const updatedMoreDataTerms = [...moreDataTerms];
    updatedMoreDataTerms[index].type = newType;
    setMoreDataTerms(updatedMoreDataTerms);
  };

  // Function to handle form submission
  const handleMoreSubmit = async () => {
    // Build extraDataArray from moreDataTerms
    const extraDataArray = moreDataTerms.map((term) => ({
      labelName: term.labelName || "", // If labelName is not provided, use an empty string
      enter_value: term.enter_value || "", // If value is not provided, use an empty string
      purpose: term.purpose || "Purpose for the document", // Default purpose
      typeOfValue: term.type || "text", // Default to 'text' if no type is selected
      typeOfShare: term.typeOfSharing || "",
      // status: statuses2[term.labelName]||"Pending",
    }));

    const requestBody = {
      connection_name: connectionName,
      host_locker_name: hostLockerName,
      guest_locker_name: guestLockerName,
      host_user_username: hostUserUsername,
      guest_user_username: guestUserUsername,
      extra_data: extraDataArray,
    };

    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`${frontend_host}/update-extra-data/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update extra data");
      }

      const data = await response.json();
      if (data.success) {
        alert("Data updated successfully!");
        navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
      } else {
        alert(data.error || "Error updating data");
      }
    } catch (err) {
      alert(err.message);
    }
  };
  const addMoreDataTerm = () => {
    setMoreDataTerms((prevTerms) => [
      ...prevTerms,
      { labelName: "", purpose: "", enter_value: "", type: "text", typeOfSharing: "share", status: "Pending" }, // Default values
    ]);
  };
  const removeMoreDataTerm = (index) => {
    setMoreDataTerms((prevTerms) => prevTerms.filter((_, i) => i !== index));
  };

  const updateTerm = (index, field, value) => {
    setMoreDataTerms((prevTerms) => {
      const updatedTerms = [...prevTerms];
      updatedTerms[index] = {
        ...updatedTerms[index],
        [field]: value, // Update the specific field based on the input
      };
      return updatedTerms;
    });
  };

  const navigateToConnectionTerms = (connection) => {
    // console.log("print", connection);
    // Check if connection is a string
    if (typeof connection === "string") {
      const connectionName = connection; // Treat the string as the connection_name
      const connectionTypeName = connectionName.split("-").shift().trim();

      // console.log("conntype", connectionTypeName);

      navigate("/show-connection-terms", {
        state: {
          connectionName: connectionName, // Pass the string as connectionName
          connectionDescription: connectionDescription,
          hostLockerName: hostLockerName,
          connectionTypeName,
          guestLockerName:guestLockerName,
          hostUserUsername: hostUserUsername,
          guestUserUsername: guestUserUsername,
          locker: locker.name,
          showConsent: false,
          lockerComplete: locker,
          hostLocker: hostLocker,
          guestLocker: guestLocker,
        },
      });
    } else {
      console.error(
        "Expected connection to be a string, but received:",
        connection
      );
    }
  };

  const handleConsentAndInfo = (connection) => {
    if (typeof connection === "string") {
      const connectionName = connection; // Treat the string as the connection_name
      const connectionTypeName = connectionName.split("-").shift().trim();

      console.log("Navigating with state:", {
        connectionName,
        connectionTypeName,
        guest_locker_id: connection.guest_locker?.id,
        host_locker_id: connection.host_locker?.id,
        connection_id: connection.connection_id,
      });

      navigate("/show-connection-terms", {
        state: {
          connectionName: connectionName, // Pass the string as connectionName
          connectionDescription: connectionDescription,
          hostLockerName: hostLockerName,
          connectionTypeName,
          guestLockerName:guestLockerName,
          hostUserUsername: hostUserUsername,
          guestUserUsername: guestUserUsername,
          locker: locker.name,
          showConsent: true,
          guest_locker_id,
          host_locker_id,
          connection_id,
          lockerComplete: locker,
          hostLocker: hostLocker,
          guestLocker: guestLocker,
        },
      });
    }
  };

  // const handlePermissionChange = (index, value) => {
  //   const newPermissions = [...permissions];
  //   newPermissions[index] = value;
  //   setPermissions(newPermissions);
  // };

  // const uniqueGlobalConnTypeIds = [...new Set(terms
  //   .filter(term => term.global_conn_type_id !== null)
  //   .map(term => term.global_conn_type_id)
  // )];
  console.log("Terms:", terms); // Check the content of terms

  // Flatten the object (for example, consider guest_to_host)
  const termsArray = [...(terms.guest_to_host || []), ...(terms.host_to_guest || [])];
  // Access guest_to_host array, fallback to empty array

  // Log the termsArray for debugging
  console.log("Terms Array:", termsArray);

  // Ensure you filter and map properly over the array
  const uniqueGlobalConnTypeIds = Array.isArray(termsArray) ? [
    ...new Set(
      termsArray
        .filter(term => term.global_conn_type_id !== null && term.global_conn_type_id !== undefined)
        .map(term => term.global_conn_type_id)
    )
  ] : [];


  console.log("Unique Global Conn Type Ids:", uniqueGlobalConnTypeIds);



  const globalTemplateNames = uniqueGlobalConnTypeIds.map(id => {
    const template = globalTemplates.find(template => template.global_connection_type_template_id === id);
    // console.log(template, "template for id:", id);  

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
  // console.log(uniqueGlobalConnTypeIds, globalTemplates,  globalTemplateNames, "name");
  const allObligationsApproved = () => {
    return res?.guestToHostObligations?.every((obligation) => statuses[obligation.labelName] === "Approved");
  };
  // const handleNavigation = (template) => {
  //   if (template) {
  //     console.log("temp",template);
  //     console.log("id",template.global_connection_type_template_id);
  //     navigate('/GlobalTermsView', {
  //       state: {
  //         connectionTypeName: template.global_connection_type_name,
  //         connectionTypeDescription: template.global_connection_type_description,
  //         template_Id: template.global_connection_type_template_id,
  //         hide: true,
  //       },
  //     });
  //   }
  // };


  const handleClick = async (xnode_id) => {

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
      // console.log(data);
      const { link_To_File } = data;

      if (link_To_File) {
        // console.log("link to file", link_To_File);
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

  // console.log("selection", selection);
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

  console.log("selection", selection);
  const handleRevokeConsentConfirm = () => {
    setShowRevokeConsentModal(false); // Close the modal
    handleConsentAndInfo(connectionName); // Execute revoke consent action
  };
  const content = (
    <>
      {/* <div className="navbarBrand">
        {curruser ? capitalizeFirstLetter(curruser.username) : "None"}
      </div>
      <div className="description">
        {curruser ? curruser.description : "None"}
      </div> */}

      <div className="navbarBrands">
        {connectionName}
      </div>

      {/* <br></br>
      <div className="connection-details">
        Connection Name: {connectionName}
        <button
          className="info-button"
          onClick={() => navigateToConnectionTerms(connectionName)}
          title="Show Connection Terms"
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
          }}
        >
          <i className="fa fa-info-circle" style={{ fontSize: "16px" }}></i>
        </button>
        <button
          //   className="info-button"
          onClick={() => handleConsentAndInfo(connectionName)}
        >
          Revoke Consent
        </button>
        <br></br>
        <>
        <div style={{paddingBottom:"8px"}}>
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
     </span></div></>
        {connectionDescription}
        <br></br>
        <div className="tooltip-container user-container">
          <div className="tooltip user-container">
            <FaUserCircle className="userIcon"/> &nbsp;
            <span className="userName">{renderUserTooltip('guest')} : {guestUserUsername} &nbsp;</span>
          </div>
          <i class="fa-solid fa-right-long"></i> &nbsp;
          <div className="tooltip user-container">
            <FaRegUserCircle className="userIcon"/>&nbsp;
            <span className="userName">{renderUserTooltip('host')} : {hostUserUsername}</span>
          </div>
        </div>
        <div className="tooltip-container user-container">
          <div className="tooltip user-container" onClick={() => navigate("/home")} style={{ cursor: 'pointer' }}>
            <i class="bi bi-person-fill-lock"></i> &nbsp;
            <span className="userName">{renderUserTooltip('guest')} : {guestLockerName} &nbsp;</span>
          </div>
          <i class="fa-solid fa-right-long"></i> &nbsp;
          <div className="tooltip user-container" onClick={() => handleuserclick(hostUserUsername)}>
            <i class="bi bi-person-lock"></i>&nbsp;
            <span className="userName">{renderUserTooltip('host')} : {hostLockerName}</span>
          </div>
        </div>
      </div> */}
    </>
  );

  const tooltips = {
    share: "You are not transferring ownership of this resource, but the recipient can view your resource. The recipient cannot do anything else.",
    transfer: "You are transferring ownership of this resource. You will no longer have access to this resource after this operation.",
    confer: "You are going to transfer ownership of the resource, but the recipient cannot modify the contents. You still have rights over this resource.",
    collateral: "You are temporarily transferring ownership to the recipient. After this operation, you cannot change anything in the resource."
  };

  const renderTooltip = (typeOfShare) => {
    return (
      <span className="tooltiptext">
        {tooltips[typeOfShare] || "Select a type of share to view details."}
      </span>
    );
  };


  console.log(termValues, "term values");
  console.log("moreDataTerms", moreDataTerms);

  const renderPermissionsTable = () => {
    if (permissionsData.length > 0) {
      return (
        <div className="permissions-table">
          <h3>User Permissions</h3>
          <table>
            <thead>
              <tr>
                <th>Sno</th>
                <th>Label Name</th>
                <th>Data Element</th>
                <th>Purpose</th>
                <th>Type of Share</th> {/* New column for Type of Share */}
                <th>Status</th> {/* New column for status dropdown */}
              </tr>
            </thead>
            <tbody>

            </tbody>
          </table>
        </div>
      );
    } else {
      return;
    }
  };

  const handleuserclick = (hostUserUsername) => {
    console.log(hostUserUsername);
    navigate(`/target-user-view`, { state: { user: { username: hostUserUsername } } });
  }




  return (

    <div>

      <Navbar content={content} />

      <div style={{ marginTop: "120px" }}>
        <div className="connection-details">
          Connection Name: {connectionName}
          <button
            className="info-button info"
            onClick={() => navigateToConnectionTerms(connectionName)}
            title="Show Connection Terms"
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              background: "transparent",
              border: "none",
            }}
          >
            <i className="fa fa-info-circle" style={{ fontSize: "16px" }}></i>
          </button>
          <button
    onClick={() => setShowRevokeConsentModal(true)} // Trigger confirmation modal
  >
    Revoke Consent
  </button>
          <br></br>
          <>
            <div className="longconnectionDescription" style={{ paddingBottom: "4px"}}>
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
          {connectionDescription}
          </div></>
          <div className="tooltip-container user-container">
            <div className="tooltips user-container">
              <FaUserCircle className="userIcon" /> &nbsp;
              <span className="userName">{renderUserTooltip('guest')} : {guestUserUsername} &nbsp;</span>
            </div>
            <i class="fa-solid fa-right-long"></i> &nbsp;
            <div className="tooltips user-container">
              <FaRegUserCircle className="userIcon" />&nbsp;
              <span className="userName">{renderUserTooltip('host')} : {hostUserUsername}</span>
            </div>
          </div>
          <div className="tooltip-container user-container">
            <div className="tooltips user-container"  onClick={() => handleGuestClick()} style={{ cursor: 'pointer' }}>
              <i class="bi bi-person-fill-lock"></i> &nbsp;
              <span className="userName">{renderUserTooltip('guest')} : {guestLockerName} &nbsp;</span>
            </div>
            <i class="fa-solid fa-right-long"></i> &nbsp;
            <div className="tooltips user-container" onClick={() => handleHostClick()}>
              <i class="bi bi-person-lock"></i>&nbsp;
              <span className="userName">{renderUserTooltip('host')} : {hostLockerName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* <div className={showResources || showResources2 ? "split-view" : ""}>
        <div className="table-container">
          
          <div className="center">
          {globalTemplateNames.length > 0 && "Regulations used: "}
            <span style={{ fontWeight: "bold" }}>
              {globalTemplateNames.filter(Boolean).map((template, index) => (
                <span key={index}>
                  <span 
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => handleNavigation(template)}
        >
          {template.global_connection_type_name}
        </span>
                  {index < globalTemplateNames.filter(Boolean).length - 1 &&
                    ", "}
                </span>
              ))}
            </span>
          </div>
          
          <h3>Your Obligations</h3> */}


      <div>
        <div className="view-container">
          <div className="b">
            <div className="tabs">
              <div
                className={`tab-header ${activeTab === "guest" ? "active" : ""
                  }`}
                onClick={() => setActiveTab("guest")}
              >
                Guest Data
              </div>
              <div
                className={`tab-header ${activeTab === "host" ? "active" : ""
                  }`}
                onClick={() => navigate("/host-terms-review", {
                  state: {
                    connection: connection,
                    // connectionType: connectionType,
                  },
                })}
              >
                Host Data
              </div>
            </div>
            <div className="tab-content">
              {activeTab === "guest" && (
                <div>

                  <div className={showResources || showResources2 ? "split-view" : ""}>
                    <div className="table-container">

                      <div className="center">
                        {globalTemplateNames.length > 0 && "Regulations used: "}
                        <span style={{ fontWeight: "bold" }}>
                          {globalTemplateNames.filter(Boolean).map((template, index) => (
                            <span key={index}>
                              <span
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handleNavigation(template)}
                              >
                                {template.global_connection_type_name}
                              </span>
                              {index < globalTemplateNames.filter(Boolean).length - 1 &&
                                ", "}
                            </span>
                          ))}
                        </span>
                      </div>

                      <h3>Your Obligations</h3>

                      <table>
                        <thead>
                          <tr>
                            <th>Sno</th>
                            <th>Name</th>
                            <th>purpose</th>
                            <th>Type of share</th>
                            <th>Enter value</th>
                            <th>Host Privileges</th>
                            <th>Status</th> {/* New column for Status */}
                          </tr>
                        </thead>
                        <tbody>
                          {guestToHostObligations.map((obligation, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{obligation.labelName}</td>
                              <td>{obligation.purpose}</td>
                              <td>
                                <div className="tooltips">
                                <span>{obligation.typeOfSharing}</span>
                                  {renderTooltip(obligation.typeOfSharing)}
                                </div>
                              </td>
                              <td>{renderInputField(obligation)}</td>
                              <td>
                                {obligation.hostPermissions
                                  ? obligation.hostPermissions.join(", ")
                                  : "None"}
                              </td>
                              <td>{statuses[obligation.labelName] || "Pending"}</td>{" "}
                              {/* Display status */}
                              {/* <td>{obligation.labelDescription}</td> */}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ margin: "10px 0" }}>
                      <div>
                        {
                          <button style={{ marginLeft: "10px" }} onClick={handleSubmit}>
                            Submit
                          </button>
                        }
                      </div>
                    </div>
                    <div>
                      {showResources && (
                        <div className="resource-container">
                          <h3>Select Resource for {currentLabelName}</h3>
                          {/* {error && <p className="error">{error}</p>} */}

                          <ul>
                            {xnodes.map((resource, index) => (
                              <li key={index}>
                                <div>
                                  <label>
                                    <input
                                      type="radio"
                                      name="selectedResource"
                                      value={resource.resource_name} //i changed here
                                      checked={
                                        selection[currentLabelName]
                                          ?.id === resource.id
                                      }
                                      onClick={() => handleResourceSelection(resource)}
                                    />
                                    {resource.resource_name}  <button id="view" onClick={() => handleClick(resource.id)}>View</button>
                                  </label>

                                </div>
                              </li>
                            ))}
                          </ul>
                          <button className="btn btn-primary clsoeBtn" style={{backgroundColor:"#007bff"}} onClick={() => setShowResources(false)}>Cancel</button>
                        </div>
                      )}
                      {showRevokeConsentModal && (
  <Modal
    message="Are you sure you want to revoke consent?"
    type="confirmation"
    onClose={() => setShowRevokeConsentModal(false)} // Close modal on "No"
    onConfirm={handleRevokeConsentConfirm} // Execute revoke consent action
  />
)}


                      {showResources2 && (
                        <div className="resource-container">
                          <h3 style={{fontWeight:"bold"}}>Select Resource for {currentLabelName}</h3>
                          {/* {error && <p className="error">{error}</p>} */}

                          <ul>
                            {xnodes.map((resource, index) => (
                              <li key={index}>
                                <div>
                                  <label>
                                    <input
                                      type="radio"
                                      name="selectedResource"
                                      value={resource.resource_name} //i changed here
                                      checked={
                                        selection2[currentLabelName]
                                          ?.id === resource.id
                                      }
                                      onClick={() => handleResourceSelection2(resource)}
                                    />
                                    {resource.resource_name}  <button id="view" onClick={() => handleClick(resource.id)}>View</button>
                                  </label>

                                </div>
                              </li>
                            ))}
                          </ul>
                          <button onClick={() => setShowResources2(false)}>Select</button>
                        </div>
                      )}

                    </div>

                  </div>
                  <div>
                  </div>
                  <div>
                    {/* </div>
                  
              </div>
              <div>
                  </div>
                <div>
              {permissions?.canShareMoreData && (
            <div className="table-container">

              <h3>Share more data</h3>
              <table>
                <thead>
                  <tr>
                    <th>Sno</th>
                    <th>Name</th>
                    <th>Purpose</th>
                    <th>Type of Share</th>
                    <th>Value</th>
                    <th>Status</th> 
                  </tr>
                </thead>
                <tbody>
                  
                  {permissionsData.map((permission) => (
                    <tr key={permission.sno}>
                      <td>{permission.sno}</td>
                      <td>{permission.labelName}</td>
                      <td>{permission.purpose || "None"}</td>
                      
                      <td>{permission.action}</td>
                      <td>
                        {permission.dataElement || "None"}
                        
                      </td>
                      <td>Status Active</td> 
                    </tr>
                  ))}
                  {moreDataTerms.map((term, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={term.labelName}
                          onChange={(e) =>
                            updateTerm(index, "labelName", e.target.value)
                          }
                          placeholder="Label Name"
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={term.purpose}
                          onChange={(e) =>
                            updateTerm(index, "purpose", e.target.value)
                          }
                          placeholder="Purpose"
                          required
                        />
                      </td>
                      <td>
                        <select
                          value={term.typeOfShare}
                          onChange={(e) =>
                            updateTerm(index, "typeOfShare", e.target.value)
                          }
                        >
                          <option value="share">Share</option>
                          <option value="transfer">Transfer</option>
                          <option value="confer">Confer</option>
                          <option value="collateral">Collateral</option>
                        </select>
                      </td>
                      <td>
                        
                      
                        <button onClick={() => handleButtonClick(term.labelName)}>
                          {selectedResources[term.labelName]?.id ||
                            "Upload File"}
                        </button>
                      </td>
                      <td>Pending</td> 
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ margin: "20px 0" }}>
                <div>
                  <button style={{ marginRight: "10px" }} onClick={addMoreDataTerm}>
                    Add New Term
                  </button>
                  <button style={{ marginRight: "10px" }} onClick={() => removeMoreDataTerm(moreDataTerms.length - 1)}>
                    Remove Last Term 
                  </button>
                  <button onClick={handleMoreSubmit}>Submit</button>
                </div>
                  
              {allObligationsApproved() && (
            <div>
              <h3 style={{ textAlign: "left", marginTop: "20px" }}>
                Host Obligations
              </h3>
              <p>You will receive a receipt from the host</p>
            </div>
          )}
          
          {hostObligationMessage && (
            <h3 style={{ textAlign: "center", marginTop: "20px" }}>
              Host Obligation: {hostObligationMessage}
            </h3>
          )}
                  
              {isModalOpen && (
                <Modal
                  message={modalMessage.message}
                  onClose={handleCloseModal}
                  type={modalMessage.type}
                />
              )}
    */}


                    {/* {showPageInput && (
            <div className="page-input-modal">
            <div>
              <h3>Enter Page Range for {currentLabelName}</h3>
              {errorMessage && <p className="error">{errorMessage}</p>}
          
              <label>
                From Page:
                <input
                  type="number"
                  value={fromPage}
                  onChange={(e) => setFromPage(e.target.value)}
                  min="1"
                />
              </label>
              <br></br>
          
              <label>
                To Page:
                <input
                  type="number"
                  value={toPage}
                  onChange={(e) => setToPage(e.target.value)}
                  min="1"
                />
              </label>
          
              

            </div>v
            <div className="button-group">
              <button onClick={handlePageSubmit}>Submit</button>
              <button onClick={() =>{
              setShowPageInput(false);
              setErrorMessage(null);
              setFromPage('');
              setToPage('');
            }}>Cancel</button>
            </div>
          <div> */}

                    {showPageInput && (
                      <div className="page-input-modal">
                        <div>
                          <h5><b>Enter Page Range for {currentLabelName}</b></h5>
                          {errorMessage && <p className="error">{errorMessage}</p>}

                          <label>
                            From Page:
                            <input
                              type="number"
                              value={fromPage}
                              onChange={(e) => setFromPage(e.target.value)}
                              min="1"
                            />
                          </label>

                          <label>
                            To Page:
                            <input
                              type="number"
                              value={toPage}
                              onChange={(e) => setToPage(e.target.value)}
                              min="1"
                            />
                          </label>


                        </div>
                        <div className="button-group">
                          <button onClick={handlePageSubmit}>Submit</button>
                          <button onClick={() => {
                            setShowPageInput(false);
                            setErrorMessage(null);
                            setFromPage('');
                            setToPage('');
                          }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {showPageInput2 && (
                      <div className="page-input-modal">
                        <div>
                          <h3>Enter Page Range for {currentLabelName}</h3>
                          {errorMessage && <p className="error">{errorMessage}</p>}

                          <label>
                            From Page:
                            <input
                              type="number"
                              value={fromPage}
                              onChange={(e) => setFromPage(e.target.value)}
                              min="1"
                            />
                          </label>

                          <label>
                            To Page:
                            <input
                              type="number"
                              value={toPage}
                              onChange={(e) => setToPage(e.target.value)}
                              min="1"
                            />
                          </label>


                        </div>
                        <div className="button-group">
                          <button onClick={handlePageSubmit2}>Submit</button>
                          <button onClick={() => {
                            setShowPageInput2(false);
                            setErrorMessage(null);
                            setFromPage('');
                            setToPage('');
                          }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {true && (
                      <div className="table-container">
                        {/* Add this div for styling */}
                        <h3>Share more data</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>Sno</th>
                              <th>Name</th>
                              <th>Purpose</th>
                              <th>Type of Share</th>
                              <th>Value</th>
                              <th>Status</th> {/* Changed "Remove" to "Status" */}
                            </tr>
                          </thead>
                          <tbody>

                            {permissionsData.map((permission) => (
                              <tr key={permission.sno}>
                                <td>{permission.sno}</td>
                                <td>{permission.labelName}</td>
                                <td>{permission.purpose || "None"}</td>
                                {/* Display "None" if empty */}
                                <td>{permission.share}</td>
                                <td>
                                  <button>{permission.dataElement?.split(";")[0]?.split("|")[0] || "None"}</button>
                                  {/* Display "None" if empty */}
                                </td>
                                <td>{statuses2[permission.labelName]}</td> {/* Example status value */}
                              </tr>
                            ))}
                            {moreDataTerms.map((term, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                  <input
                                    type="text"
                                    value={term.labelName}
                                    onChange={(e) =>
                                      updateTerm(index, "labelName", e.target.value)
                                    }
                                    placeholder="Label Name"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={term.purpose}
                                    onChange={(e) =>
                                      updateTerm(index, "purpose", e.target.value)
                                    }
                                    placeholder="Purpose"
                                    required
                                  />
                                </td>
                                <td>
                                  <select
                                    value={term.typeOfSharing}
                                    onChange={(e) =>
                                      updateTerm(index, "typeOfSharing", e.target.value)
                                    }
                                  >
                                    <option value="share">Share</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="confer">Confer</option>
                                    <option value="collateral">Collateral</option>
                                  </select>
                                </td>
                                <td>
                                  {/* <input
                  {/* <input
                    type="file"
                    onChange={(e) =>
                      updateTerm(index, "enter_value", e.target.files[0])
                    }
                  
                    required
                  /> */}
                                  <button onClick={() => handleButtonClick2(term.labelName)}>
                                    {moreDataTerms[index].enter_value?.split(";")[0]?.split("|")[0] ||
                                      "Upload File"}
                                  </button>
                                </td>
                                <td>Pending</td> {/* Example status value */}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ margin: "20px 0" }}>
                          <div>
                            <button style={{ marginRight: "10px" }} onClick={addMoreDataTerm}>
                              Add New Term
                            </button>
                            <button style={{ marginRight: "10px" }} onClick={() => removeMoreDataTerm(moreDataTerms.length - 1)}>
                              Remove Last Term {/* This removes the last term added */}
                            </button>
                            <button onClick={handleMoreSubmit}>Submit</button>
                          </div>

                          {allObligationsApproved() && (
                            <div>
                              <h3 style={{ textAlign: "left", marginTop: "20px" }}>
                                Host Obligations
                              </h3>
                              <p>You will receive a receipt from the host</p>
                            </div>
                          )}

                          {hostObligationMessage && (
                            <h3 style={{ textAlign: "center", marginTop: "20px" }}>
                              Host Obligation: {hostObligationMessage}
                            </h3>
                          )}

                          {isModalOpen && (
                            <Modal
                              message={modalMessage.message}
                              onClose={handleCloseModal}
                              type={modalMessage.type}
                            />
                          )}

                          {/* {showPageInput && (
      <div className="page-input-modal">
      <div>
        <h3>Enter Page Range for {currentLabelName}</h3>
        {errorMessage && <p className="error">{errorMessage}</p>}

        <label>
          From Page:
          <input
            type="number"
            value={fromPage}
            onChange={(e) => setFromPage(e.target.value)}
            min="1"
          />
        </label>

        <label>
          To Page:
          <input
            type="number"
            value={toPage}
            onChange={(e) => setToPage(e.target.value)}
            min="1"
          />
        </label>

        
      </div>
      <div className="button-group">
        <button onClick={handlePageSubmit}>Submit</button>
        <button onClick={() =>{
        setShowPageInput(false);
        setErrorMessage(null);
        setFromPage('');
        setToPage('');
      }}>Cancel</button>
      </div>
      </div>
    )}

    {showPageInput2 && (
      <div className="page-input-modal">
      <div>
        <h3>Enter Page Range for {currentLabelName}</h3>
        {errorMessage && <p className="error">{errorMessage}</p>}

        <label>
          From Page:
          <input
            type="number"
            value={fromPage}
            onChange={(e) => setFromPage(e.target.value)}
            min="1"
          />
        </label>

        <label>
          To Page:
          <input
            type="number"
            value={toPage}
            onChange={(e) => setToPage(e.target.value)}
            min="1"
          />
        </label>

        
      </div>
      <div className="button-group">
        <button onClick={handlePageSubmit2}>Submit</button>
        <button onClick={() =>{
        setShowPageInput2(false);
        setErrorMessage(null);
        setFromPage('');
        setToPage('');
      }}>Cancel</button>
      </div>
      </div>
    )} */}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
              {activeTab === "host" && (
                <>
                  <h3>Host Obligations</h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Sno</th>
                          <th>Name</th>
                          <th>Data Element</th>
                          <th>Purpose</th>
                          <th>Type of Share</th>
                          <th>Host Privileges</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                    </table>

                    {/* Permissions Table Rendered Here */}
                    {renderPermissionsTable()}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );

};




