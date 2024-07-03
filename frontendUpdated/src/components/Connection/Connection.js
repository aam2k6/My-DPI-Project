import React from "react";
import { useNavigate } from "react-router-dom";
import "./connection.css";

export const Connection = () => {
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Form submitted");
        navigate("/connectionTerms");
    };

    const handleHomeClick = () => {
        navigate("/home");
    };

    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };

    const handleAdmin = () => {
        navigate('/admin');
    };

    const handleLogout = () =>{
        navigate('/');
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

            {/* <div className="descriptionLocker">
                <p>This Locker consists of my Education Documents</p>
            </div> */}

            <div className="connection-heroContainer">


                <div className="connection-resourceHeading">Connection</div>


                <div className="connection-lockerForm">
                    <form className="connection-lockerForm" onSubmit={handleSubmit}>
                        <label>
                            <span>Locker</span>
                            <input type="text" name="lockerName" placeholder="Locker Name" />
                        </label>

                        <label>
                            <span>Name</span>
                            <input
                                type="text"
                                name="lockerDescription"
                                placeholder="Connection Name"
                            />
                        </label>

                        <label>
                            <span>Description </span>
                            <input
                                type="text"
                                name="lockerDescription"
                                placeholder="Description"
                            />
                        </label>
                        <label>
                            <span>Validity</span>
                            <input
                                type="text"
                                name="lockerDescription"
                                placeholder="Calendar Picker"
                            />
                        </label>

                        <button type="submit">Next</button>
                    </form>
                </div>
            </div>

        </div>
    );
};
