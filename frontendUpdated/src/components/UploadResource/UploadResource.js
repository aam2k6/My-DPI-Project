import React, { useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';
import { usercontext } from "../../usercontext";
import "./page4.css";
import Navbar from '../Navbar/Navbar';
import Modal from '../Modal/Modal'; 
import { frontend_host } from '../../config';
import { Grid, TextField, Button, Select, MenuItem, InputLabel, Typography, Box, Container } from '@mui/material';
import { Padding } from '@mui/icons-material';


export const UploadResource = () => {
  const location = useLocation();
  const locker = location.state ? location.state.locker : null;
  const { curruser, setUser } = useContext(usercontext);
  const [resourceName, setResourceName] = useState("");
  const [document, setDocument] = useState(null);
  const [visibility, setVisibility] = useState("public"); // Default value set to Public
  const navigate = useNavigate();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
 const [errorModalMessage, setErrorModalMessage] = useState('');




  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, [curruser, navigate]);



  const handleSubmit = (event) => {
    event.preventDefault();
    if (document && document.type !== 'application/pdf') {
      setErrorModalMessage('Only PDF files are allowed.');
      setIsErrorModalOpen(true);
      return;
    }
  

    const data = new FormData();
    data.append('locker_name', locker.name);
    data.append('resource_name', resourceName);
    data.append('type', visibility);
    data.append('document', document);

    const token = Cookies.get('authToken');

    fetch('host/upload-resource/'.replace(/host/, frontend_host), {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${token}`
      },
      body: data,
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Resource uploaded:", data);
        navigate("/view-locker",{state: {locker}});
      } else {
        console.error("Error:", data.error);
        alert(data.error);
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("An error occurred while uploading the resource");
    });
  };


  
  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
  };


  const content = (
    <>
    <div className="navbarBrands">Locker: {locker.name}</div>
          <div className="navbarBrands">Owner: {curruser.username}</div>
          {/* <span className='uploadDescription'><p>{locker.description}</p></span> */}
    </>
  );

  return (
    <div>
     <Navbar content={content} />
     {isErrorModalOpen && (
        <Modal
          message={errorModalMessage}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}

      <div style={{ marginTop: "120px" }}>
        <div className='uploadDescriptions'>
          <p>{locker.description}</p>
        </div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-sm-12 p-4 border border-primary rounded shadow">
              <h2 className="text-center mb-4 page4resourceHeading">Resources</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="resourceName" className="form-label fw-bold">Resource Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="resourceName"
                    placeholder="Enter resource name"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="document" className="form-label fw-bold">Select File</label>
                  <input
                    type="file"
                    className="form-control"
                    id="document"
                    onChange={(e) => setDocument(e.target.files[0])}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="visibility" className="form-label fw-bold">Visibility</label>
                  <select
                    className="form-select"
                    id="visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    required
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="text-center">
                  <button type="submit" className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};
