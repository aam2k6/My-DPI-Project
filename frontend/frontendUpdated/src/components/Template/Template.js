import React, { useState, useContext } from "react";
import UniversityModal from "../UniversityModal/UniversityModal";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext"; // Adjust if usercontext is located elsewhere
import Sidebar from "../Sidebar/Sidebar"; 

export const Template = () => {
  const navigate = useNavigate();
  const { curruser } = useContext(usercontext);

  // --- SIDEBAR STATES ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Template");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
    lockerSettings: false,
    lockerSettings1: false,
    adminSettings: false,
  });

  // --- PAGE VIEW STATE ---
  // Tracks whether we are on the main template screen or the sub-screen
  const [currentView, setCurrentView] = useState("main"); 
  const [isModalOpen, setIsModalOpen] = useState(false);


  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) => {
    setOpenSubmenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "User";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", position: "relative", overflowX: "hidden" }}>
      
      {/* 1. TOP-LEFT TOGGLE BUTTON (Visible only when sidebar is closed) */}
      {!isSidebarOpen && (
        <div 
          className="user-greeting-container" 
          onClick={toggleSidebar}
          style={{ cursor: "pointer" }}
        >
          <button className="hamburger-btn">
            <i className="bi bi-list" style={{ fontSize: "24px", color: "white" }}></i>
          </button>
          <span style={{ marginLeft: "10px", fontWeight: "600", color: "#333" }}>
            Hi, {capitalizeFirstLetter(curruser?.username)}
          </span>
        </div>
      )}

      {/* 2. SIDEBAR COMPONENT */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
      />

      {/* 3. MAIN CONTENT WRAPPER (Shifts right when sidebar opens) */}
      <div className={`main-content ${isSidebarOpen ? "sidebar-open" : ""}`} style={{ padding: "40px", paddingTop: "80px" }}>

        {/* TOP-RIGHT BREADCRUMB & TITLE */}
        <div style={{ position: "absolute", top: "30px", right: "50px", textAlign: "right" }}>
          <h2 style={{ margin: 0, color: "#444", fontSize: "28px", fontWeight: "bold" }}>
            {currentView === "main" ? "Template" : "University Template"}
          </h2>
          <div style={{ backgroundColor: "#f5f5f5", padding: "8px 16px", borderRadius: "6px", display: "inline-block", marginTop: "8px", fontSize: "14px" }}>
            
            {/* Home Link */}
            <span style={{ color: "#0D6EFD", fontWeight: "bold", cursor: "pointer" }} onClick={() => navigate("/home")}>
              Home
            </span>
            <span style={{ color: "#aaa", margin: "0 8px", fontSize: "12px" }}>▶</span>
            
            {/* Template Link (Clickable if we are inside University Template) */}
            <span
              style={{ 
                color: currentView === "main" ? "#666" : "#0D6EFD", 
                fontWeight: currentView === "main" ? "normal" : "bold", 
                cursor: currentView === "main" ? "default" : "pointer" 
              }}
              onClick={() => setCurrentView("main")}
            >
              Template
            </span>

            {/* University Template (Shows only if clicked) */}
            {currentView === "university" && (
              <>
                <span style={{ color: "#aaa", margin: "0 8px", fontSize: "12px" }}>▶</span>
                <span style={{ color: "#666" }}>University Template</span>
              </>
            )}
          </div>
        </div>

        {/* MIDDLE / BODY CONTENT */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
  
          <button
            className="btn btn-primary"
            style={{
              backgroundColor: "#0D6EFD",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              fontSize: "16px",
              fontWeight: "600",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(13, 110, 253, 0.2)",
            }}
            onClick={() => setIsModalOpen(true)}
          >
            University Template
          </button>

        </div>

      </div>

      <UniversityModal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
    />

    </div>
  );
};