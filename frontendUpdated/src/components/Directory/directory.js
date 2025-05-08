import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from '../Navbar/Navbar';
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import "./directory.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from "../Sidebar/Sidebar.js";

export const DirectoryPage = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
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
    const breadcrumbs = (
        <div className="breadcrumbs">
          <a href="/home" className="breadcrumb-item">
            Home
          </a>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">Directory</span>
        </div>
      )
    return (
        <div>
            <button
        className={`hamburger-menu ${isSidebarOpen ? "hidden" : ""}`}
        onClick={toggleSidebar}
      >
         <FontAwesomeIcon icon={faBars} style={{fontSize:"20px"}}/>
      </button>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
      />
            {/* <Navbar breadcrumbs={breadcrumbs} /> */}
            <Box className="landing-page">
                <div className="landing-page-container">
                    <h1>Directory</h1>
                    <p>Choose an option to continue:</p>

                    <Grid
                        container
                        spacing={3}
                        className="landing-page-grid"
                        alignItems="center"
                        justifyContent="center"
                    >

                        <Grid item xs={12} sm={6} md={6}>
                            <Box
                                onClick={() => navigate("/dpi-directory")}
                                className="landing-page-card"
                            >
                                DPI Directory
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={6}>
                            <Box
                                onClick={() => navigate("/create-global-connection-type")}
                                className="landing-page-card"
                            >
                                Global Connection Directory
                            </Box>
                        </Grid>


                    </Grid>
                </div>
            </Box>
        </div>
    );
};

export default DirectoryPage;
