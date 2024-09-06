import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import "./page1.css";
import { useNavigate } from "react-router-dom";
//import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";

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
  const { curruser } = useContext(usercontext);


  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }},[]);


  useEffect(() => {
    const fetchLockers = async () => {
      try {
        const token = Cookies.get('authToken');
        console.log('Fetching lockers with token:', token);

        const response = await fetch('host/get-lockers-user/'.replace(/host/, frontend_host), {
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

    if (curruser) {
      fetchLockers();
    }
  }, [curruser]);

  const handleNewLockerClick = () => {
    navigate('/create-locker');
  };

  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
  };

  const content = (
    <>
      <div className="navbarBrand">
        {curruser ? capitalizeFirstLetter(curruser.username) : "None"}
      </div>
      <div className="description">
        {curruser ? curruser.description : "None"}
      </div>
    </>
  );

  return (
    <div>

  <Navbar content = {content}/>

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
              <div key={locker.locker_id} className="page1-locker">
                <h4>{locker.name}</h4>
                
                {locker.is_frozen === false && <button id="openLockerBtn" onClick={() => handleClick(locker)}>Open</button>}
                {locker.is_frozen === true && <button id="openLockerBtn">Frozen</button>}
    
                <p className="description2">{locker.description}</p>
               
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
