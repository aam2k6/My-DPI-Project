// import "./CreateConnectionTerms.css";
// import React, { useContext, useEffect, useState } from "react";
// import Cookies from 'js-cookie';
// import { useNavigate, useLocation } from "react-router-dom";
// import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
// import { usercontext } from "../../usercontext";
// // import res from "./object";

// export const CreateConnectionTerms = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser, setUser } = useContext(usercontext);
//   const [error, setError] = useState(null);
//   const [isOpen, setIsOpen] = useState(false);
//   const [Iagree, setIagree] = useState("0"); // Step 2: Create a state variable
//   const [message, setMessage] = useState("");
//   const [res, setRes] = useState(null);
//   const [consentData, setConsentData] = useState(null);
//   const { selectedConnectionType, selectedLocker, parentUser, locker } = location.state || {};

//   const capitalizeFirstLetter = (string) => {
//     if (!string) return '';
//     return string.charAt(0).toUpperCase() + string.slice(1);
//   };

//   useEffect(() => {
//     if (!curruser) {
//       navigate('/');
//       return;
//     }

//     //fetch terms from the api
//     const fetchTerms = async () => {
//       console.log("Inside fetch terms");
//       try {
//         const token = Cookies.get('authToken');
//         const response = await fetch(`localhost:8000/show_terms/?username=${curruser.username}&locker_name=${selectedLocker.name}&connection_name=Connection 1`, {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Basic ${token}` // Adjust if using a different authentication method
//           },
//         });
//         if (!response.ok) {
//           throw new Error('Failed to fetch terms');
//         }
//         const data = await response.json();
//         if (data.success) {
//           setRes(data.terms);
//           console.log(data.terms);
//         } else {
//           setError(data.error || 'No terms found');
//         }
//       } catch (err) {
//         setError(err.message);
//       }
//     };

//     fetchTerms();
//   }, []);

//   const handleDPIDirectory = () => {
//     navigate('/dpi-directory');
//   };

//   const handleHomeClick = () => {
//     navigate('/home');
//   };

//   const handleAdmin = () => {
//     navigate('/admin');
//   };



//   const handleLogout = () => {
//     Cookies.remove('authToken');
//     localStorage.removeItem('curruser');
//     setUser(null);
//     navigate('/');
//   };

//   const toggleDropdown = () => {
//     setIsOpen(!isOpen);
//   };

//   const handleIagreebutton = async () => {
//     const token = Cookies.get('authToken');
//     const consent = true;

//     const formData = new FormData();
//     formData.append('connection_name', "Connection 1");
//     formData.append('connection_type_name', selectedConnectionType.connection_type_name);
//     formData.append('guest_username', curruser.username)
//     formData.append('guest_lockername', selectedLocker.name); //rohiths locker
//     formData.append('host_username', parentUser.username);
//     formData.append('host_lockername', locker.name); //logged in users locker(iiitb)
//     formData.append('consent', consent);

//     try {
//       const response = await fetch('localhost:8000/give_consent/', {
//         method: 'POST',
//         headers: {
//           // 'Content-Type': 'application/json',
//           'Authorization': `Basic ${token}`
//         },
//         body: formData,
//       });

//       const data = await response.json();
//       if (data.success) {
//         setMessage("Consent given successfully.");
//         console.log(message);
//         setConsentData(data);
//         setIagree("1");
//       } else {
//         setMessage(data.error || "An error occurred while giving consent.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setMessage("An error occurred while giving consent.");
//     }
//   };

//   const handleRevokebutton = async () => {
//     const token = Cookies.get('authToken');
//     const revoke_guest = false;
//     const revoke_host = false;

//     const formData = new FormData();
//     formData.append('connection_name', "Connection 1");
//     formData.append('connection_type_name', selectedConnectionType.connection_type_name);
//     formData.append('guest_username', curruser.username);
//     formData.append('guest_lockername', selectedLocker.name);
//     formData.append('host_username', parentUser.username);
//     formData.append('host_lockername', locker.name);
//     formData.append('revoke_host', revoke_host);
//     formData.append('revoke_guest', revoke_guest);

//     try {
//       const response = await fetch('localhost:8000/revoke_consent/', {
//         method: 'POST',
//         headers: {
//           // 'Content-Type': 'application/json',
//           'Authorization': `Basic ${token}`
//         },
//         body: formData,
//       });

//       const data = await response.json();
//       if (data.success) {
//         setMessage("Consent revoked successfully.");
//         console.log(message);
//         // setConsentData(data);
//         setIagree("0");
//       } else {
//         setMessage(data.error || "An error occurred while revoking consent.");
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setMessage("An error occurred while revoking consent.");
//     }

//   }


//   const renderObligations = () => {
//     if (res && res.obligations) {
//       return res.obligations.map((obligation, index) => (
//         <div key={index}>
//           <ul>
//             <li>{obligation.typeOfSharing}  {" "}  {obligation.labelName}</li>
//           </ul>
//         </div>
//       ));
//     } else {
//       return <p>No obligations available.</p>;
//     }
//   };

//   const renderPermissions = () => {
//     if (res && res.permissions) {
//       const { canShareMoreData, canDownloadData } = res.permissions;
//       return (
//         <div className="permissions">
//           <ul>
//             <li>{canShareMoreData && <div>You can share more data.</div>}</li>
//             <li>{canDownloadData && <div>You can download data.</div>}</li>
//           </ul>

//         </div>
//       );

//     }
//     return null;
//   };


//   return (
//     <div>
//       <nav className="navbar">
//         <div className="wrap">
//           <div className="navbarBrand">{capitalizeFirstLetter(selectedConnectionType.connection_type_name)} ({capitalizeFirstLetter(parentUser.username)}&lt; &gt;{capitalizeFirstLetter(curruser.username)})</div>
//           <div className="description"></div>
//         </div>

//         <div className="navbarLinks">
//           <ul className="navbarFirstLink">
//             <li>
//               <a href="#" onClick={handleDPIDirectory}>DPI Directory</a>
//             </li>
//           </ul>
//           <ul className="navbarSecondLink">
//             <li>
//               <a href="#" onClick={handleHomeClick}>Home</a>
//             </li>
//             <li>
//               <a href="" ></a>
//             </li>
//           </ul>

//           <ul className="navbarThirdLink">
//             <li>
//               <img src={userImage} alt="User Icon" onClick={toggleDropdown} className="dropdownImage" />
//               {isOpen && (
//                 <div className="dropdownContent">
//                   <div className="currusername">{capitalizeFirstLetter(curruser.username)}</div>
//                   <div className="curruserdesc">{curruser.description}</div>

//                   <button onClick={handleAdmin}>Settings</button>
//                   <button onClick={handleLogout}>Logout</button>
//                 </div>
//               )}
//             </li>
//           </ul>
//         </div >
//       </nav >

//       <div className="page13parent">
//         <div className="page13host1">Host : {capitalizeFirstLetter(parentUser.username)}</div>
//         <div className="page13requestor">Requestor :{capitalizeFirstLetter(curruser.username)}</div>

//       </div>

//       <div className="page13parent">
//         <div className="page13host2">Locker:{capitalizeFirstLetter(locker.name)}</div>
//         <div className="page13requestor">Locker :{capitalizeFirstLetter(selectedLocker.name)}</div>

//       </div>
//       <div className="page13container">


//         <p><u>Terms of connection</u></p>

//         <div className="page13subparent">
//           <div className="page13headterms">Your Obligations </div>
//           <div className="page13lowerterms">
//             {renderObligations()}
//           </div>

//           <div className="page13headterms">Your Rights </div>
//           <div className="page13lowerterms">{renderPermissions()}</div>

//         </div>
//       </div>


//       {
//         Iagree === "0" &&
//         <div >
//           <div className="page13button"> <button className="page13iagree0button" onClick={handleIagreebutton}> I  Agree </button></div>
//           <div>
//             {message && <div className="message">{message}</div>}
//           </div>
//         </div>
//       }

//       {
//         Iagree === "1" &&
//         <div className="page13parent13state1" >
//           <div className="page13consent">Consent Given on : {consentData.consent_given_date}
//             <br />
//             Consent valid Until : {consentData.valid_until}
//           </div>
//           <div className="page13button"> <button className="page13iagree1button" onClick={handleRevokebutton}> Revoke </button></div>

//         </div>
//       }


//     </div >

//   );
// }



import "./CreateConnectionTerms.css";
import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
// import res from "./object";

export const CreateConnectionTerms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [Iagree, setIagree] = useState("0"); // Step 2: Create a state variable
  const [message, setMessage] = useState("");
  const [res, setRes] = useState(null);
  const [consentData, setConsentData] = useState(null);
  const { connectionName, hostLockerName, connectionTypeName, hostUserUsername ,locker} = location.state || {};
 
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

    //fetch terms from the api
    const fetchTerms = async () => {
      console.log("Inside fetch terms");
      try {
        const token = Cookies.get('authToken');
        const response = await fetch(`host/show_terms/?username=${curruser.username}&locker_name=${locker.name}&connection_name=${connectionName}`.replace(/host/g, frontend_host), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${token}` // Adjust if using a different authentication method
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch terms');
        }
        const data = await response.json();
        if (data.success) {
          setRes(data.terms);
          console.log(data.terms);
        } else {
          setError(data.error || 'No terms found');
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchTerms();
  }, []);

  const handleIagreebutton = async () => {
    const token = Cookies.get('authToken');
    const consent = true;

    const formData = new FormData();
    formData.append('connection_name', connectionName);
    formData.append('connection_type_name', connectionTypeName);
    formData.append('guest_username', curruser.username)
    formData.append('guest_lockername', locker.name); //rohiths locker
    formData.append('host_username', hostUserUsername);
    formData.append('host_lockername', hostLockerName); //logged in users locker(iiitb)
    formData.append('consent', consent);

    try {
      const response = await fetch('host/give_consent/'.replace(/host/g, frontend_host), {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Consent given successfully.");
        console.log(message);
        setConsentData(data);
        setIagree("1");
      } else {
        setMessage(data.error || "An error occurred while giving consent.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred while giving consent.");
    }
  };

  const handleRevokebutton = async () => {
    const token = Cookies.get('authToken');
    const revoke_guest = false;
    const revoke_host = false;

    const formData = new FormData();
    formData.append('connection_name', connectionName);
    formData.append('connection_type_name', connectionTypeName);
    formData.append('guest_username', curruser.username);
    formData.append('guest_lockername', locker.name);
    formData.append('host_username', hostUserUsername);
    formData.append('host_lockername', hostLockerName);
    formData.append('revoke_host', revoke_host);
    formData.append('revoke_guest', revoke_guest);

    try {
      const response = await fetch('host/revoke_consent/'.replace(/host/g, frontend_host), {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setMessage("Consent revoked successfully.");
        console.log(message);
        // setConsentData(data);
        setIagree("0");
      } else {
        setMessage(data.error || "An error occurred while revoking consent.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("An error occurred while revoking consent.");
    }

  }


  const renderObligations = () => {
    if (res && res.obligations) {
      return res.obligations.map((obligation, index) => (
        <div key={index}>
          <ul>
            <li>{obligation.typeOfSharing}  {" "}  {obligation.labelName}</li>
          </ul>
        </div>
      ));
    } else {
      return <p>No obligations available.</p>;
    }
  };

  const renderPermissions = () => {
    if (res && res.permissions) {
      const { canShareMoreData, canDownloadData } = res.permissions;
      return (
        <div className="permissions">
          <ul>
            {canShareMoreData && <li>You can share more data.</li> }
            {canDownloadData && <li>You can download data.</li> }
          </ul>

        </div>
      );
    }
    return null;
  };

const content = (
  <>
  <div className="navbarBrand">{capitalizeFirstLetter(connectionTypeName)} ({capitalizeFirstLetter(hostUserUsername)}&lt; &gt;{capitalizeFirstLetter(curruser.username)})</div>
  <div className="navbarBrand">Connection name:: {capitalizeFirstLetter(connectionName)}   </div>
  {/* <div className="navbarBrand">{(connection_description)}   </div> */}
  <div className="description"></div>
  </>
  
);

  return (
    <div>
      <Navbar content = {content}/>

      <div className="page13parent">
        <div className="page13host1">Host : {capitalizeFirstLetter(hostUserUsername)}</div>
        <div className="page13requestor">Requestor :{capitalizeFirstLetter(curruser.username)}</div>

      </div>

      <div className="page13parent">
        <div className="page13host2">Locker:{capitalizeFirstLetter(hostLockerName)}</div>
        <div className="page13requestor">Locker :{capitalizeFirstLetter(locker.name)}</div>

      </div>
      <div className="page13container">


        <p><u>Terms of connection</u></p>

        <div className="page13subparent">
          <div className="page13headterms">Your Obligations </div>
          <div className="page13lowerterms">
            {renderObligations()}
          </div>

          <div className="page13headterms">Your Rights </div>
          <div className="page13lowerterms">{renderPermissions()}</div>

        </div>
      </div>


      {
        Iagree === "0" &&
        <div >
          <div className="page13button"> <button className="page13iagree0button" onClick={handleIagreebutton}> I  Agree </button></div>
          <div>
            {message && <div className="message">{message}</div>}
          </div>
        </div>
      }

      {
        Iagree === "1" &&
        <div className="page13parent13state1" >
          <div className="page13consent">Consent Given on : {consentData.consent_given_date}
            <br />
            Consent valid Until : {consentData.valid_until}
          </div>
          <div className="page13button"> <button className="page13iagree1button" onClick={handleRevokebutton}> Revoke </button></div>

        </div>
      }


    </div >

  );
}


