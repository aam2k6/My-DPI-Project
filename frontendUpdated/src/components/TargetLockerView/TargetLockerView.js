import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./page7.css";
import Navbar from "../Navbar/Navbar";

export const TargetLockerView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);
  const [parentUser, setParentUser] = useState(location.state ? location.state.user : null);
  const [resources, setResources] = useState([]);
  const [otherConnections, setOtherConnections] = useState([]); 
  const [locker, setLocker] = useState(location.state ? location.state.locker : null);
  const [error, setError] = useState(null);
  const [outgoingConnections, setOutgoingConnections] = useState([]); // State for outgoing connections

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
    if (parentUser && locker) {
      fetchResources();
      fetchOtherConnections(); 
      fetchConnections(); // Fetch connections when component mounts
    }
  }, [curruser, navigate, parentUser, locker]);

  const fetchResources = async () => {
    try {
      const token = Cookies.get('authToken');
      const params = new URLSearchParams({ locker_name: locker.name, username: parentUser.username });
      const response = await fetch(`http://localhost:8000/get-public-resources?${params}`, {
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

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get('authToken');
      const params = new URLSearchParams({ guest_username: parentUser.username, guest_locker_name: locker.name });
      const response = await fetch(`http://localhost:8000/get-other-connection-types/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setOtherConnections(data.connection_types); 
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching other connections");
    }
  };

  const fetchConnections = async () => {
    try {
      const token = Cookies.get('authToken');
      const params = new URLSearchParams({ locker_name: locker.name ,username:parentUser.username});
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
        // Filter outgoing connections where curruser is guest
        const outgoing = data.connections.filter(conn => conn.guest_user.username === curruser.username);
        setOutgoingConnections(outgoing);
      } else {
        setError(data.message || 'Failed to fetch connections');
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('An error occurred while fetching connections');
    }
  };

  const handleClick = () => {
    navigate('/make-connection', { state: { hostuser: parentUser, hostlocker: locker } });
  };

  const handleResourceClick = (filePath) => {
    const url = `http://localhost:8000/media/${filePath}`;
    window.open(url, "_blank");
  };

  const content = (
  <>
  <div className="navbarBrand">{locker?.name}</div>
          <div className="description7">Owner:<u>{parentUser?.username}</u></div>
  </>
  );

  return (
    <div>
      <Navbar content = {content}/>
      <div className="page7description">
        <div className="descriptionpage7">{locker?.description}</div>
        <button onClick={handleClick} className="new-connection-btn">Create New Connection</button>
      </div>
      <div className="page7container">
        <div className="notvisible">
          <div className="page7publicresources">
            <p>Public resources: Resources for all</p>
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
            <p>Available Connection Types</p>
            {otherConnections.length > 0 ? (
              otherConnections.map(connection => (
                <div className="page7connection" key={connection.connection_type_id}>
                  <div id="connectionpage7">
                    <strong>{connection.connection_type_name}</strong>
                    <div id="availconntype">{connection.connection_description}</div>
                    <div id="availconntype">Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
                    <div id="availconntype">Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <p id="noconnfound">No available connection type found.</p>
            )}
          </div>
        </div >
        <div className="page7containerB">
          <p>My connections</p>
          {outgoingConnections.length > 0 ? (
            outgoingConnections.map((connection, index) => (
              <div className="page7myconnections" key={index}>
                {/* <div id="conntent"><h2>{connection.connection_type_name}</2></div> */}
                <div id="conntent"><h2>{connection.connection_name}</h2></div>

                <div id="conntent">{connection.host_locker.name} &lt;&gt; {connection.guest_locker.name}</div>
                <div id="conntent">Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
                <div id="conntent">Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
              </div>
            ))
          ) : (
            <p id="noconnfound">No outgoing connections found.</p>
          )}
        </div>
      </div >
    </div>
  );
};
