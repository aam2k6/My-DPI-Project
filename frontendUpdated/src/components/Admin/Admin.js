// import React, { useState, useEffect, useContext } from "react";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import { useNavigate, useLocation } from "react-router-dom";
// import "./Admin.css";
// import Navbar from "../Navbar/Navbar";

// export const Admin = () => {
//   const location = useLocation();
//   // const locker = location.state ? location.state: null;

//   // console.log("state locker", locker);
//   const navigate = useNavigate();
//   const [lockers, setLockers] = useState([]);
//   const [otherConnections, setOtherConnections] = useState([]); // State for other connections
//   const [error, setError] = useState(null);
//   const { curruser, setUser } = useContext(usercontext);
//   const [newLockerName, setNewLockerName] = useState("");
//   const [description, setDescription] = useState("");
//   const [editingLocker, setEditingLocker] = useState(null); // To track the locker being edited

//   const [locker, setLocker] = useState(() => {
//     const storedLocker = localStorage.getItem('locker');
//     return storedLocker ? JSON.parse(storedLocker) : (location.state || null);
//   });


//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }

//     if (location.state) {
//       setLocker(location.state);
//       localStorage.setItem('locker', JSON.stringify(location.state));
//     } else if (locker) {
//       localStorage.setItem('locker', JSON.stringify(locker));
//     }

//     fetchOtherConnections();
//      fetchUserLockers();
//   }, [curruser, locker, location.state]);


//   const handleEditClick = (locker) => {
//     setEditingLocker(locker.locker_id);
//     setNewLockerName(locker.name);
//     setDescription(locker.description);
//   };

//   const handleSaveClick = async (locker_id) => {
//     try {
//       const token = Cookies.get('authToken');
//       const response = await fetch(`http://localhost:8000/update-delete-locker/`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Basic ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           locker_name: lockers.find(locker => locker.locker_id === locker_id).name,
//           new_locker_name: newLockerName,
//           description: description,
//           username: curruser.username,

//         }),
//       });
//       const data = await response.json();
//       if (data.message === "Locker updated successfully.") {
//          fetchUserLockers(); // Refresh lockers
//         setEditingLocker(null);
//       } else {
//         console.error(data.message);
//       }
//     } catch (error) {
//       console.error("An error occurred while updating the locker.");
//     }
//   };

//   const handleDeleteClick = async (locker_name) => {
//     try {
//       const token = Cookies.get('authToken');
//       const response = await fetch(`http://localhost:8000/update-delete-locker/`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Basic ${token}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ locker_name: locker_name }),
//       });
//       const data = await response.json();
//       if (data.message.includes("successfully deleted")) {
//          fetchUserLockers(); // Refresh lockers
//       } else {
//         console.error(data.message);
//       }
//     } catch (error) {
//       console.error("An error occurred while deleting the locker.");
//     }
//   };

  
//   const fetchOtherConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const response = await fetch(
//         `http://localhost:8000/get-connection-type/`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         setOtherConnections(data.connection_types); // Updated to match the new response structure
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching other connections");
//     }
//   };


//   // const fetchOtherConnections = async () => {
//   //   try {
//   //     const token = Cookies.get("authToken");
//   //     const params = new URLSearchParams({ locker_name: locker.name });
//   //     const response = await fetch(
//   //       `http://172.16.192.201:8000/connection_types/?${params}`,
//   //       {
//   //         method: "GET",
//   //         headers: {
//   //           Authorization: `Basic ${token}`,
//   //           "Content-Type": "application/json",
//   //         },
//   //       }
//   //     );
//   //     const data = await response.json();
//   //     if (data.success) {
//   //       setOtherConnections(data.connection_types);
//   //     } else {
//   //       setError(data.message);
//   //     }
//   //   } catch (error) {
//   //     setError("An error occurred while fetching other connections");
//   //   }
//   // };


//   const fetchUserLockers = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const response = await fetch(`http://localhost:8000/get-lockers-user/`, {
//         method: "GET",
//         headers: {
//           Authorization: `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const data = await response.json();
//       if (data.success) {
//         setLockers(data.lockers);
//       } else {
//         setError(data.message || data.error);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching lockers.");
//     }
    
//   };

//   const gotopage12createconnection = () => {
//     navigate("/connection");
//   };

//   const filteredConnections = otherConnections.filter(
//     (connection) => connection.owner_locker === locker.locker_id
//   );

//   const filteredLockers = lockers.filter(
//     (l) => l.locker_id === locker.locker_id
//   );

  

//   return (
//     <div>
      
//       <Navbar lockerAdmin = {true}/>
//       <button onClick={gotopage12createconnection} className="admin-btn">
//         Create New Connection Type
//       </button>

//       <div className="page8parent">
//         <div className="descriptionadmin"> Existing Connections Type </div>
//         {filteredConnections.length > 0 ? (
//           filteredConnections.map((connection) => (
//             <div
//               key={connection.connection_type_id}
//               className="page8connections"
//             >
//               <h4>{connection.connection_type_name}</h4>
//               <p>{connection.connection_description}</p>
//               <div>
//                 Created On:{" "}
//                 {new Date(connection.created_time).toLocaleDateString()}
//               </div>
//               <div>
//                 Valid Until:{" "}
//                 {new Date(connection.validity_time).toLocaleDateString()}
//               </div>

//               <button>Edit</button>
//             </div>
//           ))
//         ) : (
//           <p>No connections found.</p>
//         )}
//       </div>

//       <div className="page8parent">
//         <div className="descriptionadmin">Existing Lockers</div>
//         {filteredLockers.length > 0 ? (
//           filteredLockers.map(locker => (
//             <div key={locker.locker_id} className="page8connections">
//               {editingLocker === locker.locker_id ? (
//                 <>
//                   <label>Locker Name</label>
//                   <input
//                     type="text"
//                     value={newLockerName}
//                     onChange={(e) => setNewLockerName(e.target.value)}
//                   />
//                   <label>Description</label>
//                   <input
//                     type="text"
//                     value={description}
//                     onChange={(e) => setDescription(e.target.value)}
//                   />
//                   <button onClick={() => handleSaveClick(locker.locker_id)}>Save</button>
//                   <button onClick={() => setEditingLocker(null)}>Cancel</button>
//                 </>
//               ) : (
//                 <>
//                   <h4>{locker.name}</h4>
//                   <p>{locker.description}</p>
//                   <button onClick={() => handleEditClick(locker)}>Edit</button>
//                   <button onClick={() => handleDeleteClick(locker.name)}>Delete</button>
//                 </>
//               )}
//             </div>
//           ))
//         ) : (
//           <p>No lockers found.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// import React, { useState, useEffect, useContext } from "react";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import { useNavigate, useLocation } from "react-router-dom";
// import "./Admin.css";
// import Navbar from "../Navbar/Navbar";

// export const Admin = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [lockers, setLockers] = useState([]);
//   const [otherConnections, setOtherConnections] = useState([]);
//   const [error, setError] = useState(null);
//   const { curruser } = useContext(usercontext);
//   const [newLockerName, setNewLockerName] = useState("");
//   const [description, setDescription] = useState("");
//   const [editingLocker, setEditingLocker] = useState(null);
//   const [locker, setLocker] = useState(() => {
//     const storedLocker = localStorage.getItem("locker");
//     return storedLocker ? JSON.parse(storedLocker) : location.state || null;
//   });

//   const [showEditModal, setShowEditModal] = useState(false);

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }

//     if (location.state) {
//       setLocker(location.state);
//       localStorage.setItem("locker", JSON.stringify(location.state));
//     } else if (locker) {
//       localStorage.setItem("locker", JSON.stringify(locker));
//     }

//     fetchOtherConnections();
//     fetchUserLockers();
//   }, [curruser, locker, location.state]);

//   const handleEditClick = (locker) => {
//     setEditingLocker(locker.locker_id); // Set the ID of the locker being edited
//     setNewLockerName(locker.name); // Set the current name to be edited
//     setDescription(locker.description); // Set the current description to be edited
//     setShowEditModal(true); // Open the edit modal
//   };
  

//   const handleSaveClick = async () => {
//     try {
//       const token = Cookies.get("authToken");
  
//       // Make sure you are sending the correct locker ID and current name
//       const lockerToUpdate = lockers.find(
//         (locker) => locker.locker_id === editingLocker
//       );
//       if (!lockerToUpdate) {
//         console.error("Locker not found.");
//         return;
//       }
  
//       const response = await fetch(`http://localhost:8000/update-delete-locker/`, {
//         method: "PUT",
//         headers: {
//           Authorization: `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           locker_name: lockerToUpdate.name, // Existing locker name
//           new_locker_name: newLockerName,   // New locker name entered by the user
//           description: description,         // New description entered by the user
//         }),
//       });
  
//       const data = await response.json();
  
//       if (response.ok) {
//         if (data.message === "Locker updated successfully.") {
//           fetchUserLockers(); // Refresh lockers
//           setEditingLocker(null);
//           setShowEditModal(false); // Close the edit modal
//         } else {
//           console.error(data.message);
//         }
//       } else {
//         console.error("Failed to update locker:", data.message || "Unknown error");
//       }
//     } catch (error) {
//       console.error("An error occurred while updating the locker:", error);
//     }
//   };
  
  

//   const handleDeleteClick = (locker_id) => {
//     const lockerToDelete = lockers.find((locker) => locker.locker_id === locker_id);
//     if (window.confirm(`Do you want to delete the locker "${lockerToDelete.name}"?`)) {
//       try {
//         const token = Cookies.get("authToken");
//         fetch(`http://localhost:8000/update-delete-locker/`, {
//           method: "DELETE",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             locker_name: lockerToDelete.name,
//           }),
//         }).then(async (response) => {
//           const data = await response.json();
//           if (data.message.includes("successfully deleted")) {
//             fetchUserLockers(); // Refresh lockers
//             setEditingLocker(null);
//             setShowEditModal(false); // Close the edit modal
//           } else {
//             console.error(data.message);
//           }
//         });
//       } catch (error) {
//         console.error("An error occurred while deleting the locker.");
//       }
//     }
//   };

//   const fetchOtherConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const response = await fetch(`http://localhost:8000/get-connection-type/`, {
//         method: "GET",
//         headers: {
//           Authorization: `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const data = await response.json();
//       if (data.success) {
//         setOtherConnections(data.connection_types);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching other connections");
//     }
//   };

//   const fetchUserLockers = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const response = await fetch(`http://localhost:8000/get-lockers-user/`, {
//         method: "GET",
//         headers: {
//           Authorization: `Basic ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       const data = await response.json();
//       if (data.success) {
//         setLockers(data.lockers);
//       } else {
//         setError(data.message || data.error);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching lockers.");
//     }
//   };

//   const gotopage12createconnection = () => {
//     navigate("/connection");
//   };

//   const filteredConnections = otherConnections.filter(
//     (connection) => connection.owner_locker === locker.locker_id
//   );

//   const filteredLockers = lockers.filter(
//     (l) => l.locker_id === locker.locker_id
//   );

//   return (
//     <div>
//       <Navbar lockerAdmin={true} />
//       <button onClick={gotopage12createconnection} className="admin-btn">
//         Create New Connection Type
//       </button>

//       <div className="page8parent">
//         <div className="descriptionadmin">Existing Connections Type</div>
//         {filteredConnections.length > 0 ? (
//           filteredConnections.map((connection) => (
//             <div
//               key={connection.connection_type_id}
//               className="page8connections"
//             >
//               <h4>{connection.connection_type_name}</h4>
//               <p>{connection.connection_description}</p>
//               <div>
//                 Created On:{" "}
//                 {new Date(connection.created_time).toLocaleDateString()}
//               </div>
//               <div>
//                 Valid Until:{" "}
//                 {new Date(connection.validity_time).toLocaleDateString()}
//               </div>

//               <button>Edit</button>
//             </div>
//           ))
//         ) : (
//           <p>No connections found.</p>
//         )}
//       </div>

//       <div className="page8parent">
//         <div className="descriptionadmin">Existing Lockers</div>
//         {filteredLockers.length > 0 ? (
//           filteredLockers.map((locker) => (
//             <div key={locker.locker_id} className="page8connections">
//               <h4>{locker.name}</h4>
//               <p>{locker.description}</p>
//               <div className="button-group">
//                 <button onClick={() => handleEditClick(locker)}>Edit</button>
//                 <button onClick={() => handleDeleteClick(locker.locker_id)}>Delete</button>
//               </div>
//             </div>
//           ))
//         ) : (
//           <p>No lockers found.</p>
//         )}
//       </div>

//       {/* Edit Locker Modal */}
//       {showEditModal && (
//   <div className="edit-modal">
//     <div className="modal-content">
//       <h3>Edit Locker</h3>
//       <div className="form-group">
//         <label>Locker Name:</label>
//         <input
//           type="text"
//           value={newLockerName}
//           onChange={(e) => setNewLockerName(e.target.value)}
//         />
//       </div>
//       <div className="form-group">
//         <label>Description:</label>
//         <input
//           type="text"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//         />
//       </div>
//       <div className="modal-buttons">
//         <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
//         <button className="save-btn" onClick={handleSaveClick}>Save Changes</button>
//       </div>
//     </div>
//   </div>
// )}

//     </div>
//   );
// };
import React, { useState, useEffect, useContext } from "react";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import "./Admin.css";
import Navbar from "../Navbar/Navbar";
import Modal from "../Modal/Modal"; // Import the Modal component

export const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [otherConnections, setOtherConnections] = useState([]);
  const [error, setError] = useState(null);
  const { curruser } = useContext(usercontext);
  const [newLockerName, setNewLockerName] = useState("");
  const [description, setDescription] = useState("");
  const [editingLocker, setEditingLocker] = useState(null);
  const [locker, setLocker] = useState(() => {
    const storedLocker = localStorage.getItem("locker");
    return storedLocker ? JSON.parse(storedLocker) : location.state || null;
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(null); // State for modal message

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }

    if (location.state) {
      setLocker(location.state);
      localStorage.setItem("locker", JSON.stringify(location.state));
    } else if (locker) {
      localStorage.setItem("locker", JSON.stringify(locker));
    }

    fetchOtherConnections();
    fetchUserLockers();
  }, [curruser, locker, location.state]);

  const handleEditClick = (locker) => {
    setEditingLocker(locker.locker_id);
    setNewLockerName(locker.name);
    setDescription(locker.description);
    setShowEditModal(true);
  };

  const handleSaveClick = async () => {
    try {
      const token = Cookies.get("authToken");

      const lockerToUpdate = lockers.find(
        (locker) => locker.locker_id === editingLocker
      );
      if (!lockerToUpdate) {
        console.error("Locker not found.");
        return;
      }

      const response = await fetch(`http://localhost:8000/update-delete-locker/`, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locker_name: lockerToUpdate.name,
          new_locker_name: newLockerName,
          description: description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.message === "Locker updated successfully.") {
          fetchUserLockers();
          setEditingLocker(null);
          setShowEditModal(false);
          setModalMessage({ message: "Locker updated successfully!", type: "success" });
        } else {
          console.error(data.message);
          setModalMessage({ message: "Failed to update locker.", type: "failure" });
        }
      } else {
        console.error("Failed to update locker:", data.message || "Unknown error");
        setModalMessage({ message: "Failed to update locker.", type: "failure" });
      }
    } catch (error) {
      console.error("An error occurred while updating the locker:", error);
      setModalMessage({ message: "An error occurred while updating the locker.", type: "failure" });
    }
  };

  const handleDeleteClick = (locker_id) => {
    const lockerToDelete = lockers.find((locker) => locker.locker_id === locker_id);
    if (window.confirm(`Do you want to delete the locker "${lockerToDelete.name}"?`)) {
      try {
        const token = Cookies.get("authToken");
        fetch(`http://localhost:8000/update-delete-locker/`, {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locker_name: lockerToDelete.name,
          }),
        }).then(async (response) => {
          const data = await response.json();
          if (data.message.includes("successfully deleted")) {
            fetchUserLockers();
            setEditingLocker(null);
            setShowEditModal(false);
            setModalMessage({ message: "Locker deleted successfully!", type: "success" });
          } else {
            console.error(data.message);
            setModalMessage({ message: "Failed to delete locker.", type: "failure" });
          }
        });
      } catch (error) {
        console.error("An error occurred while deleting the locker.");
        setModalMessage({ message: "An error occurred while deleting the locker.", type: "failure" });
      }
    }
  };

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`http://localhost:8000/get-connection-type/`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        setOtherConnections(data.connection_types);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching other connections");
    }
  };

  const fetchUserLockers = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`http://172.16.192.201:8000/get-lockers-user/`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.success) {
        setLockers(data.lockers);
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching lockers.");
    }
  };

  const gotopage12createconnection = () => {
    navigate("/connection");
  };

  const filteredConnections = otherConnections.filter(
    (connection) => connection.owner_locker === locker.locker_id
  );

  const filteredLockers = lockers.filter(
    (l) => l.locker_id === locker.locker_id
  );

  const handleCloseModal = () => {
    setModalMessage(null); // Close the modal
  };

  return (
    <div>
      <Navbar lockerAdmin={true} />
      <button onClick={gotopage12createconnection} className="admin-btn">
        Create New Connection Type
      </button>

      <div className="page8parent">
        <div className="descriptionadmin">Existing Connections Type</div>
        {filteredConnections.length > 0 ? (
          filteredConnections.map((connection) => (
            <div
              key={connection.connection_type_id}
              className="page8connections"
            >
              <h4>{connection.connection_type_name}</h4>
              <p>{connection.connection_description}</p>
              <div>
                Created On:{" "}
                {new Date(connection.created_time).toLocaleDateString()}
              </div>
              <div>
                Valid Until:{" "}
                {new Date(connection.validity_time).toLocaleDateString()}
              </div>

              <button>Edit</button>
            </div>
          ))
        ) : (
          <p>No connections found.</p>
        )}
      </div>

      <div className="page8parent">
        <div className="descriptionadmin">Existing Lockers</div>
        {filteredLockers.length > 0 ? (
          filteredLockers.map((locker) => (
            <div key={locker.locker_id} className="page8connections">
              <h4>{locker.name}</h4>
              <p>{locker.description}</p>
              <div className="button-group">
                <button onClick={() => handleEditClick(locker)}>Edit</button>
                <button onClick={() => handleDeleteClick(locker.locker_id)}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p>No lockers found.</p>
        )}
      </div>

      {/* Edit Locker Modal */}
      {showEditModal && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>Edit Locker</h3>
            <div className="form-group">
              <label>Locker Name:</label>
              <input
                type="text"
                value={newLockerName}
                onChange={(e) => setNewLockerName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveClick}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {modalMessage && (
  <Modal
    message={modalMessage.message}
    type={modalMessage.type}
    onClose={handleCloseModal} // Close the message modal
  />
)}

    </div>
  );
};
