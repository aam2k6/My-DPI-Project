import React, { useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';
import { usercontext } from "../../usercontext";
import "./page4.css";
import Navbar from '../Navbar/Navbar';
import Modal from '../Modal/Modal'; 
import { frontend_host } from '../../config';
import { Grid, TextField, Button, Select, MenuItem, InputLabel, Typography, Box, Container } from '@mui/material';


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
    <div className="navbarLockerName">Locker: {locker.name}</div>
          <div className="navbarLockerOwner">Owner: {curruser.username}</div>
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
    

      {/* <div className="descriptionLocker">
        <p>{locker.description}</p>
      </div> */}

      <div style={{marginTop:"120px"}}>  
      <div className='uploadDescriptions'><p>{locker.description}</p></div>

          <Container maxWidth="md">
            <Box
              sx={{
                border: '1px solid blue',
                borderRadius: '8px',
                padding: '50px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="page4resourceHeading">Resources</div>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom fontWeight="bold" >
                    Locker Name
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="text"
                    name="resourceName"
                    placeholder="Resource Name"
                    onChange={(e) => setResourceName(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom fontWeight="bold" >
                    Select File
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    type="file"
                    name="document"
                    onChange={(e) => setDocument(e.target.files[0])}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom fontWeight="bold" >
                    Visibility
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    variant="outlined"
                    name="visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    required>
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <Grid item xs={12} container justifyContent="center" mt={4}>
              <Grid item>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  Submit
                </Button>
              </Grid>
            </Grid>
            </form>

            </Box>
        </Container>
        </div>
      </div>
  );
};
