import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import "./guestuser.css";

export const Guestusers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);

  const [connections, setConnections] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Destructure connection and locker from location.state with fallback to empty object
  const { connection: connectionType = null, locker = null } = location.state || {};

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

    if (!connectionType || !locker) {
      setError("Locker or Connection Type information is missing.");
      return;
    }

    const token = Cookies.get('authToken');
    const params = new URLSearchParams({
      connection_type_name: connectionType.connection_type_name,
      host_locker_name: locker.name,
      host_user_username: curruser.username
    });

    fetch(`http://localhost:8000/get-guest-user-connection/?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.connections) {
          setConnections(data.connections);
          setFilteredConnections(data.connections);
        } else {
          setError("No connections found.");
        }
      })
      .catch(error => {
        setError("An error occurred while fetching connection details.");
        console.error("Error:", error);
      });
  }, [curruser, navigate, locker, connectionType]);

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleAdmin = () => {
    navigate('/admin');
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    Cookies.remove('authToken');
    localStorage.removeItem('curruser');
    setUser(null);
    navigate('/');
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const results = connections.filter(connection =>
      connection.guest_user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConnections(results);
  };

  const handleConnectionClick = (connection) => {
    navigate("/guest-terms-review", { state: { connection ,connectionType} });
  };

  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          {connectionType && (
            <>
              <div className="navbarBrand">{connectionType.connection_type_name} </div>
              <div className="description">{connectionType.connection_description}</div>
              <div id='conntentguest'>Created On: {new Date(connectionType.created_time).toLocaleDateString()}</div>
              <div id='conntentguest'>Valid Until: {new Date(connectionType.validity_time).toLocaleDateString()}</div>
            </>
          )}
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
          </ul>
        </div>
      </nav>

      <div className="page5heroContainer">
        <h4 className='guestusers'>Guest Users</h4>
        <div className="search">
          <form onSubmit={handleSearch}>
            <div className="searchContainer">
              <div className="inputContainer">
                <input type="text" placeholder="Search guest users" name="search" value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button className="find" type="submit">Search</button>
            </div>
          </form>
        </div>
        <div className="page5container">
          {error && <div className="error">{error}</div>}
          {filteredConnections.length > 0 ? (
            filteredConnections.map((connection, index) => (
              <div key={index} className="card">
                <h4>{connection.guest_user.username}</h4>
                <p>{connection.guest_user.description}</p>
                <button
                  className='cardButton'
                  onClick={() => handleConnectionClick(connection)}
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <p>No guest users found.</p>
          )}
        </div>
      </div>
    </div>

  );
};
