import React from "react";
import "./Admin.css";
import { useNavigate } from "react-router-dom";

export const Admin = () => {
    const navigate = useNavigate();


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
                    <div className="navbarBrand">Locker:Transcripts</div>
                    <div className="description7">Owner:<u>IIITB</u></div>
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
                <div className="page8connections">
                    Btech 2020 applicant
                </div>
            </div>
        </div>

    );
}
