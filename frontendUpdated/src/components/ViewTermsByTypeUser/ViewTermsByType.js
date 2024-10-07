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

export const ViewTermsByType = () => {
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

  const {
    connectionName,
    connectionDescription,
    hostLockerName,
    guestLockerName,
    hostUserUsername,
    guestUserUsername,
    locker,
    connection_id,
    guest_locker_id,
    host_locker_id,
  } = location.state || {};

  console.log("start", guest_locker_id, host_locker_id);
  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }

    const fetchTerms = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          `host/get-terms-value/?username=${hostUserUsername}&locker_name=${guestLockerName}&connection_name=${connectionName}`.replace(
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
          throw new Error("Failed to fetch terms");
        }

        const data = await response.json();
        // console.log("data", data);
        if (data.success) {
          const initialValues = {};
          const initialResources = {};
          const statusMap = {};
          // const resourceMap = {
          //     share: [],
          //     transfer: []
          // };

          data.terms.obligations.forEach((obligation) => {
            initialValues[obligation.labelName] = obligation.value || "";
            statusMap[obligation.labelName] = obligation.value.endsWith("T")
              ? "Approved"
              : obligation.value.endsWith("R")
              ? "Rejected"
              : "Pending";

            if (obligation.typeOfAction === "file" && obligation.value) {
              const [document_name] = obligation.value.split(";");
              initialResources[obligation.labelName] = {
                document_name,
                i_node_pointer: obligation.i_node_pointer,
                typeOfSharing: obligation.typeOfSharing,
              };

              // if (obligation.typeOfSharing === "transfer") {
              //     resourceMap.transfer.push(document_name);
              // } else if (obligation.typeOfSharing === "share") {
              //     resourceMap.share.push(document_name);
              // }
            }
          });

          setRes(data.terms);
          setTermValues(initialValues);
          setSelectedResources(initialResources);
          setPermissions(data.terms.permissions); // Set permissions
          setStatuses(statusMap);
          console.log("data initial", data);
          // setResourcesData({
          //     share: Object.values(initialResources).filter(res => res.typeOfSharing === "share").map(res => res.document_name),
          //     transfer: Object.values(initialResources).filter(res => res.typeOfSharing === "transfer").map(res => res.document_name),
          // });

          // console.log("resourceMap", resourceMap);
          // console.log("initialResources", initialResources);
          // console.log(resourcesData);
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        setError(err.message);
      }
    };
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
          const sharedData = Object.entries(data.shared_more_data_terms).map(
            ([key, value], index) => ({
              sno: index + 1,
              labelName: key,
              dataElement: value.enter_value,
              purpose: value.purpose,
              action: value.typeOfValue,
            })
          );
          setPermissionsData(sharedData);
        } else {
          setError(data.error || "No permissions data found");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPermissionsData();
    fetchTerms();
  }, [curruser, navigate, hostUserUsername, guestLockerName, connectionName]);

  const handleInputChange = (labelName, value) => {
    setTermValues((prev) => ({
      ...prev,
      [labelName]: value,
    }));
  };

  console.log("permissionsData", permissionsData);
  const renderInputField = (obligation) => {
    const strippedValue = termValues[obligation.labelName]
      // ?.replace(/;[TFR]$/, "");
      ?.replace(/;[ ]?[TFR]$/, "");
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
        // console.log("name", selectedResources[obligation.labelName]?.document_name);
        // console.log("name 2", selectedResources);
        return (
          <button onClick={() => handleButtonClick(obligation.labelName)}>
            {selectedResources[obligation.labelName]?.document_name ||
              "Upload File"}
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
    setSelectedResources((prev) => ({
      ...prev,
      [currentLabelName]: resource,
    }));
    setShowResources(false);
  };

  useEffect(() => {
    if (selectedLocker) {
      const fetchResources = async () => {
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
      };

      const fetchVnodeResources = async () => {
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
      };

      fetchResources();
      fetchVnodeResources();
    }
  }, [selectedLocker]);

  const combinedResources = [...resources];
  VnodeResources.forEach((vnode) => {
    combinedResources.push(vnode.resource);
  });

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
      };

      // Traverse through permissionsData
      const canShareMoreData = termValues["canShareMoreData"] || {};
      permissionsData.forEach((permission) => {
        const { labelName, dataElement, purpose, action } = permission;

        canShareMoreData[labelName] = {
          enter_value: dataElement,
          purpose: purpose,
          typeOfValue: action,
        };
      });

      console.log("check2", canShareMoreData);
      const termsValuePayload = {
        ...Object.fromEntries(
          Object.entries(termValues).map(([key, value]) => {
            const obligation = res.obligations.find(
              (ob) => ob.labelName === key
            );
            const initialValue = obligation?.value || "";

            if (obligation.typeOfAction === "file") {
              const resource = selectedResources[key];
              // console.log("resource in payload", resource);
              const initialResourcePointer = initialValue.split(";")[0];

              if (
                resource &&
                resource.i_node_pointer &&
                resource.i_node_pointer !== initialResourcePointer
              ) {
                // if (obligation.typeOfSharing === "transfer" && obligation.value.endsWith('T')) {
                if (obligation.typeOfSharing === "transfer") {
                  //if (!updatedResourcesData.transfer.includes(resource.i_node_pointer)) {
                  // newResourcesData.Transfer.push(resource.i_node_pointer);
                  // }
                  // } else if (obligation.typeOfSharing === "share" && obligation.value.endsWith('T')) {
                } else if (obligation.typeOfSharing === "share") {
                  //if (!updatedResourcesData.share.includes(resource.i_node_pointer)) {
                  // newResourcesData.Share.push(resource.i_node_pointer);
                  //}
                }

                return [
                  key,
                  `${resource.i_node_pointer.replace(/;[ ]?[TFR]$/, "")}; F`,
                ];
              } else {
                return [key, initialValue];
              }
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
  const [moreDataTerms, setMoreDataTerms] = useState([]);
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
    }));

    const requestBody = {
      connection_name: connectionName,
      host_locker_name: hostLockerName,
      guest_locker_name: guestLockerName,
      host_user_username: hostUserUsername,
      guest_user_username: guestUserUsername,
      extra_data: extraDataArray,
    };

    // console.log("Request Body:", JSON.stringify(requestBody, null, 2));

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
      { labelName: "", purpose: "", enter_value: "", type: "text" }, // Default values
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
    console.log("print", connection);
    // Check if connection is a string
    if (typeof connection === "string") {
      const connectionName = connection; // Treat the string as the connection_name
      const connectionTypeName = connectionName.split("-").shift().trim();

      console.log("conntype", connectionTypeName);

      navigate("/show-connection-terms", {
        state: {
          connectionName: connectionName, // Pass the string as connectionName
          connectionDescription: connectionDescription,
          hostLockerName: hostLockerName,
          connectionTypeName,
          hostUserUsername: hostUserUsername,
          locker: locker.name,
          showConsent: false,
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
        connection_id : connection.connection_id,
          });
      
    navigate("/show-connection-terms", {
        state: {
          connectionName: connectionName, // Pass the string as connectionName
          connectionDescription: connectionDescription,
          hostLockerName: hostLockerName,
          connectionTypeName,
          hostUserUsername: hostUserUsername,
          locker: locker.name,
          showConsent: true,
          guest_locker_id,
          host_locker_id,
          connection_id,
        },
        
      });
    }
  };

  const handlePermissionChange = (index, value) => {
    const newPermissions = [...permissions];
    newPermissions[index] = value;
    setPermissions(newPermissions);
  };

  const content = (
    <>
      <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
      <div className="description">
        {curruser ? curruser.description : "None"}
      </div>
      <br></br>
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
        {connectionDescription}
        <br></br>
        Guest: {guestUserUsername} --&gt;Host: {hostUserUsername}
      </div>
    </>
  );
  //     console.log("res without submit", res);
  //     console.log("resources normal", resources);
  //     console.log("combined", resources);
  //     console.log('Obligations:', res?.obligations);
  // console.log('Additional Terms:', res?.moreDataTerms);

  // console.log("resourcesData", resourcesData);
  return (
    <div>
      <Navbar content={content} />

      <div className={showResources ? "split-view" : ""}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Sno</th>
                <th>Name</th>
                <th>purpose</th>
                <th>Enter value</th>
                <th>Host Privileges</th>
                <th>Status</th> {/* New column for Status */}
              </tr>
            </thead>

            <tbody>
              {res?.obligations.map((obligation, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{obligation.labelName}</td>
                  <td>{obligation.purpose}</td>
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
              {error && <p className="error">{error}</p>}

              <ul>
                {combinedResources.map((resource, index) => (
                  <li key={index}>
                    <div>
                      <label>
                        <input
                          type="radio"
                          name="selectedResource"
                          value={resource.document_name} //i changed here
                          checked={
                            selectedResources[currentLabelName]
                              ?.i_node_pointer === resource.i_node_pointer
                          }
                          onChange={() => handleResourceSelection(resource)}
                        />
                        {resource.document_name}
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowResources(false)}>Select</button>
            </div>
          )}
        </div>

        {/* Adding space below the submit button */}
        <div style={{ marginBottom: "20px" }}></div>

        {permissions?.canShareMoreData && (
          <div className="table-container">
            {" "}
            {/* Add this div for styling */}
            <h3>Share more data</h3>
            <table>
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Name</th>
                  <th>Purpose</th>
                  <th>Action Type</th>
                  <th>Value</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {permissionsData.map((permission) => (
                  <tr key={permission.sno}>
                    <td>{permission.sno}</td>
                    <td>{permission.labelName}</td>
                    <td>{permission.purpose || "None"}</td>{" "}
                    {/* Display "None" if empty */}
                    <td>{permission.action}</td>
                    <td>
                      {permission.dataElement || "None"}{" "}
                      {/* Display "None" if empty */}
                    </td>
                    <td>None</td>
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
                        value={term.type}
                        onChange={(e) =>
                          handleActionTypeChange(index, e.target.value)
                        }
                      >
                        <option value="text">Text</option>
                        <option value="file">File</option>
                        <option value="date">Date</option>
                      </select>
                    </td>
                    <td>
                      {term.type === "text" && (
                        <input
                          type="text"
                          value={term.enter_value}
                          onChange={(e) =>
                            updateTerm(index, "enter_value", e.target.value)
                          }
                          placeholder="Enter Value"
                          required
                        />
                      )}
                      {term.type === "file" && (
                        <input
                          type="file"
                          onChange={(e) =>
                            updateTerm(index, "enter_value", e.target.files[0])
                          } // Store file
                          required
                        />
                      )}
                      {term.type === "date" && (
                        <input
                          type="date"
                          value={term.enter_value}
                          onChange={(e) =>
                            updateTerm(index, "enter_value", e.target.value)
                          }
                          required
                        />
                      )}
                    </td>
                    <td>
                      <button onClick={() => removeMoreDataTerm(index)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ margin: "20px 0" }}>
              <div>
                <button
                  style={{ marginRight: "10px" }}
                  onClick={addMoreDataTerm}
                >
                  Add New Term
                </button>
                <button onClick={handleMoreSubmit}>Submit</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
