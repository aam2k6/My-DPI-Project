import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import "./ConsentDashboard.css";
import Cookies from "js-cookie";
import { frontend_host } from "../../config";
import Sidebar from "../Sidebar/Sidebar.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Box } from "@mui/material";
import { FaUnlink } from 'react-icons/fa';


export const ConsentDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("incoming");
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  const [incomingConnections, setIncomingConnections] = useState([]);
  const [outgoingConnections, setOutgoingConnections] = useState([]);
  const [openCards, setOpenCards] = useState({});
  const [openOutgoingCards, setOpenOutgoingCards] = useState({});
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
const [statsData, setStatsData] = useState({
  incoming: {
    total_Users: 0,
    live: 0,
    established: 0,
    closed: 0,
    total_connections_type: 0
  },
  outgoing: {
    total_Connections: 0,
    live: 0,
    established: 0,
    closed: 0
  }
});

  const [connectionUsers, setConnectionUsers] = useState({});
  const [openUserDetails, setOpenUserDetails] = useState({});
  const [resourceLists, setResourceLists] = useState({});
  const [outgoingResourceLists, setOutgoingResourceLists] = useState({});
  const [loadingOutgoingResource, setLoadingOutgoingResource] = useState({});



  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [loadingResources, setLoadingResources] = useState({});

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
  fetchStats();
}, []);


const fetchStats = async () => {
  try {
    const token = Cookies.get("authToken");
    const response = await fetch(`${frontend_host}/stats/`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Raw stats data:", data);

    // ✅ Only check for response.ok
    if (!response.ok) {
      console.warn("Stats fetch failed with status:", response.status);
      return;
    }

    // ✅ Update state directly
    setStatsData({
      incoming: data.incoming,
      outgoing: data.outgoing
    });

  } catch (error) {
    console.error("Error fetching stats:", error);
  }
};



console.log("cczc", statsData);
  const handleToggleOutgoing = (index) => {
    setOpenOutgoingCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleToggle = async (index, conn) => {
    setOpenCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));


    // Only fetch if not already fetched
    if (!connectionUsers[index]) {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          `${frontend_host}/get-guest-user-connection-id/?connection_type_id=${conn.connection_type_id}&locker_id=${conn.owner_locker}&user_id=${conn.owner_user}`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.connections) {
          setConnectionUsers((prev) => ({
            ...prev,
            [index]: data.connections,
          }));
        } else {
          console.error("Error fetching users:", data.error);
          setConnectionUsers((prev) => ({
            ...prev,
            [index]: [],
          }));
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    }
  };

  useEffect(() => {

   
    
    const fetchIncomingConnections = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(`${frontend_host}/all_connection_types/`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        console.log("Fetched data:", data);

        if (!response.ok || !data.success) {
          return;
        }

        setIncomingConnections(data.connection_types || []);
      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    };

    const fetchOutgoingConnections = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(`${frontend_host}/get-outgoing-connections-by-user/`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        console.log("Fetched outgoing data:", data);

        if (!response.ok || !data.success) {
          return;
        }

        setOutgoingConnections(data.outgoing_connections || []);
      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    };


    if (curruser) {
      fetchStats();
      fetchIncomingConnections();
      fetchOutgoingConnections();
    }
  }, [curruser]);

  // console.log("Incoming Connections:", incomingConnections);
  console.log("Outgoing Connections:", statsData);

  const handleUserToggle = (connIndex, userIndex) => {
    setOpenUserDetails((prev) => ({
      ...prev,
      [`${connIndex}-${userIndex}`]: !prev[`${connIndex}-${userIndex}`],
    }));
  };

  const fetchResources = async (user, connectionIndex, userIndex) => {
    const key = `${connectionIndex}-${userIndex}`;
    const connectionId = user.connection_id;
    setLoadingResources(prev => ({ ...prev, [key]: true }));

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `${frontend_host}/all_incoming_connection_resource/?connection_id=${connectionId}&guest_user_id=${user.guest_user.user_id}&guest_locker_id=${user.guest_locker.locker_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        setResourceLists(prev => ({
          ...prev,
          [key]: data.data
        }));
      } else {
        setResourceLists(prev => ({
          ...prev,
          [key]: []
        }));
      }

      // setSelectedResourceCards(prev => ({
      //   ...prev,
      //   [key]: true
      // }));

    } catch (err) {
      console.error("Error fetching resources:", err);
    } finally {
      setLoadingResources(prev => ({ ...prev, [key]: false }));
    }
  };

  const fetchOutgoingResources = async (user, index) => {
    const key = `${index}`;
    setLoadingOutgoingResource((prev) => ({ ...prev, [key]: true }));

    try {
      const token = Cookies.get("authToken");

      const res = await fetch(
        `${frontend_host}/all_outgoing_connection_resource/?connection_id=${user.connection_id}&host_user_id=${user.host_user.user_id}&host_locker_id=${user.host_locker.locker_id}`,
        {
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();
      console.log("Outgoing Resources:", data);

      if (data.success) {
        setOutgoingResourceLists((prev) => ({
          ...prev,
          [key]: data.data || [],
        }));
      } else {
        setOutgoingResourceLists((prev) => ({
          ...prev,
          [key]: [],
        }));
      }
    } catch (error) {
      console.error("Error fetching outgoing resources:", error);
    } finally {
      setLoadingOutgoingResource((prev) => ({ ...prev, [key]: false }));
    }
  };




  return (
    <>
      <div className={`user-greeting-container shadow ${isSidebarOpen ? "d-none" : ""}`}>
        <button
          className="hamburger-btn me-2"
          onClick={toggleSidebar}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        <span className="fw-semibold fs-6 text-dark">
          Hi, {capitalizeFirstLetter(curruser.username)}
        </span>
      </div>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
      />
      {/* <div className="locker-header">
        <div className="locker-text">
          <div className="navbar-content">{content}</div>
        </div>
        <div className="navbar-breadcrumbs">{breadcrumbs}</div>
      </div> */}
      <Box style={{ display: "flex", justifyContent: "center" }}>
        <div className="consent-dashboard-container">
          {/* Title */}
          <span className="consent-dashboard-title">
            My Consent Dashboard
          </span>

          {/* Button */}
          <button className="back-button" onClick={() => navigate("/home")}>
            ← Back to Lockers
          </button>
        </div>
      </Box>
      <div className="dashboard-wrapper m-4">
        <div className="consent-dashboard">
          {/* <h3 className="consent-title">Incoming Connection <i className="bi bi-arrow-down-short" style={{fontSize:"30px"}}></i></h3> */}
          <h3 className="consent-title">
            Incoming Connection
            <span
              className="align-arrow"
            >
              <i
                className="bi bi-arrow-down-short"
              ></i>
            </span>
          </h3>

          <div className="stat-grid">
            <StatBox label="Total Connection Type" value={statsData?.incoming?.total_connections_type} fullWidth />
            <StatBox label="Total" value={<><span className="main-value">{statsData?.incoming?.total_Users}</span><sub className="sub-label"> users</sub></>} />
            <StatBox label="Established" value={<><span className="main-value">{statsData?.incoming?.established}</span><sub className="sub-label"> users</sub></>} />
            <StatBox label="Live" value={<><span className="main-value">{statsData?.incoming?.live}</span><sub className="sub-label"> users</sub></>} />
            <StatBox label="Closed" value={<><span className="main-value">{statsData?.incoming?.closed}</span><sub className="sub-label"> users</sub></>} />
          </div>

        </div>

        <div className="consent-dashboard">
          <h3 className="consent-title">Outgoing Connection  <span
            className="align-arrow"
          >
            <i
              className="bi bi-arrow-up-short"
            ></i>
          </span></h3>
          <div className="stat-grids">
            <StatBox label="Total Connection" value={statsData?.outgoing?.total_Connections} fullWidth />
            <StatBox label="Established" value={<><span className="main-value">{statsData?.outgoing?.established}</span><sub className="sub-label"> connections</sub></>} />
            <StatBox label="Live" value={<><span className="main-value">{statsData?.outgoing?.live}</span><sub className="sub-label"> connections</sub></>} />
            <StatBox label="Closed" value={<><span className="main-value">{statsData?.outgoing?.closed}</span><sub className="sub-label"> connections</sub></>} />
          </div>
        </div>
      </div>
      <div
        className="container bg-white rounded p-3 mt-4"
      >

        <div className="row g-3 align-items-center">

          {/* Search Input */}
          {/* <div className="col-lg-3 col-md-6 col-12">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search Connections by Name"
                aria-label="Search Connection"
              />
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
            </div>
          </div> */}

          {/* Date Picker */}
          {/* <div className="col-lg-2 col-md-6 col-12">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="dd-mm-yyyy"
                aria-label="Select Date"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
              />
              <span className="input-group-text">
                <i className="bi bi-calendar3"></i>
              </span>
            </div>
          </div> */}

          {/* Sort Dropdown */}
          {/* <div className="col-lg-2 col-md-6 col-12">
            <div className="input-group">
              <select className="form-select" aria-label="Sort by locker">
                <option defaultValue>Sort by Locker</option>
                <option value="1">Sort by Connection status</option>
                
              </select>
              <span className="input-group-text">
                <i className="bi bi-funnel"></i>
              </span>
            </div>
          </div> */}

          <div className="col-lg-3 col-md-6 col-12">
          </div>
          

          <div className="col-lg-5 col-md-6 col-12">
            {/* Wrap the buttons in a div with the 'btn-group' class */}
            <div className="btn-group gap-4 w-100" role="group" aria-label="Connection Type">
              <button
                type="button"
                className={`btn ${activeTab === 'incoming' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('incoming')}
                style={{ borderRadius: "4px", border: "2px solid #007bff" }}
              >
                INCOMING CONNECTIONS
              </button>
              <button
                type="button"
                className={`btn ${activeTab === 'outgoing' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('outgoing')}
                style={{ borderRadius: "4px", border: "2px solid #007bff" }}
              >
                OUTGOING CONNECTIONS
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        {activeTab === "incoming" && (
          <div className="container mt-4">
            {incomingConnections.length > 0 ? (
              <div className="row">
                {incomingConnections.map((conn, index) => (
                  <div key={index} className="col-12">
                    <div
                      className="card border-0 shadow rounded-4 px-3 py-2"
                      style={{
                        backgroundColor: "#f8f9fa",  // Light gray (optional)
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      <div className="card-body d-flex justify-content-between align-items-center px-2">
                        <h6 className="card-title mb-0 fw-semibold">{conn.connection_type_name}</h6>

                        <button
                          className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                          onClick={() => handleToggle(index, conn)}
                          style={{
                            width: "32px",
                            height: "32px",
                            padding: 0,
                          }}
                          aria-label="Toggle users"
                        >
                          {openCards[index] ? "▲" : "▼"}
                        </button>
                      </div>
                      {openCards[index] && (
                        <div className="card-body pt-0">
                          {connectionUsers[index] ? (
                            connectionUsers[index].length > 0 ? (
                              <ul className="list-group list-group-flush">
                                {connectionUsers[index].map((user, uIdx) => (
                                  <li key={uIdx} className="list-group-item">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span>{openUserDetails[`${index}-${uIdx}`] ? <strong>{user.connection_name}</strong> : <strong>{user.guest_user.username}</strong>}</span>
                                      <button
                                        className="btn btn-md btn-outline-primary rounded-circle p-0"
                                        style={{ width: "28px", height: "28px", fontSize: "18px" }}
                                        onClick={() => handleUserToggle(index, uIdx)}
                                        aria-label="Toggle user details"
                                      >
                                        {openUserDetails[`${index}-${uIdx}`] ? <i className="bi bi-chevron-up"></i> : <i className="bi bi-chevron-down"></i>}
                                      </button>
                                    </div>
                                    {/* {openUserDetails[`${index}-${uIdx}`] ? <hr></hr>  : ""} */}


                                    {openUserDetails[`${index}-${uIdx}`] && (
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-5">
                                            <p className="mb-3"><strong>Connection Type:</strong> {conn.connection_type_name}</p>
                                            <div className="d-flex flex-column flex-md-row gap-4 mb-3">
                                              <div className="user-container">
                                                <i className="hostuser-icon" /> &nbsp;
                                                <span className="userName">: {capitalizeFirstLetter(user.host_user.username)}</span>
                                              </div>
                                              <div className="user-container">
                                                <i className="guestuser-icon" /> &nbsp;
                                                <span className="userName">: {capitalizeFirstLetter(user.guest_user.username)}</span>
                                              </div>
                                            </div>

                                            <div className="d-flex flex-column flex-md-row gap-4 mb-3">
                                              <div className="user-container">
                                                <i className="hostLocker-icon" /> &nbsp;
                                                <span className="userName">: {user.host_locker.name}</span>
                                              </div>
                                              <div className="user-container">
                                                <i className="guestLocker-icon" /> &nbsp;
                                                <span className="userName">: {user.guest_locker.name}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="col-md-5">
                                            <p className="mb-3"><strong>Status:</strong> {capitalizeFirstLetter(user.connection_status) || ""}</p>
                                            <p className="mb-3"><strong>Created On:</strong> {new Date(user.created_time).toLocaleString()}</p>
                                            <p className="mb-3"><strong>Valid Till:</strong> {new Date(user.validity_time).toLocaleString()}</p>
                                          </div>

                                          <div className="col-md-2">
                                            <span className="me-2 mb-3">Actions:</span>
                                            <button className="btn btn-sm btn-light rounded-circle me-2">I</button>
                                            <button className="btn btn-sm btn-light rounded-circle">C</button>
                                          </div>
                                        </div>
                                        <div className="row mt-3">
                                          <div className="col-sm-12 col-md-6 mb-3">
                                            <button
                                              type="button"
                                              className="btn btn-primary"
                                              style={{ borderRadius: "4px", border: "2px solid #007bff" }}
                                              onClick={() => fetchResources(user, index, uIdx)}
                                            >
                                              {loadingResources[`${index}-${uIdx}`] ? "Loading..." : "List of Resources"}
                                            </button>
                                          </div>



                                          <div className="col-sm-12 col-md-6">
                                            {resourceLists[`${index}-${uIdx}`] ? (
                                              <div className="">
                                                <ul className="list-group">
                                                  {resourceLists[`${index}-${uIdx}`].length > 0 ? (
                                                    resourceLists[`${index}-${uIdx}`].map((resource, rIdx) => (
                                                      <li key={rIdx} className="list-group-item"
                                                        style={{ marginLeft: "-2px", marginBottom: "0"}}

                                                        id={
                                                          resource.xnode_Type === "INODE"
                                                            ? "documents"
                                                            : resource.xnode_Type === "SNODE"
                                                              ? "documents-byConfer"
                                                              : "documents-byShare"
                                                        }

                                                      // onMouseEnter={() => setHovered(xnode.id)}
                                                      // onMouseLeave={() => setHovered(null)}
                                                      >
                                                        <div>
                                                          <span
                                                            // onClick={() => handleClick(xnode.id)}
                                                            style={{ cursor: "pointer", flexGrow: 1, fontSize: "16px" }}
                                                          >
                                                            {resource.resource_name}
                                                          </span>
                                                          <button type="button" className="btn btn-outline-primary float-end" style={{ borderRadius: "4px", border: "2px solid #007bff", fontSize: "70%", padding: "3px 10px" }}>
                                                            Revert
                                                          </button>



                                                          {/* {error && <div className="error-message">{error}</div>} */}
                                                        </div>

                                                      </li>
                                                    ))
                                                  ) : (
                                                    <li className="list-group-item text-muted">No resources found.</li>
                                                  )}
                                                </ul>
                                              </div>
                                            ) : (
                                              <div className="mt-3 text-muted"></div>
                                            )}
                                          </div>
                                        </div>




                                      </div>
                                    )}
                                  </li>

                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted mb-0">No users found for this connection.</p>
                            )
                          ) : (

                            <div className="loading-dots text-center my-2">
                              <span className="dot"></span>
                              <span className="dot"></span>
                              <span className="dot"></span>
                            </div>

                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5">
                <FaUnlink size={64} color="#adb5bd" />

                <h6 className="mt-3 text-secondary">No incoming connections available.</h6>
                <p className="text-muted small">Try creating a connection type or check outgoing connections.</p>
              </div>

            )}

          </div>
        )}

        {activeTab === "outgoing" && (
          <div className="container mt-4">
            {outgoingConnections.length > 0 ? (
              <div className="row">
                {outgoingConnections.map((conn, index) => (
                  <div key={conn.connection_id} className="col-12">
                    <div className="card border-0 shadow rounded-4 px-3 py-2" style={{ backgroundColor: "#f8f9fa" }}>
                      <div className="card-body d-flex justify-content-between align-items-center px-2">
                        <h6 className="card-title mb-0 fw-semibold">{conn.connection_name}</h6>

                        <button
                          className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                          onClick={() => handleToggleOutgoing(index)}
                          style={{ width: "32px", height: "32px", padding: 0 }}
                          aria-label="Toggle users"
                        >
                          {openOutgoingCards[index] ? "▲" : "▼"}
                        </button>
                      </div>

                      {openOutgoingCards[index] && (
                        <div className="card-body bg-white p-4 rounded-3" style={{marginBottom:"15px"}}>
                          <div className="row">
                            <div className="col-md-5">
                              <p className="mb-3"><strong>Connection Type:</strong> {conn.connection_type_name}</p>

                              <div className="d-flex flex-column flex-md-row gap-4 mb-3">
                                <div className="user-container">
                                  <i className="hostuser-icon" /> &nbsp;
                                  <span className="userName">: {capitalizeFirstLetter(conn.host_user.username)}</span>
                                </div>
                                <div className="user-container">
                                  <i className="guestuser-icon" /> &nbsp;
                                  <span className="userName">: {capitalizeFirstLetter(conn.guest_user.username)}</span>
                                </div>
                              </div>

                              <div className="d-flex flex-column flex-md-row gap-4 mb-3">
                                <div className="user-container">
                                  <i className="hostLocker-icon" /> &nbsp;
                                  <span className="userName">: {conn.host_locker.name}</span>
                                </div>
                                <div className="user-container">
                                  <i className="guestLocker-icon" /> &nbsp;
                                  <span className="userName">: {conn.guest_locker.name}</span>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-5">
                              <p className="mb-3"><strong>Status:</strong> {capitalizeFirstLetter(conn.connection_status) || ""}</p>
                              <p className="mb-3"><strong>Created On:</strong> {new Date(conn.created_time).toLocaleString()}</p>
                              <p className="mb-3"><strong>Valid Till:</strong> {new Date(conn.validity_time).toLocaleString()}</p>
                            </div>

                            <div className="col-md-2">
                              <span className="me-2 mb-3">Actions:</span>
                              <button className="btn btn-sm btn-light rounded-circle me-2">I</button>
                              <button className="btn btn-sm btn-light rounded-circle">C</button>
                            </div>
                          </div>
                          <div className="row mt-3">
                            <div className="col-sm-12 col-md-6 mb-3">
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ borderRadius: "4px", border: "2px solid #007bff" }}
                                onClick={() => fetchOutgoingResources(conn, index)}
                              >
                                {loadingOutgoingResource[`${index}`] ? "Loading..." : "List of Resources"}
                              </button>
                            </div>

                            <div className="col-sm-12 col-md-6">
                              {outgoingResourceLists[`${index}`] && (
                                <div>
                                  <ul className="list-group">
                                    {outgoingResourceLists[`${index}`].length > 0 ? (
                                      outgoingResourceLists[`${index}`].map((resource, rIdx) => (
                                        <li
                                          key={rIdx}
                                          className="list-group-item"
                                          style={{ marginLeft: "-2px", marginBottom: "0" }}
                                          id={
                                            resource.xnode_Type === "INODE"
                                              ? "documents"
                                              : resource.xnode_Type === "SNODE"
                                                ? "documents-byConfer"
                                                : "documents-byShare"
                                          }
                                        >
                                          <div>
                                            <span style={{ cursor: "pointer", flexGrow: 1, fontSize: "16px" }}>
                                              {resource.resource_name}
                                            </span>
                                            <button
                                              type="button"
                                              className="btn btn-outline-primary float-end"
                                              style={{
                                                borderRadius: "4px",
                                                border: "2px solid #007bff",
                                                fontSize: "70%",
                                                padding: "3px 10px",
                                              }}
                                            >
                                              Revert
                                            </button>
                                          </div>
                                        </li>
                                      ))
                                    ) : (
                                      <li className="list-group-item text-muted">
                                        No resources found.
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5">
                <FaUnlink size={64} color="#adb5bd" />
                <h6 className="mt-3 text-secondary">No outgoing connections available.</h6>
                <p className="text-muted small">Try creating a connection or check incoming connections.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

const StatBox = ({ label, value, fullWidth }) => {
  const colorClassMap = {
    "Live": "stat-success",
    "Established": "stat-warning",
    "Closed": "stat-secondary",
    "Total": "stat-info",
    "Total Connection": "stat-primary",
    "Total Connection Type": "stat-primary"
  };

  const colorClass = colorClassMap[label] || "stat-default";

  return (
    <div className={`stat-box ${fullWidth ? "full-width" : ""} ${colorClass}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
};
