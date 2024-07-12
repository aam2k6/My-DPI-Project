import React, { useState, useEffect } from 'react';
import './page3.css';
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { useParams, useLocation } from 'react-router-dom';


export const ViewLocker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locker = location.state ? location.state.locker : null;


  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);



  useEffect(() => {
    const fetchResources = async () => {
      try {
        const token = Cookies.get('authToken');
        const params = new URLSearchParams({ locker_name: locker.name });

        const response = await fetch(`http://127.0.0.1:8000/get-resources-user-locker/?${params}`, {
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
    navigate('/upload-resource')
  }

  const handleAdmin = () => {
    navigate('/admin');
  }

  const handleLogout = () => {
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
          <div className="loc"><span className='desc'>{locker ? `Description: ${locker.description}` : 'Description'}</span></div>
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
                    // </div>
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
              <div id="conntent"><h3>Btech Admission</h3></div>
              <div id="conntent">IIITb Transcripts&lt;&gt;Rohith:Education</div>
              <div id="conntent">Created On:</div>
              <div id="conntent">Valid Until:</div>
            </div>
            <div className="conn">
              <div id="conntent"> <h3>Real Estate</h3></div>
              <div id="conntent">Mantri Builder Property&lt;&gt;Rohith:Education</div>
              <div id="conntent">Created On:</div>
              <div id="conntent">Valid Until:</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

