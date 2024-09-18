import React, { useContext, useEffect, useState } from 'react';
import "./CreateConnectionType.css";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import Navbar from '../Navbar/Navbar';
import { frontend_host } from '../../config';

export const CreateConnectionType = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const { curruser, setUser } = useContext(usercontext);
    const [isOpen, setIsOpen] = useState(false);
    const [lockers, setLockers] = useState([]); // Initialize as empty array
    const [error, setError] = useState(null);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [connectionTypes, setConnectionTypes] = useState([]); // Initialize as empty array
    // const [selectedConnectionType, setSelectedConnectionType] = useState(null);
    const [parentUser, setParentUser] = useState(location.state ? location.state.hostuser : null);
    const [locker, setLocker] = useState(location.state ? location.state.hostlocker : null);
    const [selectedConnectionType, setSelectedConnectionType] = useState(location.state ? location.state.selectedConnectionType : null);


    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }

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
            fetch(`host/get-other-connection-types/?${params}`.replace(/host/, frontend_host), {
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

    console.log("locker", locker.name);
    const handleNextClick = (event) => {
        event.preventDefault(); // Prevent the default form submission
    
        // Ensure all required data is present
        if (!selectedConnectionType || !parentUser || !curruser || !locker || !selectedLocker) {
            console.error('Missing necessary data to proceed');
            setError("Required data is missing.");
            return;
        }
    
        console.log('Navigating to show connection terms');
    
        // Navigate to the terms page with state data
        navigate('/show-connection-terms', {
            state: {
                connectionTypeName: selectedConnectionType.connection_type_name,
                connectionDescription:selectedConnectionType.connection_description,
                locker: selectedLocker,
                hostUserUsername: parentUser.username,
                hostLockerName: locker.name,
                connectionName: `${selectedConnectionType.connection_type_name}-${curruser.username}:${parentUser.username}`
            }
        });
    };
    

console.log(connectionTypes);
const content = (
    <>
     <select className="navbarBrand" name="connectionType" onChange={handleConnectionTypeChange} value={selectedConnectionType ? selectedConnectionType.connection_type_name : ''}>
    <option value="" disabled>Select Connection Type</option>
    {connectionTypes && connectionTypes.map(type => (
        <option key={type.connection_type_id} value={type.connection_type_name}>{type.connection_type_name}</option>
    ))}
</select>
    </>
   
)
    return (
        <>
        <Navbar content = {content} />
        
            <div className="page12typeofconn">
                {selectedConnectionType && <div>{selectedConnectionType.connection_type_name} ({curruser.username }&lt;&gt; {parentUser.username}) <p className = "noBold">Description: {selectedConnectionType.connection_description}</p></div> }
                
            </div>
            <div className="page12parentconnections">
                <div className="page12hostlocker">
                    <pre>Host User: {parentUser.username} <br />Host Locker: {locker.name}</pre>
                </div>
                <span className='createconnectionmylock'><pre>Select My Locker</pre></span>
                <select className="page12hostlocker" name="locker" onChange={handleLockerChange} value={selectedLocker ? selectedLocker.name : ''}>
                    {lockers && lockers.map(locker => (
                        <option key={locker.locker_id} value={locker.name}>{locker.name}</option>
                    ))}
                </select>
            </div>
            {selectedConnectionType && (
                <div className="page12paragraph">
                    <u>"{selectedConnectionType.connection_type_name}"</u> For this connection type you will need to fulfill the following obligations. Click on the next button.
                    <button onClick={handleNextClick} className="next-btn">Next</button>
                </div>
            )}
        </>
    );
};