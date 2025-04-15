
import React from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export const Home = ({ isSidebarOpen }) => {
  const navigate = useNavigate();

  return (
    <main className={`main-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <h1 className="page-title">Home Page</h1>

      <div className="content-container">
        <div className="button-container">
          <span className="text-button">My Lockers</span>
          <button
            className="primary-button"
            onClick={() => navigate("/create-locker")}
          >
            CREATE NEW LOCKER
          </button>
          <button
            className="primary-button"
            onClick={() => navigate("/consent-dashboard")}
          >
            CONSENT DASHBOARD
          </button>
        </div>
        <div className="locker-box2">
          <div className="locker-box">
            <div className="locker-inner">
              <div className="locker-content">
                <h2 className="locker-heading">Education</h2>
                <p className="locker-text">
                  This locker consists of my education documents
                </p>
              </div>
              <button
                className="open-button"
                onClick={() => navigate("/view-locker")}
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
