import React, { useContext, useEffect, useState } from 'react';
import "./CreateConnectionType.css";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";

export const CreateConnectionType = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { curruser, setUser } = useContext(usercontext);
    const [isOpen, setIsOpen] = useState(false);
    const [lockers, setLockers] = useState([]); // Initialize as empty array
    const [error, setError] = useState(null);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [connectionTypes, setConnectionTypes] = useState([]); // Initialize as empty array
    const [selectedConnectionType, setSelectedConnectionType] = useState(null);
    const [parentUser, setParentUser] = useState(location.state ? location.state.hostuser : null);
    const [locker, setLocker] = useState(location.state ? location.state.hostlocker : null);

    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }

        const token = Cookies.get('authToken');
        fetch('http://172.16.192.201:8000/get-lockers-user/', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setLockers(data.lockers || []); // Ensure array
                if (!selectedLocker && data.lockers.length > 0) {
                    setSelectedLocker(data.lockers[0]);
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

    useEffect(() => {
        if (parentUser && locker) {
            const token = Cookies.get('authToken');
            const params = new URLSearchParams({ guest_locker_name: locker.name, guest_username: parentUser.username });
            fetch(`http://172.16.192.201:8000/get-other-connection-types/?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setConnectionTypes(data.connection_types || []); // Ensure array
                    if (!selectedConnectionType && data.connection_types.length > 0) {
                        setSelectedConnectionType(data.connection_types[0]);
                    }
                } else {
                    setError(data.message || data.error);
                }
            })
            .catch(error => {
                setError("An error occurred while fetching connection types.");
                console.error("Error:", error);
            });
        }
    }, [parentUser, locker]);

    const handleLockerChange = (event) => {
        const selectedLockerName = event.target.value;
        const locker = lockers.find(l => l.name === selectedLockerName);
        setSelectedLocker(locker);
    };

    const handleConnectionTypeChange = (event) => {
        const selectedConnectionTypeName = event.target.value;
        const connectionType = connectionTypes.find(ct => ct.connection_type_name === selectedConnectionTypeName);
        setSelectedConnectionType(connectionType);
    };

    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };

    const handleHomeClick = () => {
        navigate('/home');
    };

    const handleAdmin = () => {
        navigate('/admin');
    };

    const handleLogout = () => {
        Cookies.remove('authToken');
        localStorage.removeItem('curruser');
        setUser(null);
        navigate('/');
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

   const handleNextClick = async (event) => {
    event.preventDefault();
    console.log('Next button clicked');

    const token = Cookies.get('authToken');
    if (!selectedConnectionType || !parentUser || !curruser || !locker || !selectedLocker) {
        console.error('Missing necessary data to create connection');
        setError("Required data is missing.");
        return;
    }

    console.log('All necessary data is available:', {
        selectedConnectionType,
        parentUser,
        curruser,
        locker,
        selectedLocker
    });

    const formData = new FormData();
    formData.append('connection_type_name', selectedConnectionType.connection_type_name);
    formData.append('connection_name', `${locker.name}:${selectedLocker.name}`);
    formData.append('connection_description', selectedConnectionType.connection_description);
    formData.append('host_locker_name', locker.name);
    formData.append('guest_locker_name', selectedLocker.name);
    formData.append('host_user_username', parentUser.username);
    formData.append('guest_user_username', curruser.username);

    try {
        console.log('Sending request to create connection');
        const response = await fetch('http://172.16.192.201:8000/create-new-connection/', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${token}`,
            },
            body: formData
        });

        console.log('Request sent, awaiting response');
        if (!response.ok) {
            // console.error(HTTP error! Status: ${response.status});
            // throw new Error(HTTP error! Status: ${response.status});
        }

        const data = await response.json();
        const connectionname=`${locker.name}:${selectedLocker.name}`;
        console.log('Response data:', data);
        if (data.success) {
            console.log('Navigation to show connection terms');
            navigate('/show-connection-terms', {
                state: {
                    selectedConnectionType,
                    selectedLocker,
                    parentUser,
                    locker,
                    connectionname
                }
            });
        } else {
            console.error('Server error:', data.error);
            setError(data.error || 'Failed to create connection');
        }
    } catch (error) {
        console.error("Fetch error:", error);
        setError("An error occurred while creating the connection.");
    }
};


    return (

        <div className='create-connection-type-page'>
            <nav className="navbar">
                <div className="wrap">
                    <select className="navbarBrand" name="connectionType" onChange={handleConnectionTypeChange} value={selectedConnectionType ? selectedConnectionType.connection_type_name : ''}>
                        <option value="" disabled>Select Connection Type</option>
                        {connectionTypes && connectionTypes.map(type => (
                            <option key={type.connection_type_id} value={type.connection_type_name}>{type.connection_type_name}</option>
                        ))}
                    </select>
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
                            <a href="#" onClick={handleHomeClick}></a>
                            
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
            <div className="page12typeofconn">
                {selectedConnectionType && <div>{selectedConnectionType.connection_type_name} (Connection) ({curruser.username }&lt;&gt; {parentUser.username})</div>}
            </div>
            <div className="page12parentconnections">
                <div className="page12hostlocker">
                    <pre>Host User: {parentUser.username} <br />Host Locker: {locker.name}</pre>
                </div>
                <span className='createconnectionmylock'><pre>Select My Locker</pre></span>
                <select className="page12hostlocker" name="locker" onChange={handleLockerChange} value={selectedLocker ? selectedLocker.name : ''}>
                    {lockers && lockers.map(locker => (
                        <option key={locker.id} value={locker.name}>{locker.name}</option>
                    ))}
                </select>
            </div>
            {selectedConnectionType && (
                <div className="page12paragraph">
                    <u>"{selectedConnectionType.connection_type_name}"</u> For this connection type you will need to fulfill the following obligations. Click on the next button.
                    <button onClick={handleNextClick} className="next-btn">Next</button>
                </div>
            )}
        </div>
    );
};