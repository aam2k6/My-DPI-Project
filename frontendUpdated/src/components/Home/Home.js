import React, { useEffect, useState } from "react";
import "./page1.css";
import { useNavigate } from "react-router-dom";

export const Home = () => {
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [error, setError] = useState(null);

  // This should be dynamically obtained, hardcoded here for demonstration
  const username = "iiitb";

  useEffect(() => {
    // Fetch lockers for the specified user
      //fetch(`http://172.16.192.201:8000/get-lockers-user/?username=${username}`)
      fetch(`http://127.0.0.1:8005/get-lockers-user/?username=${username}`)

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
    //console.log("Create New Locker button clicked");
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

  const handleClick = () => {
    navigate('/view-locker');
  };

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

      <div className="heroContainer">
        <div className="newLocker">
          <h3>My Lockers</h3>
          <button id="newLockerBtn" onClick={handleNewLockerClick}>
            Create New Locker
          </button>
        </div>

        {/* {error && <div className="error">{error}</div>} */}

        <div className="allLockers">
          {/* <div className="docs">
            <h4>Docs</h4>
            <button id="docsBtn" onClick={handleDocsClick}>
              Open
            </button>
          </div>

          <div className="education">
            <h4>Education</h4>
            <button id="educationBtn" onClick={handleEducationClick}>
              Open
            </button>
          </div> */}

          {lockers.length > 0 ? (
            lockers.map(locker => (
              <div key={locker.id} className="page1-locker">
                <h4>{locker.name}</h4>
                {/* <p>{locker.description}</p> */}
                <button id="openLockerBtn" onClick={handleClick}>Open</button>
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
