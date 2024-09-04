import React, { useState,useEffect,useContext } from "react";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./page2.css";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";

export const CreateLocker = () => {
  const navigate = useNavigate();
  const [lockerName, setLockerName] = useState("");
  const [description, setDescription] = useState("");
  const { curruser, setUser } = useContext(usercontext);

  const handleSubmit = (event) => {
    event.preventDefault();

    const token = Cookies.get('authToken');

    // Prepare data to send
    const data = new FormData();
    data.append('name', lockerName);
    data.append('description', description);

    // Send data to the backend
    fetch('http://host/create-locker/'.replace(/host/g, frontend_host), {
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


  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }
  },[]);


  return (
    <div>
      <Navbar />

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
