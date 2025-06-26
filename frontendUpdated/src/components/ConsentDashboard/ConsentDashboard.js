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

export const ConsentDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("incoming");
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
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
    <Box style={{display:"flex", justifyContent:"center"}}>
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
      <StatBox label="Total Connection Type" value="3" fullWidth />
      <StatBox label="Total" value={<><span className="main-value">10</span><sub className="sub-label"> users</sub></>} />
      <StatBox label="Established" value={<><span className="main-value">5</span><sub className="sub-label"> users</sub></>} />
      <StatBox label="Live" value={<><span className="main-value">4</span><sub className="sub-label"> users</sub></>} />
      <StatBox label="Closed" value={<><span className="main-value">1</span><sub className="sub-label"> users</sub></>} />
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
      <StatBox label="Total Connection" value="10" fullWidth />
      <StatBox label="Established" value={<><span className="main-value">5</span><sub className="sub-label"> connections</sub></>} />
      <StatBox label="Live" value={<><span className="main-value">4</span><sub className="sub-label"> connections</sub></>} />
      <StatBox label="Closed" value={<><span className="main-value">1</span><sub className="sub-label"> connections</sub></>} />
    </div>
  </div>
</div>
<div
  className="container bg-white rounded p-3 mt-4"
>

  <div className="row g-3 align-items-center">

    {/* Search Input */}
    <div className="col-lg-3 col-md-6 col-12">
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
    </div>

    {/* Date Picker */}
    <div className="col-lg-2 col-md-6 col-12">
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
    </div>

    {/* Sort Dropdown */}
    <div className="col-lg-2 col-md-6 col-12">
        <div className="input-group">
             <select className="form-select" aria-label="Sort by locker">
                <option defaultValue>Sort by Locker</option>
                <option value="1">Sort by Connection status</option>
                {/* <option value="2">Sort by Date</option> */}
             </select>
             <span className="input-group-text">
                <i className="bi bi-funnel"></i>
             </span>
        </div>
    </div>

<div className="col-lg-5 col-md-6 col-12">
  {/* Wrap the buttons in a div with the 'btn-group' class */}
  <div className="btn-group gap-4 w-100" role="group" aria-label="Connection Type">
    <button
      type="button"
      className={`btn ${activeTab === 'incoming' ? 'btn-primary' : ''}`}
      onClick={() => setActiveTab('incoming')}
      style={{borderRadius:"4px", border:"2px solid #007bff"}}
    >
      INCOMING CONNECTIONS
    </button>
    <button
      type="button"
      className={`btn ${activeTab === 'outgoing' ? 'btn-primary' : ''}`}
      onClick={() => setActiveTab('outgoing')}
      style={{borderRadius:"4px", border:"2px solid #007bff"}}
    >
      OUTGOING CONNECTIONS
    </button>
  </div>
</div>



  </div>
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
