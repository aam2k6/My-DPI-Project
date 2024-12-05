import React, { useState, useContext, useEffect } from "react";
import { frontend_host } from "../../config.js";
import Modal from '../Modal/Modal.jsx';
import Navbar from "../Navbar/Navbar";
import { usercontext } from '../../usercontext';
import Cookies from 'js-cookie';

export const FreezeConnection = () => {

    const [userConnections, setConnections] = useState([]);
    const [connectionName, setConnectionName] = useState("");
    const [connectionId, setConnectionId] = useState("");
    const [freezeMode, setFreezeMode] = useState(true); //state for toggle
    const [isLoading, setIsLoading] = useState({ connection: false });
    const [error, setError] = useState(null);
    const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { curruser } = useContext(usercontext);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const token = Cookies.get('authToken');
        fetch('host/dpi-directory/'.replace(/host/, frontend_host), {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("dpi ", data);
                    setUsers(data.users);
                } else {
                    setError(data.message || data.error);
                }
            })
            .catch(error => {
                setError("An error occurred while fetching users.");
                console.error("Error:", error);
            });

    }, []);

    const fetchConnections = async () => {
        const token = Cookies.get('authToken');
        try {
            const response = await fetch('host/get-all-connections/'.replace(/host/, frontend_host), {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch connections');
                console.error('Error fetching connections:', errorData);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setConnections(data.connections.filter(connection => connection.is_frozen === !freezeMode));
            } else {
                setError(data.message || data.error);
            }
        } catch (error) {
            setError("An error occurred while fetching connections.");
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, [freezeMode]);

    const handleFreezeConnection = async () => {
        if (!connectionName) {
            setModalMessage({ message: 'Please enter a connection name', type: 'info' });
            setIsModalOpen(true);
            return;
        }

        const action = freezeMode ? 'freeze' : 'unfreeze'; // Determine action based on toggle
        console.log("action in conn", action);

        setIsLoading((prevState) => ({ ...prevState, connection: true }));

        const token = Cookies.get('authToken');

        try {
            const response = await fetch("host/freeze-unfreeze-connection/".replace(/host/, frontend_host), {
                method: "PUT",
                //curruser is user obj
                body: JSON.stringify({ connection_id: connectionId, username: curruser.username, connection_name: connectionName, action }),
                headers: {
                    'Authorization': `Basic ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (response.ok) {
                setModalMessage({ message: data.message || 'Connection freeze request successful', type: 'success' });
                //to clear input fields 
                setConnectionName("");
                setConnectionId("");
                //fetching updated list of lockers and connections
                // await fetchLockers();
                await fetchConnections();
            } else {
                setModalMessage({ message: data.error || 'Connection freeze request failed', type: 'failure' });
            }
            setIsModalOpen(true);
        } catch (error) {
            console.log("er", error);
            setModalMessage({ message: `Error while performing ${action}`, type: 'failure' });
            setIsModalOpen(true);
        } finally {
            setIsLoading((prevState) => ({ ...prevState, connection: false }));
        }
        console.log("id", connectionId);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMessage({ message: "", type: "" });
    };

    const toggleFreezeMode = () => {
        // setIsFreezing(prev => !prev);
        setFreezeMode(prev => !prev);
        setConnectionName("")
        // setSelectedUser(null);
    };


    return (
        <>
            <Navbar />
            <div className="container" style={{ marginTop: "120px" }}>
                <div className="row justify-content-center p-4">
                    <div className="col-md-6 col-sm-12 col-xs-12 p-4 border border-primary rounded shadow">
                        <button onClick={toggleFreezeMode}>
                            {freezeMode ? 'Switch to Unfreeze' : 'Switch to Freeze'}
                        </button>
                        <div className="row justify-content-center mt-4">
                            <div className="col-md-8 col-sm-12 col-xs-12 p-4 border border-primary rounded shadow">
                                <h2 className="m-4" style={{ textAlign: "center" }}>{freezeMode ? "Freeze Connection" : "Unfreeze Connection"}</h2>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Select Connection Name</label>
                                    <select
                                        className="form-select"
                                        onChange={(e) => {
                                            const selectedConnection = userConnections.find(connection => connection.connection_name === e.target.value);
                                            console.log(selectedConnection);
                                            setConnectionName(e.target.value);
                                            setConnectionId(selectedConnection ? selectedConnection.connection_id : "");
                                        }}
                                        value={connectionName}
                                    >
                                        <option value="">Select a connection</option>
                                        {userConnections.map(connection => (
                                            <option key={connection.connection_id} value={connection.connection_name}>
                                                {connection.connection_name}
                                            </option>
                                        ))}
                                    </select>

                                </div>
                                <button onClick={handleFreezeConnection} disabled={isLoading.connection}>
                                    {isLoading.connection ? (freezeMode ? "Freezing Connection..." : "Unfreezing Connection...") : (freezeMode ? "Freeze Connection" : "Unfreeze Connection")}
                                </button>

                                {isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}

                            </div>
                        </div>



                    </div>
                </div>
            </div>
        </>
    )
}
