import "./CreateConnectionTerms.css";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";


export const CreateConnectionTerms = () => {
  const navigate = useNavigate();

  const [Iagree, setIagree] = useState("0"); // Step 2: Create a state variable

  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleLogoutClick = () => {
    console.log("Logout button clicked");
    navigate('/');
  };

  const handleAdminClick = () => {
    console.log("Admin button clicked");
    navigate('/admin');
  };
  
  const handleIagreebutton = () => {
 // Step 3: Update the state variable on change
    setIagree(1);  
};

  

  return (
    <div>
      <nav className="navbar">
        <div className="wrap">
          <div className="navbarBrand">Mtech 2024 (Rohith&lt; &gt;IIITB)</div>
          <div className="description"></div>
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
          <a href="" onClick={handleAdminClick}>Admin</a>
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

      <div className="page13parent">
        <div className="page13host1">Host : IIITB</div>
        <div className="page13requestor">Requestor : Rohith</div>

      </div>

      <div className="page13parent">
        <div className="page13host2">Locker:Transcripts</div>
        <div className="page13requestor">Locker : Education</div>

      </div>
   <div className="page13container">


    <p><u>Terms of connection</u></p>
    
    <div className="page13subparent"> 
    <div className="page13headterms">Your Obligations </div>
        <div className="page13lowerterms">1) Share Eng.marks card
        <br />  2) Share Gate score </div>
        

        
        <div className="page13headterms">Your Rights </div>
        <div className="page13lowerterms">1) Can share any other files</div>

       
        
        <div className="page13headterms">Your Prohibitions </div>
        <div className="page13lowerterms">1) Can't Unilateraly close the connection</div>

</div>
</div>
       

{Iagree=="0"&&
    <div >
    <div className="page13button"> <button className="page13iagree0button" onClick={handleIagreebutton}> I  Agree </button></div>
    
   </div>}

   {Iagree=="1"&&
    <div className="page13parent13state1" >
        <div className="page13consent">consent Given on :&lt;june 20,2024,5:34pm&gt;
        <br />
        Valid Until &lt; March 2028 &gt; 
        </div>
    <div className="page13button"> <button className="page13iagree1button" onClick={handleIagreebutton}> Revoke </button></div>
    
   </div>}


</div>

  );
}
