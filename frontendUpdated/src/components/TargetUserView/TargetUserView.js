import React from "react";
import { useNavigate } from "react-router-dom";
import "./page6.css";



export const TargetUserView = () => {
  const navigate = useNavigate();

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

  const handleTranscriptsClick = () => {
    navigate('/target-locker-view');
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
          <div className="navbarBrand" id="deem">IIITB</div>
          <div className="description" id="deem">&lt;Deemed University&gt;</div>
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
          <h3>IIITB Lockers</h3>
          {/* <button id="newLockerBtn" onClick={handleNewLockerClick}>
            Create New Locker
          </button> */}
        </div>
        <div className="page6-allLockers">
          <div className="page6-locker">
            <h4>Transcripts </h4>
            <button id="docsBtn" onClick={handleTranscriptsClick}>
              Open
            </button>
          </div>

          <div className="page6-locker">
            <h4>Statutory Documents </h4>
            <button id="educationBtn" >
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


