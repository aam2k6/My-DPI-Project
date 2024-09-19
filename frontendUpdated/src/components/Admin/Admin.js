import React, { useState, useEffect, useContext } from "react";
import { usercontext } from "../../usercontext";
import { ConnectionContext } from "../../ConnectionContext";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import "./Admin.css";
import Navbar from "../Navbar/Navbar";
import Modal from "../Modal/Modal"; // Import the Modal component
import { frontend_host } from "../../config";

export const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [otherConnections, setOtherConnections] = useState([]);
  const [error, setError] = useState(null);
  const { locker_conn, setLocker_conn } = useContext(ConnectionContext);
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
  const {
    connectionName,
    hostLockerName,
    connectionTypeName,
    connectionDescription,
    createdtime,
    validitytime,
    hostUserUsername,
  } = location.state || {};

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }

    if (location.state) {
      setLocker(location.state);
      setLocker_conn(location.state);
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

      const response = await fetch(
        `host/update-delete-locker/`.replace(/host/, frontend_host),
        {
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
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.message === "Locker updated successfully.") {
          fetchUserLockers();
          setEditingLocker(null);
          setShowEditModal(false);
          setModalMessage({
            message: "Locker updated successfully!",
            type: "success",
          });
        } else {
          console.error(data.message);
          setModalMessage({
            message: "Failed to update locker.",
            type: "failure",
          });
        }
      } else {
        console.error(
          "Failed to update locker:",
          data.message || "Unknown error"
        );
        setModalMessage({
          message: "Failed to update locker.",
          type: "failure",
        });
      }
    } catch (error) {
      console.error("An error occurred while updating the locker:", error);
      setModalMessage({
        message: "An error occurred while updating the locker.",
        type: "failure",
      });
    }
  };

  const handleDeleteClick = (locker_id) => {
    const lockerToDelete = lockers.find(
      (locker) => locker.locker_id === locker_id
    );
    if (
      window.confirm(
        `Do you want to delete the locker "${lockerToDelete.name}"?`
      )
    ) {
      try {
        const token = Cookies.get("authToken");
        fetch(`host/update-delete-locker/`.replace(/host/, frontend_host), {
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
            setModalMessage({
              message: "Locker deleted successfully!",
              type: "success",
            });
          } else {
            console.error(data.message);
            setModalMessage({
              message: "Failed to delete locker.",
              type: "failure",
            });
          }
        });
      } catch (error) {
        console.error("An error occurred while deleting the locker.");
        setModalMessage({
          message: "An error occurred while deleting the locker.",
          type: "failure",
        });
      }
    }
  };

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `host/get-connection-type/`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log(data);
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
      const response = await fetch(
        `host/get-lockers-user/`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
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
    navigate("/connection", { state: { locker } });
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

  const content = (
    <div className="navbarBrand">
      {/* ADD THIS */}
      <p>Locker Admin: {locker.name}</p>
    </div>
  );

  const handleDeleteConnection = async (connection_type_id) => {
    const connectionToDelete = otherConnections.find(
      (connection) => connection.connection_type_id === connection_type_id
    );

    if (
      window.confirm(
        `Do you want to delete the connection type "${connectionToDelete.connection_type_name}"?`
      )
    ) {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          `host/edit-delete-connectiontype/`.replace(/host/, frontend_host),
          {
            method: "DELETE",
            headers: {
              Authorization: `Basic ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              connection_type_id: connection_type_id,
            }),
          }
        );
        const data = await response.json();

        if (data.success) {
          fetchOtherConnections(); // Refresh the list
          setModalMessage({
            message: "Connection type deleted successfully!",
            type: "success",
          });
        } else {
          console.error(data.error);
          setModalMessage({
            message: "Failed to delete connection type.",
            type: "failure",
          });
        }
      } catch (error) {
        console.error(
          "An error occurred while deleting the connection type:",
          error
        );
        setModalMessage({
          message: "An error occurred while deleting the connection type.",
          type: "failure",
        });
      }
    }
  };

  return (
    <div>
      <Navbar content={content} />
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
              <h4
                className="clickable-connection-name"
                onClick={() => {
                  console.log("Navigating with the following data:");
                  console.log(
                    "Connection Type Name:",
                    connection.connection_type_name,
                    connection.connectionDescription,
                    connection.created_time,
                    connection.validity_time
                  );
                  console.log("Host Locker Name:", locker.name);
                  console.log("Host User Username:", curruser?.username);
                  console.log("Locker:", locker);
                  navigate("/display-terms", {
                    state: {
                      connectionTypeName: connection.connection_type_name,
                      hostLockerName: locker.name,
                      hostUserUsername: curruser?.username,
                      locker: locker,
                      connectionDescription:connection.connection_description,
                      createdtime:connection.created_time,
                      validitytime:connection.validity_time

                    },
                    
                  });
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                {connection.connection_type_name}
              </h4>
              <p>{connection.connection_description}</p>
              <div>
                <p>
                  Created On:{" "}
                  {new Date(connection.created_time).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p>
                  Valid Until:{" "}
                  {new Date(connection.validity_time).toLocaleDateString()}
                </p>
              </div>

              {/* Add Delete Button */}
              <button
                onClick={() =>
                  handleDeleteConnection(connection.connection_type_id)
                }
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p>No connections found.</p>
        )}
      </div>

      <div className="page8parent">
        <div className="descriptionadmin">Locker</div>
        {filteredLockers.length > 0 ? (
          filteredLockers.map((locker) => (
            <div key={locker.locker_id} className="page8connections">
              <h4>{locker.name}</h4>
              <p>{locker.description}</p>
              <div className="button-group">
                <button onClick={() => handleEditClick(locker)}>Edit</button>
                <button onClick={() => handleDeleteClick(locker.locker_id)}>
                  Delete
                </button>
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
              <button
                className="cancel-btn"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveClick}>
                Save Changes
              </button>
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
