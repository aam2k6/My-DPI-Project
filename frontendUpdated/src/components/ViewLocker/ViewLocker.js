import React from 'react';
import './page3.css';
import { useNavigate } from "react-router-dom";


export const ViewLocker = () => {
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

  const handleDocsClick = () => {
    console.log("Open Docs button clicked");
  };

  const handleEducationClick = () => {
    console.log("Open Education button clicked");
    navigate('/view-locker');
  };

  const handleUploadResource = () => {
    navigate('/upload-resource')
  }

  const handleAdmin = () =>{
    navigate('/admin');
  }

  const handleLogout = () =>{
    navigate('/');
  }


  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">Locker:Education</div>
          <div className="description3">Owner:Rohith</div>
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

      <div className="container">
        <div className="locker-name">
          <div className="loc"><span className='desc'>This locker consists of my Education documents</span></div>
        </div>
        <div className="container-2 clearfix">
          <div className="a">
            <div className="res"><h3>Resources</h3></div>
            <div className="container-3 clearfix">
              <div className="aa">
                <div id="documents">Transcripts.pdf</div>
                <div id="documents">10thMarks-card.pdf</div>
              </div>
              <div className="bb">
                <div className="public-private">Public/private</div>
                <div className="public-private">Public/private</div>
              </div>
            </div>
            <button className="page3button">Share</button>
            &nbsp;&nbsp;&nbsp;
            <button className="page3button" onClick={handleUploadResource}>Upload resource</button>
          </div>
          <div className="b">
            <h3 id="mycon">My Connections:</h3>
            <div className="conn">
              <div id="conntent"><h3>Btech Admission</h3></div>
              <div id="conntent">IIITb Transcripts&lt;&gt;Rohith:Education</div>
              <div id="conntent">Created On:</div>
              <div id="conntent">Valid Until:</div>
            </div>
            <div className="conn">
              <div id="conntent"> <h3>Real Estate</h3></div>
              <div id="conntent">Mantri Builder Property&lt;&gt;Rohith:Education</div>
              <div id="conntent">Created On:</div>
              <div id="conntent">Valid Until:</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

