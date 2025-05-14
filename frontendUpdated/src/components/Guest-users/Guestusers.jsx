import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import "./guestuser.css";
import Navbar from '../Navbar/Navbar';
import Sidebar from "../Sidebar/Sidebar.js";
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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export const Guestusers = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);

  const [connections, setConnections] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [trackerData, setTrackerData] = useState({});
  const [trackerDataReverse, setTrackerDataReverse] = useState({});


  // Destructure connection and locker from location.state with fallback to empty object
  const { connection: connectionType = null, locker = null } = location.state || {};
  const {
    hostLockerName,
    hostUserUsername,
    hostLocker,
  } = location.state || {};
  console.log("connections[0].host_locker", hostUserUsername)

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

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
          const filteredConnections = data.connections.filter(connection => connection.connection_status !== "closed");
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
      fetchTrackerDataReverse(connection);
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

  const fetchTrackerDataReverse = async (connection) => {
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
        `host/get-terms-status-reverse/?${params}`.replace(/host/, frontend_host),
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
        console.log("view locker", data);
        setTrackerDataReverse((prevState) => ({
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

  const getStatusColorReverse = (trackerReverse) => {
    const totalObligations =
      trackerReverse.count_T + trackerReverse.count_F + trackerReverse.count_R;
    if (trackerReverse.count_T === totalObligations && trackerReverse.count_R === 0) {
      return "green";
    } else if (trackerReverse.filled === 0 || trackerReverse.count_R === totalObligations) {
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

  const calculateRatioReverse = (trackerReverse) => {
    const totalObligations =
      trackerReverse.count_T + trackerReverse.count_F + trackerReverse.count_R;
    return totalObligations > 0
      ? `${trackerReverse.filled}/${totalObligations}`
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

  const handleConnectionHost = (connection) => {
    console.log("navigate", connection, connectionType);
    navigate("/view-host-terms-by-type", {
      state: {
        connection: connection,
        connection_id: connection.connection_id,
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
        hostLockerName: connection.host_locker?.name,
        guestLockerName: connection.guest_locker?.name,
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        locker: locker,
        guest_locker_id: connection.guest_locker?.locker_id,
        host_locker_id: connection.host_locker?.locker_id,
        hostLocker: connection.host_locker,
        guestLocker: connection.guest_locker
      },
    });
  };

  const navigateToConnDetails = (connection) => {
    console.log("print", connection); // Log the connection object

    const connectionName = connection.connection_type_name;
    const connectionDescription = connection.connection_description;

    console.log("Navigating with:", {
      connectionName,
      connectionDescription,
      hostLockerName,
      hostUserUsername
    });

    navigate("/display-terms", {
      state: {
        connectionTypeName: connectionName, // Extracted from connection object
        hostLockerName: hostLockerName,
        connectionTypeName: connection.connection_type_name,
        connectionDescription: connection.connection_description,
        createdtime: connection.created_time,
        validitytime: connection.validity_time,
        hostUserUsername: hostUserUsername,
        locker: locker,
        hostLocker: hostLocker,
        connectionType: connectionType,
        connection: connection,
        viewGuestuser: true,
      },
    });
  };
  console.log("connectionType", connectionType);
  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
  };

  const content = (
    <>
      {connectionType && (
        <>
          <div className="navbarBrands">{connectionType.connection_type_name}
            <i className="fa fa-info-circle" onClick={() => navigateToConnDetails(connectionType)}
              title="Show Connection Terms" style={{ fontSize: '16px', marginLeft: "10px" }}></i>

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
  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleClick(locker)} className="breadcrumb-item">View Locker</span>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">ShowGuestUsers</span>
    </div>
  )
  return (
    <div>
      <div className={`user-greeting-container shadow ${isSidebarOpen ? "d-none" : ""}`}>
        <button
          className="hamburger-btn me-2"
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <span className="fw-semibold fs-6 text-dark">
          Hi, {capitalizeFirstLetter(curruser.username)}
        </span>
      </div>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
      />
      <div className="locker-header">
        <div className="locker-text">
          <div className="navbar-content">{content}</div>
        </div>
        <div className="navbar-breadcrumbs">{breadcrumbs}</div>
      </div>
      {/* <Navbar content={content} breadcrumbs={breadcrumbs} /> */}
      <Box className="page5heroContainer" marginTop={{ md: "12px", xs: "12px" }}>
        <h4 className='guestusers' style={{ textAlign: "center", marginBottom: "25px", fontWeight: "bold" }}>Guest Users</h4>
        <div className="search">
          <form onSubmit={handleSearch}>
            <div className="inputContainer" style={{ display: "flex", justifyContent: "center", alignItems: "center", marginLeft: "20px", marginRight: "20px" }}>
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
        <Grid container spacing={{ md: 5, xs: 4, sm: 4 }} className="page5container" padding={{ md: 10, sm: 2, xs: 2 }}>
          {/* {error && <div className="error">{error}</div>} */}
          {filteredConnections.length > 0 ? (
            filteredConnections.map((connection, index) => {
              const tracker = trackerData[connection.connection_id];
              const color = tracker ? getStatusColor(tracker) : "gray";
              const ratio = tracker
                ? calculateRatio(tracker)
                : "Loading...";
              const trackerReverse = trackerDataReverse[connection.connection_id]
              const colorReverse = trackerReverse
                ? getStatusColorReverse(trackerReverse)
                : "gray";
              const ratioReverse = trackerReverse
                ? calculateRatioReverse(trackerReverse)
                : "Loading...";
              return (
                <Grid item xs={12} sm={6} md={4} paddingRight={{ md: 0, xs: "30px" }}>
                  <Grid container className="card">
                    <Grid item md={7} xs={12} key={index} >
                      <h4>{connection.guest_user.username}</h4>
                      <p>{connection.guest_user.description}</p>
                      <p> Locker: {connection.guest_locker.name}</p>
                      {/* <CardActions sx={{ justifyContent: 'center' }}>
                        <Button
                          className='cardButton'
                          size='small'
                          variant='contained'
                          fontWeight="bold"
                          onClick={() => handleConnectionClick(connection)}
                        >
                          View Details
                        </Button>
                      </CardActions> */}

                    </Grid>
                    <Grid item md={5} xs={12}>
                      <div className="d-flex align-items-center mt-2">

                        <h6 className="mt-2 me-2"><b>{capitalizeFirstLetter(connection.guest_user.username)}</b></h6>
                        <i className="bi bi-arrow-right me-2" style={{ fontSize: '1.2rem' }}></i>
                        <button
                          onClick={() => handleConnectionClick(connection)}
                          style={{
                            backgroundColor: color,
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          {ratio}
                        </button>
                      </div>

                      <div className="d-flex align-items-center mt-1">
                        <button className='me-2'
                          onClick={() => handleConnectionHost(connection)}
                          style={{
                            backgroundColor: colorReverse,
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          {ratioReverse}
                        </button>
                        <i className="bi bi-arrow-left me-2" style={{ fontSize: '1.2rem' }}></i>
                        <h6 className="mt-2 me-2"><b>{capitalizeFirstLetter(connection.host_user.username)}</b></h6>
                      </div>
                    </Grid>
                    <Grid md={12} xs={12} sm={12}>
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
                    </Grid>
                  </Grid>
                </Grid>

              );
            })
          ) : (
            <Typography variant="body1" padding={{ xs: "60px", md: "0px" }}>No guest users found.</Typography>

          )}
        </Grid>
      </Box>
    </div>

  );
};
