import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import "./guestuser.css";
import Navbar from '../Navbar/Navbar';
import { frontend_host } from '../../config';

export const Guestusers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);

  const [connections, setConnections] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [trackerData, setTrackerData] = useState({});

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

    fetch(`host/get-guest-user-connection/?${params.toString()}`.replace(/host/, frontend_host), {
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
          fetchAllTrackerData(data.connections);
        } else {
          setError("No connections found.");
        }
      })
      .catch(error => {
        setError("An error occurred while fetching connection details.");
        console.error("Error:", error);
      });
  }, [curruser, navigate, locker, connectionType]);


  const fetchAllTrackerData = (outgoingConnections) => {
    outgoingConnections.forEach((connection) => {
      fetchTrackerData(connection);
    });
  };

  const fetchTrackerData = async (connection) => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        connection_name: connection.connection_name,
        host_locker_name: connection.host_locker.name,
        guest_locker_name: connection.guest_locker.name,
        host_user_username: connection.host_user.username,
        guest_user_username: connection.guest_user.username,
      });
      const response = await fetch(
        `host/get-terms-status/?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tracker data");
      }
      const data = await response.json();
      if (data.success) {
        // console.log("view locker", data);
        setTrackerData((prevState) => ({
          ...prevState,
          [connection.connection_id]: {
            count_T: data.count_T,
            count_F: data.count_F,
            count_R: data.count_R,
            filled: data.filled,
            empty: data.empty,
          },
        }));
      } else {
        setError(data.message || "Failed to fetch tracker data");
      }
    } catch (error) {
      console.error("Error fetching tracker data:", error);
      setError("An error occurred while fetching tracker data");
    }
  };

  const getStatusColor = (tracker) => {
    const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
    if (tracker.count_T === totalObligations && tracker.count_R === 0) {
      return "green";
    } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
      return "red";
    } else {
      return "orange";
    }
  };

  const calculateRatio = (tracker) => {
    const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
    return totalObligations > 0
      ? `${tracker.filled}/${totalObligations}`
      : "0/0";
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const results = connections.filter(connection =>
      connection.guest_user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConnections(results);
  };

  const handleConnectionClick = (connection) => {
    navigate("/guest-terms-review", { state: { connection, connectionType } });
  };

  
  const navigateToConnDetails = (connection) => {
    console.log("print", connection); // Log the connection object
  
    const connectionName = connection.connection_type_name; 
    const connectionDescription = connection.connection_description;
    
    console.log("Navigating with:", {
      connectionName,
      connectionDescription,
    });
  
    navigate("/display-terms", {
      state: {
        connectionTypeName: connectionName, // Extracted from connection object
        hostLockerName: connection.host_locker?.name,
        connectionTypeName: connection.connection_type_name,
        connectionDescription:connection.connection_description,
        createdtime:connection.created_time,
        validitytime:connection.validity_time,
        hostUserUsername: connection.host_user?.username,
        locker: locker,
      },
    });
  };
  
  const content = (
    <>
      {connectionType && (
        <>
          <div className="navbarBrand">{connectionType.connection_type_name} 
          <button
        className="info-button"
        onClick={() => navigateToConnDetails(connectionType)}
        title="Show Connection Terms"
        style={{ marginLeft: "10px", cursor: "pointer", background: "transparent", border: "none" }}
      >
        <i className="fa fa-info-circle" style={{ fontSize: '16px' }}></i>
      </button></div>
          <div className="description">{connectionType.connection_description}</div>
          <div id='conntentguest'>Created On: {new Date(connectionType.created_time).toLocaleDateString()}</div>
          <div id='conntentguest'>Valid Until: {new Date(connectionType.validity_time).toLocaleDateString()}</div>
        </>
      )}
    </>
  );
  // console.log(filteredConnections);
  return (
    <div>
      <Navbar content={content} />
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
          {/* {error && <div className="error">{error}</div>} */}
          {filteredConnections.length > 0 ? (
            filteredConnections.map((connection, index) => {
              const tracker = trackerData[connection.connection_id];
              const color = tracker ? getStatusColor(tracker) : "gray";
              const ratio = tracker
                ? calculateRatio(tracker)
                : "Loading...";
              return (
                <div key={index} className="card">
                  <h4>{connection.guest_user.username}</h4>
                  <p>{connection.guest_user.description}</p>
                  <p> Locker: {connection.guest_locker.name}</p>
                  <button
                    className='cardButton'
                    onClick={() => handleConnectionClick(connection)}
                  >
                    View Details
                  </button>
                  <button id = "track"
                    onClick={() => handleConnectionClick(connection)}
                    style={{ backgroundColor: color }}
                  >
                    {ratio}
                  </button >
                </div>
              );
            })
          ) : (
            <p>No guest users found.</p>
          )}
        </div>
      </div>
    </div>

  );
};
