import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from "react-router-dom";
import { ConnectionContext } from '../../ConnectionContext';
import { usercontext } from "../../usercontext";

import "./connection.css";
import Navbar from "../Navbar/Navbar";
import Panel from "../Panel/Panel";

export const Connection = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const { curruser} = useContext(usercontext);
    const location = useLocation();
    const [connectionName, setConnectionName] = useState(null);
    const [connectionDescription, setConnectionDescription] = useState(null);
    const [validity, setValidity] = useState(null); 
    const { locker_conn, setConnectionData } = useContext(ConnectionContext);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [lockers, setLockers] = useState([]);

    // const locker = location.state ? location.state.locker : null;
    // console.log("in connection", locker);

    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }
    }, []);

    useEffect(() => {
        const token = Cookies.get('authToken');

        fetch('http://localhost:8000/get-lockers-user/', {
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
            lockerName: locker_conn?.name,
            connectionName,
            connectionDescription,
            validity
        };

        setConnectionData(connectionData);

        console.log("Form submitted");
        console.log("in connection 2", connectionData, locker_conn);

        navigate("/connectionTerms");
        // navigate("/connectionTerms", { state: { selectedLocker } });
    };


    return (
        <div>
            <Navbar />
            <Panel />  
            <div className="Panelcontent">      
          <div className="connection-heroContainer">
                <div className="connection-resourceHeading">Connection</div>

                <div className="connection-lockerForm">
                    <form className="connection-lockerForm" onSubmit={handleSubmit}>
                        <label>
                            <span>Locker</span>
                            <input
                             value={locker_conn ? locker_conn.name : ''}  readOnly/>

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
        </div>
    );
};
