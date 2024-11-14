import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './CreateGlobalConnectionType.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import { frontend_host } from '../../config';
import { FaArrowDown, FaArrowRight } from 'react-icons/fa';
import {Grid} from '@mui/material'


export default function CreateGlobalConnectionType() {
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { curruser } = useContext(usercontext);
  const isSystemAdmin = curruser && (curruser.user_type === 'sys_admin' || curruser.user_type === 'system_admin');

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

    const token = Cookies.get('authToken');

    fetch('host/get-template-or-templates/'.replace(/host/, frontend_host), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch connection types');
        }
        return response.json();
      })
      .then(data => {
        if (data.data) {
          setConnectionTypes(data.data);
        } else {
          setError('No connection types found.');
        }
      })
      .catch(error => {
        setError("An error occurred while fetching connection types.");
        console.error("Error fetching connection types:", error);
      });
  }, [curruser, navigate]);

  const handleAddNewConnectionType = () => {
    navigate('/ConnectionTermsGlobal');
  };

  const handleConnectionTypeClick = (type) => {
    const template_Id = type.global_connection_type_template_id;

    if (!template_Id) {
      setError("Template ID is missing or invalid.");
      return;
    }

    navigate('/GlobalTermsView', {
      state: {
        connectionTypeName: type.global_connection_type_name,
        connectionTypeDescription: type.global_connection_type_description,
        template_Id: template_Id
      }
    });
  };

  const allDomains = ["health", "finance", "education", "personal data"];
  const [expandedStates, setExpandedStates] = useState({}); // Manage expanded state of domains

  const handleDomainToggle = (domain, type) => {
    setExpandedStates((prev) => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        [type]: !prev[domain]?.[type], // Toggle the specific type
      },
    }));
  };

  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div className="manage-connection-page">
      <Navbar />
      <div style={{marginTop:"120px"}}>
      {/* {isSystemAdmin && <Sidebar />} */}
      <Grid container className="" paddingLeft={{md:"30%", xs:"10%"}}>
        <Grid md={12}>
        <h1>GLOBAL CONNECTIONS</h1>
        {error && <p className="error">{error}</p>}

        {allDomains.length > 0 ? (
          <>
            <h2>TEMPLATES AND POLICIES</h2>
            <div className="section">
              <h3>Templates</h3>
              {allDomains.map((domain) => {
                const filteredTemplates = connectionTypes.filter(
                  (type) => type.domain === domain && type.globaltype === "template"
                );

                return (
                  <div key={domain}>
                    <div className="domain-header" onClick={() => handleDomainToggle(domain, 'templates')}>
                      <span className="domain-title">
                      {expandedStates[domain]?.templates ? '▼' : '►'} {capitalizeFirstLetter(domain)}
                      </span>
                    </div>
                    {expandedStates[domain]?.templates && (
                      <ol className="connection-list">
                        {filteredTemplates.map((type) => (
                          <li key={type.global_connection_type_template_id} className="connection-item">
                            <span className="connection-link" onClick={() => handleConnectionTypeClick(type)}>
                              {type.global_connection_type_name}
                            </span>
                          </li>
                        ))}
                        {filteredTemplates.length === 0 && (
                          <li className="no-connection-item">No templates found for this domain.</li>
                        )}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Policies Section */}
            <div className="section">
              <h3>Policies</h3>
              {allDomains.map((domain) => {
                const filteredPolicies = connectionTypes.filter(
                  (type) => type.domain === domain && type.globaltype === "policy"
                );

                return (
                  <div key={domain}>
                    <div className="domain-header" onClick={() => handleDomainToggle(domain, 'policies')}>
                      <span className="domain-title">
                      {expandedStates[domain]?.policies ? '▼' :  '►'} {capitalizeFirstLetter(domain)}
                      </span>
                    </div>
                    {expandedStates[domain]?.policies && (
                      <ol className="connection-list">
                        {filteredPolicies.map((type) => (
                          <li key={type.global_connection_type_template_id} className="connection-item">
                            <span className="connection-link" onClick={() => handleConnectionTypeClick(type)}>
                              {type.global_connection_type_name}
                            </span>
                          </li>
                        ))}
                        {filteredPolicies.length === 0 && (
                          <li className="no-connection-item">No policies found for this domain.</li>
                        )}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p>No domains found.</p>
        )}

{isSystemAdmin && ( // Show button only for System Admin
          <div className="add-connection-type-container">
            <button className="add-connection-type-button" onClick={handleAddNewConnectionType}>
              Add New Global Connection Type
            </button>
          </div>
        )}
 
        </Grid>
      </Grid>
      </div>
    </div>
  );
}