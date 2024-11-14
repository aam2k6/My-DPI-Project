import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import { Container, Grid, TextField, Button, Typography,Box} from "@mui/material";
import "./page2.css";

export const CreateLocker = () => {
  const navigate = useNavigate();
  const [lockerName, setLockerName] = useState("");
  const [description, setDescription] = useState("");
  const { curruser, setUser } = useContext(usercontext);

  const handleSubmit = (event) => {
    event.preventDefault();

    const token = Cookies.get('authToken');

    // Prepare data to send
    const data = new FormData();
    data.append('name', lockerName);
    data.append('description', description);

    // Send data to the backend
    fetch('host/create-locker/'.replace(/host/, frontend_host), {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${token}`, // Add token to the headers
      },
      body: data,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Locker created:', data);
          // Redirect to another page or show success message
          navigate('/home');
        } else if (data.error === 'Locker with this name already exists') {
          // Handle case where locker with same name exists
          alert('A locker with this name already exists. Please choose a different name.');
        } else {
          console.error('Error:', data.error);
          // Show error message for other cases
          alert(data.error);
        }
      })
      .catch(error => {
        console.error("Error:", error);
        // Show error message
        alert("An error occurred while creating the locker");
      });
  };

  useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }
  }, []);

  return (
    <div>
      <Navbar />

      <Container maxWidth="sm" style={{ marginTop: "120px"}}>
        <Box
          sx={{
            border: '1px solid blue',
            borderRadius: '8px',
            padding: '50px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom fontWeight="bold" >
                Locker Name
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={lockerName}
                onChange={(e) => setLockerName(e.target.value)}
                placeholder="Enter Locker Name"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Description
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
              />
            </Grid>
            <Grid item xs={12} container justifyContent="center">
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
          </Grid>
        </form>
        </Box>
      </Container>
    </div>
  );
};
