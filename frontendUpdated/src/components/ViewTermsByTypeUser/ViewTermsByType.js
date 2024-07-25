import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import Cookies from 'js-cookie';
import {GetResource} from './GetResource'
import "./ViewTermsByType.css";


export const ViewTermsByType = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const { curruser, setUser } = useContext(usercontext);
    const [showResources, setShowResources] = useState(false);

    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }
    }, []);

    const handleNewLockerClick = () => {
        navigate('/create-locker');
    };

    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };

    const handleHomeClick = () => {
        navigate('/home');
    };

    const handleLogout = () => {
        // Clear cookies
        Cookies.remove('authToken');
        // Clear local storage
        localStorage.removeItem('curruser');
        // Set user context to null
        setUser(null);
        // Redirect to login page
        navigate('/');
    }
    const handleClick = (locker) => {
        navigate('/view-locker', { state: { locker } });
    };

    const handleAdmin = () => {
        navigate('/admin');
    }


    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    }

    const handleResourceSubmit = () =>{
        setShowResources(false);
    }

    const handleButtonClick = () =>{
        setShowResources(true);
    }



    return (
        <div>
            <nav className="navbar">
                <div className="wrap">
                    <div className="navbarBrand">{curruser ? curruser.username : 'None'}</div>
                    <div className="description">{curruser ? curruser.description : 'None'}</div>
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



        <div className={showResources ? "split-view" : ""}>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Sno</th>
                            <th>Name</th>
                            <th>Enter value</th>
                            <th>Restrictions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>Application ID</td>
                            <td>
                            <input type="text" placeholder="Enter value" />                                
                            </td>
                            <td>IIITB can save, aggregate this value</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Btech Marks</td>
                            <td>
                                <button onClick = {handleButtonClick}>Choose Resource</button>
                                
                            </td>
                            <td>IIITB can't reshare, download or aggregate this data.</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Gate Score Card</td>
                            <td>
                                <button onClick = {handleButtonClick}>Choose Resource</button>
                            </td>
                            <td>IIITB can't reshare, download or aggregate this data.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {showResources && (
                    <div className="resource-container">
                        <GetResource onSubmit={handleResourceSubmit} />
                    </div>
                )}

        </div>
        </div>
    );
}