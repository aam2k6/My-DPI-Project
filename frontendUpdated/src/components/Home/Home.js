import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import "./page1.css";
import { useNavigate } from "react-router-dom";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 
import { usercontext } from "../../usercontext";

// Helper function to capitalize the first letter of a string
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const Home = () => {
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { curruser,setUser } = useContext(usercontext);

  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }},[]);

  useEffect(() => {
    const token = Cookies.get('authToken');

    fetch('http://172.16.192.201:8000/get-lockers-user/', {
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
  }, [curruser]);

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

  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">{curruser ? capitalizeFirstLetter(curruser.username) : 'None'}</div>
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
                  <div className="currusername">{capitalizeFirstLetter(curruser.username)}</div>
                  <div className="curruserdesc">{curruser.description}</div>

                  <button onClick={handleAdmin}>Settings</button>
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
