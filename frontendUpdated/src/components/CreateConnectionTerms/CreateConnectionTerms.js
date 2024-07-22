import "./CreateConnectionTerms.css";

import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from "react-router-dom";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 
import { usercontext } from "../../usercontext";

export const CreateConnectionTerms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const [Iagree, setIagree] = useState("0"); // Step 2: Create a state variable

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
};

useEffect(() => {
    if (!curruser) {
        navigate('/');
        return;
    }
}, []);



  const handleDPIDirectory = () => {
    navigate('/dpi-directory');
  };

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleAdmin = () => {
    navigate('/admin');
};

const handleLogout = () => {
    // Clear cookies
    Cookies.remove('authToken');
    // Clear local storage
    localStorage.removeItem('curruser');
    // Set user context to null
    setUser(null);
    // Redirect to login page
    navigate('/');
};

const toggleDropdown = () => {
  setIsOpen(!isOpen);
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
          <a href="" ></a>
          </li>
        </ul>

        <ul className="navbarThirdLink">
        <li>
                            <img src={userImage} alt="User Icon" onClick={toggleDropdown} className="dropdownImage" />
                            {isOpen && (
                                <div className="dropdownContent">
                                    <div className="currusername">{capitalizeFirstLetter(curruser.username)}</div>
                                    <div className="curruserdesc">{curruser.description}</div>

                                    <button onClick={handleAdmin}>Settings</button>
                                    <button onClick={handleLogout}>Logout</button>
                                </div>
                            )}
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
