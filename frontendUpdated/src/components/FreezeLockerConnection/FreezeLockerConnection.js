import React, { useState, useContext } from "react";
import "./FreezeLockerConnection.css";
import Modal from '../Modal/Modal.jsx';
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { usercontext } from '../../usercontext';
import Cookies from 'js-cookie';


export default function App() {
  const [lockerName, setLockerName] = useState("");
  const [connectionName, setConnectionName] = useState("");
  const [modalMessage, setModalMessage] = useState({message: "", type: ""});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState({locker: false, connection: false});
  const { curruser,setUser } = useContext(usercontext);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({message: "", type: ""});
  };

  const handleFreezeLocker = async () => {
    if (!lockerName) {
      setModalMessage({message: 'Please enter a locker name', type: 'info'});
      setIsModalOpen(true);
      return;
    }

    setIsLoading((prevState) => ({ ...prevState, locker: true }));

    const token = Cookies.get('authToken');

    try {
      const response = await fetch("http://localhost:8000/freeze_locker/", {
        method: "PUT",
        body: JSON.stringify({ locker_name: lockerName, username: curruser.username}),
        headers: {
          'Authorization': `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setModalMessage({ message: data.message || 'Locker freeze request successful', type: 'success' });
      } else {
        setModalMessage({ message: data.message || 'Locker freeze request failed', type: 'failure' });
      }
      setIsModalOpen(true);
    } catch (error) {
      setModalMessage({ message: 'Error freezing locker', type: 'failure' });
      setIsModalOpen(true);
    }  finally {
      setIsLoading((prevState) => ({ ...prevState, locker: false }));
    }
  };

  const handleFreezeConnection = async () => {
    if (!connectionName) {
      setModalMessage({ message: 'Please enter a connection name', type: 'info' });
      setIsModalOpen(true);
      return;
    }

    setIsLoading((prevState) => ({ ...prevState, connection: true }));

    const token = Cookies.get('authToken');

    try {
      const response = await fetch("http://localhost:8000/freeze_connection/", {
        method: "PUT",
        //curruser is user obj
        body: JSON.stringify({ connection_name: connectionName, username: curruser.username }),
        headers: {
          'Authorization': `Basic ${token}`,
          "Content-Type": "application/json",
        },   
      });
      const data = await response.json();
      if (response.ok) {
        setModalMessage({ message: data.message || 'Connection freeze request successful', type: 'success' });
      } else {
        setModalMessage({ message: data.message || 'Connection freeze request failed', type: 'failure' });
      }
      setIsModalOpen(true);
    } catch (error) {
      setModalMessage({ message: 'Error freezing connection', type: 'failure' });
      setIsModalOpen(true);
    } finally {
      setIsLoading((prevState) => ({ ...prevState, connection: false }));
    }
  };

  return (
    <div className="content">
      {/* <header className="header">
        <div className="menu-bar">
          <h1 className="page-title">Moderator Page</h1>
          <nav className="nav-links">
            <a href="#dpi-directory">DPI Directory</a>
            <a href="#home">Home</a>
            <div className="user-info">
              <img src="user_avatar.png" alt="Profile" />
              <p id="name">Ragini</p>
              <p >
                Imtech 3rd year
                <br />
                Student at IIITB
              </p></div>
          </nav>
        </div>
      </header> */}
    <Navbar />
    <Sidebar />
      <div className="freeze-section">
        <div className="freeze-locker">
          <label>Enter Locker Name</label>
          <input
            type="text"
            value={lockerName}
            onChange={(event) => setLockerName(event.target.value)}
            placeholder="Enter Locker Name"
          />
          <button onClick={handleFreezeLocker} disabled={isLoading.locker}>
            {isLoading.locker ? "Freezing Locker..." : "Freeze Locker"}
          </button>
        </div>
        <div className="freeze-connection">
          <label>Enter Connection Name</label>
          <input
            type="text"
            value={connectionName}
            onChange={(event) => setConnectionName(event.target.value)}
            placeholder="Enter Connection Name"
          />
          <button onClick={handleFreezeConnection} disabled={isLoading.connection}>
            {isLoading.connection ? "Freezing Connection..." : "Freeze Connection"}
          </button>
        </div>
      </div>
      {isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}
    </div>

  );
}
