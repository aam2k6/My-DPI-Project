import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { ConnectionContext } from "../../ConnectionContext";
import { usercontext } from "../../usercontext";

import "./connection.css";
import Navbar from "../Navbar/Navbar";
import Panel from "../Panel/Panel";
import { frontend_host } from "../../config";
import { Container, Grid, TextField, Button, Typography,Box} from "@mui/material";

export const Connection = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { curruser } = useContext(usercontext);
  const location = useLocation();
  const { locker_conn, setConnectionData } = useContext(ConnectionContext);
  const [lockers, setLockers] = useState([]);

  // Local state for connection fields
  const [connectionName, setConnectionName] = useState(null);
  const [connectionDescription, setConnectionDescription] = useState(null);
  const [validity, setValidity] = useState(null);
  const [selectedLocker, setSelectedLocker] = useState(null);
  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get("authToken");

    fetch("host/get-lockers-user/".replace(/host/, frontend_host), {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setLockers(data.lockers);
          if (!selectedLocker && data.lockers.length > 0) {
            setSelectedLocker(data.lockers[0]);
          }
        } else {
          setError(data.message || data.error);
        }
      })
      .catch((error) => {
        setError("An error occurred while fetching lockers.");
        console.error("Error:", error);
      });
  }, [curruser]);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Hiiiii")
    const connectionData = {
      lockerName: locker_conn?.name,
      connectionName,
      connectionDescription,
      validity,
    };
    setConnectionData(connectionData);
    console.log("Form submitted");
    console.log("in connection 2", connectionData, locker_conn);
    navigate("/connectionTerms");
  };
  

  const content = (
    <>
      <div className="navbarBrands">Locker : {locker_conn?.name}</div>
      <div className="navbarBrands">Owner : {curruser.username}</div>
    </>
  );

  return (
    <>
      <Navbar content={content}></Navbar>
      {/* <Panel /> */}
      <Container maxWidth="md" style={{marginTop:"120px"}}>
        <div>
          {/* <div className="connection-resourceHeading">Connection</div> */}
          <div className="connection-lockerForms">
          <Box
          sx={{
            border: '1px solid blue',
            borderRadius: '8px',
            padding: '50px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="connection-resourceHeading">Connection</div>
          <form  onSubmit={handleSubmit}>
            <Grid container className=" mb-4">
                <Grid item md={2} sm={2} xs={12}>
                <Typography variant="h6" gutterBottom fontWeight="bold" >Locker
                </Typography>
                </Grid>
                <Grid item md={8} sm={8} xs={12}>
                <TextField  fullWidth variant="outlined" value={locker_conn ? locker_conn.name : ""} readOnly />
                </Grid>
            </Grid>

            <Grid container className=" mb-4">
                <Grid item md={2} sm={2} xs={12}>
                <Typography variant="h6" gutterBottom fontWeight="bold" >Name
                </Typography>
                </Grid>
                <Grid item md={8} sm={8} xs={12}>
                <TextField  fullWidth variant="outlined" type="text"
                name="connectionName"
                placeholder="Connection Type Name"
                onChange={(e) => setConnectionName(e.target.value)} />
                </Grid>
            </Grid>

            <Grid container className=" mb-4">
                <Grid item md={2} sm={2} xs={12}>
                <Typography variant="h6" gutterBottom fontWeight="bold" >Description
                </Typography>
                </Grid>
                <Grid item md={8} sm={8} xs={12}>
                <TextField  fullWidth variant="outlined" 
                type="text"
                name="connectionDescription"
                placeholder="Description"
                onChange={(e) => setConnectionDescription(e.target.value)} />
                </Grid>
            </Grid>

            <Grid container className=" mb-4">
                <Grid item md={2} sm={2} xs={12}>
                <Typography variant="h6" gutterBottom fontWeight="bold" >Validity
                </Typography>
                </Grid>
                <Grid item md={8} sm={8} xs={12}>
                <TextField  fullWidth variant="outlined"  type="date"
                name="validity"
                placeholder="Calendar Picker"
                onChange={(e) => setValidity(e.target.value)} />
                </Grid>
            </Grid>
            <Button type="submit">Next</Button>
          </form>
        </Box>
          </div>
        </div>
      </Container>
    </>
  );
};
