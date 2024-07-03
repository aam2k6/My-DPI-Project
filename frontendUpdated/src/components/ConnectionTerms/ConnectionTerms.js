import React from "react";
import { useNavigate } from "react-router-dom";
import "./connectionTerms.css";

export const ConnectionTerms = () => {
    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Form submitted");
        navigate("/target-locker-view");
    };

    const handleHomeClick = () => {
        navigate("/home");
    };

    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
      };

    const handleAdmin=() =>{
        navigate('/admin');
    }
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

            <div className="connectionTerms-heroContainer">
               

                    <div className="connectionTerms-resourceHeading">Add New Terms</div>


                    <div className="connectionTerms-lockerForm">
                        <form className="connectionTerms-lockerForm" onSubmit={handleSubmit}>
                            <label>
                                <span>Modality</span>
                                <input type="text" name="lockerName" placeholder="O/P/F" />
                            </label>

                            <label>
                                <span>Name of Data</span>
                                <input
                                    type="text"
                                    name="lockerDescription"
                                    placeholder="Name"
                                />
                            </label>

                            <label>
                                <span>Type of Data</span>
                                <input
                                    type="text"
                                    name="lockerDescription"
                                    placeholder="text/file/date"
                                />
                            </label>
                            <label>
                                <span>Type of Sharing</span>
                                <input
                                    type="text"
                                    name="lockerDescription"
                                    placeholder="Share/Transfer/Confer/Create/Collateral"
                                />
                            </label>

                            <label>
                                <span>Description</span>
                                <input
                                    type="text"
                                    name="lockerDescription"
                                    placeholder="Name"
                                />
                            </label>

                            <div className="connectionTerms-btn">
                                <button >Add</button>

                                <button type="submit">Submit</button>

                            </div>
                        </form>
                    </div>
                </div>
           
        </div>
    );
};
