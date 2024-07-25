import React, { useContext, useEffect, useState } from 'react';
<<<<<<< HEAD
=======
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

import './page3.css';
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { useParams, useLocation } from 'react-router-dom';
import { usercontext } from "../../usercontext";






export const ViewLocker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locker = location.state ? location.state.locker : null;
<<<<<<< HEAD
=======
  const [isOpen, setIsOpen] = useState(false);

  const { curruser, setUser } = useContext(usercontext);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);

  const [connections, setConnections] = useState({ incoming_connections: [], outgoing_connections: [] });

  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }},[]);


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
      }
    }, [locker]);
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

  const { curruser, setUser } = useContext(usercontext);
  const [resources, setResources] = useState([]);
  const [connections, setConnections] = useState({ incoming_connections: [], outgoing_connections: [] });
  const [error, setError] = useState(null);

<<<<<<< HEAD
  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, []);
=======
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
    navigate('/upload-resource',{state: {locker}});
  }

  const handleAdmin = () => {
    navigate('/admin');
  }

  const handleResourceClick = (filePath) => {
    // const url = `http://localhost:8000/download-resource/${resourceId}`;
    const url = `http://localhost:8000/media/${filePath}`;
    window.open(url, "_blank");
  };

  const handleLogout = () => {
    // Clear cookies
    Cookies.remove('authToken');
    // Clear local storage
    localStorage.removeItem('curruser');
    // Set user context to null
    setUser(null);
    // Redirect to login page
    navigate('/');
  }
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }




  

<<<<<<< HEAD
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const token = Cookies.get('authToken');
        const params = new URLSearchParams({ locker_name: locker.name });
=======
  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">{locker ? `Locker: ${locker.name}` : 'Locker'}</div>
          {/* <div className="description3">{locker ? `Description: ${locker.description}` : 'Description'}</div> */}
        </div>
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4

        const response = await fetch(`http://localhost:8000/get-resources-user-locker/?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json'
          }
        });

<<<<<<< HEAD
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
        } else {
          setError(data.message || 'Failed to fetch connections');
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
        setError('An error occurred while fetching connections');
      }
    };
  
    if (locker) {
      fetchResources();
      fetchConnections();
    }
  }, [locker]);


 


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
  navigate('/upload-resource', { state: { locker } });
}

const handleAdmin = () => {
  navigate('/admin');
}

const handleLogout = () => {
  // Clear cookies
  Cookies.remove('authToken');
  // Clear local storage
  localStorage.removeItem('curruser');
  // Set user context to null
  setUser(null);
  // Redirect to login page
  navigate('/');
}


return (
  <div>
    <nav className="navbar">
      <div className="wrap">
        <div className="navbarBrand">{locker ? `Locker: ${locker.name}` : 'Locker'}</div>
        {/* <div className="description3">{locker ? `Description: ${locker.description}` : 'Description'}</div> */}
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
        <div className="loc"><span className='desc'>{locker ? ` ${locker.description}` : 'Description'}</span></div>
      </div>
      <div className="container-2 clearfix">
        <div className="a">
          <div className="res"><h3>Resources</h3></div>
          <div className="container-3 clearfix">

            <div className='aa'>
              {resources.length > 0 ? (
                resources.map(resource => (
                  <div key={resource.resource_id} className="resource-item">
                    <div id="documents">{resource.document_name}</div>
                    {/* <div className="public-private"> */}
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
            <div className="conn">
              <h4>Incoming Connections</h4>
              {connections.incoming_connections.length > 0 ? (
                connections.incoming_connections.map(connection => (
                  <div key={connection.connection_id}>
                    <div id="conntent"><h3>{connection.connection_name}</h3></div>
                    <div id="conntent">{connection.host_locker.name} &lt;&gt; {connection.guest_user.username}: {connection.guest_locker.name}</div>
                    <div id="conntent">Created On: {new Date(connection.created_time).toLocaleString()}</div>
                    <div id="conntent">Valid Until: {new Date(connection.validity_time).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <p>No incoming connections found.</p>
              )}
            </div>
            <div className="conn">
              <h4>Outgoing Connections</h4>
              {connections.outgoing_connections.length > 0 ? (
                connections.outgoing_connections.map(connection => (
                  <div key={connection.connection_id}>
                    <div id="conntent"><h3>{connection.connection_name}</h3></div>
                    <div id="conntent">{connection.host_user.username} &lt;&gt; {connection.guest_locker.name}</div>
                    <div id="conntent">Created On: {new Date(connection.created_time).toLocaleString()}</div>
                    <div id="conntent">Valid Until: {new Date(connection.validity_time).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <p>No outgoing connections found.</p>
              )}
            </div>
=======
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
              {/* <div className="aa">
                <div id="documents">Transcripts.pdf</div>
                <div id="documents">10thMarks-card.pdf</div>
              </div>
              <div className="bb">
                <div className="public-private">Public/private</div>
                <div className="public-private">Public/private</div>
              </div> */}

              {/* {resources.length > 0 ? (
                resources.map(resource => (
                  <div key={resource.resource_id} className="aa">
                    <div id="documents">{resource.document_name}</div>
                    <div className="public-private">{resource.type === 'public' ? 'Public' : `Private shared with ${resource.}` }</div>
                  </div>
                ))
              ) : (
                <p>No resources found.</p>
              )} */}

              <div className='aa'>
                
                {resources.length > 0 ? (
                  resources.map(resource => (
                    <div key={resource.resource_id} className="resource-item">
                           <div className="resource-details">
                      <div id="documents"    onClick={() => handleResourceClick(resource.i_node_pointer)}>{resource.document_name}</div>
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
            <div className="conn">
              <h4>Incoming Connections</h4>
              {connections.incoming_connections.length > 0 ? (
                connections.incoming_connections.map(connection => (
                  <div key={connection.connection_id}>
                    <div id="conntent"><h3>{connection.connection_name}</h3></div>
                    <div id="conntent">{connection.host_locker.name} &lt;&gt; {connection.guest_user.username}: {connection.guest_locker.name}</div>
                    <div id="conntent">Created On: {new Date(connection.created_time).toLocaleString()}</div>
                    <div id="conntent">Valid Until: {new Date(connection.validity_time).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <p>No incoming connections found.</p>
              )}
            </div>
            <div className="conn">
              <h4>Outgoing Connections</h4>
              {connections.outgoing_connections.length > 0 ? (
                connections.outgoing_connections.map(connection => (
                  <div key={connection.connection_id}>
                    <div id="conntent"><h3>{connection.connection_name}</h3></div>
                    <div id="conntent">{connection.host_user.username} &lt;&gt; {connection.guest_locker.name}</div>
                    <div id="conntent">Created On: {new Date(connection.created_time).toLocaleString()}</div>
                    <div id="conntent">Valid Until: {new Date(connection.validity_time).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <p>No outgoing connections found.</p>
              )}
            </div>
>>>>>>> 2d773298c9328c24beab6cada3bc2c1e9d296fd4
        </div>
      </div>
    </div>
  </div>
);
}