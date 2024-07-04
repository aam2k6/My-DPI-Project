import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./page2.css";

export const CreateLocker = () => {
  const navigate = useNavigate();
  const [lockerName, setLockerName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    // Prepare data to send
    const data = new FormData();
    data.append('name', lockerName);
    data.append('description', description);

    // Send data to the backend
    fetch('http://172.16.192.201:8000/create-locker/', {
      method: 'POST',
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

  const handleLogout = () =>{
    navigate('/');
  }

  const handleAdmin = () =>{
    navigate('/admin');
  }


  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">Rohith</div>
          <div className="description">MS Student at IIIT Bangalore</div>
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

          <ul className="navbarThirdLink">
            <li>
              <img src="" alt="User Icon" />
            </li>
            <li>
              <a href="#" onClick={handleLogout}>Logout</a>
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
