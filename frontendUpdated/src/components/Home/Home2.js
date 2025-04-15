import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export const Home = ({ isSidebarOpen }) => {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setScale(0.6);
      } else if (width < 768) {
        setScale(0.7);
      } else if (width < 1024) {
        setScale(0.85);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <main className={`main-content ${isSidebarOpen ? "sidebar-open" : ""}`} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
      <h1 className="page-title" style={{ fontSize: `${48 * scale}px` }}>Home Page</h1>

      <div className="content-container">
        <div className="button-container">
          <span className="text-button" style={{ fontSize: `${28 * scale}px` }}>My Lockers</span>
          <button
            className="primary-button"
            onClick={() => navigate("/create-locker")}
            style={{ fontSize: `${14 * scale}px`, padding: `${10 * scale}px ${24 * scale}px` }}
          >
            CREATE NEW LOCKER
          </button>
          <button
            className="primary-button"
            onClick={() => navigate("/consent-dashboard")}
            style={{ fontSize: `${14 * scale}px`, padding: `${10 * scale}px ${24 * scale}px` }}
          >
            CONSENT DASHBOARD
          </button>
        </div>
        <div className="locker-box2">
          <div className="locker-box">
            <div className="locker-inner">
              <div className="locker-content">
                <h2 className="locker-heading" style={{ fontSize: `${20 * scale}px` }}>Education</h2>
                <p className="locker-text" style={{ fontSize: `${14 * scale}px` }}>
                  This locker consists of my education documents
                </p>
              </div>
              <button
                className="open-button"
                onClick={() => navigate("/locker/education")}
                style={{ fontSize: `${14 * scale}px`, padding: `${8 * scale}px ${24 * scale}px` }}
              >
                Open
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
