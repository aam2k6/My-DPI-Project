import React from "react";
import "./page7.css";
import { useNavigate } from "react-router-dom";

export const TargetLockerView=()=>  {
  const navigate = useNavigate();


  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleClick = () => {
    navigate('/connection');
  };
  
  const handleLogoutClick = () => {
    console.log("Logout button clicked");
    navigate('/');
  };
  const handleAdminClick = () => {
    console.log("Admin button clicked");
    navigate('/admin');
  };


  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">Locker:Transcripts</div>
          <div className="description7">Owner:<u>IIITB</u></div>
        </div>

        <div className="navbarLinks">
        <ul className="navbarFirstLink">
          <li>
            <a href="#" onClick={handleDPIDirectory}>DPI Directory</a>
          </li>
        </ul>

        <ul className="navbarSecondLink">
          <li>
          <a href="#" onClick={handleHomeClick}>Home</a>
          </li>
          <li>
          <a href="#" onClick={handleAdminClick}>Admin </a>
          </li>
        </ul>

        <ul className="navbarThirdLink">
          <li>
            <img src="" alt="User Icon" />
          </li>
          <li>
          <a href="#"onClick={handleLogoutClick}>Logout</a>
            
          </li>
        </ul>
        </div>
      </nav>
      <div className="page7description">  
      <div className="descriptionpage7">This locker stores students transcripts</div>
      <button onClick={handleClick} className="new-connection-btn">Create New Connection</button>
         </div>
      
      <div className="page7container">
              {/* <div className="page7containerA"> */}
              <div className="notvisible">
               <div className="page7publicresources">
              <p>  Public resources: Resources for all</p>
               <div className="page7resource">
                <u>MS_manual.pdf</u></div>    
               </div>

               <div className="page7publicresources">
              <p>  Other Resources</p>
               {/* <div className="page7resource">
                <u></u></div>     */}
               </div>
               </div>
              
              {/* </div> */}

              <div className="page7containerB">
                <p>My connections</p>
                <div className="page7myconnections">
                <div id="conntent"><h3>Btech 2020 :Appplicant</h3></div>
              <div id="conntent">IIITb Transcripts&lt;&gt;Rohith:Education</div>
              <div id="conntent">Created On:</div>
              <div id="conntent">Valid Until:</div>
                </div>
                <div className="page7myconnections">
                <div id="conntent"><h3>IMtech 2020 :Appplicant</h3></div>
              <div id="conntent">IIITb Transcripts&lt;&gt;Rohith:Education</div>
              <div id="conntent">Created On:</div>
              <div id="conntent">Valid Until:</div>
                </div>
              </div>

      </div>
      

      </div>

  );
}
