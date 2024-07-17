import React, { useState,useEffect,useContext } from "react";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";

import Cookies from "js-cookie";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import "./page2.css";

export const CreateLocker = () => {
  const navigate = useNavigate();
  const [lockerName, setLockerName] = useState("");
  const [description, setDescription] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { curruser, setUser } = useContext(usercontext);


  const handleSubmit = (event) => {
    event.preventDefault();

    const token = Cookies.get('authToken');

    // Prepare data to send
    const data = new FormData();
    data.append('name', lockerName);
    data.append('description', description);

    // Send data to the backend
    fetch('http://172.16.192.201:8000/create-locker/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${token}`, // Add token to the headers
      },
      body: data,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log("Locker created:", data);
          // Redirect to another page or show success message
          navigate('/home');
        } else {
          console.error("Error:", data.error);
          // Show error message
          alert(data.error);
        }
      })
      .catch(error => {
        console.error("Error:", error);
        // Show error message
        alert("An error occurred while creating the locker");
      });
  };


  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleHomeClick = () => {
    navigate('/home');
  };
  const handleLogout = () => {
    Cookies.remove('authToken');
    localStorage.removeItem('curruser');
    setUser(null);
    navigate('/');
  }
  const handleAdmin = () =>{
    navigate('/admin');
  }

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }

  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }
  },[]);

  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand"></div>
          <div className="description"></div>
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
                 
                 
                  <div className="currusername">{curruser.username}</div>
                  <div className="curruserdesc">{curruser.description}</div>
                  <button onClick={handleAdmin}>Admin</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>

      <div className="page2heroContainer">
        <form className="page2lockerForm" onSubmit={handleSubmit}>
          <label>
            <span>Locker Name</span>
            <input type="text" name="lockerName" placeholder="Enter Locker Name" onChange={(e) => setLockerName(e.target.value)} />
          </label>

          <label>
            <span>Description </span>
            <input type="text" name="lockerDescription" placeholder="Enter description" onChange={(e) => setDescription(e.target.value)} />
          </label>

          <button type="submit">Submit</button>

        </form>

      </div>
    </div>
  );
};