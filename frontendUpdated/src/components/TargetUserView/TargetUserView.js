import React, {useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./page6.css";
import Cookies from "js-cookie";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 
import { usercontext } from "../../usercontext";

export const TargetUserView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state ? location.state.user : null;
  const [allLockers, setLockers] = useState([]);
  const [error, setError] = useState(null);
   const [isOpen, setIsOpen] = useState(false);
   const { curruser,setUser } = useContext(usercontext);



  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }},[]);

  const handleNewLockerClick = () => {
    navigate('/create-locker');
  };

  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleLockersClick = (lockers) => {
    navigate('/target-locker-view', { state: { locker:lockers, user:user } });
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

  const handleAdmin = () => {
    navigate('/admin');
  }

  useEffect(() => {
    const fetchLockers = async () => {
      try {
        const token = Cookies.get('authToken');
        const params = new URLSearchParams({ username: user ? user.username : '' });

        console.log('Fetching lockers with token:', token);
        console.log('Fetching lockers with params:', params.toString());
        console.log('User object:', user);

        const response = await fetch(`http://localhost:8000/get-lockers-user/?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch lockers');
          console.error('Error fetching lockers:', errorData);
          return;
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
          setLockers(data.lockers || []);
        } else {
          setError(data.message || data.error);
        }
      } catch (error) {
        setError("An error occurred while fetching this user's lockers.");
        console.error("Error:", error);
      }
    };

    if (user) {
      fetchLockers();
    }
  }, [user]);

  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">{user ? user.username : 'None'}</div>
          <div className="description">{user ? user.description : 'None'}</div>
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

      <div className="heroContainer">
        <div className="newLocker">
          <h3></h3>
          {/* <button id="newLockerBtn" onClick={handleNewLockerClick}>
            Create New Locker
          </button> */}
        </div>
        <div className="page6-allLockers">
          {error && <div className="error">{error}</div>}
          {Array.isArray(allLockers) && allLockers.length > 0 ? (
            allLockers.map(lockers => (
              <div key={lockers.locker_id} className="page6-locker">
                <h4>{lockers.name}</h4>
                <button id="docsBtn" onClick={() => handleLockersClick(lockers)}>
                  Open
                </button>
              </div>
            ))
          ) : (
            <div>No lockers found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
