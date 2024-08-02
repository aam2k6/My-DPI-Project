import React, { useContext, useEffect, useState } from 'react';
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import './page3.css';
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { useParams, useLocation } from 'react-router-dom';
import { usercontext } from "../../usercontext";

export const ViewLocker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locker = location.state ? location.state.locker : null;

  const [isOpen, setIsOpen] = useState(false);

  const { curruser, setUser } = useContext(usercontext);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);

  const [connections, setConnections] = useState({ incoming_connections: [], outgoing_connections: [] });
  const [otherConnections, setOtherConnections] = useState([]); // State for other connections
  const [trackerData, setTrackerData] = useState([]);

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, [curruser, navigate]);

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get('authToken');
      const params = new URLSearchParams({ locker_name: locker.name });

      const response = await fetch(`http://localhost:8000/connection_types/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {

        setOtherConnections(data.connection_types);
        // fetchAllTrackerData(data.connections.outgoing_connections);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching other connections");
    }
  };

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const token = Cookies.get('authToken');
        const params = new URLSearchParams({ locker_name: locker.name });

        const response = await fetch(`http://localhost:8000/get-connections-user-locker/?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch connections');
        }

        const data = await response.json();
        if (data.success) {
          setConnections(data.connections);
          fetchAllTrackerData(data.connections.outgoing_connections);
        } else {
          setError(data.message || 'Failed to fetch connections');
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
        setError('An error occurred while fetching connections');
      }
    };

    const fetchResources = async () => {
      try {
        const token = Cookies.get('authToken');
        const params = new URLSearchParams({ locker_name: locker.name });

        const response = await fetch(`http://localhost:8000/get-resources-user-locker/?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }

        const data = await response.json();
        if (data.success) {
          setResources(data.resources);
        } else {
          setError(data.message || 'Failed to fetch resources');
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
        setError('An error occurred while fetching resources');
      }
    };

    if (locker) {
      fetchResources();
      fetchConnections();
      fetchOtherConnections();
    }
  }, [locker]);


  const fetchAllTrackerData = (outgoingConnections) => {
    outgoingConnections.forEach(connection => {
      fetchTrackerData(connection);
    });
  };

  const fetchTrackerData = async (connection) => {


    console.log("inside fetch tracker data");
    try {
      const token = Cookies.get('authToken');
      const params = new URLSearchParams({
        connection_name: connection.connection_name,
        host_locker_name: connection.host_locker.name,
        guest_locker_name: connection.guest_locker.name,
        host_user_username: connection.host_user.username,
        guest_user_username: connection.guest_user.username
      });

      const response = await fetch(`http://localhost:8000/get-terms-status/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tracker data');
      }

      const data = await response.json();
      if (data.success) {
        setTrackerData(prevState => ({
          ...prevState,
          [connection.connection_id]: {
            count_T: data.count_T,
            count_F: data.count_F
          }
        }));
      } else {
        setError(data.message || 'Failed to fetch tracker data');
      }
    } catch (error) {
      console.error('Error fetching tracker data:', error);
      setError('An error occurred while fetching tracker data');
    }
  };

  const handleUploadResource = () => {
    navigate('/upload-resource', { state: { locker } });
  }

  const handleAdmin = () => {
    navigate('/admin');
  }

  const handleResourceClick = (filePath) => {
    const url = `http://localhost:8000/media/${filePath}`;
    window.open(url, "_blank");
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }

  const handleNewLockerClick = () => {
    navigate('/create-locker');
  };

  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleTracker = (connection) => {
    // console.log(connection.host_locker?.name);
    navigate('/view-terms-by-type', {
      state: {
        connectionName: connection.connection_name,
        hostLockerName: connection.host_locker?.name,
        guestLockerName: connection.guest_locker?.name,
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        locker: locker
      }
    });
  }


  const handleDocsClick = () => {
    console.log("Open Docs button clicked");
  };

  const handleEducationClick = () => {
    console.log("Open Education button clicked");
    navigate('/view-locker');
  };

  const handleLogout = () => {
    Cookies.remove('authToken');
    localStorage.removeItem('curruser');
    setUser(null);
    navigate('/');
  }
  //locker  bhi state se paas krra
  const handleConnectionClick = (connection) => {
    navigate('/show-guest-users', { state: { connection, locker } });


  }

  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">{locker ? `Locker: ${locker.name}` : 'Locker'}</div>
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

      <div className="container">
        <div className="locker-name">
          <div className="loc"><span className='desc'>{locker ? ` ${locker.description}` : 'Description'}</span></div>
        </div>
        <div className="container-2 clearfix">
          <div className="a">
            <div className="res"><h3>Resources</h3></div>
            <div className="container-3 clearfix">

              <div className='aa'>
                {resources.length > 0 ? (
                  resources.map((resource, index) => (
                    <div key={resource.resource_id} className="resource-item">
                      <div className="resource-details">
                        <div id="documents" onClick={() => handleResourceClick(resource.i_node_pointer)}>{index + 1}. {resource.document_name}</div>
                        <div className="public-private">
                          {resource.type === 'private' ? (
                            <>
                              Private - Shared with:
                              {resource.connections.map((connection, index) => (
                                <span key={connection.connection_id}>
                                  {connection.host_user.username}
                                  {index < resource.connections.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </>
                          ) : (
                            'Public'
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No resources found.</p>
                )}
              </div>
            </div>
            <button className="page3button">Share</button>
            &nbsp;&nbsp;&nbsp;
            <button className="page3button" onClick={handleUploadResource}>Upload resource</button>
          </div>
          <div className="b">
            <h3 id="mycon">My Connections:</h3>
            <h4 id='headingconnection'>Incoming Connection types</h4>

            <div className="conn">
              {otherConnections.length > 0 ? (
                otherConnections.map((connection, index) => (
                  <div key={connection.connection_type_id} className="viewlockerconnections" onClick={() => handleConnectionClick(connection)}>
                    <h4 id='connectiontype'><u>{index + 1}. {connection.connection_type_name}</u></h4>
                  </div>
                ))
              ) : (
                <p>No connections found.</p>
              )}
            </div>
            <h4 id='headingconnection'>Outgoing Connections</h4>

            <div className="conn">

              {connections.outgoing_connections.length > 0 ? (
                connections.outgoing_connections.map((connection, index) => {
                  const tracker = trackerData[connection.connection_id];
                  const count_T = tracker ? tracker.count_T : 0;
                  const count_F = tracker ? tracker.count_F : 0;

                  return (
                    <div key={connection.connection_id} className='viewlockerconnections'>
                      <div id="conntent"><h3>{index + 1}. {connection.connection_name}</h3></div>
                      <div id="conntent">{connection.host_user.username} &lt;&gt; {connection.guest_locker.name}</div>
                      <div id="conntent">Created On: {new Date(connection.created_time).toLocaleString()}</div>
                      <div id="conntent">Valid Until: {new Date(connection.validity_time).toLocaleString()}</div>
                      <div className='tracker'>
                        <button onClick={() => handleTracker(connection)}>
                          {count_T} / {count_T + count_F}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p>No outgoing connections found.</p>
              )}

              {/* {connections.outgoing_connections.length > 0 ? (
                connections.outgoing_connections.map((connection, index) => (



              <div key={connection.connection_id} className='viewlockerconnections'>
                <div id="conntent"><h3>{index + 1}. {connection.connection_name}</h3></div>
                <div id="conntent">{connection.host_user.username} &lt;&gt; {connection.guest_locker.name}</div>
                <div id="conntent">Created On: {new Date(connection.created_time).toLocaleString()}</div>
                <div id="conntent">Valid Until: {new Date(connection.validity_time).toLocaleString()}</div>
                <div className='tracker'><button onClick={() => handleTracker(connection)}>
                  {trackerData ? `${trackerData.count_T} / ${trackerData.count_T + trackerData.count_F}` : 'Loading...'}
                </button></div>
              </div>
              ))
              ) : (
              <p>No outgoing connections found.</p>
              )} */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
