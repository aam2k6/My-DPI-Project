import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { ConnectionContext } from "../../ConnectionContext";
import { usercontext } from "../../usercontext";

import "./connection.css";
import Navbar from "../Navbar/Navbar";
import Panel from "../Panel/Panel";
import { frontend_host } from "../../config";

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
      <div className="navbarLockerName-terms">Locker : {locker_conn?.name}</div>
      <div className="navbarLockerOwner-terms">Owner : {curruser.username}</div>
    </>
  );

  return (
    <>
      <Navbar content={content}></Navbar>
      <Panel />
      <div className="Panelcontent">
        <div className="connection-heroContainer">
          <div className="connection-resourceHeading">Connection</div>
          <div className="connection-lockerForm">
            <form className="connection-lockerForm" onSubmit={handleSubmit}>
              <label>
                <span>Locker</span>
                <input value={locker_conn ? locker_conn.name : ""} readOnly />
              </label>
              <label>
                <span>Name</span>
                <input
                  type="text"
                  name="connectionName"
                  placeholder="Connection Type Name"
                  onChange={(e) => setConnectionName(e.target.value)}
                />
              </label>
              <label>
                <span>Description </span>
                <input
                  id="kerak"
                  type="text"
                  name="connectionDescription"
                  placeholder="Description"
                  onChange={(e) => setConnectionDescription(e.target.value)}
                />
              </label>
              <label>
                <span>Validity</span>
                <input
                  type="date"
                  name="validity"
                  placeholder="Calendar Picker"
                  onChange={(e) => setValidity(e.target.value)}
                />
              </label>
              <button type="submit">Next</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
