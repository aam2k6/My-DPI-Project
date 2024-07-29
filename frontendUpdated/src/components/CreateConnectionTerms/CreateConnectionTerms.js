import "./CreateConnectionTerms.css";
import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from "react-router-dom";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import { usercontext } from "../../usercontext";
// import res from "./object";

export const CreateConnectionTerms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [Iagree, setIagree] = useState("0"); // Step 2: Create a state variable
  const [message, setMessage] = useState("");
  const [res, setRes] = useState(null);

//   let res = {
//     connectionDescription: "Connection for education documents",
//     connectionName: "connection1",
//     lockerName: "Education",
//     obligations: [
//         {
//             labelName: "Admission No",
//             typeOfAction: "text",
//             typeOfSharing: "share",
//             hostPermissions: [
//                 "reshare",
//                 "download"
//             ],
//             labelDescription: "Admission id for mtech admission"
//         },
//         {
//             labelName: "Gate Score Card",
//             typeOfAction: "file",
//             typeOfSharing: "transfer",
//             hostPermissions: [
//                 "download"
//             ],
//             labelDescription: "Gate score card for mtechs"
//         }
//     ],
//     permissions: {
//         canShareMoreData: true,
//         canDownloadData: true
//     }
// }

// export default res;



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
        const response = await fetch(`http://localhost:8000/show_terms/?username=${curruser.username}&locker_name=Transcripts&connection_name=Connection 1`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${token}` // Adjust if using a different authentication method
          },
          // body: JSON.stringify({
          //   username: curruser.username,
          //   lockername: "Transcripts",
          //   connection_name: "Connection 1"
          // }
          // )
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
  Cookies.remove('authToken');
  localStorage.removeItem('curruser');
  setUser(null);
  navigate('/');
};

const toggleDropdown = () => {
  setIsOpen(!isOpen);
};

const handleIagreebutton = async () => {

  const token = Cookies.get('authToken');
  const consent = true; 
  const id = 1;
  const data = new FormData();
  data.append('connection_id', id);
  data.append('consent', consent);
};


const renderObligations = () => {
  if (res && res.obligations) {
    return res.obligations.map((obligation, index) => (
      <div key={index}>
        <ul>
          <li>{obligation.typeOfSharing}  {" "}  {obligation.labelName}</li>
        </ul>
        {/* <h4>{obligation.labelName}</h4>
        <p>{obligation.labelDescription}</p>
        <p>Type of Action: {obligation.typeOfAction}</p>
        <p>Type of Sharing: {obligation.typeOfSharing}</p>
        <p>Permissions: {obligation.hostPermissions.join(', ')}</p> */}
      </div>
    ));
  } else {
    return <p>No obligations available.</p>;
  }
};

const renderPermissions = () => {
  if(res && res.permissions){
    const { canShareMoreData, canDownloadData } = res.permissions;
  return (
    <div className="permissions">
      <ul>
      <li>{canShareMoreData && <div>You can share more data.</div>}</li>
      <li>{canDownloadData && <div>You can download data.</div>}</li>
      </ul>
      
    </div>
  );

  }
  return null;
  
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
      </div >
    </nav >

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
        <div className="page13lowerterms">
        {renderObligations()}
        </div>



        <div className="page13headterms">Your Rights </div>
        <div className="page13lowerterms">{renderPermissions()}</div>



        {/* <div className="page13headterms">Your Prohibitions </div>
        <div className="page13lowerterms">1) Can't Unilateraly close the connection</div> */}

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
        <div className="page13consent">consent Given on :&lt;june 20,2024,5:34pm&gt;
          <br />
          Valid Until &lt; March 2028 &gt;
        </div>
        <div className="page13button"> <button className="page13iagree1button" onClick={handleIagreebutton}> Revoke </button></div>

      </div>
    }


  </div >

);
}
