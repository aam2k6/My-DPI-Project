import React, { useEffect, useState } from 'react';
import './page5.css';
// import searchicon from '../../assets/searchicon.jpg';
import { useNavigate } from 'react-router-dom';


export const DPIdirectory = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleAdmin = () => {
    navigate('/admin');
  }

  const handleLogout = () => {
    navigate('/');
  }

  useEffect(() => {
    // Fetch all users from the backend
    fetch('http://127.0.0.1:8000/dpi-directory/')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
        } else {
          setError(data.message || data.error);
        }
      })
      .catch(error => {
        setError("An error occurred while fetching users.");
        console.error("Error:", error);
      });
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const filteredUsers = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setUsers(filteredUsers);
  };



  return (
    <div>
      <nav className="navbar">
        <div className="navbarLinks">
          <ul className="navbarFirstLink">
            <li>
              <a href="" onClick={handleDPIDirectory}>DPI Directory</a>
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


      <div className="page5heroContainer">
        <div className="search">

          <form onSubmit={handleSearch}>
            <div className="searchContainer">
              <div className="inputContainer">
                <input type="text" placeholder="Search" name="search" value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} />
                {/* <img src="" alt="Search Icon" /> */}
              </div>
              <button className="find" type="submit">Search</button>
            </div>
            {/* <p>Select Tags: Tag1, Tag2</p> */}
          </form>

        </div>
        <div className="page5container">
          {/* <div className="card">
            <h4>IIITB</h4>
            <button className='cardButton' id="btn-iiitb" onClick={()=>navigate("/Page6")}>Enter</button>
          </div>
          <div className="card">
            <h4>Mantri Build</h4>
            <button className='cardButton'>Enter</button>
          </div>
          <div className="card">
            <h4>Rohith</h4>
            <button className='cardButton'>Enter</button>
          </div>
          <div className="card">
            <h4>Siemens</h4>
            <button className='cardButton'>Enter</button>
          </div>
          <div className="card">
            <h4>User</h4>
            <button className='cardButton'>Enter</button>
          </div>
          <div className="card">
            <h4>User</h4>
            <button className='cardButton'>Enter</button>
          </div> */}

          {error && <div className="error">{error}</div>}
          {users.length > 0 ? (
            users.map(user => (
              <div key={user.id} className="card">
                <h4>{user.username}</h4>
                <p>{user.description}</p>
                <button
                  className='cardButton'
                  onClick={() => navigate(`/target-user-view`)}
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
}

