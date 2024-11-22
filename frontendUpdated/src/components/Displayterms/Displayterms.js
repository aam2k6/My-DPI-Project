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
import { Grid } from "@mui/material"

export const Displayterms = () => {

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [res, setRes] = useState(null);
  const [globalTemplates, setGlobalTemplates] = useState([]);
  const [terms, setTerms] = useState([]);
  const [activeTab, setActiveTab] = useState("guest");
  
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

    const fetchGlobalTemplates = () => {
      const token = Cookies.get("authToken");
      fetch("host/get-template-or-templates/".replace(/host/, frontend_host), {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          // console.log("Fetched Templates:", data); // Log the fetched data
          setGlobalTemplates(data.data); // Store fetched templates
          // console.log("global data", data.data);
        })
        .catch((error) => {
          console.error("Error fetching templates:", error);
          setError("Failed to fetch templates");
        });
    };


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
          setTerms(data.data.obligations);
          console.log(data.data);
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchTerms();
    fetchGlobalTemplates();
  }, [curruser, connectionTypeName, hostUserUsername, hostLockerName, locker.name, navigate]);

  const renderTermsSection = (terms, title, userType) => (
    <div className="termsSection">
      <h3>{title}</h3>
      {terms && terms.length > 0 ? (
        <ul>
          {terms.map((term, index) => (
            <li key={index}>
              <strong>
          {userType === "guest"
            ? term.typeOfSharing === "collateral"
              ? `Guest shall provide ${term.labelName} as ${term.typeOfSharing} - ${term.labelDescription}`
              : `Guest shall ${term.typeOfSharing} ${term.labelName} - ${term.labelDescription}`
            : term.typeOfSharing === "collateral"
            ? `Host will provide ${term.labelName} as ${term.typeOfSharing} - ${term.labelDescription}`
            : `Host will ${term.typeOfSharing} ${term.labelName} - ${term.labelDescription}`}
        </strong>
        (Host Privilege: {term.hostPermissions && term.hostPermissions.length > 0 
          ? term.hostPermissions.join(", ") 
          : "None"})
      </li>
          ))}
        </ul>
      ) : (
        <p>No terms available.</p>
      )}
    </div>
  );
  
  
const renderObligations = (userType) => {
  if (res && res.obligations) {
    return userType === "guest"
      ? renderTermsSection(res.obligations.guest_to_host, "", "guest")
      : renderTermsSection(res.obligations.host_to_guest, "", "host");
  }
  return <p>No obligations available.</p>;
};

const renderPermissions = (userType) => {
  if (res && res.permissions) {
    const permissionsData = userType === "guest"
      ? res.permissions.guest_to_host
      : res.permissions.host_to_guest;
    return (
      <div className="permissions">
        <ul>
          <li>
            {userType === "guest"
              ? `Guest ${permissionsData.canShareMoreData ? "Can" : "Cannot"} share more data`
              : `Host ${permissionsData.canShareMoreData ? "Can" : "Cannot"} share more data`}
          </li>
          <li>
            {userType === "guest"
              ? `Guest ${permissionsData.canDownloadData ? "Can" : "Cannot"} download data`
              : `Host ${permissionsData.canDownloadData ? "Can" : "Cannot"} download data`}
          </li>
        </ul>
      </div>
    );
  }
  return <p>No permissions available.</p>;
};

const renderForbidden = (userType) => {
  if (res && res.forbidden) {
    return (
      <div className="termsSection">
        {res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"] &&
        res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"].length > 0 ? (
          <ul>
            {res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"].map(
              (term, index) => (
                <li key={index}>
                  <strong>
                    {userType === "guest"
                      ? `Guest  ${term.labelName} - ${term.labelDescription}`
                      : `Host  ${term.labelName} - ${term.labelDescription}`}
                  </strong>
                  (Host Privilege:{" "}
                  {term.hostPermissions && term.hostPermissions.length > 0
                    ? term.hostPermissions.join(", ")
                    : "None"})
                </li>
              )
            )}
          </ul>
        ) : (
          <p>No forbidden terms available.</p>
        )}
      </div>
    );
  }
  return <p>No forbidden terms available.</p>;
};


console.log(res);




const uniqueGlobalConnTypeIds = Array.isArray(terms)
    ? [...new Set(terms
      .filter(term => term.global_conn_type_id !== null)
      .map(term => term.global_conn_type_id)
    )]
    : [];


  const globalTemplateNames = uniqueGlobalConnTypeIds.map(id => {
    const template = globalTemplates.find(template => template.global_connection_type_template_id === id);
    return template ? template : null;
  });

  const handleNavigation = (template) => {
    if (template) {
      console.log(template);
      navigate('/GlobalTermsView', {
        state: {
          connectionTypeName: template.global_connection_type_name,
          connectionTypeDescription: template.global_connection_type_description,
          template_Id: template.global_connection_type_template_id,
          hide: true,
        },
      });
    }
  };
  

  const content = (
    <>
      <div className="navbarBrands">{curruser ? capitalizeFirstLetter(curruser.username): "None"}</div>
      <div>
        {curruser ? curruser.description : "None"}
      </div>
    </>
  );

  console.log(res, "res");
  return (
    <div>
      <Navbar content={content} />
      <div className="connection-details1" style={{marginTop:"120px"}}>
        <div className="connectionName1">Connection Type Name: {connectionTypeName}</div>
        <div className="connectionName2">
          {globalTemplateNames.length > 0 && "Connection has been imported from "}
          <span style={{ fontWeight: "bold" }}>
            {globalTemplateNames.filter(Boolean).map((template, index) => (
              <span key={index}>
                <span 
                  style={{ cursor: 'pointer', textDecoration  : 'underline' }}
                  onClick={() => handleNavigation(template)}
                >
                  {template.global_connection_type_name}
                </span>
                {index < globalTemplateNames.filter(Boolean).length - 1 && ", "}
              </span>
            ))}
          </span>
        </div>       
       <div className="dates">
        <div style={{fontSize:"18px", width:"65%"}}>
          {connectionDescription}
        </div>
        <br></br>Created on: {new Date(createdtime).toLocaleString()}
        <br></br>Valid until: {new Date(validitytime).toLocaleString()}
       </div>
      </div>


      <div className="show-connection">
      <Grid container className="view-container">
      <Grid item xs={12}  className="b">
        <div className="tabs">
          <div
            className={`tab-header ${activeTab === "guest" ? "active" : ""}`}
            onClick={() => setActiveTab("guest")}
          >
            Guest Data
          </div>
          <div
            className={`tab-header ${activeTab === "host" ? "active" : ""}`}
            onClick={() => setActiveTab("host")}
          >
            Host Data
          </div>
        </div>
        <div className="tab-content">
          <div className="table-container">
            {activeTab === "guest" && (
              <div>
                <div className="page13headterms">Your Obligations</div>
                <div className="page13lowerterms">{renderObligations("guest")}</div>
                <div className="page13headterms">Your Permissions</div>
                <div className="page13lowerterms">{renderPermissions("guest")}</div>
                <div className="page13headterms">Your Forbidden Terms</div>
                <div className="page13lowerterms">{renderForbidden("guest")}</div>
                <div className="page13headterms">Default Host Privileges</div>
                By default Reshare,Download,Aggreagte are disabled unless otherwise mentioned in the terms
              </div>
            )}
            {activeTab === "host" && (
              <div>
                <div className="page13headterms">Host Obligations</div>
                <div className="page13lowerterms">{renderObligations("host")}</div>
                <div className="page13headterms">Host Permissions</div>
                <div className="page13lowerterms">{renderPermissions("host")}</div>
                <div className="page13headterms">Host Forbidden Terms</div>
                <div className="page13lowerterms">{renderForbidden("host")}</div>
                <div className="page13headterms">Default Host Privileges</div>
                By default Reshare,Download,Aggreagte are disabled unless otherwise mentioned in the terms
              </div>
            )}
          </div>
        </div>
      </Grid>
      </Grid>
      </div>

     
    </div>
  );
};
