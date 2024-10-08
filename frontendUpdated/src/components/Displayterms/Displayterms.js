// import "./Displayterms.css";
// import React, { useContext, useEffect, useState } from "react";
// import Cookies from "js-cookie";
// import { useNavigate, useLocation } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";

// export const Displayterms = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser } = useContext(usercontext);
//   const [error, setError] = useState(null);
//   const [res, setRes] = useState(null);
//   const {
//     connectionName,
//     hostLockerName,
//     connectionTypeName,
//     connectionDescription,
//     createdtime,
//     validitytime,
//     hostUserUsername,
//     locker,
//   } = location.state || {};
//   console.log("Location State:", location.state);


//   console.log(
//     connectionName,
//     hostLockerName,
//     connectionTypeName,
//     hostUserUsername,
//     locker
//   );

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }

//     const fetchTerms = async () => {
//       console.log("Inside fetch terms");
//       try {
//         const token = Cookies.get("authToken");

//         let apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${curruser.username}&host_locker_name=${locker.name}`;
//         console.log("Final API URL:", apiUrl);

//         const response = await fetch(apiUrl, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Basic ${token}`,
//           },
//         });

//         if (!response.ok) {
//           throw new Error("Failed to fetch terms");
//         }

//         const data = await response.json();

//         if (data.success) {
//           setRes(data.data.terms);
//           console.log(data.data.terms);
//         } else {
//           setError(data.error || "No terms found");
//         }
//       } catch (err) {
//         setError(err.message);
//       }
//     };

//     fetchTerms();
//   }, [curruser, connectionTypeName, hostUserUsername, hostLockerName, locker.name, navigate]);

//   // Render Obligations
//   const renderObligations = () => {
//     if (res) {
//       return (
//         <div>
          
//           <ul>
//             {res.map((term, index) => (
//               <li key={index}>
//                 {term.sharing_type} - {term.data_element_name}
//               </li>
//             ))}
//           </ul>
//         </div>
//       );
//     }
//     return <p>No obligations available.</p>;
//   };

//   // Render Permissions
//   const renderPermissions = () => {
//     if (res && res.permissions) {
//         const { canShareMoreData, canDownloadData } = res.permissions;
//         return (
//             <div className="permissions">
//                 <h3>Permissive</h3>
//                 <ul>
//                     {canShareMoreData && <li>You can share more data.</li>}
//                     {canDownloadData && <li>You can download data.</li>}
//                 </ul>
//             </div>
//         );
//     }
//     return null;
// };

//   const content = (
//     <>
//       <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
//       <div className="description">
//         {curruser ? curruser.description : "None"}
//       </div>
    
//     </>
//   );

//   return (
//     <div>
//       <Navbar content={content} />
//       <div className="connection-details1">
//         <h4>Connection Type Name: {connectionTypeName}</h4>
//         {connectionDescription}
//         <br></br>Created on:{new Date(createdtime).toLocaleString()}
//         <br></br>Valid until: {new Date(validitytime).toLocaleString()}
//       </div>
//       <div className="page13container">
//         <p>
//           <u>Terms of connection</u>
//         </p>

//         <div className="page13subparent">
//           <div className="page13headterms">Your Obligations</div>
//           <div className="page13lowerterms">{renderObligations()}</div>

//           <div className="page13headterms">Your Rights</div>
//           <div className="page13lowerterms">{renderPermissions()}</div>
//         </div>
//       </div>
//     </div>
//   );
// };
import "./Displayterms.css";
import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";

export const Displayterms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [res, setRes] = useState(null);
  const {
    connectionName,
    hostLockerName,
    connectionTypeName,
    connectionDescription,
    createdtime,
    validitytime,
    hostUserUsername,
    locker,
  } = location.state || {};
  console.log("Location State:", location.state);

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }

    const fetchTerms = async () => {
      console.log("Inside fetch terms");
      try {
        const token = Cookies.get("authToken");

        let apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${curruser.username}&host_locker_name=${locker.name}`;
        console.log("Final API URL:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch terms");
        }

        const data = await response.json();

        if (data.success) {
          setRes(data.data);
          console.log(data.data);
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchTerms();
  }, [curruser, connectionTypeName, hostUserUsername, hostLockerName, locker.name, navigate]);

  // Render Obligations
  const renderObligations = () => {
    if (res && res.obligations) {
      return (
        <div>
          <ul>
            {res.obligations.map((term, index) => (
              <li key={index}>
      {term.typeOfSharing} - {term.labelName} (Host Privilege: {term.hostPermissions && term.hostPermissions.length > 0 ? term.hostPermissions.join(", ") : "None"})
      </li>
            ))}
          </ul>
        </div>
      );
    }
    return <p>No obligations available.</p>;
  };

  // Render Permissions
  const renderPermissions = () => {
    if (res && res.permissions) {
        const { canShareMoreData, canDownloadData } = res.permissions;
        return (
            <div className="permissions">
                {/* <h3>Permissive</h3> */}
                <ul>
                    {canShareMoreData ? <li>You can share more data.</li> : <li>You cannot share more data.</li>}
                    {canDownloadData ? <li>You can download data.</li> : <li>You cannot download data.</li>}
                </ul>
            </div>
        );
    }
    return <p>No permissions available.</p>;
  };
  const renderForbidden = () => {
    if (res && res.forbidden) {
      return (
        <ul>
          {res.forbidden.map((term, index) => (
            <li key={index}>
              {term.labelDescription}
            </li>
          ))}
        </ul>
      );
    }
    return <p>No forbidden terms available.</p>;
  };

  const content = (
    <>
      <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
      <div className="description">
        {curruser ? curruser.description : "None"}
      </div>
    </>
  );

  console.log(res, "res");
  return (
    <div>
      <Navbar content={content} />
      <div className="connection-details1">
        <h4>Connection Type Name: {connectionTypeName}</h4>
        {connectionDescription}
        <br></br>Created on: {new Date(createdtime).toLocaleString()}
        <br></br>Valid until: {new Date(validitytime).toLocaleString()}
      </div>
      <div className="page13container">
        <p>
          <u>Terms of connection</u>
        </p>

        <div className="page13subparent">
          <div className="page13headterms">Your Obligations</div>
          <div className="page13lowerterms">{renderObligations()}</div>

          <div className="page13headterms">Your Permissions</div>
          <div className="page13lowerterms">{renderPermissions()}</div>

          <div className="page13headterms">Your Prohibitions</div>
          <div className="page13lowerterms">{renderForbidden()}</div>

          <div className="page13headterms">Default Host Privileges</div>
          By default Reshare,Download,Aggreagte are disabled unless otherwise mentioned in the terms

        </div>
      </div>
    </div>
  );
};
