import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import Navbar from '../Navbar/Navbar';
import { frontend_host } from '../../config';
// import './page5.css';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Grid,
  TextField,
} from '@mui/material';

export const DPIdirectory = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { curruser } = useContext(usercontext);

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

    const token = Cookies.get('authToken');

    fetch('host/dpi-directory/'.replace(/host/, frontend_host), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          setError(data.message || data.error);
        }
      })
      .catch(error => {
        setError("An error occurred while fetching users.");
      });
  }, [curruser, navigate]);

  const handleSearch = (event) => {
    event.preventDefault();
    const results = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  };

  const handleuserclick = (user) => {
    if (curruser && curruser.username && user.username === curruser.username) {
      navigate('/home');
    } else {
      navigate(`/target-user-view`, { state: { user } });
    }
  };

  return (
    <div id="dpi-directory">
      <Navbar />
      <div className="page5heroContainer" style={{marginTop:"120px"}}>
        <div className="search">
          <form onSubmit={handleSearch}>
          <div className="searchContainer" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <TextField
            placeholder="Search"
            variant="outlined"
            value={searchTerm}
            size='small'
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              width:"250px",
              marginRight: '0.5rem',
              border:"2px solid black",
              borderRadius:"10px"
            }}
            
          />

            <Button
              variant="contained"
              type="submit"
              size='small'
              sx={{ minWidth: '80px', padding: '0.5rem 1rem', fontWeight: 'bold' }}
            >
              Search
            </Button>
          </div>

          </form>
        </div>
        <Grid container spacing={3} className="page5container" padding={{md:10, sm:2, xs:2}}>
          {error && <Typography color="error">{error}</Typography>}
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                <Card sx={{ backgroundColor: 'white', border: '2px solid blue', textAlign: 'center', padding: '1rem' }}>
                  <CardContent>
                    <Typography variant="h5" sx={{ fontSize: '1.45rem', marginBottom: '1rem' }}>{user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center' }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                      onClick={() => handleuserclick(user)}
                    >
                      Enter
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography variant="body1" padding={"30px"}>No users found.</Typography>
          )}
        </Grid>
      </div>
    </div>
  );
};
