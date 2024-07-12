import React, { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import "./page1.css";
import { useNavigate, useLocation } from "react-router-dom";
import userImage from "../Assets/user_icon.png"; 

export const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const user = location.state ? location.state.user:null;

  // This should be dynamically obtained, hardcoded here for demonstration
  const username = "iiitb";

  useEffect(() => {
    // Retrieve the token from cookies
    const token = Cookies.get('authToken');

    // Fetch lockers for the specified user
    fetch(`http://127.0.0.1:8000/get-lockers-user/`, {
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
      } else {
        setError(data.message || data.error);
      }
    })
    .catch(error => {
      setError("An error occurred while fetching lockers.");
      console.error("Error:", error);
    });
  }, [username]);

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

  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">{user ? `${user.username}` : 'None'}</div>
          <div className="description">{user ? `${user.description}` : 'None'}</div>
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
              <a href="#" onClick={handleAdmin}>Admin</a>
            </li>
          </ul>

          {/* <ul className="navbarThirdLink">
            <li>
              <img src="" alt="User Icon" /> 
            </li>
            <li>
              <a href="#" onClick={handleLogout}>Logout</a>
            </li>
          </ul> */}



          <ul className="navbarThirdLink">
            <li>
              <img src={userImage} alt="User Icon" onClick={toggleDropdown} className="dropdownImage" />
              {isOpen && (
                <div className="dropdownContent">
                  {/* <button onClick={() => navigate('/profile')}>Profile</button> */}
                  <button onClick={handleAdmin}>Admin</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>

      <div className="heroContainer">
        <div className="newLocker">
          <h3>My Lockers</h3>
          <button id="newLockerBtn" onClick={handleNewLockerClick}>
            Create New Locker
          </button>
        </div>

        <div className="allLockers">
          {lockers.length > 0 ? (
            lockers.map(locker => (
              <div key={locker.id} className="page1-locker">
                <h4>{locker.name}</h4>
                <button id="openLockerBtn" onClick={() => handleClick(locker)}>Open</button>
              </div>
            ))
          ) : (
            <p>No lockers found.</p>
          )}
        </div>
      </div>
    </div>
  );
};