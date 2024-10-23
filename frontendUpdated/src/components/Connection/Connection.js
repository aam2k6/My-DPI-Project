import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from "react-router-dom";
import { ConnectionContext } from '../../ConnectionContext';
import { usercontext } from "../../usercontext";

import "./connection.css";
import Navbar from "../Navbar/Navbar";
import Panel from "../Panel/Panel";
import { frontend_host } from "../../config";

export const Connection = ({ formValues, handleInputChange }) => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const { curruser } = useContext(usercontext);
    const location = useLocation();
    const { locker_conn, setConnectionData } = useContext(ConnectionContext);
    const [lockers, setLockers] = useState([]);

    // Local state for connection fields
    const [connectionName, setConnectionName] = useState(formValues.connectionType || '');  // Default to formData
    const [connectionType, setConnectionType] = useState(formValues.connectionType || '')
    const [connectionDescription, setConnectionDescription] = useState(formValues.description || '');
    const [validity, setValidity] = useState(formValues.calender || '');

    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }
    }, [curruser, navigate]);

    useEffect(() => {
        const token = Cookies.get('authToken');

        fetch('host/get-lockers-user/'.replace(/host/, frontend_host), {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setLockers(data.lockers);
                    if (data.lockers.length > 0) {
                        setConnectionName(data.lockers[0].name); // Example of setting default
                    }
                } else {
                    setError(data.message || data.error);
                }
            })
            .catch(error => {
                setError("An error occurred while fetching lockers.");
                console.error("Error:", error);
            });
    }, [curruser]);

    const handleSubmit = (event) => {
        event.preventDefault();
        const connectionData = {
            lockerName: locker_conn?.name,
            connectionName,
            connectionDescription,
            validity
        };

        setConnectionData(connectionData);
        console.log("Form submitted", connectionData, locker_conn);
        navigate("/connectionTerms");
    };

    // Handle input change for local state
    const handleLocalChange = (e, key) => {
        const value = e.target.value;
        if (key === 'connectionType') {
            setConnectionType(value);
            handleInputChange(e, 'connectionType');  // Update parent state too
        } else if (key === 'connectionDescription') {
            setConnectionDescription(value);
            handleInputChange(e, 'description');  // Update parent state too
        } else if (key === 'validity') {
            setValidity(value);
            handleInputChange(e, 'calender');  // Update parent state too
        }
    };

    const content = (
        <>
            <div className="navbarLockerName-terms">Locker : {locker_conn?.name}</div>
            <div className="navbarLockerOwner-terms">Owner : {curruser.username}</div>
        </>
    );

    return (
        <div>
            <Navbar content={content}></Navbar>
            <Panel />
            <div className="Panelcontent">
                <div className="connection-heroContainer">
                    <div className="connection-resourceHeading">Connection</div>
                    <div className="connection-lockerForm">
                        <form className="connection-lockerForm" onSubmit={handleSubmit}>
                            <label>
                                <span>Locker</span>
                                <input
                                    value={locker_conn ? locker_conn.name : ''} 
                                    readOnly
                                />
                            </label>

                            <label>
                                <span>Name</span>
                                <input
                                    type="text"
                                    placeholder="Connection Type Name"
                                    value={connectionType}
                                    onChange={(e) => handleLocalChange(e, 'connectionType')}
                                />
                            </label>

                            <label>
                                <span>Description </span>
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={connectionDescription}
                                    onChange={(e) => handleLocalChange(e, 'connectionDescription')}
                                />
                            </label>

                            <label>
                                <span>Validity</span>
                                <input
                                    type="date"
                                    placeholder="Calendar Picker"
                                    value={validity}
                                    onChange={(e) => handleLocalChange(e, 'validity')}
                                />
                            </label>

                            <button type="submit">Next</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
