import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./page7.css";
<<<<<<< HEAD
=======
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

export const TargetLockerView = () => {
  const navigate = useNavigate();
  const location = useLocation();
<<<<<<< HEAD
  const { curruser } = useContext(usercontext);
  const [parentUser, setParentUser] = useState(location.state ? location.state.user : null);
  const [resources, setResources] = useState([]);
  const [locker, setLocker] = useState(location.state ? location.state.locker : null);
  const [error, setError] = useState(null);

=======
  const { curruser, setUser } = useContext(usercontext);

  const [parentUser, setParentUser] = useState(location.state ? location.state.user : null);
  const [resources, setResources] = useState([]);
  const [otherConnections, setOtherConnections] = useState([]); // State for other connections
  const [locker, setLocker] = useState(location.state ? location.state.locker : null);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4
  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
    if (parentUser && locker) {
      fetchResources();
<<<<<<< HEAD
=======
      fetchOtherConnections(); // Fetch other connections when component mounts
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4
    }
  }, [curruser, navigate, parentUser, locker]);

  const fetchResources = async () => {
<<<<<<< HEAD
    const token = Cookies.get('authToken');
    try {
      const response = await fetch(`http://localhost:8000/get-public-resources/${parentUser.user_id}/${locker.locker_id}/`, {
=======
    try {
      const token = Cookies.get('authToken');
      const params = new URLSearchParams({ locker_name: locker.name, username: parentUser.username });

      const response = await fetch(`http://localhost:8000/get-public-resources?${params}`, {
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4
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
<<<<<<< HEAD
=======

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get('authToken');
      const params = new URLSearchParams({ guest_username: parentUser.username, guest_locker_name: locker.name });
      
      const response = await fetch(`http://localhost:8000/get-other-connections/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setOtherConnections(data.connection_types); // Updated to match the new response structure
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching other connections");
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleClick = () => {
<<<<<<< HEAD
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

=======
    navigate('/make-connection',{state:{hostuser:parentUser,hostlocker:locker}});
  };

  const handleResourceClick = (filePath) => {
    const url = `http://localhost:8000/media/${filePath}`;
    window.open(url, "_blank");
  };

  const handleLogout = () => {
    Cookies.remove('authToken');
    localStorage.removeItem('curruser');
    setUser(null);
    navigate('/');
  }

  const handleAdmin = () => {
    navigate('/admin');
  };

>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4
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
<<<<<<< HEAD
            <li><a href="#" onClick={handleAdminClick}>Admin</a></li>
          </ul>
          <ul className="navbarThirdLink">
            <li><img src="" alt="User Icon" /></li>
            <li><a href="#" onClick={handleLogoutClick}>Logout</a></li>
=======
            <li><a href="#" ></a></li>

          </ul>
          <ul className="navbarThirdLink">
            <li>
              <img src={userImage} alt="User Icon" onClick={toggleDropdown} className="dropdownImage" />
              {isOpen && (
                <div className="dropdownContent">
                  <div className="currusername">{curruser.username}</div>
                  <div className="curruserdesc">{curruser.description}</div>
                  <button onClick={handleAdmin}>Settings</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </li>
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4
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
<<<<<<< HEAD
            {resources.map(resource => (
              <div className="page7resource" key={resource.id}>
                <u>{resource.name}</u>
              </div>
            ))}
          </div>
          <div className="page7publicresources">
            <p>Other Resources</p>
            {/* Additional resources can be displayed here */}
=======
            {resources.length > 0 ? (
              resources.map(resource => (
                <div className="page7resource" key={resource.id}>
                  <div id="documentspage7" onClick={() => handleResourceClick(resource.i_node_pointer)}>
                    {resource.document_name}
                  </div>
                </div>
              ))
            ) : (
              <p id="page7nores">No resources found.</p>
            )}
          </div>

          <div className="page7publicresources">
            <p>Other Connections</p>
            {otherConnections.length > 0 ? (
              otherConnections.map(connection => (
                <div className="page7connection" key={connection.connection_type_id}>
                  <div id="connectionpage7">
                    <strong>{connection.connection_type_name}</strong>: {connection.connection_description}
                    <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
                    <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <p id="page7noconn">No other connections found.</p>
            )}
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4
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
