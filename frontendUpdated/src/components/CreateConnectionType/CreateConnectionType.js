import React, { useContext, useEffect, useState } from 'react';

import "./CreateConnectionType.css";
import { useNavigate ,useLocation} from "react-router-dom";
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";

export const CreateConnectionType = () => {
    const navigate = useNavigate();
    const [selectedOption, setSelectedOption] = useState(""); // Step 2: Create a state variable
    const [userlocker, setuserlocker] = useState(""); // Step 2: Create a state variable
    const location = useLocation();


    const [lockers, setLockers] = useState([]);
    const [error, setError] = useState(null);
    const [selectedLocker, setSelectedLocker] = useState(null);


  const [parentUser, setParentUser] = useState(location.state ? location.state.hostuser : null);
  const [locker, setLocker] = useState(location.state ? location.state.hostlocker : null);


    
    const { curruser, setUser } = useContext(usercontext);
    const [isOpen, setIsOpen] = useState(false);
  

    // const locker = location.state ? location.state.selectedLocker : null;

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
      };
  



    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };

    const handleHomeClick = () => {
        navigate('/home');
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

    //   const handleLockerChange = (event) => {
    //     const selectedLockerName = event.target.value;
    //     const locker = lockers.find(l => l.name === selectedLockerName);
    //     setSelectedLocker(locker);
    // };


  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }   },[curruser]);

    // const token = Cookies.get('authToken');

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


    const handleLockerChange = (event) => {
        const selectedLockerName = event.target.value;
        const locker = lockers.find(l => l.name === selectedLockerName);
        setSelectedLocker(locker);
    };

      

    const handleClick = () => {
        navigate('/show-connection-terms');
    }

    const handleSelectChange = (event) => {
        setSelectedOption(event.target.value); // Step 3: Update the state variable on change
    };
    // const handlelockerchange = (event) => {
    //     setuserlocker(event.target.value); // Step 3: Update the state variable on change
    // };

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
                            <a href="#" ></a>
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

            <div className="page12typeofconn">
                {/* Step 4: Conditionally render content based on the selected option */}
                {selectedOption === "Mtech2024" && <div>Mtech2024 (Connection) (Rohith&lt;&gt;IIITB)</div>}
                {selectedOption === "Btech2024" && <div>Btech2024 (Connection) (Rohith&lt;&gt;IIITB)</div>}
                {selectedOption === "Imtech2024" && <div>Imtech2024 (Connection) (Rohith&lt;&gt;IIITB)</div>}
            </div>
            <div className="page12parentconnections">
                <div className="page12hostlocker"><pre> Host User:{parentUser.username} <br></br>  
                     &nbsp;Host Locker: {locker.name}</pre></div>
               
                <span className='createconnectionmylock'> <pre>Select My locker</pre></span>
                <select className="page12hostlocker" name="connectionType" onChange={handleLockerChange}>
                   {lockers.map(locker => (
                                    <option key={locker.id} value={locker.name}>
                                        {locker.name}
                                    </option>
                                ))}
                </select>
               

            </div>
            {selectedOption != "" &&
                <div className="page12paragraph">

                     <u>"{selectedOption}"</u> For this connection type you will need to fulfill the following obligations: click on next button
                    <button onClick={handleClick} className="next-btn"> Next </button>
                </div>

            }

        </div>
    );
}
