import React, { useState, useEffect } from "react";
import "./Admin.css";
import Cookies from 'js-cookie';
import { useNavigate } from "react-router-dom";

export const Admin = () => {
    const navigate = useNavigate();


    const [connectionTypes, setConnectionTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect(() => {

    //     const token = Cookies.get('authToken');
    //     fetch('http://localhost:8000/get-connection-type/', {
    //         method: 'GET',
    //         headers: {
    //             'Authorization': `Basic ${token}`,
    //             'Content-Type': 'application/json'
    //         }
    //     })
    //         .then(response => {
    //             if (!response.ok) {
    //                 throw new Error('Network response was not ok');
    //             }
    //             return response.json();
    //         })
    //         .then(data => {
    //             setConnectionTypes(data.connection_types);
    //             setLoading(false);
    //         })
    //         .catch(error => {
    //             setError(error.message);
    //             setLoading(false);
    //         });
    // }, []);



    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };

    const handleHomeClick = () => {
        navigate('/home');
    };

    const handleLogoutClick = () => {
        navigate('/');
    };

    const handleAdminClick = () => {
        navigate('/admin');
    };

    const gotopage12createconnection = () => {
        console.log("Admin button clicked");
        navigate('/connection');
    };


    return (
        <div>
            <nav className="navbar">
                <div className="wrap">
                    <div className="navbarBrand"></div>
                    <div className="description7"><u></u></div>
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
                            <a href="" onClick={handleAdminClick}>Admin </a>
                        </li>
                    </ul>

                    <ul className="navbarThirdLink">
                        <li>
                            <img src="" alt="User Icon" />
                        </li>
                        <li>
                            <a href="#" onClick={handleLogoutClick}>Logout</a>

                        </li>
                    </ul>
                </div>
            </nav>
            <div className="page7description">
                <div className="descriptionpage7">Existing Connections</div>
                <button onClick={gotopage12createconnection} className="admin-btn">Create New Connection Type</button>
            </div>
            <div className="page8parent">
                {/* <div className="page8connections">
                    Btech 2020 applicant
                </div> */}

                {loading ? (
                    <div>Loading...</div>
                ) : error ? (
                    <div>Error: {error}</div>
                ) : connectionTypes.length > 0 ? (
                    connectionTypes.map((connection, index) => (
                        <div key={index} className="page8connections">
                            {connection.name}
                        </div>
                    ))
                ) : (
                    <div>No connection types found.</div>
                )}
            </div>
        </div>
       

    );
}
