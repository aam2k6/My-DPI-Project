// import React, { useEffect, useState, useContext } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import Cookies from "js-cookie";
// import Navbar from "../Navbar/Navbar";
// import Sidebar from "../Sidebar/Sidebar";
// import { usercontext } from "../../usercontext";
// import { frontend_host } from "../../config";
// import './GlobalTermsView.css'; // Make sure to create the relevant CSS file

// const GlobalTermsView = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser } = useContext(usercontext);
//   const [termsData, setTermsData] = useState(null);
//   const [error, setError] = useState(null);

//   const { connectionTypeName, connectionTypeDescription, template_Id } = location.state || {};

//   useEffect(() => {
//     if (!curruser) {
//       navigate('/');
//       return;
//     }

//     const fetchGlobalTerms = async () => {
//       try {
//         const token = Cookies.get("authToken");
//         const apiUrl = `${frontend_host}/get-connection-terms-for-global-template/?template_Id=${template_Id}`;

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

//         if (data.data) {
//           setTermsData(data.data);
//         } else {
//           setError("No terms found for this global connection type.");
//         }
//       } catch (err) {
//         setError(err.message);
//       }
//     };

//     fetchGlobalTerms();
//   }, [curruser, template_Id, navigate]);

//   const renderObligations = () => {
//     if (termsData && termsData.obligations) {
//       return (
//         <ul>
//           {termsData.obligations.map((term, index) => (
//             <li key={index}>
//               {term.typeOfSharing} - {term.labelName} (Host Privilege: {term.hostPermissions?.length > 0 ? term.hostPermissions.join(", ") : "None"})
//             </li>
//           ))}
//         </ul>
//       );
//     }
//     return <p>No obligations available.</p>;
//   };

//   const renderPermissions = () => {
//     if (termsData && termsData.permissions) {
//       const { canShareMoreData, canDownloadData } = termsData.permissions;
//       return (
//         <ul>
//           {canShareMoreData ? <li>You can share more data.</li> : <li>You cannot share more data.</li>}
//           {canDownloadData ? <li>You can download data.</li> : <li>You cannot download data.</li>}
//         </ul>
//       );
//     }
//     return <p>No permissions available.</p>;
//   };

//   const renderForbidden = () => {
//     if (termsData && termsData.forbidden) {
//       return (
//         <ul>
//           {termsData.forbidden.map((term, index) => (
//             <li key={index}>
//               {term.labelDescription}
//             </li>
//           ))}
//         </ul>
//       );
//     }
//     return <p>No forbidden terms available.</p>;
//   };
//   const content = (
//     <>
//       <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
//       <div className="description">
//         {curruser ? curruser.description : "None"}
//       </div>
//     </>
//   );

//   return (
//     <div className="global-connection-terms-page">
//       <Navbar />
//       <Sidebar />
//       <div className="terms-content-container">
//         <h2>Global Connection Terms for {connectionTypeName}</h2>
//         <p>{connectionTypeDescription}</p>
//         {error && <p className="error">{error}</p>}

//         {termsData ? (
//           <div className="terms-sections">
//             <div className="terms-section">
//               <h3>Your Obligations</h3>
//               {renderObligations()}
//             </div>
//             <div className="terms-section">
//               <h3>Your Permissions</h3>
//               {renderPermissions()}
//             </div>
//             <div className="terms-section">
//               <h3>Your Prohibitions</h3>
//               {renderForbidden()}
//             </div>
//             <div className="terms-section">
//               <h3>Default Host Privileges</h3>
//               <p>By default, Reshare, Download, and Aggregate are disabled unless otherwise mentioned in the terms.</p>
//             </div>
//           </div>
//         ) : (
//           <p>Loading terms...</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GlobalTermsView;
import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { usercontext } from "../../usercontext";
import { frontend_host } from "../../config";
import './GlobalTermsView.css'; // Make sure to create the relevant CSS file

const GlobalTermsView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [termsData, setTermsData] = useState(null);
  const [error, setError] = useState(null);

  const { connectionTypeName, connectionTypeDescription, template_Id } = location.state || {};

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

    const fetchGlobalTerms = async () => {
      try {
        const token = Cookies.get("authToken");
        const apiUrl = `${frontend_host}/get-connection-terms-for-global-template/?template_Id=${template_Id}`;

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

        if (data.data) {
          setTermsData(data.data);
        } else {
          setError("No terms found for this global connection type.");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchGlobalTerms();
  }, [curruser, template_Id, navigate]);

  const renderObligations = () => {
    if (termsData && termsData.obligations) {
      return (
        <ul>
          {termsData.obligations.map((term, index) => (
            <li key={index}>
              {term.typeOfSharing} - {term.labelName} (Host Privilege: {term.hostPermissions?.length > 0 ? term.hostPermissions.join(", ") : "None"})
            </li>
          ))}
        </ul>
      );
    }
    return <p>No obligations available.</p>;
  };

  const renderPermissions = () => {
    if (termsData && termsData.permissions) {
      const { canShareMoreData, canDownloadData } = termsData.permissions;
      return (
        <ul>
          {canShareMoreData ? <li>You can share more data.</li> : <li>You cannot share more data.</li>}
          {canDownloadData ? <li>You can download data.</li> : <li>You cannot download data.</li>}
        </ul>
      );
    }
    return <p>No permissions available.</p>;
  };

  const renderForbidden = () => {
    if (termsData && termsData.forbidden) {
      return (
        <ul>
          {termsData.forbidden.map((term, index) => (
            <li key={index}>
              {term.labelDescription}
            </li>
          ))}
        </ul>
      );
    }
    return <p>No forbidden terms available.</p>;
  };
  const handleEditClick = () => {
    navigate('/ConnectionTermsGlobal', {
      state: {
        connectionTypeName: connectionTypeName,
        connectionTypeDescription: connectionTypeDescription,
        existingTerms: termsData,
      },
    });
  };
  return (
    <div className="global-terms-view-page">
    <Navbar />
    <Sidebar />
    <div className="terms-content-container">
      <div className="header-with-button">
        <h2>Global Connection Terms - {connectionTypeName}</h2>
        <button className="edit-button" onClick={handleEditClick}>Edit</button>
      </div>

        <p>{connectionTypeDescription}</p>

        {error && <p className="error">{error}</p>}

        {termsData ? (
          <div className="terms-sections">
            <div className="terms-section">
              <h3>Obligations</h3>
              {renderObligations()}
              <h3>Permissions</h3>
              {renderPermissions()}
              <h3>Prohibitions</h3>
              {renderForbidden()}
            
              <h3>Default Host Privileges</h3>
              <p>By default, Reshare, Download, and Aggregate are disabled unless otherwise mentioned in the terms.</p>
            </div>
          </div>
        ) : (
          <p>Loading terms...</p>
        )}
      </div>
    </div>
  );
};

export default GlobalTermsView;
