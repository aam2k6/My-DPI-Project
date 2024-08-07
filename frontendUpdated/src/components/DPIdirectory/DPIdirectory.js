import React, { useContext, useEffect, useState } from 'react';
import './page5.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 


export const DPIdirectory = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { curruser, setUser } = useContext(usercontext);
  const [isOpen, setIsOpen] = useState(false);

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleAdmin = () => {
    navigate('/admin');
  }
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  }

  const handleLogout = () => {
    Cookies.remove('authToken');
    localStorage.removeItem('curruser');
    setUser(null);
    navigate('/');
  }

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
      <nav className="navbar">
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
              <a href="#" onClick={handleAdmin}></a>
            </li>
          </ul>

          <ul className="navbarThirdLink">
            <li>
            <img src={userImage} alt="User Icon" onClick={toggleDropdown} className="dropdownImage" />
              {isOpen && (
                <div className="dropdownContent">
                  <div className="currusername">{curruser.username}</div>
                  <div className="curruserdesc">{curruser.description}</div>
                  <button onClick={handleAdmin}>Settings</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </li>
          </ul>
        </div>
      </nav>

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
