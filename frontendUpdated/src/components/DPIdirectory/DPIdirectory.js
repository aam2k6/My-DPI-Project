import React, { useContext, useEffect, useState } from 'react';
import './page5.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import Navbar from '../Navbar/Navbar';


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


    fetch('http://localhost:8000/dpi-directory/', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log("dpi ",data);
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          setError(data.message || data.error);
        }
      })
      .catch(error => {
        setError("An error occurred while fetching users.");
        console.error("Error:", error);
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
    <div>
      <Navbar />
      <div className="page5heroContainer">
        <div className="search">
          <form onSubmit={handleSearch}>
            <div className="searchContainer">
              <div className="inputContainer">
                <input type="text" placeholder="Search" name="search" value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button className="find" type="submit">Search</button>
            </div>
          </form>
        </div>
        <div className="page5container">
          {error && <div className="error">{error}</div>}
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div key={user.user_id} className="card">
                <h4>{user.username}</h4>
                <p>{user.description}</p>
                <button
                  className='cardButton'
                  onClick={() => handleuserclick(user)}
                >
                  Enter
                </button>
              </div>
            ))
          ) : (
            <p>No users found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
