import React, { useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';
import { usercontext } from "../../usercontext";
import "./page4.css";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 


export const UploadResource = () => {
  const location = useLocation();
  const locker = location.state ? location.state.locker : null;
  const { curruser, setUser } = useContext(usercontext);
  const [resourceName, setResourceName] = useState("");
  const [document, setDocument] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const [visibility, setVisibility] = useState("public"); // Default value set to Public
  const navigate = useNavigate();

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, [curruser, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const data = new FormData();
    data.append('locker_name', locker.name);
    data.append('resource_name', resourceName);
    data.append('type', visibility);
    data.append('document', document);

    const token = Cookies.get('authToken');

    fetch('http://localhost:8000/upload-resource/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${token}`
      },
      body: data,
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Resource uploaded:", data);
        navigate("/view-locker",{state: {locker}});
      } else {
        console.error("Error:", data.error);
        alert(data.error);
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("An error occurred while uploading the resource");
    });
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
          <div className="navbarLockerName">Locker: {locker.name}</div>
          <div className="navbarLockerOwner">Owner: {curruser.username}</div>
        </div>
        <div className="navbarLinks">
          <ul className="navbarFirstLink">
            <li><a href="#" onClick={handleDPIDirectory}>DPI Directory</a></li>
          </ul>
          <ul className="navbarSecondLink">
            <li><a href="#" onClick={handleHomeClick}>Home</a></li>
            <li><a href="#"></a></li>
          </ul>
          <ul className="navbarThirdLink">
            <li> <img src={userImage} alt="User Icon" onClick={toggleDropdown} className="dropdownImage" />
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

      <div className="descriptionLocker">
        <p>{locker.description}</p>
      </div>

      <div className="page4heroContainer">
        <div className="page4resourceHeading">Resources</div>
        <div className="page4lockerForm">
          <form onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input
                type="text"
                name="resourceName"
                placeholder="Resource Name"
                onChange={(e) => setResourceName(e.target.value)}
                required
              />
            </label>
            <label>
              <span>Select File</span>
              <input
                type="file"
                name="document"
                onChange={(e) => setDocument(e.target.files[0])}
                required
              />
            </label>
            <label>
              <span>Visibility</span>
              <select
                name="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                required
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};
