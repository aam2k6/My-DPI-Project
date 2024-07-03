import React, { useState } from "react";
import "./CreateConnectionType.css";
import { useNavigate } from "react-router-dom";

export const CreateConnectionType = () => {
    const navigate = useNavigate();
    const [selectedOption, setSelectedOption] = useState(""); // Step 2: Create a state variable
    const [userlocker, setuserlocker] = useState(""); // Step 2: Create a state variable


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

    const handleClick = () => {
        navigate('/create-connection-terms');
    }

    const handleSelectChange = (event) => {
        setSelectedOption(event.target.value); // Step 3: Update the state variable on change
    };
    const handlelockerchange = (event) => {
        setuserlocker(event.target.value); // Step 3: Update the state variable on change
    };

    return (
        <div>
            <nav className="navbar">
                <div className="wrap">
                    <select className="navbarBrand" name="connectionType" onChange={handleSelectChange}>
                        <option value="default" disabled selected>Select Connection type</option>
                        <option value="Mtech2024">Mtech2024</option>
                        <option value="Btech2024">Btech2024</option>
                        <option value="Imtech2024">Imtech2024</option>
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
                            <a href="#" onClick={handleAdminClick}>Admin</a>
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

            <div className="page12typeofconn">
                {/* Step 4: Conditionally render content based on the selected option */}
                {selectedOption === "Mtech2024" && <div>Mtech2024 (Connection) (Rohith&lt;&gt;IIITB)</div>}
                {selectedOption === "Btech2024" && <div>Btech2024 (Connection) (Rohith&lt;&gt;IIITB)</div>}
                {selectedOption === "Imtech2024" && <div>Imtech2024 (Connection) (Rohith&lt;&gt;IIITB)</div>}
            </div>
            <div className="page12parentconnections">
                <div className="page12hostlocker"><div >Host Locker:IIITB:Transcripts</div></div>
                <select className="page12hostlocker" name="connectionType" onChange={handlelockerchange}>
                    <option value="default" disabled selected>Select Rohit's Locker</option>
                    <option value="Mtech2024">Real Estate</option>
                    <option value="Btech2024">Education</option>
                    <option value="Imtech2024">Medical</option>
                </select>


            </div>
            {selectedOption != "" &&
                <div className="page12paragraph">

                    Use this connection to apply for {selectedOption}. For this process, you will need to fulfill the following obligations:
                    <button onClick={handleClick}> Next </button>
                </div>

            }

        </div>
    );
}
