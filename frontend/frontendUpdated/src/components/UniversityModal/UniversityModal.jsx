import React from "react";
import "./UniversityModal.css";

const UniversityModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <span className="close-btn" onClick={onClose}>×</span>

        <h2>Template Preview</h2>

        <div className="template-header">
          <h3>Universal University Template</h3>
          <p>Auto-generated profile with verified credentials</p>
        </div>

        {/* Academic */}
        {/* Personal Details */}
          <div className="section">
            <h4>Personal Details 🔒</h4>

            <div className="grid">
              <input value="Akul Anhith" readOnly />
              <input value="5th July 2006" readOnly />
              <input value="motukuri.akul@iiitb.ac.in" readOnly />
              <input value="+91 9491259683" readOnly />
            </div>
          </div>
        <div className="section">
          <h4>Academic Details</h4>
          <div className="grid">
            <input value="IIIT Bangalore" readOnly />
            <input placeholder="Program" />
            <input placeholder="Year of Study" />
            <input placeholder="Student ID" />
          </div>
        </div>

        {/* Profile */}
        <div className="section">
          <h4>Profile Description</h4>
          <textarea placeholder="Write your profile..." />
        </div>

        <div className="actions">
          <button className="secondary">Download PDF</button>
          <button className="primary" onClick={onClose}>
            Submit
          </button>
        </div>

      </div>
    </div>
  );
};

export default UniversityModal;