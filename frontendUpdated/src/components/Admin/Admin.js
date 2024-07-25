<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import "./Admin.css";
import Cookies from 'js-cookie';
=======
import React, { useState, useEffect, useContext } from "react";
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import Cookies from "js-cookie";
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4
import { useNavigate } from "react-router-dom";
import "./Admin.css";

export const Admin = () => {
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [otherConnections, setOtherConnections] = useState([]); // State for other connections
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { curruser, setUser } = useContext(usercontext);

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

<<<<<<< HEAD
    const [connectionTypes, setConnectionTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect(() => {

    //     const token = Cookies.get('authToken');
    //     fetch('http://localhost:8000/get-connection-type/', {
    //         method: 'GET',
    //         headers: {
    //             'Authorization': `Basic ${token}`,
    //             'Content-Type': 'application/json'
    //         }
    //     })
    //         .then(response => {
    //             if (!response.ok) {
    //                 throw new Error('Network response was not ok');
    //             }
    //             return response.json();
    //         })
    //         .then(data => {
    //             setConnectionTypes(data.connection_types);
    //             setLoading(false);
    //         })
    //         .catch(error => {
    //             setError(error.message);
    //             setLoading(false);
    //         });
    // }, []);



    const handleDPIDirectory = () => {
        navigate('/dpi-directory');
    };
=======
    fetchOtherConnections();
    fetchUserLockers();
  }, [curruser]);
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get('authToken');
      const response = await fetch(`http://localhost:8000/get-connection-type/`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json',
        },
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

  const fetchUserLockers = async () => {
    try {
      const token = Cookies.get('authToken');
      const response = await fetch('http://localhost:8000/get-lockers-user/', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setLockers(data.lockers);
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching lockers.");
    }
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

<<<<<<< HEAD
    return (
        <div>
            <nav className="navbar">
                <div className="wrap">
                    <div className="navbarBrand"></div>
                    <div className="description7"><u></u></div>
                </div>
=======
  const handleAdmin = () => {
    navigate('/admin');
  }
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

  const gotopage12createconnection = () => {
    navigate('/connection');
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }

<<<<<<< HEAD
                    <ul className="navbarThirdLink">
                        <li>
                            <img src="" alt="User Icon" />
                        </li>
                        <li>
                            <a href="#" onClick={handleLogoutClick}>Logout</a>

                        </li>
                    </ul>
                </div>
            </nav>
            <div className="page7description">
                <div className="descriptionpage7">Existing Connections</div>
                <button onClick={gotopage12createconnection} className="admin-btn">Create New Connection Type</button>
            </div>
            <div className="page8parent">
                {/* <div className="page8connections">
                    Btech 2020 applicant
                </div> */}

                {loading ? (
                    <div>Loading...</div>
                ) : error ? (
                    <div>Error: {error}</div>
                ) : connectionTypes.length > 0 ? (
                    connectionTypes.map((connection, index) => (
                        <div key={index} className="page8connections">
                            {connection.name}
                        </div>
                    ))
                ) : (
                    <div>No connection types found.</div>
                )}
            </div>
        </div>
       
=======
  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand"></div>
          <div className="description7"><u></u></div>
        </div>
        <div className="navbarLinks">
          <ul className="navbarFirstLink">
            <li><a href="#" onClick={handleDPIDirectory}>DPI Directory</a></li>
          </ul>
          <ul className="navbarSecondLink">
            <li><a href="#" onClick={handleHomeClick}>Home</a></li>
            <li><a href="#" onClick={handleAdmin}></a></li>
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
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

      <button onClick={gotopage12createconnection} className="admin-btn">Create New Connection Type</button>

      <div className="page8parent">
        <div className="descriptionadmin"> Existing Connections Type </div>
        {otherConnections.length > 0 ? (
          otherConnections.map(connection => (
            <div key={connection.connection_type_id} className="page8connections">
              <h4>{connection.connection_type_name}</h4>
              <p>{connection.connection_description}</p>
              <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
              <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
              <button>Edit</button>
            </div>
          ))
        ) : (
          <p>No connections found.</p>
        )}
      </div>

      <div className="page8parent">
        <div className="descriptionadmin"> Existing Lockers </div>
        {lockers.length > 0 ? (
          lockers.map(locker => (
            <div key={locker.id} className="page8connections">
              <h4>{locker.name}</h4>
              <button>Edit</button>
            </div>
          ))
        ) : (
          <p>No lockers found.</p>
        )}
      </div>
    </div>
  );
};
