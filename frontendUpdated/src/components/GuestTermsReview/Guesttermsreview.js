
import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from 'js-cookie';
import "./Guesttermsreview.css";
import Navbar from "../Navbar/Navbar";
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


    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }

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

                    const initialStatuses = {};
                    for (const [key, value] of Object.entries(data.connections.terms_value || {})) {
                        initialStatuses[key] = value.endsWith('T') ? 'approved' : value.endsWith('R') ? 'rejected' : '';
                    }
                    setStatuses(initialStatuses);
                }
            } catch (err) {
                setError(err.message);
            }
        };

        fetchTerms();
        fetchConnectionDetails();
    }, [curruser, connection, connectionType, navigate]);


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
            const terms_value = res?.obligations.reduce((acc, obligation, index) => {
                const status = statuses[obligation.labelName] === 'approved' ? 'T' : statuses[obligation.labelName] === 'rejected' ? 'R' : 'F';
                const resourceName = termsValue[obligation.labelName]?.split(";")[0] || "";
                acc[obligation.labelName] = `${resourceName};${status}`;
                return acc;
            }, {});

            console.log("terms_value", terms_value);
    
            // const resourcesToTransfer = Object.values(terms_value)
            //     .filter(value => value.includes(";T"))
            //     .map(value => value.split(";")[0]);

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
    
            console.log("resources to transfer", resourcesToTransfer);
            // Transfer resources
            for (const resource of resourcesToTransfer) {
                console.log("resource inside for", resource);
                await handleAcceptResource(resource);
            }
    

            for( const resource of resourcesToShare) {
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
                        {canShareMoreData && <li>You can share more data.</li>}
                        {canDownloadData && <li>You can download data.</li>}
                    </ul>
                </div>
            );
        }
        return null;
    };

    const renderForbidden = () => {
        if (res && res.forbidden) {
            return (
                <div className="forbidden">
                    <h3>Forbidden</h3>
                    <ul>
                        {res.forbidden.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            );
        }
        return null;
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
                            </tr>
                        </thead>
                        <tbody>
                            {permissionsData.map((permission) => (
                                <tr key={permission.sno}>
                                    <td>{permission.sno}</td>
                                    <td>{permission.labelName}</td>
                                    <td>
                                        {permission.dataElement || "None"} {/* Display "None" if empty */}
                                    </td>
                                    <td>{permission.purpose || "None"}</td> {/* Display "None" if empty */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    };
    


    const content = (
        <>
            <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
            <div className="description">
                {curruser ? curruser.description : "None"}</div>
                <br></br>
                <div className="connection-details">
            Connection Name: {conndetails?.connection_name || "Loading..."} <br />
            {conndetails?.connection_description}<br></br>
            Guest: {conndetails?.guest_user?.username || "Loading..."} --&gt; Host: {conndetails?.host_user?.username || "Loading..."}
        </div>
        </>
    );

    return (
        <div>
            <Navbar content={content} />
    
            <div className={showResources ? "split-view" : ""}>
                <div className="table-container">
                    <button onClick={openTermsPopup} className="view-terms-link">View Terms</button>
                    {showTermsPopup && (
                        <div className="terms-popup">
                            <div className="terms-popup-content">
                                <span className="close" onClick={closeTermsPopup}>&times;</span>
                                <h2>Connection Terms</h2>
                                {renderObligations()}
                                {renderPermissions()}
                                {renderForbidden()}
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
        </div>
    );
    
};

export default Guesttermsreview;
