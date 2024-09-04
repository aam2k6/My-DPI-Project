import React, {useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./page6.css";
import Cookies from "js-cookie"; 
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";

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


  const handleLockersClick = (lockers) => {
    navigate('/target-locker-view', { state: { locker:lockers, user:user } });
  }
   
  useEffect(() => {
    const fetchLockers = async () => {
      try {
        const token = Cookies.get('authToken');
        const params = new URLSearchParams({ username: user ? user.username : '' });

        console.log('Fetching lockers with token:', token);
        console.log('Fetching lockers with params:', params.toString());
        console.log('User object:', user);

        const response = await fetch(`http://host/get-lockers-user/?${params}`.replace(/host/g, frontend_host), {
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

  const content = (
    <>
    <div className="navbarBrand">{user ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'None'}</div>
          <div className="description">{user ? user.description : 'None'}</div></>
  );

  return (
    <div>
      <Navbar content = {content}/>

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
                <p className="description2">{lockers.description}</p>
                {lockers.is_frozen === false && <button id="docsBtn" onClick={() => handleLockersClick(lockers)}>
                  Open
                </button>} 
                {lockers.is_frozen === true && <button id="docsBtn">Frozen</button> }
                
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
