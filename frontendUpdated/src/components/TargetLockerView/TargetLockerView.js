import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./page7.css";

export const TargetLockerView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [parentUser, setParentUser] = useState(location.state ? location.state.user : null);
  const [resources, setResources] = useState([]);
  const [locker, setLocker] = useState(location.state ? location.state.locker : null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
    if (parentUser && locker) {
      fetchResources();
    }
  }, [curruser, navigate, parentUser, locker]);

  const fetchResources = async () => {
    const token = Cookies.get('authToken');
    try {
      const response = await fetch(`http://localhost:8000/get-public-resources/${parentUser.user_id}/${locker.locker_id}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setResources(data.resources);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching resources");
    }
  };

  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleClick = () => {
    navigate('/create-connection-terms');
  };

  const handleLogoutClick = () => {
    console.log("Logout button clicked");
    navigate('/');
  };

  const handleAdminClick = () => {
    console.log("Admin button clicked");
    navigate('/admin');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">{locker?.name}</div>
          <div className="description7">Owner:<u>{parentUser?.username}</u></div>
        </div>
        <div className="navbarLinks">
          <ul className="navbarFirstLink">
            <li><a href="#" onClick={handleDPIDirectory}>DPI Directory</a></li>
          </ul>
          <ul className="navbarSecondLink">
            <li><a href="#" onClick={handleHomeClick}>Home</a></li>
            <li><a href="#" onClick={handleAdminClick}>Admin</a></li>
          </ul>
          <ul className="navbarThirdLink">
            <li><img src="" alt="User Icon" /></li>
            <li><a href="#" onClick={handleLogoutClick}>Logout</a></li>
          </ul>
        </div>
      </nav>
      <div className="page7description">
        <div className="descriptionpage7">{locker?.description}</div>
        <button onClick={handleClick} className="new-connection-btn">Create New Connection</button>
      </div>
      <div className="page7container">
        <div className="notvisible">
          <div className="page7publicresources">
            <p>Public resources: Resources for all</p>
            {resources.map(resource => (
              <div className="page7resource" key={resource.id}>
                <u>{resource.name}</u>
              </div>
            ))}
          </div>
          <div className="page7publicresources">
            <p>Other Resources</p>
            {/* Additional resources can be displayed here */}
          </div>
        </div>
        <div className="page7containerB">
          <p>My connections</p>
          <div className="page7myconnections">
            <div id="conntent"><h3>Btech 2020: Applicant</h3></div>
            <div id="conntent">IIITb Transcripts &lt;&gt; Rohith: Education</div>
            <div id="conntent">Created On:</div>
            <div id="conntent">Valid Until:</div>
          </div>
          <div className="page7myconnections">
            <div id="conntent"><h3>IMtech 2020: Applicant</h3></div>
            <div id="conntent">IIITb Transcripts &lt;&gt; Rohith: Education</div>
            <div id="conntent">Created On:</div>
            <div id="conntent">Valid Until:</div>
          </div>
        </div>
      </div>
    </div>
  );
};
