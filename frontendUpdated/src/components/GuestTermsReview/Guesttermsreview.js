
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from 'js-cookie';
import "./Guesttermsreview.css";
import Navbar from "../Navbar/Navbar";
import Modal from "../Modal/Modal.jsx";
import { frontend_host } from "../../config";



export const Guesttermsreview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { curruser } = useContext(usercontext);
    const [showResources, setShowResources] = useState(false);
    const [error, setError] = useState(null);
    const [res, setRes] = useState(null);
    const [termsValue, setTermsValue] = useState({});
    const [statuses, setStatuses] = useState({});
    const [resources, setResources] = useState([]); 
    const [showTermsPopup, setShowTermsPopup] = useState(false);  
    const { connection, connectionType } = location.state || {};
    const [conndetails, setconndetails] = useState([]);
    const [resourcesData, setResourcesData] = useState({
        share: [],
        transfer: [],
    });
    const [permissionsData, setPermissionsData] = useState([]);
    const [terms, setTerms] = useState([]);
    const [globalTemplates, setGlobalTemplates] = useState([]);
    const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revokeState, setRevokeState] = useState(true);
//   const [revokeMessage, setRevokeMessage] = useState(""); // To store the response message
// const [isRevokeModalOpen, setRevokeModalOpen] = useState(false);


// const RevokeMessageModal = ({ message, onClose }) => (
//     <div className="modal">
//         <div className="modal-content">
//             <h2>Revoke Status</h2>
//             <p>{message}</p>
//             <button onClick={onClose}>Close</button>
//         </div>
//     </div>
// );

const onRevokeButtonClick = async (connection_id) => {
    setRevokeState(false);
    const message = await handleRevoke(connection_id); 
    setIsModalOpen(false);
    setModalMessage({message: message, type: "info"});
    setIsModalOpen(true); 
};

    useEffect(() => {
        if (!curruser) {
            navigate('/');
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
                console.log("Fetched Templates:", data); // Log the fetched data
                setGlobalTemplates(data.data); // Store fetched templates
                console.log("global data", data.data);
              })
              .catch((error) => {
                console.error("Error fetching templates:", error);
                setError("Failed to fetch templates");
              });
          };
      
          //fetch terms from the api
          const fetchObligations = async () => {
            console.log("Inside fetch terms");
            try {
              const token = Cookies.get("authToken");
              const connectionTypeName = connection.connection_name.split("-").shift().trim();
              let apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${connection.host_user.username}&host_locker_name=${connection.host_locker.name}`;
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
                setTerms(data.data.obligations); // Update to set data.data instead of data
                console.log("Terms Response Data:", data.data.obligations);
              } else {
                setError(data.error || "No terms found");
              }
            } catch (err) {
              setError(err.message);
            }
          };
      

        const fetchTerms = async () => {
            try {
                const token = Cookies.get('authToken');
                const response = await fetch(`host/show_terms/?username=${connection.guest_user.username}&locker_name=${connection.guest_locker.name}&connection_name=${connection.connection_name}`.replace(/host/, frontend_host), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${token}`
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch terms');
                }
                const data = await response.json();
                if (data.success) {
                    setRes(data.terms);
                    setResources(data.terms.resources || []);
    
                    // Fetch permissions data if canShareMoreData is true
                    if (data.terms.permissions.canShareMoreData) {
                        await fetchPermissionsData();
                    }
                } else {
                    setError(data.error || 'No terms found');
                }
            } catch (err) {
                setError(err.message);
            }
        };
        const fetchPermissionsData = async () => {
            try {
                const token = Cookies.get('authToken');
                const connectionId = connection.connection_id; // Assume you have a connection ID
                const response = await fetch(`host/get-extra-data?connection_id=${connectionId}`.replace(/host/, frontend_host), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${token}`
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch permissions data');
                }
                const data = await response.json();
                if (data.success) {
                    // Create an array from the shared_more_data_terms object
                    const sharedData = Object.entries(data.shared_more_data_terms).map(([key, value], index) => ({
                        sno: index + 1,
                        labelName: key,
                        dataElement: value.enter_value,
                        purpose: value.purpose,
                    }));
                    setPermissionsData(sharedData);
                } else {
                    setError(data.error || 'No permissions data found');
                }
            } catch (err) {
                setError(err.message);
            }
        };
        
        const fetchConnectionDetails = async () => {
            try {
                const token = Cookies.get('authToken');
                const response = await fetch(`host/get-connection-details?connection_type_name=${connectionType.connection_type_name}&host_locker_name=${connection.host_locker.name}&host_user_username=${connection.host_user.username}&guest_locker_name=${connection.guest_locker.name}&guest_user_username=${connection.guest_user.username}`.replace(/host/, frontend_host), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${token}`
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch connection details');
                }
                const data = await response.json();
                if (data.connections) {
                    console.log("data", data);
                    setTermsValue(data.connections.terms_value || {});
                    setconndetails(data.connections);
                    setConnectionDetails(data.connections);

                    const initialStatuses = {};
                    for (const [key, value] of Object.entries(data.connections.terms_value || {})) {
                        initialStatuses[key] = value.endsWith('T') ? 'approved' : value.endsWith('R') ? 'rejected' : '';
                    }
                    setStatuses(initialStatuses);
                }
            } catch (err) {
                setError(err.message);
            }
             finally {
                    setLoading(false);
             } 
        };

        fetchTerms();
        fetchConnectionDetails();
        fetchGlobalTemplates();
        fetchObligations();
    }, [curruser, connection, connectionType, navigate]);


    useEffect(() => {
        if (connectionDetails) {
          const { revoke_guest, revoke_host } = connectionDetails;
          console.log(revoke_host, revoke_guest);
          if (revoke_guest === true || revoke_host === true) {
            setModalMessage({
              message: 'The guest has closed the connection, click Revoke to revoke the connection',
              type: 'info',
            });
            setIsModalOpen(true);
          }
        }
      }, [connectionDetails]);
    

    // const handleStatusChange = (index, status, value, type, isFile) => {
    //     if (value !== "") {
    //         setStatuses(prevStatuses => {
    //             const newStatuses = {
    //                 ...prevStatuses,
    //                 [index]: status
    //             };
    
    //             setResourcesData(prevData => {
    //                 // Create a new copy for both arrays to avoid unintended mutations
    //                 const updatedResources = {
    //                     transfer: [...prevData.transfer],
    //                     share: [...prevData.share]
    //                 };
    
    //                 // Check the type and isFile conditions separately
    //                 if (isFile) {
    //                     if (type === 'transfer') {
    //                         if (status === 'approved' && !updatedResources.transfer.includes(value)) {
    //                             updatedResources.transfer.push(value);
    //                         } else if (status === 'rejected') {
    //                             updatedResources.transfer = updatedResources.transfer.filter(item => item !== value);
    //                         }
    //                     } else if (type === 'share') {
    //                         if (status === 'approved' && !updatedResources.share.includes(value)) {
    //                             updatedResources.share.push(value);
    //                         } else if (status === 'rejected') {
    //                             updatedResources.share = updatedResources.share.filter(item => item !== value);
    //                         }
    //                     }
    //                 }
    
    //                 return updatedResources; // Ensure returning the correct state
    //             });
    
    //             return newStatuses;
    //         });
    //     } else {
    //         alert("Value required in Enter Value field to either Approve or Reject");
    //     }
    // };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMessage({ message: "", type: "" });
        navigate(`/view-locker?param=${Date.now()}`, { state: { locker: conndetails.host_locker } });
      };


      const handleRevoke = async (connection_id) => {

        const formData = new FormData();
        formData.append("connection_id", connection_id);
        formData.append("revoke_host_bool", "True");

        console.log(connection_id ,"id");
        const token = Cookies.get("authToken"); 
        try {
            // Step 1: Call revoke_host API using fetch
            const revokeHostResponse = await fetch('host/revoke-host/'.replace(/host/, frontend_host), {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${token}`,
                    
                },
            

                body: formData,
                
            });
    
            const revokeHostData = await revokeHostResponse.json(); // Parse JSON response
    
            if (revokeHostResponse.ok) {
                console.log("Revoke host successful: ", revokeHostData.message);
            };
            }catch(error){
                console.error("Error:", error);
   
            }
    
                // Step 2: Call revoke API using fetch
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
                    
                    return "Successfully revoked ";
                     
                      
                    } else {
                  
                     return data.message || "An error occurred while revoking consent.";
                    }
                  } catch (error) {
                    console.error("Error:", error);
                   
                    return "An error occurred while revoking consent.";
                  }
                
                };
    

    const handleStatusChange = (index, status, value, type, isFile) => {
        if (value !== "") {
            setStatuses(prevStatuses => {
                // Update the statuses for the specific index
                const newStatuses = {
                    ...prevStatuses,
                    [index]: status
                };
    
                // Recalculate the resourcesData based on all statuses
                setResourcesData(() => {
                    // Initialize new arrays for transfer and share
                    const newTransfer = [];
                    const newShare = [];
    
                    // Iterate through all statuses to populate new arrays
                    Object.keys(newStatuses).forEach(key => {
                        const currentValue = termsValue[key]?.split(";")[0]; // Extract current value for the term
                        const currentType = res.obligations.find(obligation => obligation.labelName === key)?.typeOfSharing;
                        const currentIsFile = res.obligations.find(obligation => obligation.labelName === key)?.typeOfAction === 'file';
    
                        if (newStatuses[key] === 'approved' && currentValue && currentIsFile) {
                            if (currentType === 'transfer') {
                                newTransfer.push(currentValue);
                            } else if (currentType === 'share') {
                                newShare.push(currentValue);
                            }
                        }
                    });
    
                    // Return the updated resourcesData
                    return {
                        transfer: newTransfer,
                        share: newShare
                    };
                });
    
                return newStatuses;
            });
        } else {
            alert("Value required in Enter Value field to either Approve or Reject");
        }
    };
    
    const handleSave = async () => {
        try {
            const token = Cookies.get('authToken');
    
            // Create the terms_value object from the obligations
            const terms_value = res?.obligations.reduce((acc, obligation) => {
                // Determine the status for the current obligation
                const status = statuses[obligation.labelName] === 'approved' ? 'T' : statuses[obligation.labelName] === 'rejected' ? 'R' : 'F';
                const resourceName = termsValue[obligation.labelName]?.split(";")[0] || "";
                // Add to terms_value with the status
                acc[obligation.labelName] = `${resourceName};${status}`;
                return acc;
            }, {});
    
            // Preserve the existing canShareMoreData structure without overriding other terms
            if (termsValue?.canShareMoreData) {
                terms_value.canShareMoreData = { 
                    ...termsValue.canShareMoreData 
                };
            }
    
            console.log("terms_value", terms_value);
    
            const resourcesToTransfer = resourcesData.transfer;
            const resourcesToShare = resourcesData.share;
    
            const requestBody = {
                "connection_name": conndetails.connection_name,
                "host_locker_name": conndetails.host_locker.name,
                "guest_locker_name": conndetails.guest_locker.name,
                "host_user_username": conndetails.host_user.username,
                "guest_user_username": conndetails.guest_user.username,
                "terms_value": terms_value,
                resources: {
                    Transfer: resourcesToTransfer,
                    Share: resourcesToShare,
                }
            };
    
            console.log("Request Body:", requestBody);
    
            const updateResponse = await fetch(`host/update-connection-terms/`.replace(/host/, frontend_host), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
                body: JSON.stringify(requestBody),
            });
    
            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                console.error('Error Response:', errorText);
                throw new Error('Failed to save statuses');
            }
    
            const updateData = await updateResponse.json();
            if (updateData.success) {
                alert('Statuses saved successfully');
            } else {
                setError(updateData.error || 'Failed to save statuses');
            }
    
            // Transfer resources
            for (const resource of resourcesToTransfer) {
                await handleAcceptResource(resource);
            }
    
            // Share resources
            for (const resource of resourcesToShare) {
                await handleShareResource(resource);
            } 
    
            navigate('/home');
        } catch (err) {
            console.error('Error:', err.message);
            setError(err.message);
        }
    };
    

    console.log("conndetials", conndetails);
    const handleAcceptResource = async (resource) => {
        try {
            const token = Cookies.get('authToken');
            const response = await fetch(`host/transfer-resource/`.replace(/host/, frontend_host), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
                body: JSON.stringify({
                    connection_name: conndetails.connection_name,
                    host_locker_name: conndetails.host_locker.name,
                    guest_locker_name: conndetails.guest_locker.name,
                    host_user_username: conndetails.host_user.username,
                    guest_user_username: conndetails.guest_user.username,
                    resource
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error('Failed to transfer resource');
            }

            const data = await response.json();
            console.log("transfer", data);
            if (data.success) {
                alert('Resource transfer successful');
            } else {
                setError(data.error || 'Failed to transfer resource');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const handleShareResource = async (resource) => {
        try {
            const token = Cookies.get('authToken');
            const response = await fetch(`host/share-resource/`.replace(/host/, frontend_host), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
                body: JSON.stringify({
                    connection_name: conndetails.connection_name,
                    host_locker_name: conndetails.host_locker.name,
                    guest_locker_name: conndetails.guest_locker.name,
                    host_user_username: conndetails.host_user.username,
                    guest_user_username: conndetails.guest_user.username,
                    resource
                }),
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error Response:', errorText);
                throw new Error('Failed to share resource');
            }
    
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to share resource');
            }
    
        } catch (err) {
            console.error('Error:', err.message);
            throw err; // Rethrow error to be handled by the main try-catch
        }
    };


    // const handleResourceClick = (filePath) => {
    //     const url = `host/media/documents/${filePath}`.replace(/host/, frontend_host);
    //     window.open(url, "_blank");
    // };

    const handleResourceClick = (filePath) => {
        const url = `host/media/${filePath}`.replace(/host/, frontend_host);
        window.open(url, "_blank");
      };

    const openTermsPopup = () => {
        setShowTermsPopup(true);
    };

    const closeTermsPopup = () => {
        setShowTermsPopup(false);
    };

    const renderObligations = () => {
        if (res && res.obligations) {
            return (
                <div>
                    <h3>Obligations</h3>
                    <ul>
                        {res.obligations.map((obligation, index) => (
                            <li key={index}>{obligation.typeOfSharing} - {obligation.labelName} (Host Privilege: {obligation.hostPermissions && obligation.hostPermissions.length > 0 ? obligation.hostPermissions.join(", ") : "None"})</li>
                        ))}
                    </ul>
                </div>
            );
        }
        return <p>No obligations available.</p>;
    };

    const renderPermissions = () => {
        if (res && res.permissions) {
            const { canShareMoreData, canDownloadData } = res.permissions;
            return (
                <div className="permissions">
                    <h3>Permissions</h3>
                    <ul>
                    {canShareMoreData ? <li>You can share more data.</li> : <li>You cannot share more data.</li>}
                    {canDownloadData ? <li>You can download data.</li> : <li>You cannot download data.</li>}
                    </ul>
                </div>
            );
        }
        return null;
    };
const renderForbidden = () => {
    if (res && res.forbidden) {
      return (
        
        <div className="permissions">

         <h3>Forbidden</h3>
          <ul>
          {res.forbidden.map((term, index) => (
            <li key={index}>
              {term.labelDescription}
            </li>
          ))}
        </ul>
      </div>)
    }
    return <p>No forbidden terms available.</p>;
  };

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
                        {permissionsData.map((permission, index) => (
                            <tr key={index}>
                                <td>{permission.sno}</td>
                                <td>{permission.labelName}</td>
                                <td>{permission.dataElement || "None"}</td> {/* Display "None" if empty */}
                                <td>{permission.purpose || "None"}</td> {/* Display "None" if empty */}
                                <td>{permission.typeOfShare || "None"}</td> {/* Type of Share column */}
                                <td>
                                    <select
                                        value={statuses[permission.labelName] || ''}
                                        onChange={(e) =>
                                            handleStatusChange(permission.labelName, e.target.value)
                                        }
                                    >
                                        <option value="">Select Status</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    } else {
        return;
    }
};
    
    const navigateToConnectionDetails = (connection) => {
        console.log("print", connection); // Log the connection object
    
        // Access connection_type_name safely
        const connectionTypeName = connection.connection_type_name 
            ? connection.connection_type_name.split("-").shift().trim() 
            : undefined;
    
        const connectionDescription = connection.connection_description;
    
        // Use the owner_locker and owner_user from the connection object
        const hostLockerName = conndetails?.host_locker?.name; // Assuming lockerData has a 'name' property
        const hostUserUsername = connection.owner_user;
    
        const connectionName = conndetails.connection_name;
    
        // Log the names to verify they're being retrieved correctly
        console.log("Host Locker Name:", hostLockerName);
        console.log("Host User Username:", hostUserUsername);
        console.log("Connection Type:", connectionTypeName);
        console.log("Description:", connectionDescription);
        console.log("Connection Name:", connectionName);
        
        navigate("/display-terms", {
            state: {
                connectionTypeName: connectionTypeName,
                hostLockerName: hostLockerName,
                connectionName: connectionName, 
                connectionDescription: connectionDescription,
                createdtime: connection.created_time,
                validitytime: connection.validity_time,
                hostUserUsername: hostUserUsername, 
                locker: conndetails.host_locker, 
            },
        });
        
    };
    

    const content = (
        <>
            <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
            <div className="description">
                {curruser ? curruser.description : "None"}</div>
                <br></br>
                <div className="connection-details">
            Connection Name: {conndetails?.connection_name || "Loading..."} 
            <button
        className="info-button"
        onClick={() => navigateToConnectionDetails(connectionType)}
        title="Show Connection Terms"
        style={{ marginLeft: "10px", cursor: "pointer", background: "transparent", border: "none" }}
      >
        <i className="fa fa-info-circle" style={{ fontSize: '16px' }}></i>
      </button>
      <br></br>
            {conndetails?.connection_description}<br></br>
            Guest: {conndetails?.guest_user?.username || "Loading..."} --&gt; Host: {conndetails?.host_user?.username || "Loading..."}
        </div>
        </>
    );

    const uniqueGlobalConnTypeIds = [...new Set(terms
        .filter(term => term.global_conn_type_id !== null)
        .map(term => term.global_conn_type_id)
      )];
    
      const globalTemplateNames = uniqueGlobalConnTypeIds.map(id => {
        const template = globalTemplates.find(template => template.global_connection_type_template_id === id);
        return template ? template.global_connection_type_name : null;
      });

    return (
        <div>
            <Navbar content={content} />
    
            <div className={showResources ? "split-view" : ""}>
                <div className="table-container">
                    
                <div className="center2">
            {globalTemplateNames.length > 0 && "Regulations used: "}
            <span style={{ fontWeight: "bold" }}>
              {globalTemplateNames.filter(Boolean).map((name, index) => (
                <span key={index}>
                  {name}
                  {index < globalTemplateNames.filter(Boolean).length - 1 &&
                    ", "}
                </span>
              ))}
            </span>
          </div>

                    <button onClick={openTermsPopup} className="view-terms-link">View Terms</button>
                    {showTermsPopup && (
                        <div className="terms-popup">
                            <div className="terms-popup-content">
                                <span className="close" onClick={closeTermsPopup}>&times;</span>
                                <h2>Connection Terms</h2>
                                {renderObligations()}
                                {renderPermissions()}
                                {renderForbidden()}
                                <div className="permissions">
                    <h3>Default Host Privileges</h3>
                    By default Reshare,Download,Aggreagte are disabled unless otherwise mentioned in the terms
                </div>
                            </div>
                        </div>
                    )}
                    <br></br>
                    <table>
                        <thead>
                            <tr>
                                <th>Sno</th>
                                <th>Name</th>
                                <th>Data Element</th>
                                <th>Purpose</th>
                                <th>Host Privileges</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {res?.obligations.map((obligation, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{obligation.labelName}</td>
                                    <td>
                                        {termsValue[obligation.labelName]?.split(";")[0] ? (
                                            <a href="#" onClick={() => handleResourceClick(termsValue[obligation.labelName]?.split(";")[0])}>
                                                {termsValue[obligation.labelName]?.split(";")[0]}
                                            </a>
                                        ) : "None"}
                                    </td>
                                    <td>{obligation.purpose}</td>
                                    <td>{obligation.hostPermissions ? obligation.hostPermissions.join(", ") : "None"}</td>
                                    <td>
                                        <select
                                            value={statuses[obligation.labelName] || ''}
                                            onChange={(e) => handleStatusChange(obligation.labelName, e.target.value, termsValue[obligation.labelName]?.split(";")[0], obligation.typeOfSharing, obligation.typeOfAction === 'file')}
                                        >
                                            <option value="">Select Status</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
    
                    {/* Permissions Table Rendered Here */}
                    {renderPermissionsTable()}
    
                </div>
                {showResources && (
                    <div className="resource-container">
                        <h3>Resource List</h3>
                        <ul>
                            {resources.map((resource, index) => (
                                <li key={index} onClick={() => handleResourceClick(resource)}>
                                    {resource}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <br></br>
            <div className="save-button-container">
                <button onClick={handleSave}>Save</button>
            </div>
            {isModalOpen && (
      <Modal
        message={modalMessage.message}
        onClose={handleCloseModal}
        type={modalMessage.type}
        revoke = {revokeState}
        onRevoke={() => onRevokeButtonClick(conndetails.connection_id)}
        viewTerms = {() => navigateToConnectionDetails(connectionType)}
      />
    )}

    {/* {isRevokeModalOpen && (
    <RevokeMessageModal 
        message={revokeMessage} 
        onClose={handleCloseModal}
    />
)} */}
        </div>
    );
    
};

export default Guesttermsreview;