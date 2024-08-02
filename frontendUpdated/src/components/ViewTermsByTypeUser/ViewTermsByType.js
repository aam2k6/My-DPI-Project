import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import Cookies from 'js-cookie';
import { GetResource } from './GetResource'
import "./ViewTermsByType.css";

export const ViewTermsByType = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { curruser, setUser } = useContext(usercontext);
    const [showResources, setShowResources] = useState(false);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [error, setError] = useState(null);
    const [res, setRes] = useState(null);
    const [resources, setResources] = useState([]);
    const [selectedResource, setSelectedResource] = useState(null);
    const [termValues, setTermValues] = useState({});
    const [selectedResourceTemp, setSelectedResourceTemp] = useState(null);



    const { connectionName, hostLockerName, guestLockerName, hostUserUsername, guestUserUsername, locker } = location.state || {};

    console.log(guestLockerName);

    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }

        // Fetch terms from the API
        const fetchTerms = async () => {
            console.log("Inside fetch terms");
            try {
                const token = Cookies.get('authToken');
                const response = await fetch(`http://localhost:8000/show_terms/?username=${guestUserUsername}&locker_name=${guestLockerName}&connection_name=${connectionName}`, {
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
                    console.log(data.terms);
                } else {
                    setError(data.error || 'No terms found');
                }
            } catch (err) {
                setError(err.message);
            }
        };

        fetchTerms();
    }, []);

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

    const handleInputChange = (labelName, value) => {
        setTermValues(prev => ({
            ...prev,
            [labelName]: value
        }));
    };


    const renderInputField = (obligation) => {
        switch (obligation.typeOfAction) {
            case 'text':
                return (
                    <input
                        type="text"
                        placeholder="Enter value"
                        value={termValues[obligation.labelName] || ""}
                        onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
                    />
                );
            case 'file':
                return <button onClick={handleButtonClick}>{selectedResource ? selectedResource.document_name : "Upload File"}</button>;
            case 'date':
                return (
                    <input
                        type="date"
                        value={termValues[obligation.labelName] || ""}
                        onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
                    />
                );
            default:
                return null;
        }
    };


    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleButtonClick = () => {
        setSelectedLocker(guestLockerName);
        setShowResources(true);
        setSelectedResourceTemp(null);
    };

    const handleResourceSelection = (resource) => {
        // setSelectedResource(resource);
        setSelectedResourceTemp(resource);
        // setShowResources(false);
    };

    useEffect(() => {
        if (selectedLocker) {
            const fetchResources = async () => {
                try {
                    const token = Cookies.get('authToken');
                    const response = await fetch(`http://localhost:8000/get-resources-user-locker/?locker_name=${selectedLocker}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Basic ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch resources');
                    }
                    const data = await response.json();
                    if (data.success) {
                        setResources(data.resources);
                    } else {
                        setError(data.message || 'Failed to fetch resources');
                    }
                } catch (error) {
                    console.error('Error fetching resources:', error);
                    setError('An error occurred while fetching resources');
                }
            };
            fetchResources();
        }
    }, [selectedLocker]);

    const handleSubmit = async () => {
        // Define the payload based on the updated terms and resources
        const resourcesData = {
            Transfer: [
                ...resources.map(resource => resource.document_name), // Include all document names
                ...Object.values(termValues).filter(value => value.includes("documents/")) // Include all document paths in term values
            ]
        };

        // Define the payload based on the updated terms and resources
        const payload = {
            connection_name: connectionName,
            host_locker_name: hostLockerName,
            guest_locker_name: guestLockerName,
            host_user_username: hostUserUsername,
            guest_user_username: guestUserUsername,
            terms_value: {
                // ...termValues,
                // "Selected Resource": selectedResourceTemp ? `${selectedResourceTemp.document_name}; F` : "None"
                ...Object.fromEntries(
                    Object.entries(termValues).map(([key, value]) => [key, `${value}; F`])
                ),
                "Selected Resource": selectedResourceTemp ? `${selectedResourceTemp.document_name}; F` : "None"
            },
            resources: resourcesData
        };

        


        try {
            const token = Cookies.get('authToken');
            const response = await fetch(`http://localhost:8000/update-connection-terms/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to update terms');
            }

            const data = await response.json();
            if (data.success) {
                console.log('Terms successfully updated');
                navigate('/view-locker?param=${Date.now()}', { state: { locker } });

                // Handle success (e.g., navigate to a success page or show a success message)
            } else {
                setError(data.error || 'Failed to update terms');
            }
        } catch (err) {
            setError(err.message);
        }
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
                                <th>Enter value</th>
                                <th>Restrictions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {res?.obligations.map((obligation, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{obligation.labelName}</td>
                                    <td>{renderInputField(obligation)}</td>
                                    <td>{obligation.labelDescription}</td>
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
                                                checked={selectedResourceTemp?.document_name === resource.document_name}
                                                onChange={() => handleResourceSelection(resource)}
                                            />
                                            {resource.document_name}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => { setSelectedResource(selectedResourceTemp); setShowResources(false); }}>Select</button>
                    </div>
                )}
            </div>

            <div>
                <button onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
};
