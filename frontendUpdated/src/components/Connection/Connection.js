import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import "./connection.css";
import Navbar from "../Navbar/Navbar";

export const Connection = () => {
    const navigate = useNavigate();
    const [lockers, setLockers] = useState([]);
    const [error, setError] = useState(null);
    const { curruser, setUser } = useContext(usercontext);
    const location = useLocation();
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [connectionName, setConnectionName] = useState(null);
    const [connectionDescription, setConnectionDescription] = useState(null);
    const [validity, setValidity] = useState(null); 


    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }
    }, []);

    useEffect(() => {
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
                    setLockers(data.lockers);
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

    const handleSubmit = (event) => {
        event.preventDefault();
        const connectionData = {
            lockerName: selectedLocker ? selectedLocker.name : '',
            connectionName,
            connectionDescription,
            validity
        };

        console.log("Form submitted");
        console.log(connectionData);

        navigate("/connectionTerms", { state: { connectionData } });
        // navigate("/connectionTerms", { state: { selectedLocker } });
    };

    const handleLockerChange = (event) => {
        const selectedLockerName = event.target.value;
        const locker = lockers.find(l => l.name === selectedLockerName);
        setSelectedLocker(locker);
    };

    return (
        <div>
            <Navbar />
                                
          <div className="connection-heroContainer">
                <div className="connection-resourceHeading">Connection</div>

                <div className="connection-lockerForm">
                    <form className="connection-lockerForm" onSubmit={handleSubmit}>
                        <label>
                            <span>Locker</span>
                            <select name="lockerName" onChange={handleLockerChange}>
                                {lockers.map(locker => (
                                    <option key={locker.id} value={locker.name}>
                                        {locker.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span>Name</span>
                            <input
                                type="text"
                                name="lockerDescription"
                                placeholder="Connection Type Name"
                                onChange = {(e)=>setConnectionName(e.target.value)}
                            />
                        </label>

                        <label>
                            <span>Description </span>
                            <input
                                type="text"
                                name="lockerDescription"
                                placeholder="Description"
                                onChange = {(e)=>setConnectionDescription(e.target.value)}
                            />
                        </label>
                        <label>
                            <span>Validity</span>
                            <input
                                type="date"
                                name="lockerDescription"
                                placeholder="Calendar Picker"
                                onChange = {(e)=>setValidity(e.target.value)}
                            />
                        </label>

                        <button type="submit">Next</button>
                    </form>
                </div>
            </div>
        </div>
    );
};
