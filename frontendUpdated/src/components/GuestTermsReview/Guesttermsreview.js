import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import Cookies from 'js-cookie';
import "./Guesttermsreview.css";

export const Guesttermsreview = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { curruser, setUser } = useContext(usercontext);
    const [showResources, setShowResources] = useState(false);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [error, setError] = useState(null);
    const [res, setRes] = useState(null);
    const [termsValue, setTermsValue] = useState({});
    const [resources, setResources] = useState([]);
    const [selectedResource, setSelectedResource] = useState(null);
    const [statuses, setStatuses] = useState({});

    const { connection, connectionType } = location.state || {};

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
                const response = await fetch(`http://localhost:8000/get-connection-details?connection_type_name=${connectionType.connection_type_name}&host_locker_name=${connection.host_locker.name}&host_user_username=${connection.host_user.username}&guest_locker_name=${connection.guest_locker.name}&guest_user_username=${connection.guest_user.username}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch connection details');
                }
                const data = await response.json();
                if (data.connections) {
                    setTermsValue(data.connections.terms_value || {});
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
                const status = statuses[index] === 'approved' ? 'T' : 'F';
                const resourceName = obligation.resource || "";
                acc[obligation.labelName] = `${resourceName};${status}`;
                return acc;
            }, {});

            const response = await fetch(`http://localhost:8000/update-connection-terms/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
                body: JSON.stringify({
                    "connection_name": connection.connection_description,
                    "host_locker_name": connection.host_locker.name,
                    "guest_locker_name": connection.guest_locker.name,
                    "host_user_username": connection.host_user.username,
                    "guest_user_username": connection.guest_user.username,
                    terms_value
                }),
            });

            if (!response.ok) {
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
            setError(err.message);
        }
    };

    const handleResourceClick = (filePath) => {
        const url = `http://172.16.192.201:8000/media/${filePath}`;
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
                                <th>Approved</th>
                                <th>Rejected</th>
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
                                            onChange={() => handleStatusChange(index, 'approved')}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="radio"
                                            name={`status-${index}`}
                                            value="rejected"
                                            onChange={() => handleStatusChange(index, 'rejected')}
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
                <button onClick={handleSave}>Save</button>
            </div>
        </div>
    );
};