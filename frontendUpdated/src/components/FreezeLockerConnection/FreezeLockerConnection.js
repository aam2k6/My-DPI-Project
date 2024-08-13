import React, { useState, useContext, useEffect } from "react";
import "./FreezeLockerConnection.css";
import Modal from '../Modal/Modal.jsx';
import Navbar from "../Navbar/Navbar";
import { usercontext } from '../../usercontext';
import Cookies from 'js-cookie';
import Sidebar from "../Sidebar/Sidebar";


export default function FreezeLockerConnection() {
  const [lockerName, setLockerName] = useState("");
  const [connectionName, setConnectionName] = useState("");
  const [modalMessage, setModalMessage] = useState({message: "", type: ""});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState({locker: false, connection: false});
  const { curruser} = useContext(usercontext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userConnections, setConnections] = useState([]);
  const [userLockers, setUserLockers] = useState([]);
  const [error, setError] = useState(null);
  const [freezeMode, setFreezeMode] = useState(true); //state for toggle
  const [connectionId, setConnectionId] = useState("");

   useEffect(() => {
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
        } else {
          setError(data.message || data.error);
        }
      })
      .catch(error => {
        setError("An error occurred while fetching users.");
        console.error("Error:", error);
      });

   }, []);

  const fetchLockers = async () => {
    if (!selectedUser) return;
    const token = Cookies.get('authToken');
    const params = new URLSearchParams({ username: selectedUser.username });

    try {
      const response = await fetch(`http://localhost:8000/get-lockers-user/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch lockers');
        console.error('Error fetching lockers:', errorData);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUserLockers(data.lockers.filter(locker => locker.is_frozen === !freezeMode));
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching this user's lockers.");
      console.error("Error:", error);
    }
  };

  const fetchConnections = async () => {
    const token = Cookies.get('authToken');
    try {
      const response = await fetch('http://localhost:8000/get-all-connections/', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch connections');
        console.error('Error fetching connections:', errorData);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setConnections(data.connections.filter(connection => connection.is_frozen === !freezeMode));
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching connections.");
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchLockers();
    }
  }, [selectedUser, freezeMode]);

  useEffect(() => {
    fetchConnections();
  }, [freezeMode]);


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

    const action = freezeMode ? 'freeze' : 'unfreeze'; // Determine action based on toggle
    console.log("action in free", action);

    setIsLoading((prevState) => ({ ...prevState, locker: true }));

    const token = Cookies.get('authToken');

    try {
      const response = await fetch("http://localhost:8000/freeze-unfreeze-locker/", {
        method: "PUT",
        body: JSON.stringify({ locker_name: lockerName, username: selectedUser.username, action}),
        headers: {
          'Authorization': `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setModalMessage({ message: data.message || 'Locker freeze request successful', type: 'success' });
        //to clear input fields
        setLockerName("");
        setSelectedUser(null);
        //fetching updated list of lockers and connections
        await fetchLockers();
        await fetchConnections();
      } else {
        setModalMessage({ message: data.error || data.message || 'Locker freeze request failed', type: 'failure' });
      }
      setIsModalOpen(true);
    } catch (error) {
      console.log('er', error);
      setModalMessage({ message: `Error while performing ${action}`, type: 'failure' });
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

    const action = freezeMode ? 'freeze' : 'unfreeze'; // Determine action based on toggle
    console.log("action in conn", action);

    setIsLoading((prevState) => ({ ...prevState, connection: true }));

    const token = Cookies.get('authToken');

    try {
      const response = await fetch("http://localhost:8000/freeze-unfreeze-connection/", {
        method: "PUT",
        //curruser is user obj
        body: JSON.stringify({ connection_id: connectionId, connection_name: connectionName, action}),
        headers: {
          'Authorization': `Basic ${token}`,
          "Content-Type": "application/json",
        },   
      });
      const data = await response.json();
      if (response.ok) {
        setModalMessage({ message: data.message || 'Connection freeze request successful', type: 'success' });
        //to clear input fields 
        setConnectionName("");
        setConnectionId("");
        //fetching updated list of lockers and connections
        await fetchLockers();
        await fetchConnections();
      } else {
        setModalMessage({ message: data.error || 'Connection freeze request failed', type: 'failure' });
      }
      setIsModalOpen(true);
    } catch (error) {
      console.log("er", error);
      setModalMessage({ message: `Error while performing ${action}`, type: 'failure' });
      setIsModalOpen(true);
    } finally {
      setIsLoading((prevState) => ({ ...prevState, connection: false }));
    }
    console.log("id", connectionId);
  };

  const toggleFreezeMode = () => {
      // setIsFreezing(prev => !prev);
      setFreezeMode(prev => !prev);
      setLockerName("");
      setSelectedUser(null);
  };

// const filteredLockers = userLockers.filter(locker => locker.is_frozen === isFreezing);
// const filteredConnections = userConnections.filter(connection => connection.is_frozen === isFreezing);

  const code = (<>
    <Navbar />
    <button id = "toggle" onClick={toggleFreezeMode}>
     {freezeMode ? 'Switch to Unfreeze' : 'Switch to Freeze'}
   </button>
    <div className="freeze-section">
    <>
      <div className="freeze-locker">
        <label>Select Username</label>
        <select
        onChange={(e) => {
        const selected = users.find(user => user.username === e.target.value);
        setSelectedUser(selected);
      }}
      value={selectedUser ? selectedUser.username : ""}
      >
      <option value="">Select a user</option>
      {users.map(user => (
        <option key={user.user_id} value={user.username}>
          {user.username}
        </option>
      ))}
    </select>
        <label>Select Locker Name</label>
        <select
          onChange={(e) => setLockerName(e.target.value)}
          value={lockerName}
        >
          <option value="">Select a locker</option>
          {userLockers.map(locker => (
            <option key={locker.locker_id} value={locker.name}>
              {locker.name}
            </option>
          ))}
        </select>
        <button onClick={handleFreezeLocker} disabled={isLoading.locker}>
       {isLoading.locker ? (freezeMode ? "Freezing Locker..." : "Unfreezing Locker...") : (freezeMode ? "Freeze Locker" : "Unfreeze Locker")}
     </button>
      </div>

      <div className="freeze-connection">
        <label>Enter Connection Name</label>
        <select
          onChange={ (e) => {
            const selectedConnection = userConnections.find(connection => connection.connection_name === e.target.value);
            console.log(selectedConnection);
            setConnectionName(e.target.value);
            setConnectionId(selectedConnection ? selectedConnection.connection_id : "");
          }}
          value={connectionName}
        >
          <option value="">Select a connection</option>
          {userConnections.map(connection => (
            <option key={connection.connection_id} value={connection.connection_name}>
              {connection.connection_name}
            </option>
          ))}
        </select>
         <button onClick={handleFreezeConnection} disabled={isLoading.connection}>
       {isLoading.connection ? (freezeMode? "Freezing Connection..." : "Unfreezing Connection...") : (freezeMode ? "Freeze Connection" : "Unfreeze Connection")}
     </button>
      </div>
    </>
{isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}
</div>
</>);
  return (
    <>
     
    {((curruser.user_type === 'sys_admin'  || curruser.user_type === 'system_admin') && (curruser.user_type !== 'moderator')) && 
    <div className="content">{code} <Sidebar /></div> }

    {curruser.user_type === 'moderator' &&<>{code}</>}

    </>
  );
  
}


// import React, { useState, useContext, useEffect } from "react";
// import "./FreezeLockerConnection.css";
// import Modal from '../Modal/Modal.jsx';
// import Navbar from "../Navbar/Navbar";
// import { usercontext } from '../../usercontext';
// import Cookies from 'js-cookie';
// import Sidebar from "../Sidebar/Sidebar";

// export default function FreezeLockerConnection() {
//   const [lockerName, setLockerName] = useState("");
//   const [connectionName, setConnectionName] = useState("");
//   const [modalMessage, setModalMessage] = useState({message: "", type: ""});
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [users, setUsers] = useState([]);
//   const [isLoading, setIsLoading] = useState({locker: false, connection: false});
//   const { curruser,setUser } = useContext(usercontext);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [userConnections, setUserConnections] = useState([]);
//   const [userLockers, setUserLockers] = useState([]);
//   const [error, setError] = useState(null);
//   const [freezeMode, setFreezeMode] = useState(true); // New state for toggle
//   const [isFreezing, setIsFreezing] = useState(true); // true for freezing, false for unfreezing

//   useEffect(() => {
//     const token = Cookies.get('authToken');
//     fetch('http://localhost:8000/dpi-directory/', {
//       method: 'GET',
//       headers: {
//         'Authorization': `Basic ${token}`,
//         'Content-Type': 'application/json'
//       }
//     })
//       .then(response => response.json())
//       .then(data => {
//         if (data.success) {
//           setUsers(data.users);
//         } else {
//           setError(data.message || data.error);
//         }
//       })
//       .catch(error => {
//         setError("An error occurred while fetching users.");
//         console.error("Error:", error);
//       });

//   }, []);

//   useEffect(() => {
//     const fetchLockers = async () => {
//       try {
//         const token = Cookies.get('authToken');
//         const params = new URLSearchParams({ username: selectedUser ? selectedUser.username : '' });
//         const response = await fetch(`http://localhost:8000/get-lockers-user/?${params}`, {
//           method: 'GET',
//           headers: {
//             'Authorization': `Basic ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           setError(errorData.error || 'Failed to fetch lockers');
//           console.error('Error fetching lockers:', errorData);
//           return;
//         }

//         const data = await response.json();

//         if (data.success) {
//           // Filter lockers based on freeze mode
//           setUserLockers(data.lockers.filter(locker => locker.is_frozen === !freezeMode));
//         } else {
//           setError(data.message || data.error);
//         }
//       } catch (error) {
//         setError("An error occurred while fetching this user's lockers.");
//         console.error("Error:", error);
//       }
//     };

//     if (selectedUser) {
//       fetchLockers();
//     }
//   }, [selectedUser, freezeMode]);

//   useEffect(() => {
//     const fetchConnections = async () => {
//       try {
//         const token = Cookies.get('authToken');
//         const params = new URLSearchParams({ username: selectedUser ? selectedUser.username : '' });
//         const response = await fetch(`http://localhost:8000/get-connections-user/`, {
//           method: 'GET',
//           headers: {
//             'Authorization': `Basic ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           setError(errorData.error || 'Failed to fetch connections');
//           console.error('Error fetching connections:', errorData);
//           return;
//         }

//         const data = await response.json();

//         if (data.success) {
//           // Filter connections based on freeze mode
//           setUserConnections(data.connections.filter(connection => connection.is_frozen === !freezeMode));
//         } else {
//           setError(data.message || data.error);
//         }
//       } catch (error) {
//         setError("An error occurred while fetching this user's connections.");
//         console.error("Error:", error);
//       }
//     };

//     if (selectedUser) {
//       fetchConnections();
//     }
//   }, [selectedUser, freezeMode]);

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setModalMessage({message: "", type: ""});
//   };

//   const handleFreezeLocker = async () => {
//     if (!lockerName) {
//       setModalMessage({ message: 'Please enter a locker name', type: 'info' });
//       setIsModalOpen(true);
//       return;
//     }
  
//     const action = isFreezing ? 'freeze' : 'unfreeze'; // Determine action based on toggle
  
//     setIsLoading((prevState) => ({ ...prevState, locker: true }));
  
//     const token = Cookies.get('authToken');
  
//     try {
//       const response = await fetch("http://localhost:8000/freeze-unfreeze-locker/", {
//         method: "PUT",
//         body: JSON.stringify({ locker_name: lockerName, username: curruser.username, action }),
//         headers: {
//           'Authorization': `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setModalMessage({ message: data.message || `Locker ${action} request successful`, type: 'success' });
//       } else {
//         setModalMessage({ message: data.error || `Locker ${action} request failed`, type: 'failure' });
//       }
//       setIsModalOpen(true);
//     } catch (error) {
//       setModalMessage({ message: `Error ${action} locker`, type: 'failure' });
//       setIsModalOpen(true);
//     } finally {
//       setIsLoading((prevState) => ({ ...prevState, locker: false }));
//     }
//   };
  

//   const handleFreezeConnection = async () => {
//     if (!connectionName) {
//       setModalMessage({ message: 'Please enter a connection name', type: 'info' });
//       setIsModalOpen(true);
//       return;
//     }
  
//     const action = isFreezing ? 'freeze' : 'unfreeze'; // Determine action based on toggle
  
//     setIsLoading((prevState) => ({ ...prevState, connection: true }));
  
//     const token = Cookies.get('authToken');
  
//     try {
//       const response = await fetch("http://localhost:8000/freeze-unfreeze-connection/", { // Update with correct endpoint
//         method: "PUT",
//         body: JSON.stringify({ connection_name: connectionName, username: curruser.username, action }),
//         headers: {
//           'Authorization': `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setModalMessage({ message: data.message || `Connection ${action} request successful`, type: 'success' });
//       } else {
//         setModalMessage({ message: data.error || `Connection ${action} request failed`, type: 'failure' });
//       }
//       setIsModalOpen(true);
//     } catch (error) {
//       setModalMessage({ message: `Error ${action} connection`, type: 'failure' });
//       setIsModalOpen(true);
//     } finally {
//       setIsLoading((prevState) => ({ ...prevState, connection: false }));
//     }
//   };
  

 
// const toggleFreezeMode = () => {
//   setIsFreezing(!isFreezing);
// };

// const filteredLockers = userLockers.filter(locker => locker.is_frozen === isFreezing);
// const filteredConnections = userConnections.filter(connection => connection.is_frozen === isFreezing);



//   const code = (
//     <>
//       <Navbar />
//   <button onClick={toggleFreezeMode}>
//     {isFreezing ? 'Switch to Unfreeze' : 'Switch to Freeze'}
//   </button>

//   <div className="freeze-locker">
//     <label>Select Locker Name</label>
//     <select
//       onChange={(e) => setLockerName(e.target.value)}
//       value={lockerName}
//     >
//       <option value="">Select a locker</option>
//       {filteredLockers.map(locker => (
//         <option key={locker.name} value={locker.name}>
//           {locker.name}
//         </option>
//       ))}
//     </select>
//     <button onClick={handleFreezeLocker} disabled={isLoading.locker}>
//       {isLoading.locker ? (isFreezing ? "Freezing Locker..." : "Unfreezing Locker...") : (isFreezing ? "Freeze Locker" : "Unfreeze Locker")}
//     </button>
//   </div>

//   <div className="freeze-connection">
//     <label>Select Connection Name</label>
//     <select
//       onChange={(e) => setConnectionName(e.target.value)}
//       value={connectionName}
//     >
//       <option value="">Select a connection</option>
//       {filteredConnections.map(connection => (
//         <option key={connection.name} value={connection.name}>
//           {connection.name}
//         </option>
//       ))}
//     </select>
//     <button onClick={handleFreezeConnection} disabled={isLoading.connection}>
//       {isLoading.connection ? (isFreezing ? "Freezing Connection..." : "Unfreezing Connection...") : (isFreezing ? "Freeze Connection" : "Unfreeze Connection")}
//     </button>
//   </div>

//   {isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}
// </>

//   );

// return (
//       <>
      
//       {curruser.user_type === 'sys_admin' && 
//       <div className="content">{code} <Sidebar /></div> }
  
//       {curruser.user_type === 'moderator' &&<>{code}</>}
  
//       </>
//     );
    
//   }


//3
// import React, { useState, useEffect } from 'react';
// import Cookies from 'js-cookie';
// import "./FreezeLockerConnection.css";
// import Modal from '../Modal/Modal.jsx';
// import Navbar from "../Navbar/Navbar";
// import { usercontext } from '../../usercontext';
// import Sidebar from '../Sidebar/Sidebar';

// const FreezeLockerConnection = () => {
//   const [isFreezing, setIsFreezing] = useState(true);
//   const [lockerName, setLockerName] = useState('');
//   const [connectionName, setConnectionName] = useState('');
//   const [userLockers, setUserLockers] = useState([]);
//   const [userConnections, setUserConnections] = useState([]);
//   const [isLoading, setIsLoading] = useState({ locker: false, connection: false });
//   const [modalMessage, setModalMessage] = useState({ message: '', type: '' });
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [curruser, setCurruser] = useState({ username: 'current_user', user_type: 'MODERATOR' }); // Dummy user info, replace as needed

//   useEffect(() => {
//     // Fetch initial lockers and connections
//     fetchLockers();
//     fetchConnections();
//   }, []);

//   const fetchLockers = async () => {
//     // Fetch lockers from API
//     const token = Cookies.get('authToken');
//     try {
//       const response = await fetch("http://localhost:8000/get_lockers/", {
//         headers: { 'Authorization': `Basic ${token}` }
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setUserLockers(data.lockers);
//       } else {
//         console.error('Failed to fetch lockers:', data.error);
//       }
//     } catch (error) {
//       console.error('Error fetching lockers:', error);
//     }
//   };

//   const fetchConnections = async () => {
//     // Fetch connections from API
//     const token = Cookies.get('authToken');
//     try {
//       const response = await fetch("http://localhost:8000/get_connections/", {
//         headers: { 'Authorization': `Basic ${token}` }
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setUserConnections(data.connections);
//       } else {
//         console.error('Failed to fetch connections:', data.error);
//       }
//     } catch (error) {
//       console.error('Error fetching connections:', error);
//     }
//   };

//   const handleFreezeLocker = async () => {
//     if (!lockerName) {
//       setModalMessage({ message: 'Please enter a locker name', type: 'info' });
//       setIsModalOpen(true);
//       return;
//     }

//     const action = isFreezing ? 'freeze' : 'unfreeze';

//     setIsLoading((prevState) => ({ ...prevState, locker: true }));

//     const token = Cookies.get('authToken');

//     try {
//       const response = await fetch("http://localhost:8000/freeze_or_unfreeze_locker/", {
//         method: "PUT",
//         body: JSON.stringify({ locker_name: lockerName, username: curruser.username, action }),
//         headers: {
//           'Authorization': `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setModalMessage({ message: data.message || `Locker ${action} request successful`, type: 'success' });
//       } else {
//         setModalMessage({ message: data.error || `Locker ${action} request failed`, type: 'failure' });
//       }
//       setIsModalOpen(true);
//     } catch (error) {
//       setModalMessage({ message: `Error ${action} locker`, type: 'failure' });
//       setIsModalOpen(true);
//     } finally {
//       setIsLoading((prevState) => ({ ...prevState, locker: false }));
//     }
//   };

//   const handleFreezeConnection = async () => {
//     if (!connectionName) {
//       setModalMessage({ message: 'Please enter a connection name', type: 'info' });
//       setIsModalOpen(true);
//       return;
//     }

//     const action = isFreezing ? 'freeze' : 'unfreeze';

//     setIsLoading((prevState) => ({ ...prevState, connection: true }));

//     const token = Cookies.get('authToken');

//     try {
//       const response = await fetch("http://localhost:8000/freeze_or_unfreeze_connection/", {
//         method: "PUT",
//         body: JSON.stringify({ connection_name: connectionName, username: curruser.username, action }),
//         headers: {
//           'Authorization': `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setModalMessage({ message: data.message || `Connection ${action} request successful`, type: 'success' });
//       } else {
//         setModalMessage({ message: data.error || `Connection ${action} request failed`, type: 'failure' });
//       }
//       setIsModalOpen(true);
//     } catch (error) {
//       setModalMessage({ message: `Error ${action} connection`, type: 'failure' });
//       setIsModalOpen(true);
//     } finally {
//       setIsLoading((prevState) => ({ ...prevState, connection: false }));
//     }
//   };

//   const toggleFreezeMode = () => {
//     setIsFreezing(!isFreezing);
//   };

//   const filteredLockers = userLockers.filter(locker => locker.is_frozen === isFreezing);
//   const filteredConnections = userConnections.filter(connection => connection.is_frozen === isFreezing);

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//   };

// const code = (
//     <>
//       <button onClick={toggleFreezeMode}>
//         {isFreezing ? 'Switch to Unfreeze' : 'Switch to Freeze'}
//       </button>

//       <div className="freeze-locker">
//         <label>Select Locker Name</label>
//         <select
//           onChange={(e) => setLockerName(e.target.value)}
//           value={lockerName}
//         >
//           <option value="">Select a locker</option>
//           {filteredLockers.map(locker => (
//             <option key={locker.name} value={locker.name}>
//               {locker.name}
//             </option>
//           ))}
//         </select>
//         <button onClick={handleFreezeLocker} disabled={isLoading.locker}>
//           {isLoading.locker ? (isFreezing ? "Freezing Locker..." : "Unfreezing Locker...") : (isFreezing ? "Freeze Locker" : "Unfreeze Locker")}
//         </button>
//       </div>

//       <div className="freeze-connection">
//         <label>Select Connection Name</label>
//         <select
//           onChange={(e) => setConnectionName(e.target.value)}
//           value={connectionName}
//         >
//           <option value="">Select a connection</option>
//           {filteredConnections.map(connection => (
//             <option key={connection.name} value={connection.name}>
//               {connection.name}
//             </option>
//           ))}
//         </select>
//         <button onClick={handleFreezeConnection} disabled={isLoading.connection}>
//           {isLoading.connection ? (isFreezing ? "Freezing Connection..." : "Unfreezing Connection...") : (isFreezing ? "Freeze Connection" : "Unfreeze Connection")}
//         </button>
//       </div>

//       {isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}
//     </>
//   );
  



// return (
//       <>
      
//       {curruser.user_type === 'sys_admin' && 
//       <div className="content">{code} <Sidebar /></div> }
  
//       {curruser.user_type === 'moderator' &&<>{code}</>}
  
//       </>
//     );
// }

// export default FreezeLockerConnection;
