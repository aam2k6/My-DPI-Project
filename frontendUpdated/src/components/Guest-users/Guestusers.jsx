import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import "./guestuser.css";
import Navbar from '../Navbar/Navbar';
import { frontend_host } from '../../config';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Grid,
  TextField,
} from '@mui/material';

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

  console.log(connectionType, locker);
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
          const filteredConnections = data.connections.filter(connection => !connection.closed);
          setFilteredConnections(filteredConnections);
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
    console.log("navigate", connection, connectionType);
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
  console.log("connectionType", connectionType);
  const content = (
    <>
      {connectionType && (
        <>
          <div className="navbarBrands">{connectionType.connection_type_name} 
          <i className="fa fa-info-circle"  onClick={() => navigateToConnDetails(connectionType)}
            title="Show Connection Terms" style={{ fontSize: '16px', marginLeft:"10px" }}></i>

            {/* <button
            className="info-button"
            onClick={() => navigateToConnDetails(connectionType)}
            title="Show Connection Terms"
            style={{ marginLeft: "10px", cursor: "pointer", background: "transparent", border: "none" }}
            >
              <i className="fa fa-info-circle" style={{ fontSize: '16px' }}></i>
            </button> */}
          </div>
          {/* <div className="description">{connectionType.connection_description}</div> */}
          {/* <details>
  <summary class="truncate">
    <span class="content"></span>
  </summary>
  <p>{connectionType.connection_description}</p>
  <div id='conntentguest'>Created On: {new Date(connectionType.created_time).toLocaleDateString()}</div>
          <div id='conntentguest'>Valid Until: {new Date(connectionType.validity_time).toLocaleDateString()}</div>
</details> */}
          
        </>
      )}
    </>
  );
  // console.log(filteredConnections);
  return (
    <div>
      <Navbar content={content} />
      <Box className="page5heroContainer" marginTop={{md:"150px", xs:"100px"}}>
        <h4 className='guestusers' style={{textAlign:"center",marginBottom:"25px", fontWeight:"bold"}}>Guest Users</h4>
        <div className="search">
          <form onSubmit={handleSearch}>
            <div className="inputContainer" style={{ display: "flex", justifyContent: "center", alignItems: "center", marginLeft:"20px", marginRight:"20px"}}>
              <TextField
                type="text"
                size='small'
                placeholder="Search guest users"
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "200px",
                  marginRight: "0.5rem",
                  // padding: "0.25rem 0.5rem",
                  border: "2px solid black",
                  borderRadius: "10px"
                }}
              />
              
              <Button
                className="find"
                variant="contained"
                type="submit"
                size='small'
                style={{
                  minWidth: "80px",
                  padding: "0.5rem 1rem",
                  fontWeight: "bold",
                }}
              >
                Search
              </Button>
            </div>
          </form>
        </div>
        <Grid container spacing={{md:20, xs:4, sm:4}} className="page5container" padding={{md:10, sm:2, xs:2}}>
          {/* {error && <div className="error">{error}</div>} */}
          {filteredConnections.length > 0 ? (
            filteredConnections.map((connection, index) => {
              const tracker = trackerData[connection.connection_id];
              const color = tracker ? getStatusColor(tracker) : "gray";
              const ratio = tracker
                ? calculateRatio(tracker)
                : "Loading...";
              return (
                <Grid item xs={12} sm={6} md={4} >
                  <div key={index} className="card">
                  <h4>{connection.guest_user.username}</h4>
                  <p>{connection.guest_user.description}</p>
                  <p> Locker: {connection.guest_locker.name}</p>
                  <CardActions sx={{ justifyContent: 'center' }}>
                  <Button
                    className='cardButton'
                    size='small'
                    variant='contained'
                    fontWeight="bold"
                    onClick={() => handleConnectionClick(connection)}
                  >
                    View Details
                  </Button>
                  </CardActions>
                  <Button id = "track"
                    onClick={() => handleConnectionClick(connection)}
                    style={{ backgroundColor: color }}
                  >
                    {ratio}
                  </Button >
                </div>
                </Grid>
                
              );
            })
          ) : (
            <Typography variant="body1" padding={{xs:"60px", md:"120px"}}>No guest users found.</Typography>

          )}
        </Grid>
      </Box>
    </div>

  );
};
