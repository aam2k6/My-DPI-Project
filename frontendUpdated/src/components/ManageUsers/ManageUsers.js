import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './ManageUsers.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import Modal from '../Modal/Modal';

export default function ManageUsers({ role }) {  // Role can be 'moderator' or 'admin'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleUser, setSelectedRoleUser] = useState(null);
  const navigate = useNavigate();
  const { curruser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState({message: "", type: ""});
  const [isModalOpen, setIsModalOpen] = useState(false);
  

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
          console.log("manage users ", data);
          setUsers(data.users);
        } else {
          setError(data.message || data.error);
        }
      })
      .catch(error => {
        setError("An error occurred while fetching users.");
        console.error("Error:", error);
      });
  }, [curruser, navigate]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({message: "", type: ""});
  };

  const handleRoleChange = (action) => {
    if (!selectedUser && !selectedRoleUser) {
      setError("Please select a user.");
      return;
    }

    //if we are making default user as admin/moderator(action = make), admin/moderator(stored in role) would be the newUserType
    //if we are removing an admin/moderator(action = remove), we would be making them as a user(newUserType)
    const newUserType = action === 'make' ? role : 'user'; 
    const user = selectedUser || selectedRoleUser;

    const typeOfAction = action === "make" ? "create-" : "remove-";
    const typeOfRole = (role === "sys_admin" || role === "system_admin") ? "admin/" : "moderator/"
    const token = Cookies.get('authToken');

    const url = `http://localhost:8000/${typeOfAction}${typeOfRole}`;
    console.log("url", url);
    fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // user_id: user.user_id,
        username: user.username,
        // user_type: newUserType
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setUsers(users.map(u => u.user_id === user.user_id ? { ...u, user_type: newUserType } : u));
          //Conditional Clearing
          if (action === 'make') {
            setSelectedUser(null);
          } else {
            setSelectedRoleUser(null);
          }
          const msg = `User ${action}d as ${role}: ${user}`;
          setModalMessage({message: data.message || msg, type: 'success'})
        } else {
          setError(data.message || data.error);
          setModalMessage({message: data.message || data.error, type: 'failure'})
        }
        setIsModalOpen(true);
      })
      .catch(error => {
        setError(`An error occurred while ${action}ing the user.`);
        console.error("Error:", error);
      });
  };

  const value = (role === 'sys_admin' || role === "system_admin") ? "System Admin" : role.charAt(0).toUpperCase() + role.slice(1);
  return (
    <div className='content'>
      <Navbar />

      <h2>Manage {value}s</h2>
      <Sidebar />
      <div className='add'>
        <label>Add {value}</label>
        <select onChange={(e) => setSelectedUser(users.find(user => user.username === e.target.value))}>
          <option value="">Select User</option>
          {users.filter(user => user.user_type === 'user').map(user => (
            <option key={user.user_id} value={user.username}>
              {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
            </option>
          ))}
        </select>
        <button onClick={() => handleRoleChange('make')}>Make as {value}</button>
      </div>
      <div className="remove">
        <label>Remove {value}</label>
        <select onChange={(e) => setSelectedRoleUser(users.find(user => user.username === e.target.value))}>
          <option value="">Select {value}</option>
          {users.filter(user => user.user_type === role).map(user => (
            <option key={user.user_id} value={user.username}>
              {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
            </option>
          ))}
        </select>
        <button onClick={() => handleRoleChange('remove')}>Remove as {value}</button>
      </div>
      {/* {error && <p className="error">{error}</p>} */}
      {isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}
    </div>
  );
};
