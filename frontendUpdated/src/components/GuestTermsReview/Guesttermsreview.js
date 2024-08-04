import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import Cookies from 'js-cookie';
import "./Guesttermsreview.css";

export const Guesttermsreview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { curruser, setUser } = useContext(usercontext);
    const [isOpen, setIsOpen] = useState(false);
    const [showResources, setShowResources] = useState(false);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [error, setError] = useState(null);
    const [res, setRes] = useState(null);
    const [termsValue, setTermsValue] = useState({});
    const [resources, setResources] = useState([]);
    const [selectedResource, setSelectedResource] = useState(null);
    const [statuses, setStatuses] = useState({});
    const { connection, connectionType } = location.state || {};
    const [conndetails, setconndetails] = useState([]);

    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }

        const fetchTerms = async () => {
            try {
                const token = Cookies.get('authToken');
                const response = await fetch(`http://localhost:8000/show_terms/?username=${connection.guest_user.username}&locker_name=${connection.guest_locker.name}&connection_name=${connection.connection_name}`, {
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
                } else {
                    setError(data.error || 'No terms found');
                }
            } catch (err) {
                setError(err.message);
            }
        };

        const fetchConnectionDetails = async () => {
            try {
                const token = Cookies.get('authToken');
                const response = await fetch(`http://localhost:8000/get-connection-details?connection_type_name=${connectionType.connection_type_name}&host_locker_name=${connection.host_locker.name}&host_user_username=${connection.host_user.username}&guest_locker_name=${connection.guest_locker.name}&guest_user_username=${connection.guest_user.username}`, {
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
                    setTermsValue(data.connections.terms_value || {});
                    setconndetails(data.connections);

                    const initialStatuses = {};
                    for (const [key, value] of Object.entries(data.connections.terms_value || {})) {
                        initialStatuses[key] = value.endsWith(';T') ? 'approved' : 'rejected';
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

    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };

    const handleHomeClick = () => {
        navigate('/home');
    };

    const handleLogout = () => {
        Cookies.remove('authToken');
        localStorage.removeItem('curruser');
        setUser(null);
        navigate('/');
    };

    const handleAdmin = () => {
        navigate('/admin');
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleStatusChange = (index, status) => {
        setStatuses(prevStatuses => ({
            ...prevStatuses,
            [index]: status
        }));
    };

    const handleSave = async () => {
        try {
            const token = Cookies.get('authToken');
            const terms_value = res?.obligations.reduce((acc, obligation, index) => {
                const status = statuses[obligation.labelName] === 'approved' ? 'T' : 'F';
                const resourceName = termsValue[obligation.labelName]?.split(";")[0] || "";
                acc[obligation.labelName] = `${resourceName};${status}`;
                return acc;
            }, {});

            const resources = {
                Transfer: Object.values(terms_value).filter(value => value.includes(";T")).map(value => value.split(";")[0]),
                Share: []
            };

            const requestBody = {
                "connection_name": conndetails.connection_name,
                "host_locker_name": conndetails.host_locker.name,
                "guest_locker_name": conndetails.guest_locker.name,
                "host_user_username": conndetails.host_user.username,
                "guest_user_username": conndetails.guest_user.username,
                "terms_value": terms_value,
                resources
            };

            console.log("Request Body:", requestBody);

            const response = await fetch(`http://localhost:8000/update-connection-terms/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error Response:', errorText);
                throw new Error('Failed to save statuses');
            }

            const data = await response.json();
            if (data.success) {
                alert('Statuses saved successfully');
                navigate('/home');
            } else {
                setError(data.error || 'Failed to save statuses');
            }
        } catch (err) {
            console.error('Error:', err.message);
            setError(err.message);
        }
    };

    const handleAcceptResource = async (resource) => {
        try {
            console.log("Resource accepted:", resource);
            const token = Cookies.get('authToken');
            const response = await fetch(`http://localhost:8000/transfer-resource`, {
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
                console.error('Error Response:', errorText);
                throw new Error('Failed to transfer resource');
            }

            const data = await response.json();
            if (data.success) {
                alert('Resource transfer successful');
                // Optionally, refresh resources or handle the UI update
            } else {
                setError(data.error || 'Failed to transfer resource');
            }
        } catch (err) {
            console.error('Error:', err.message);
            setError(err.message);
        }
    };

    const handleResourceClick = (filePath) => {
        const url = `http://localhost:8000/media/documents/${filePath}`;
        window.open(url, "_blank");
    };

    return (
        <div>
            <nav className="navbar">
                <div className="wrap">
                    <div className="navbarBrand">{curruser ? curruser.username : 'None'}</div>
                    <div className="description">{curruser ? curruser.description : 'None'}</div>
                </div>

                <div className="navbarLinks">
                    <ul className="navbarFirstLink">
                        <li>
                            <a href="#" onClick={handleDPIDirectory}>DPI Directory</a>
                        </li>
                    </ul>

                    <ul className="navbarSecondLink">
                        <li>
                            <a href="#" onClick={handleHomeClick}>Home</a>
                        </li>
                        <li>
                            <a href="#" onClick={handleAdmin}></a>
                        </li>
                    </ul>

                    <ul className="navbarThirdLink">
                        <li>
                            <img src={userImage} alt="User Icon" onClick={toggleDropdown} className="dropdownImage" />
                            {isOpen && (
                                <div className="dropdownContent">
                                    <div className="currusername">{curruser.username}</div>
                                    <div className="curruserdesc">{curruser.description}</div>

                                    <button onClick={handleAdmin}>Settings</button>
                                    <button onClick={handleLogout}>Logout</button>
                                </div>
                            )}
                        </li>
                    </ul>
                </div>
            </nav>

            <div className={showResources ? "split-view" : ""}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Sno</th>
                                <th>Name</th>
                                <th>Enter Value</th>
                                <th>Restrictions</th>
                                <th>Approve</th>
                                <th>Reject</th>
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
                                    <td>{obligation.hostPermissions ? obligation.hostPermissions.join(", ") : "None"}</td>
                                    <td>
                                        <input
                                            type="radio"
                                            name={`status-${index}`}
                                            value="approved"
                                            checked={statuses[obligation.labelName] === 'approved'}
                                            onChange={() => handleStatusChange(obligation.labelName, 'approved')}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="radio"
                                            name={`status-${index}`}
                                            value="rejected"
                                            checked={statuses[obligation.labelName] === 'rejected'}
                                            onChange={() => handleStatusChange(obligation.labelName, 'rejected')}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {showResources && (
                    <div className="resource-container">
                        <h3>Resources for {selectedLocker}</h3>
                        {error && <p className="error">{error}</p>}
                        <ul>
                            {resources.map((resource, index) => (
                                <li key={index}>
                                    <div>
                                        <label>
                                            <input
                                                type="radio"
                                                name="selectedResource"
                                                value={resource.document_name}
                                                onChange={() => setSelectedResource(resource)}
                                            />
                                            {resource.document_name}
                                        </label>
                                        <button className="link-button" onClick={() => handleAcceptResource(resource)}>Accept</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setShowResources(false)}>Close</button>
                    </div>
                )}
            </div>

            <div>
                <button onClick={handleSave}>Save</button>
            </div>
        </div>
    );
};
