import React from "react";
import { useNavigate } from "react-router-dom";
import "./page4.css";

export const UploadResource = () => {
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Form submitted");
        navigate("/view-locker");
    };

    const handleHomeClick = () => {
        navigate("/home");
    };

    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };

    const handleLogout = () => {
        navigate('/');
    }

    const handleAdmin = () => {
        navigate('/admin');
    }

    return (
        <div>
            <nav className="navbar">
                <div className="wrap">
                    <div className="navbarLockerName">Locker : Education</div>
                    <div className="navbarLockerOwner">Owner : Rohith</div>
                </div>

                <div className="navbarLinks">
                    <ul className="navbarFirstLink">
                        <li>
                            <a href="#" onClick={handleDPIDirectory}>DPI Directory</a>
                        </li>
                    </ul>

                    <ul className="navbarSecondLink">
                        <li>
                            <a href="#" onClick={handleHomeClick}>
                                Home
                            </a>
                        </li>
                        <li>
                            <a href="#" onClick={handleAdmin}>Admin</a>
                        </li>
                    </ul>

                    <ul className="navbarThirdLink">
                        <li>
                            <img src="" alt="User Icon" />
                        </li>
                        <li>
                            <a href="#" onClick={handleLogout}>Logout</a>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="descriptionLocker">
                <p>This Locker consists of my Education Documents</p>
            </div>

            <div className="page4heroContainer">


                <div className="page4resourceHeading">Resources</div>


                <div className="page4lockerForm">
                    <form className="page4lockerForm" onSubmit={handleSubmit}>
                        <label>
                            <span>Name</span>
                            <input type="text" name="lockerName" placeholder="Resource Name" />
                        </label>

                        <label>
                            <span>Select File </span>
                            <input
                                type="text"
                                name="lockerDescription"
                                placeholder="Upload File(pdf)"
                            />
                        </label>

                        <label>
                            <span>Visibility </span>
                            <input
                                type="text"
                                name="lockerDescription"
                                placeholder="--Select-- (Public/Private)"
                            />
                        </label>

                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>

        </div>
    );
};
