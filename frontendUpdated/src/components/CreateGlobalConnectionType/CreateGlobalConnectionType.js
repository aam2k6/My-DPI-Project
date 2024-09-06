// // import React, { useState, useEffect, useContext } from 'react';
// // import Sidebar from '../Sidebar/Sidebar';
// // import Navbar from '../Navbar/Navbar';
// // import './CreateGlobalConnectionType.css';
// // import { useNavigate } from 'react-router-dom';
// // import Cookies from 'js-cookie';
// // import { usercontext } from "../../usercontext";

// // export default function CreateGlobalConnectionType() {
// //   const [connectionTypes, setConnectionTypes] = useState([]);
// //   const [error, setError] = useState(null);
// //   const navigate = useNavigate();
// //   const { curruser } = useContext(usercontext);

// //   useEffect(() => {
// //     if (!curruser) {
// //       navigate('/');
// //       return;
// //     }

// //     const token = Cookies.get('authToken');

// //     // Fetch global connection types
// //     fetch('localhost:8000/get-template-or-templates/', {
// //       method: 'GET',
// //       headers: {
// //         'Authorization': `Basic ${token}`,
// //         'Content-Type': 'application/json'
// //       }
// //     })
// //       .then(response => response.json())
// //       .then(data => {
// //         if (data.data) {
// //           setConnectionTypes(data.data);
// //         } else {
// //           setError(data.message || data.error);
// //         }
// //       })
// //       .catch(error => {
// //         setError("An error occurred while fetching connection types.");
// //         console.error("Error:", error);
// //       });
// //   }, [curruser, navigate]);

// //   // Navigate to the form for adding a new global connection type
// //   const handleAddNewConnectionType = () => {
// //     navigate('/add-global-connection-type');  
// //   };

// //   // Handle the click event to navigate to the ConnectionTerms page
// //   const handleConnectionTypeClick = (type) => {
// //     navigate('/connection-terms', {
// //       state: {
// //         connectionTypeId: type.id,
// //         connectionTypeName: type.global_connection_type_name
// //       }
// //     });
// //   };

// //   return (
// //     <div className='manage-connection-page'>
// //       <Navbar />
// //       <Sidebar />
// //       <div className='manage-connection-content'>
// //         <h1>SYSTEM ADMIN SETTINGS</h1> 

// //         <h2>Existing Global Connection Types</h2> 
// //         {error && <p className="error">{error}</p>}
// //         {connectionTypes.length > 0 ? (
// //           <ol className='connection-list'>
// //             {connectionTypes.map(type => (
// //               <li 
// //                 key={type.id} 
// //                 className='connection-item'
// //               >
// //                 <span 
// //                   className="connection-link"
// //                   onClick={() => handleConnectionTypeClick(type)}
// //                 >
// //                   {type.global_connection_type_name}
// //                 </span><br />
// //               </li>
// //             ))}
// //           </ol>
// //         ) : (
// //           <p>No global connection types found.</p>
// //         )}
        
// //         {/* Button for adding a new global connection type */}
// //         <div className="add-connection-type-container">
// //           <button className="add-connection-type-button" onClick={handleAddNewConnectionType}>
// //             Add New Global Connection Type
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// // import React, { useState, useEffect, useContext } from 'react';
// // import Sidebar from '../Sidebar/Sidebar';
// // import Navbar from '../Navbar/Navbar';
// // import './CreateGlobalConnectionType.css';
// // import { useNavigate } from 'react-router-dom';
// // import Cookies from 'js-cookie';
// // import { usercontext } from "../../usercontext";

// // export default function CreateGlobalConnectionType() {
// //   const [connectionTypes, setConnectionTypes] = useState([]);
// //   const [termsData, setTermsData] = useState([]);
// //   const [error, setError] = useState(null);
// //   const navigate = useNavigate();
// //   const { curruser } = useContext(usercontext);

// //   useEffect(() => {
// //     if (!curruser) {
// //       navigate('/');
// //       return;
// //     }

// //     const token = Cookies.get('authToken');

// //     // Fetch global connection types
// //     fetch('localhost:8000/get-template-or-templates/', {
// //       method: 'GET',
// //       headers: {
// //         'Authorization': `Basic ${token}`,
// //         'Content-Type': 'application/json'
// //       }
// //     })
// //       .then(response => {
// //         if (!response.ok) {
// //           throw new Error('Failed to fetch connection types');
// //         }
// //         return response.json();
// //       })
// //       .then(data => {
// //         console.log('Connection Types Data:', data); // Debugging log
// //         if (data.data) {
// //           setConnectionTypes(data.data);
// //         } else {
// //           setError('No connection types found.');
// //         }
// //       })
// //       .catch(error => {
// //         setError("An error occurred while fetching connection types.");
// //         console.error("Error fetching connection types:", error);
// //       });

// //     // Fetch connection terms
// //     fetch('localhost:8000/get-connection-terms-for-global-template', {
// //       method: 'GET',
// //       headers: {
// //         'Authorization': `Basic ${token}`,
// //         'Content-Type': 'application/json'
// //       }
// //     })
// //       .then(response => {
// //         if (!response.ok) {
// //           throw new Error('Failed to fetch connection terms');
// //         }
// //         return response.json();
// //       })
// //       .then(data => {
// //         console.log('Connection Terms Data:', data); // Debugging log
// //         if (data.data) {
// //           setTermsData(data.data); // Assuming data.data holds the terms array
// //         } else {
// //           setError('No terms data found.');
// //         }
// //       })
// //       .catch(error => {
// //         console.error("Error fetching terms data:", error);
// //         setError("An error occurred while fetching terms data.");
// //       });

// //   }, [curruser, navigate]);

// //   const handleAddNewConnectionType = () => {
// //     navigate('/ConnectionTermsGlobal');
// //   };

// //   const handleConnectionTypeClick = (type) => {
// //     if (termsData && termsData.length > 0) {
// //       const selectedTerms = termsData.filter(term => term.global_conn_type === type.id);
// //       console.log('Selected Terms:', selectedTerms); // Debugging log

// //       navigate('/ConnectionTermsGlobal', {
// //         state: {
// //           connectionTypeName: type.global_connection_type_name,
// //           connectionTypeDescription: type.global_connection_type_description,
// //           existingTerms: selectedTerms,
// //         }
// //       });
// //     } else {
// //       setError("No terms data available.");
// //     }
// //   };

// //   return (
// //     <div className='manage-connection-page'>
// //       <Navbar />
// //       <Sidebar />
// //       <div className='manage-connection-content'>
// //         <h1>SYSTEM ADMIN SETTINGS</h1> 

// //         <h2>Existing Global Connection Types</h2> 
// //         {error && <p className="error">{error}</p>}
// //         {connectionTypes.length > 0 ? (
// //           <ol className='connection-list'>
// //             {connectionTypes.map(type => (
// //               <li 
// //                 key={type.id} 
// //                 className='connection-item'
// //               >
// //                 <span 
// //                   className="connection-link"
// //                   onClick={() => handleConnectionTypeClick(type)}
// //                 >
// //                   {type.global_connection_type_name}
// //                 </span><br />
// //               </li>
// //             ))}
// //           </ol>
// //         ) : (
// //           <p>No global connection types found.</p>
// //         )}
        
// //         {/* Button for adding a new global connection type */}
// //         <div className="add-connection-type-container">
// //           <button className="add-connection-type-button" onClick={handleAddNewConnectionType}>
// //             Add New Global Connection Type
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


// import React, { useState, useEffect, useContext } from 'react';
// import Sidebar from '../Sidebar/Sidebar';
// import Navbar from '../Navbar/Navbar';
// import './CreateGlobalConnectionType.css';
// import { useNavigate } from 'react-router-dom';
// import Cookies from 'js-cookie';
// import { usercontext } from "../../usercontext";

// export default function CreateGlobalConnectionType() {
//   const [connectionTypes, setConnectionTypes] = useState([]);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
//   const { curruser } = useContext(usercontext);

//   useEffect(() => {
//     if (!curruser) {
//       navigate('/');
//       return;
//     }

//     const token = Cookies.get('authToken');

//     // Fetch global connection types
//     fetch('localhost:8000/get-template-or-templates/', {
//       method: 'GET',
//       headers: {
//         'Authorization': `Basic ${token}`,
//         'Content-Type': 'application/json'
//       }
//     })
//       .then(response => {
//         if (!response.ok) {
//           throw new Error('Failed to fetch connection types');
//         }
//         return response.json();
//       })
//       .then(data => {
//         console.log('Connection Types Data:', data);
//         if (data.data) {
//           setConnectionTypes(data.data);
//         } else {
//           setError('No connection types found.');
//         }
//       })
//       .catch(error => {
//         setError("An error occurred while fetching connection types.");
//         console.error("Error fetching connection types:", error);
//       });
//   }, [curruser, navigate]);

//   const handleAddNewConnectionType = () => {
//     navigate('/ConnectionTermsGlobal');
//   };

//   // const handleConnectionTypeClick = (type) => {
//   //   console.log("Selected Connection Type:", type); // Debugging log

//   //   const token = Cookies.get('authToken');

//   //   fetch(`localhost:8000/get-connection-terms-for-global-template/?template_Id=${type.global_connection_type_template_id}`, {
//   //     method: 'GET',
//   //     headers: {
//   //       'Authorization': `Basic ${token}`,
//   //       'Content-Type': 'application/json'
//   //     }
//   //   })
//   //     .then(response => {
//   //       if (!response.ok) {
//   //         throw new Error('Failed to fetch connection terms');
//   //       }
//   //       return response.json();
//   //     })
//   //     .then(data => {
//   //       if (data.data) {
//   //         navigate('/ConnectionTermsGlobal', {
//   //           state: {
//   //             connectionTypeName: type.global_connection_type_name,
//   //             connectionTypeDescription: type.global_connection_type_description,
//   //             existingTerms: data.data,
//   //           }
//   //         });
//   //       } else {
//   //         setError('No terms data found.');
//   //       }
//   //     })
//   //     .catch(error => {
//   //       console.error("Error fetching terms data:", error);
//   //       setError("An error occurred while fetching terms data.");
//   //     });
//   // };

//   const token = Cookies.get('authToken');
//   const handleConnectionTypeClick = (type) => {
//     const template_Id = type.global_connection_type_template_id;
//     console.log("Selected Connection Type:", type); // Debugging log
//     const token = Cookies.get('authToken');

  
//     fetch(`localhost:8000/get-connection-terms-for-global-template/?template_Id=${template_Id}`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Basic ${token}`,
//         'Content-Type': 'application/json'
//       }
//     })
//       .then(response => {
//         if (!response.ok) {
//           throw new Error('Failed to fetch connection terms');
//         }
//         return response.json();
//       })
//       .then(data => {
//         console.log('Connection Terms Data:', data); // Debugging log
//         if (data.data) {
//           const selectedTerms = data.data.filter(term => term.global_conn_type === template_Id);
//           console.log("type: selectedTerms", selectedTerms);
//           navigate('/ConnectionTermsGlobal', {
//             state: {
//               connectionTypeName: type.global_connection_type_name,
//               connectionTypeDescription: type.global_connection_type_description,
//               existingTerms: selectedTerms,
//             }
//           });
//         } else {
//           setError('No terms data found.');
//         }
//       })
//       .catch(error => {
//         console.error("Error fetching terms data:", error);
//         setError("An error occurred while fetching terms data.");
//       });
//   };
  

//   return (
//     <div className='manage-connection-page'>
//       <Navbar />
//       <Sidebar />
//       <div className='manage-connection-content'>
//         <h1>SYSTEM ADMIN SETTINGS</h1> 

//         <h2>Existing Global Connection Types</h2> 
//         {error && <p className="error">{error}</p>}
//         {connectionTypes.length > 0 ? (
//           <ol className='connection-list'>
//             {connectionTypes.map(type => (
//               <li 
//                 key={type.global_connection_type_template_id} 
//                 className='connection-item'
//               >
//                 <span 
//                   className="connection-link"
//                   onClick={() => handleConnectionTypeClick(type)}
//                 >
//                   {type.global_connection_type_name}
//                 </span><br />
//               </li>
//             ))}
//           </ol>
//         ) : (
//           <p>No global connection types found.</p>
//         )}
        
//         <div className="add-connection-type-container">
//           <button className="add-connection-type-button" onClick={handleAddNewConnectionType}>
//             Add New Global Connection Type
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './CreateGlobalConnectionType.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import { frontend_host } from '../../config';

export default function CreateGlobalConnectionType() {
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { curruser } = useContext(usercontext);

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

    const token = Cookies.get('authToken');

    fetch('host/get-template-or-templates/'.replace(/host/g, frontend_host), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch connection types');
        }
        return response.json();
      })
      .then(data => {
        if (data.data) {
          setConnectionTypes(data.data);
        } else {
          setError('No connection types found.');
        }
      })
      .catch(error => {
        setError("An error occurred while fetching connection types.");
        console.error("Error fetching connection types:", error);
      });
  }, [curruser, navigate]);

  const handleAddNewConnectionType = () => {
    navigate('/ConnectionTermsGlobal');
  };

  const handleConnectionTypeClick = (type) => {
    const template_Id = type.global_connection_type_template_id; // Make sure this is not undefined or null
    console.log("Selected Connection Type:", type); // Debugging log
    console.log("template_Id:", template_Id); // Debugging log to check template_Id
    
    if (!template_Id) {
        setError("Template ID is missing or invalid.");
        return;
    }

    const token = Cookies.get('authToken');
  
    fetch(`host/get-connection-terms-for-global-template/?template_Id=${template_Id}`.replace(/host/g, frontend_host), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch connection terms. Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Connection Terms Data:', data); // Debugging log
        if (data.data) {
          navigate('/ConnectionTermsGlobal', {
            state: {
              connectionTypeName: type.global_connection_type_name,
              connectionTypeDescription: type.global_connection_type_description,
              existingTerms: data.data,
            }
          });
        } else {
          setError('No terms data found.');
        }
      })
    .catch(error => {
        console.error("Error fetching terms data:", error);
        setError("An error occurred while fetching terms data.");
    });
};

  return (
    <div className='manage-connection-page'>
      <Navbar />
      <Sidebar />
      <div className='manage-connection-content'>
        <h1>SYSTEM ADMIN SETTINGS</h1> 

        <h2>Existing Global Connection Types</h2> 
        {error && <p className="error">{error}</p>}
        {connectionTypes.length > 0 ? (
          <ol className='connection-list'>
            {connectionTypes.map(type => (
              <li 
                key={type.global_connection_type_template_id} 
                className='connection-item'
              >
                <span 
                  className="connection-link"
                  onClick={() => handleConnectionTypeClick(type)}
                >
                  {type.global_connection_type_name}
                </span><br />
              </li>
            ))}
          </ol>
        ) : (
          <p>No global connection types found.</p>
        )}
        
        <div className="add-connection-type-container">
          <button className="add-connection-type-button" onClick={handleAddNewConnectionType}>
            Add New Global Connection Type
          </button>
        </div>
      </div>
    </div>
  );
}
