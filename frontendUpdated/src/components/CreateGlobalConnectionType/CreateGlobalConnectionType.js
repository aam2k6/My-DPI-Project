import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './CreateGlobalConnectionType.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";

export default function CreateGlobalConnectionType() {
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { curruser } = useContext(usercontext);

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

    const token = Cookies.get('authToken');

    // Fetch global connection types
    fetch('http://localhost:8000/get-template-or-templates/', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.data) {
          setConnectionTypes(data.data);
        } else {
          setError(data.message || data.error);
        }
      })
      .catch(error => {
        setError("An error occurred while fetching connection types.");
        console.error("Error:", error);
      });
  }, [curruser, navigate]);

  // Navigate to the form for adding a new global connection type
  const handleAddNewConnectionType = () => {
    navigate('/add-global-connection-type');  
  };

  // Handle the click event to navigate to the ConnectionTerms page
  const handleConnectionTypeClick = (type) => {
    navigate('/connection-terms', {
      state: {
        connectionTypeId: type.id,
        connectionTypeName: type.global_connection_type_name
      }
    });
  };

  return (
    <div className='manage-connection-page'>
      <Navbar />
      <Sidebar />
      <div className='manage-connection-content'>
        <h1>SYSTEM ADMIN SETTINGS</h1> 

        <h2>Existing Global Connection Types</h2> 
        {error && <p className="error">{error}</p>}
        {connectionTypes.length > 0 ? (
          <ol className='connection-list'>
            {connectionTypes.map(type => (
              <li 
                key={type.id} 
                className='connection-item'
              >
                <span 
                  className="connection-link"
                  onClick={() => handleConnectionTypeClick(type)}
                >
                  {type.global_connection_type_name}
                </span><br />
              </li>
            ))}
          </ol>
        ) : (
          <p>No global connection types found.</p>
        )}
        
        {/* Button for adding a new global connection type */}
        <div className="add-connection-type-container">
          <button className="add-connection-type-button" onClick={handleAddNewConnectionType}>
            Add New Global Connection Type
          </button>
        </div>
      </div>
    </div>
  );
}
