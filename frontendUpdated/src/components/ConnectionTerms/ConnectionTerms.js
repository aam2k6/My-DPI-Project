import React, { useContext, useEffect, useState } from 'react';

import { useLocation,useNavigate } from "react-router-dom";
import "./connectionTerms.css";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 

import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";

export const ConnectionTerms = () => {
    const navigate = useNavigate();
  const location = useLocation();
  const locker = location.state ? location.state.selectedLocker : null;


    const initialFormData = {
        labelName: "",
        typeOfAction: "share",
        typeOfSharing: "text",
        labelDescription: "",
        hostPermissions: "read",
    };

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
      };
  


    const [formData, setFormData] = useState(initialFormData);
    const [obligations, setObligations] = useState({});
  const [error, setError] = useState(null);
  const { curruser, setUser } = useContext(usercontext);
  const [isOpen, setIsOpen] = useState(false);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleAddObligation = () => {
        if (formData.labelName.trim() !== "") {
            setObligations({
                ...obligations,
                [formData.labelName]: { ...formData },
            });
            setFormData(initialFormData);
        }


    };

    const handleLoadObligation = (key) => {
        setFormData(obligations[key]);
    };




    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("Form submitted");
        navigate("/admin");
    };

    const handleHomeClick = () => {
        navigate("/home");
    };

    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };

    const handleAdmin = () => {
        navigate('/admin');
    }
    const handleLogout = () => {
        Cookies.remove('authToken');
        localStorage.removeItem('curruser');
        setUser(null);
        navigate('/');
      }
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
      }


  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }   },[curruser]);

    const token = Cookies.get('authToken');

      


    return (
        <div>
            <nav className="navbar">
                <div className="wrap">
                    <div className="navbarLockerName">Locker : {locker.name}</div>
                    <div className="navbarLockerOwner">Owner : {curruser.username}</div>
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
                            <a href="#" onClick={handleAdmin}></a>
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

            <div className="connectionTerms-heroContainer">


                <div className="main-heading">Guest Terms Of Service</div>

                <div className="parent-container">

                    <div className="parent-left-heading">
                        <div className="parent-left-heading-title">
                        <div className="connectionTerms-resourceHeading">Guest Obligations</div>
                        <button className="handle-obligation" type="button" onClick={handleAddObligation}>Add Obligations</button>
                        </div>

                        <div className="connectionTerms-lockerForm">
                            <form className="connectionTerms-lockerForm" onSubmit={handleSubmit}>
                                
                                    <label className="obligation-label">
                                        <span>Label</span>
                                        <input type="text" name="labelName" placeholder="Label of data shared" value={formData.labelName} onChange={handleInputChange} />
                                    </label>

                                    <label className="obligation-label">
                                        <span >Type of Action</span>
                                        <select className="Title" name="typeOfAction" value={formData.typeOfAction} onChange={handleInputChange}>
                                            <option value="text">Add Value</option>
                                            <option value="file">Upload File</option>
                                            <option value="date">Add Date</option>

                                        </select>
                                        <span className="tooltip">?
                                            <span className="tooltiptext">Choose the action type: Share, Transfer, Confer, or Collateral.</span>
                                        </span>
                                    </label>

                                    <label className="obligation-label">
                                        <span>Type of Sharing</span>
                                        <select className="Title" name="typeOfSharing" value={formData.typeOfSharing} onChange={handleInputChange} >
                                            <option value="share">Share</option>
                                            <option value="transfer">Transfer</option>
                                            <option value="confer">Confer</option>
                                            {/* <option value="create">Create</option> */}
                                            <option value="collateral">Collateral</option>

                                        </select>
                                        <span className="tooltip">?
                                            <span className="tooltiptext">Share -- The owner of an artifact ("a") in system "s" sets up a way for someone in system "t" to access it.
                                            Transfer -- The owner of an artifact ("a") moves the ownership completely from one system ("s") to another system ("t"). After this, the new owner in system "t" has full rights over the artifact.
                                            Confer -- The owner of an artifact ("a") in system "s" gives ownership to someone in system "t" with certain conditions ("c"). The new owner in "t" has rights over the artifact as specified in "c", but the original owner in "s" still retains some rights over it.
                                            Collateral -- The owner of an artifact ("a") temporarily gives ownership to system "t" as a guarantee until certain obligations ("o") are met.
                                            </span>
                                        </span>
                                    </label>

                                    <label className="obligation-label">
                                        <span>Description</span>
                                        <input
                                            type="text"
                                            name="labelDescription"
                                            placeholder="name"
                                            value={formData.labelDescription} onChange={handleInputChange}
                                        />
                                    </label>

                                    <label className="obligation-label">
                                        <span >Host Permissions</span>
                                        <select className="Title" name="hostPermissions" value={formData.hostPermissions} onChange={handleInputChange}>
                                            <option value="read">Reshare</option>
                                            <option value="write">Download</option>
                                            <option value="execute">Aggregate</option>
                                        </select>
                                        <span className="tooltip">?
                                            <span className="tooltiptext">Select host permissions: Reshare, Download, or Aggregate.</span>
                                        </span>
                                    </label>

                               

                                <h2>Permissions</h2>
                                <label className="permission-label">
                                    <span className="permission-labels">Can the guest share more data</span>
                                    <input type="checkbox" name="canShareMore" checked={formData.canShareMore} />
                                </label>

                                <label className="permission-label">
                                    <span className="permission-labels">Can they download the data</span>
                                    <input type="checkbox" name="canDownload" checked={formData.canDownload} />
                                </label>



                                <div className="connectionTerms-btn" >
                                    {/* <button >Add</button> */}

                                    <button type="submit">Submit</button>

                                </div>
                            </form>
                        </div>
                    </div>


                    <div className="parent-right-heading">

                        {/* <div className="connectionTerms-resourceHeading">Guest Obligations</div> */}
                        


                        {Object.keys(obligations).map((key) => (
                            <button className="obligation-button" key={key} onClick={() => handleLoadObligation(key)}>
                                {key}
                            </button>
                        ))}

                    </div>
                </div>
            </div>
        </div>

    );
};
