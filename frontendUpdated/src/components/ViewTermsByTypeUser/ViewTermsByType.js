
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
    const [statuses, setStatuses] = useState({}); // To store the statuses
    // const [resourcesData, setResourcesData] = useState({
    //     share: [],
    //     transfer: [],
    // });
    
    const {
        connectionName,
        connectionDescription,
        hostLockerName,
        guestLockerName,
        hostUserUsername,
        guestUserUsername,
        locker,
    } = location.state || {};

    useEffect(() => {
        if (!curruser) {
            navigate("/");
            return;
        }

        const fetchTerms = async () => {
            try {
                const token = Cookies.get("authToken");
                const response = await fetch(
                    `host/get-terms-value/?username=${hostUserUsername}&locker_name=${guestLockerName}&connection_name=${connectionName}`.replace(/host/, frontend_host),
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
                        statusMap[obligation.labelName] =
                            obligation.value.endsWith("T")
                                ? "Approved"
                                : obligation.value.endsWith("R")
                                    ? "Rejected"
                                    : "Pending";

                        if (obligation.typeOfAction === "file" && obligation.value) {
                            const [document_name] = obligation.value.split(";");
                            initialResources[obligation.labelName] = {
                                document_name,
                                i_node_pointer: obligation.i_node_pointer,
                                typeOfSharing: obligation.typeOfSharing 
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
                    setStatuses(statusMap);
                    // setResourcesData({
                    //     share: Object.values(initialResources).filter(res => res.typeOfSharing === "share").map(res => res.document_name),
                    //     transfer: Object.values(initialResources).filter(res => res.typeOfSharing === "transfer").map(res => res.document_name),
                    // });

                    // console.log("resourceMap", resourceMap);
                    console.log("initialResources", initialResources);
                    // console.log(resourcesData);
                } else {
                    setError(data.error || "No terms found");
                }
            } catch (err) {
                setError(err.message);
            }
        };

        fetchTerms();
    }, [curruser, navigate, hostUserUsername, guestLockerName, connectionName]);

    const handleInputChange = (labelName, value) => {
        setTermValues((prev) => ({
            ...prev,
            [labelName]: value,
        }));
    };

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
                        `host/get-resources-user-locker/?locker_name=${selectedLocker}`.replace(/host/, frontend_host),
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

            fetchResources();
        }
    }, [selectedLocker]);

    const handleSubmit = async () => {
        try {
            const newResourcesData = {
                Transfer: [],
                Share: [],
            };

            console.log("res", res);
            const termsValuePayload = {
                ...Object.fromEntries(
                    Object.entries(termValues).map(([key, value]) => {
                        const obligation = res.obligations.find(ob => ob.labelName === key);
                        const initialValue = obligation?.value || "";
    
                        if (obligation.typeOfAction === "file") {
                            const resource = selectedResources[key];
                            const initialResourcePointer = initialValue.split(";")[0];
    
                            if (resource && resource.i_node_pointer && resource.i_node_pointer !== initialResourcePointer) {
                                // if (obligation.typeOfSharing === "transfer" && obligation.value.endsWith('T')) {
                                    if (obligation.typeOfSharing === "transfer" ) {
                                        //if (!updatedResourcesData.transfer.includes(resource.i_node_pointer)) {
                                            // newResourcesData.Transfer.push(resource.i_node_pointer);
                                       // }
                                // } else if (obligation.typeOfSharing === "share" && obligation.value.endsWith('T')) {
                                } else if (obligation.typeOfSharing === "share" ) {
                                    //if (!updatedResourcesData.share.includes(resource.i_node_pointer)) {
                                        // newResourcesData.Share.push(resource.i_node_pointer);
                                    //}
                                }
    
                                return [key, `${resource.i_node_pointer.replace(/;[ ]?[TFR]$/, "")}; F`];
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
            // setResourcesData(updatedResourcesData);
            const payload = {
                connection_name: connectionName,
                host_locker_name: hostLockerName,
                guest_locker_name: guestLockerName,
                host_user_username: hostUserUsername,
                guest_user_username: guestUserUsername,
                terms_value: termsValuePayload,
                resources: newResourcesData,
            };
            // console.log("resourcesData", payload.resources);
            // console.log("resources", resources);
            // console.log("termsValue", payload.terms_value);
            console.log("payload", payload);
            const token = Cookies.get("authToken");
    
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
    
    console.log("resources list", resources);
    
    
    const content = (
        <>
            <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
            <div className="description">
                {curruser ? curruser.description : "None"}</div>
                <br></br>
            <div className="connection-details">Connection Name: {connectionName} <br></br>
            {connectionDescription}<br></br>
                Guest: {guestUserUsername} --&gt;Host: {hostUserUsername}</div>
            
        </>
    );
    console.log("res without submit", res);
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
                                    <td>{renderInputField(obligation)}</td>
                                    {/* <td>{obligation.labelDescription}</td> */}
                                    <td>{obligation.hostPermissions ? obligation.hostPermissions.join(", ") : "None"}</td>
                                    <td>{statuses[obligation.labelName] || "Pending"}</td> {/* Display status */}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showResources && (
                    <div className="resource-container">
                        <h3>Select Resource for {currentLabelName}</h3>
                        {error && <p className="error">{error}</p>}

                        <ul>
                            {resources.map((resource, index) => (
                                <li key={index}>
                                    <div>
                                        <label>
                                            <input
                                                type="radio"
                                                name="selectedResource"
                                                value={resource.i_node_pointer}
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

            <div>
                {<button onClick={handleSubmit}>Submit</button>}
            </div>
        </div>
    );
};





