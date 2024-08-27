// // import React, { useContext, useEffect, useState } from "react";
// // import { useNavigate, useLocation } from "react-router-dom";
// // import { usercontext } from "../../usercontext";
// // import Cookies from 'js-cookie';
// // import "./ViewTermsByType.css";
// // import Navbar from "../Navbar/Navbar";

// // export const ViewTermsByType = () => {
// //     const navigate = useNavigate();
// //     const location = useLocation();
// //     const { curruser, setUser } = useContext(usercontext);
// //     const [showResources, setShowResources] = useState(false);
// //     const [selectedLocker, setSelectedLocker] = useState(null);
// //     const [error, setError] = useState(null);
// //     const [res, setRes] = useState(null);
// //     const [resources, setResources] = useState([]);
// //     const [termValues, setTermValues] = useState({});
// //     const [selectedResources, setSelectedResources] = useState({});
// //     const [currentLabelName, setCurrentLabelName] = useState(null);

// //     const { connectionName, hostLockerName, guestLockerName, hostUserUsername, guestUserUsername, locker } = location.state || {};

// //     console.log(guestLockerName);

// //     useEffect(() => {
// //         if (!curruser) {
// //             navigate('/');
// //             return;
// //         }

// //         const fetchTerms = async () => {
// //             console.log("Inside fetch terms");
// //             try {
// //                 const token = Cookies.get('authToken');
// //                 const response = await fetch(`http://localhost:8000/show_terms/?username=${guestUserUsername}&locker_name=${guestLockerName}&connection_name=${connectionName}`, {
// //                     method: 'GET',
// //                     headers: {
// //                         'Content-Type': 'application/json',
// //                         'Authorization': `Basic ${token}`
// //                     },
// //                 });
// //                 if (!response.ok) {
// //                     throw new Error('Failed to fetch terms');
// //                 }
// //                 const data = await response.json();
// //                 if (data.success) {
// //                     setRes(data.terms);
// //                     console.log(data.terms);
// //                 } else {
// //                     setError(data.error || 'No terms found');
// //                 }
// //             } catch (err) {
// //                 setError(err.message);
// //             }
// //         };

// //         fetchTerms();
// //     }, []);

// //     const handleInputChange = (labelName, value) => {
// //         setTermValues(prev => ({
// //             ...prev,
// //             [labelName]: value
// //         }));
// //     };

// //     const renderInputField = (obligation) => {
// //         switch (obligation.typeOfAction) {
// //             case 'text':
// //                 return (
// //                     <input
// //                         type="text"
// //                         placeholder="Enter value"
// //                         value={termValues[obligation.labelName] || ""}
// //                         onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
// //                     />
// //                 );
// //             case 'file':
// //                 return (
// //                     <button onClick={() => handleButtonClick(obligation.labelName)}>
// //                         {selectedResources[obligation.labelName]?.document_name || "Upload File"}
// //                     </button>
// //                 );
// //             case 'date':
// //                 return (
// //                     <input
// //                         type="date"
// //                         value={termValues[obligation.labelName] || ""}
// //                         onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
// //                     />
// //                 );
// //             default:
// //                 return null;
// //         }
// //     };

// //     const handleButtonClick = (labelName) => {
// //         setSelectedLocker(guestLockerName);
// //         setShowResources(true);
// //         setCurrentLabelName(labelName);
// //     };

// //     const handleResourceSelection = (resource) => {
// //         setSelectedResources(prev => ({
// //             ...prev,
// //             [currentLabelName]: resource
// //         }));
// //         setShowResources(false);
// //     };

// //     useEffect(() => {
// //         if (selectedLocker) {
// //             const fetchResources = async () => {
// //                 try {
// //                     const token = Cookies.get('authToken');
// //                     const response = await fetch(`http://localhost:8000/get-resources-user-locker/?locker_name=${selectedLocker}`, {
// //                         method: 'GET',
// //                         headers: {
// //                             'Authorization': `Basic ${token}`,
// //                             'Content-Type': 'application/json'
// //                         }
// //                     });
// //                     if (!response.ok) {
// //                         throw new Error('Failed to fetch resources');
// //                     }
// //                     const data = await response.json();
// //                     if (data.success) {
// //                         setResources(data.resources);
// //                     } else {
// //                         setError(data.message || 'Failed to fetch resources');
// //                     }
// //                 } catch (error) {
// //                     console.error('Error fetching resources:', error);
// //                     setError('An error occurred while fetching resources');
// //                 }
// //             };
// //             fetchResources();
// //         }
// //     }, [selectedLocker]);

// //     const handleSubmit = async () => {
// //         const resourcesData = {
// //             Transfer: [
// //                 ...resources.map(resource => resource.document_name),
// //                 ...Object.values(termValues).filter(value => value.includes("documents/"))
// //             ]
// //         };

// //         const payload = {
// //             connection_name: connectionName,
// //             host_locker_name: hostLockerName,
// //             guest_locker_name: guestLockerName,
// //             host_user_username: hostUserUsername,
// //             guest_user_username: guestUserUsername,
// //             terms_value: {
// //                 ...Object.fromEntries(
// //                     Object.entries(termValues).map(([key, value]) => [key, `${value}; F`])
// //                 ),
// //                 ...Object.fromEntries(
// //                     Object.entries(selectedResources).map(([key, resource]) => [key, `${resource.document_name}; F`])
// //                 ),
// //             },
// //             resources: resourcesData
// //         };

// //         try {
// //             const token = Cookies.get('authToken');
// //             const response = await fetch(`http://localhost:8000/update-connection-terms/`, {
// //                 method: 'PATCH',
// //                 headers: {
// //                     'Content-Type': 'application/json',
// //                     'Authorization': `Basic ${token}`
// //                 },
// //                 body: JSON.stringify(payload)
// //             });

// //             if (!response.ok) {
// //                 throw new Error('Failed to update terms');
// //             }

// //             const data = await response.json();
// //             if (data.success) {
// //                 console.log('Terms successfully updated');
// //                 navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
// //             } else {
// //                 setError(data.error || 'Failed to update terms');
// //             }
// //         } catch (err) {
// //             setError(err.message);
// //         }
// //     };

// //     const content = (
// //         <>
// //         <div className="navbarBrand">{curruser ? curruser.username : 'None'}</div>
// //         <div className="description">{curruser ? curruser.description : 'None'}</div>
// //         </>
// //     );
// //     return (
// //         <div>
// //         <Navbar content = {content}/>

// //             <div className={showResources ? "split-view" : ""}>
// //                 <div className="table-container">
// //                     <table>
// //                         <thead>
// //                             <tr>
// //                                 <th>Sno</th>
// //                                 <th>Name</th>
// //                                 <th>Enter value</th>
// //                                 <th>Restrictions</th>
// //                             </tr>
// //                         </thead>

// //                         <tbody>
// //                             {res?.obligations.map((obligation, index) => (
// //                                 <tr key={index}>
// //                                     <td>{index + 1}</td>
// //                                     <td>{obligation.labelName}</td>
// //                                     <td>{renderInputField(obligation)}</td>
// //                                     <td>{obligation.labelDescription}</td>
// //                                 </tr>
// //                             ))}
// //                         </tbody>
// //                     </table>
// //                 </div>
// //                 {showResources && (
// //                     <div className="resource-container">
// //                         <h3>Resources for {selectedLocker}</h3>
// //                         {error && <p className="error">{error}</p>}
// //                         <ul>
// //                             {resources.map((resource, index) => (
// //                                 <li key={index}>
// //                                     <div>
// //                                         <label>
// //                                             <input
// //                                                 type="radio"
// //                                                 name="selectedResource"
// //                                                 value={resource.document_name}
// //                                                 checked={selectedResources[currentLabelName]?.document_name === resource.document_name}
// //                                                 onChange={() => handleResourceSelection(resource)}
// //                                             />
// //                                             {resource.document_name}
// //                                         </label>
// //                                     </div>
// //                                 </li>
// //                             ))}
// //                         </ul>
// //                         <button onClick={() => setShowResources(false)}>Select</button>
// //                     </div>
// //                 )}
// //             </div>

// //             <div>
// //                 <button onClick={handleSubmit}>Submit</button>
// //             </div>
// //         </div>
// //     );
// // };
// import React, { useContext, useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from 'js-cookie';
// import "./ViewTermsByType.css";
// import Navbar from "../Navbar/Navbar";

// export const ViewTermsByType = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { curruser } = useContext(usercontext);
//     const [showResources, setShowResources] = useState(false);
//     const [selectedLocker, setSelectedLocker] = useState(null);
//     const [error, setError] = useState(null);
//     const [res, setRes] = useState(null);
//     const [resources, setResources] = useState([]);
//     const [termValues, setTermValues] = useState(() => JSON.parse(localStorage.getItem('termValues')) || {});
//     const [selectedResources, setSelectedResources] = useState(() => JSON.parse(localStorage.getItem('selectedResources')) || {});
//     const [currentLabelName, setCurrentLabelName] = useState(null);

//     const { connectionName, hostLockerName, guestLockerName, hostUserUsername, guestUserUsername, locker } = location.state || {};

//     useEffect(() => {
//         if (!curruser) {
//             navigate('/');
//             return;
//         }

//         const fetchTerms = async () => {
//             try {
//                 const token = Cookies.get('authToken');
//                 const response = await fetch(`http://localhost:8000/show_terms/?username=${guestUserUsername}&locker_name=${guestLockerName}&connection_name=${connectionName}`, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Basic ${token}`
//                     },
//                 });
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch terms');
//                 }
//                 const data = await response.json();
//                 if (data.success) {
//                     setRes(data.terms);
//                 } else {
//                     setError(data.error || 'No terms found');
//                 }
//             } catch (err) {
//                 setError(err.message);
//             }
//         };

//         fetchTerms();
//     }, [curruser, guestUserUsername, guestLockerName, connectionName, navigate]);

//     const handleInputChange = (labelName, value) => {
//         const updatedTermValues = {
//             ...termValues,
//             [labelName]: value
//         };
//         setTermValues(updatedTermValues);
//         localStorage.setItem('termValues', JSON.stringify(updatedTermValues));
//     };

//     const renderInputField = (obligation) => {
//         switch (obligation.typeOfAction) {
//             case 'text':
//                 return (
//                     <input
//                         type="text"
//                         placeholder="Enter value"
//                         value={termValues[obligation.labelName] || ""}
//                         onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
//                     />
//                 );
//             case 'file':
//                 return (
//                     <button onClick={() => handleButtonClick(obligation.labelName)}>
//                         {selectedResources[obligation.labelName]?.document_name || "Upload File"}
//                     </button>
//                 );
//             case 'date':
//                 return (
//                     <input
//                         type="date"
//                         value={termValues[obligation.labelName] || ""}
//                         onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
//                     />
//                 );
//             default:
//                 return null;
//         }
//     };

//     const handleButtonClick = (labelName) => {
//         setSelectedLocker(guestLockerName);
//         setShowResources(true);
//         setCurrentLabelName(labelName);
//     };

//     const handleResourceSelection = (resource) => {
//         const updatedSelectedResources = {
//             ...selectedResources,
//             [currentLabelName]: resource
//         };
//         setSelectedResources(updatedSelectedResources);
//         localStorage.setItem('selectedResources', JSON.stringify(updatedSelectedResources));
//         setShowResources(false);
//     };

//     useEffect(() => {
//         if (selectedLocker) {
//             const fetchResources = async () => {
//                 try {
//                     const token = Cookies.get('authToken');
//                     const response = await fetch(`http://localhost:8000/get-resources-user-locker/?locker_name=${selectedLocker}`, {
//                         method: 'GET',
//                         headers: {
//                             'Authorization': `Basic ${token}`,
//                             'Content-Type': 'application/json'
//                         }
//                     });
//                     if (!response.ok) {
//                         throw new Error('Failed to fetch resources');
//                     }
//                     const data = await response.json();
//                     if (data.success) {
//                         setResources(data.resources);
//                     } else {
//                         setError(data.message || 'Failed to fetch resources');
//                     }
//                 } catch (error) {
//                     console.error('Error fetching resources:', error);
//                     setError('An error occurred while fetching resources');
//                 }
//             };
//             fetchResources();
//         }
//     }, [selectedLocker]);

//     const handleSubmit = async () => {
//         const resourcesData = {
//             Transfer: [
//                 ...resources.map(resource => resource.document_name),
//                 ...Object.values(termValues).filter(value => value.includes("documents/"))
//             ]
//         };

//         const payload = {
//             connection_name: connectionName,
//             host_locker_name: hostLockerName,
//             guest_locker_name: guestLockerName,
//             host_user_username: hostUserUsername,
//             guest_user_username: guestUserUsername,
//             terms_value: {
//                 ...Object.fromEntries(
//                     Object.entries(termValues).map(([key, value]) => [key, `${value}; F`])
//                 ),
//                 ...Object.fromEntries(
//                     Object.entries(selectedResources).map(([key, resource]) => [key, `${resource.document_name}; F`])
//                 ),
//             },
//             resources: resourcesData
//         };

//         try {
//             const token = Cookies.get('authToken');
//             const response = await fetch(`http://localhost:8000/update-connection-terms/`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Basic ${token}`
//                 },
//                 body: JSON.stringify(payload)
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to update terms');
//             }

//             const data = await response.json();
//             if (data.success) {
//                 console.log('Terms successfully updated');
//                 // Save the submitted data back to localStorage
//                 localStorage.setItem('termValues', JSON.stringify(termValues));
//                 localStorage.setItem('selectedResources', JSON.stringify(selectedResources));
//                 navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
//             } else {
//                 setError(data.error || 'Failed to update terms');
//             }
//         } catch (err) {
//             setError(err.message);
//         }
//     };

//     const content = (
//         <>
//             <div className="navbarBrand">{curruser ? curruser.username : 'None'}</div>
//             <div className="description">{curruser ? curruser.description : 'None'}</div>
//         </>
//     );

//     return (
//         <div>
//             <Navbar content={content} />

//             <div className={showResources ? "split-view" : ""}>
//                 <div className="table-container">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Sno</th>
//                                 <th>Name</th>
//                                 <th>Enter value</th>
//                                 <th>Restrictions</th>
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {res?.obligations.map((obligation, index) => (
//                                 <tr key={index}>
//                                     <td>{index + 1}</td>
//                                     <td>{obligation.labelName}</td>
//                                     <td>{renderInputField(obligation)}</td>
//                                     <td>{obligation.labelDescription}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//                 {showResources && (
//                     <div className="resource-container">
//                         <h3>Resources for {selectedLocker}</h3>
//                         {error && <p className="error">{error}</p>}
//                         <ul>
//                             {resources.map((resource, index) => (
//                                 <li key={index}>
//                                     <div>
//                                         <label>
//                                             <input
//                                                 type="radio"
//                                                 name="selectedResource"
//                                                 value={resource.document_name}
//                                                 checked={selectedResources[currentLabelName]?.document_name === resource.document_name}
//                                                 onChange={() => handleResourceSelection(resource)}
//                                             />
//                                             {resource.document_name}
//                                         </label>
//                                     </div>
//                                 </li>
//                             ))}
//                         </ul>
//                         <button onClick={() => setShowResources(false)}>Select</button>
//                     </div>
//                 )}
//             </div>

//             <div>
//                 <button onClick={handleSubmit}>Submit</button>
//             </div>
//         </div>
//     );
// };



// import React, { useContext, useEffect, useState } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from 'js-cookie';
// import "./ViewTermsByType.css";
// import Navbar from "../Navbar/Navbar";

// export const ViewTermsByType = () => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const { curruser, setUser } = useContext(usercontext);
//     const [showResources, setShowResources] = useState(false);
//     const [selectedLocker, setSelectedLocker] = useState(null);
//     const [error, setError] = useState(null);
//     const [res, setRes] = useState(null);
//     const [resources, setResources] = useState([]);
//     const [termValues, setTermValues] = useState({});
//     const [selectedResources, setSelectedResources] = useState({});
//     const [currentLabelName, setCurrentLabelName] = useState(null);

//     const { connectionName, hostLockerName, guestLockerName, hostUserUsername, guestUserUsername, locker } = location.state || {};

//     useEffect(() => {
//         if (!curruser) {
//             navigate('/');
//             return;
//         }

//         const fetchTerms = async () => {
//             try {
//                 const token = Cookies.get('authToken');
//                 const response = await fetch(`http://localhost:8000/show_terms/?username=${guestUserUsername}&locker_name=${guestLockerName}&connection_name=${connectionName}`, {
//                     method: 'GET',
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Basic ${token}`
//                     },
//                 });
//                 if (!response.ok) {
//                     throw new Error('Failed to fetch terms');
//                 }
//                 const data = await response.json();
//                 if (data.success) {
//                     setRes(data.terms);
//                     const initialValues = {};
//                     data.terms.obligations.forEach(obligation => {
//                         initialValues[obligation.labelName] = obligation.value || "";
//                     });
//                     setTermValues(initialValues);
//                 } else {
//                     setError(data.error || 'No terms found');
//                 }
//             } catch (err) {
//                 setError(err.message);
//             }
//         };

//         fetchTerms();
//     }, []);

//     const handleInputChange = (labelName, value) => {
//         setTermValues(prev => ({
//             ...prev,
//             [labelName]: value
//         }));
//     };

//     const renderInputField = (obligation) => {
//         switch (obligation.typeOfAction) {
//             case 'text':
//                 return (
//                     <input
//                         type="text"
//                         placeholder="Enter value"
//                         value={termValues[obligation.labelName] || ""}
//                         onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
//                     />
//                 );
//             case 'file':
//                 return (
//                     <button onClick={() => handleButtonClick(obligation.labelName)}>
//                         {selectedResources[obligation.labelName]?.document_name || "Upload File"}
//                     </button>
//                 );
//             case 'date':
//                 return (
//                     <input
//                         type="date"
//                         value={termValues[obligation.labelName] || ""}
//                         onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
//                     />
//                 );
//             default:
//                 return null;
//         }
//     };

//     const handleButtonClick = (labelName) => {
//         setSelectedLocker(guestLockerName);
//         setShowResources(true);
//         setCurrentLabelName(labelName);
//     };

//     const handleResourceSelection = (resource) => {
//         setSelectedResources(prev => ({
//             ...prev,
//             [currentLabelName]: resource
//         }));
//         setShowResources(false);
//     };

//     useEffect(() => {
//         if (selectedLocker) {
//             const fetchResources = async () => {
//                 try {
//                     const token = Cookies.get('authToken');
//                     const response = await fetch(`http://localhost:8000/get-resources-user-locker/?locker_name=${selectedLocker}`, {
//                         method: 'GET',
//                         headers: {
//                             'Authorization': `Basic ${token}`,
//                             'Content-Type': 'application/json'
//                         }
//                     });
//                     if (!response.ok) {
//                         throw new Error('Failed to fetch resources');
//                     }
//                     const data = await response.json();
//                     if (data.success) {
//                         setResources(data.resources);
//                     } else {
//                         setError(data.message || 'Failed to fetch resources');
//                     }
//                 } catch (error) {
//                     console.error('Error fetching resources:', error);
//                     setError('An error occurred while fetching resources');
//                 }
//             };
//             fetchResources();
//         }
//     }, [selectedLocker]);

//     const handleSubmit = async () => {
//         const resourcesData = {
//             Transfer: [
//                 ...resources.map(resource => resource.document_name),
//                 ...Object.values(termValues).filter(value => value.includes("documents/"))
//             ]
//         };

//         const payload = {
//             connection_name: connectionName,
//             host_locker_name: hostLockerName,
//             guest_locker_name: guestLockerName,
//             host_user_username: hostUserUsername,
//             guest_user_username: guestUserUsername,
//             terms_value: {
//                 ...Object.fromEntries(
//                     Object.entries(termValues).map(([key, value]) => [key, `${value}; F`])
//                 ),
//                 ...Object.fromEntries(
//                     Object.entries(selectedResources).map(([key, resource]) => [key, `${resource.document_name}; F`])
//                 ),
//             },
//             resources: resourcesData
//         };

//         try {
//             const token = Cookies.get('authToken');
//             const response = await fetch(`http://localhost:8000/update-connection-terms/`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Basic ${token}`
//                 },
//                 body: JSON.stringify(payload)
//             });

//             if (!response.ok) {
//                 throw new Error('Failed to update terms');
//             }

//             const data = await response.json();
//             if (data.success) {
//                 console.log('Terms successfully updated');
//                 navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
//             } else {
//                 setError(data.error || 'Failed to update terms');
//             }
//         } catch (err) {
//             setError(err.message);
//         }
//     };

//     const content = (
//         <>
//             <div className="navbarBrand">{curruser ? curruser.username : 'None'}</div>
//             <div className="description">{curruser ? curruser.description : 'None'}</div>
//         </>
//     );

//     return (
//         <div>
//             <Navbar content={content} />

//             <div className={showResources ? "split-view" : ""}>
//                 <div className="table-container">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Sno</th>
//                                 <th>Name</th>
//                                 <th>Enter value</th>
//                                 <th>Restrictions</th>
//                             </tr>
//                         </thead>

//                         <tbody>
//                             {res?.obligations.map((obligation, index) => (
//                                 <tr key={index}>
//                                     <td>{index + 1}</td>
//                                     <td>{obligation.labelName}</td>
//                                     <td>{renderInputField(obligation)}</td>
//                                     <td>{obligation.labelDescription}</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//                 {showResources && (
//                     <div className="resource-container">
//                         <h3>Resources for {selectedLocker}</h3>
//                         {error && <p className="error">{error}</p>}
//                         <ul>
//                             {resources.map((resource, index) => (
//                                 <li key={index}>
//                                     <div>
//                                         <label>
//                                             <input
//                                                 type="radio"
//                                                 name="selectedResource"
//                                                 value={resource.document_name}
//                                                 checked={selectedResources[currentLabelName]?.document_name === resource.document_name}
//                                                 onChange={() => handleResourceSelection(resource)}
//                                             />
//                                             {resource.document_name}
//                                         </label>
//                                     </div>
//                                 </li>
//                             ))}
//                         </ul>
//                         <button onClick={() => setShowResources(false)}>Select</button>
//                     </div>
//                 )}
//             </div>

//             <div>
//                 <button onClick={handleSubmit}>Submit</button>
//             </div>
//         </div>
//     );
// };




import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from 'js-cookie';
import "./ViewTermsByType.css";
import Navbar from "../Navbar/Navbar";

export const ViewTermsByType = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { curruser, setUser } = useContext(usercontext);
    const [showResources, setShowResources] = useState(false);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [error, setError] = useState(null);
    const [res, setRes] = useState(null);
    const [resources, setResources] = useState([]);
    const [termValues, setTermValues] = useState({});
    const [selectedResources, setSelectedResources] = useState({});
    const [currentLabelName, setCurrentLabelName] = useState(null);

    const { connectionName, hostLockerName, guestLockerName, hostUserUsername, guestUserUsername, locker } = location.state || {};

    useEffect(() => {
        if (!curruser) {
            navigate('/');
            return;
        }

        const fetchTerms = async () => {
            try {
                const token = Cookies.get('authToken');
                const response = await fetch(`http://localhost:8000/get-terms-value/?username=${hostUserUsername}&locker_name=${guestLockerName}&connection_name=${connectionName}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${token}`
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch terms');
                }
                const data = await response.json();
                if (data.success) {
                    setRes(data.terms);
                    console.log("res", data.terms);
                    const initialValues = {};
                    data.terms.obligations.forEach(obligation => {
                        initialValues[obligation.labelName] = obligation.value || "";
                    });
                    setTermValues(initialValues);
                    console.log("setTermValues", initialValues);
                } else {
                    setError(data.error || 'No terms found');
                    console.log("error", data.error);
                }
            } catch (err) {
                setError(err.message);
            }


            
        
        };
        
        fetchTerms();
    }, []);

    const handleInputChange = (labelName, value) => {
        setTermValues(prev => ({
            ...prev,
            [labelName]: value
        }));
    };

    const renderInputField = (obligation) => {

        const strippedValue = termValues[obligation.labelName]?.replace("; F", "");

        switch (obligation.typeOfAction) {
            
            case 'text':
                return (
                    <input
                        type="text"
                        placeholder="Enter value"
                        value={strippedValue || ""}
                        onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
                    />
                );
            case 'file':
                return (
                    <button onClick={() => handleButtonClick(obligation.labelName)}>
                        {selectedResources[obligation.labelName]?.document_name || "Upload File"}
                    </button>
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={termValues[obligation.labelName] || ""}
                        onChange={(e) => handleInputChange(obligation.labelName, e.target.value)}
                    />
                );
            default:
                return null;
        }
    };

    const handleButtonClick = (labelName) => {
        setSelectedLocker(guestLockerName);
        setShowResources(true);
        setCurrentLabelName(labelName);
    };

    const handleResourceSelection = (resource) => {
        setSelectedResources(prev => ({
            ...prev,
            [currentLabelName]: resource
        }));
        setShowResources(false);
    };

    useEffect(() => {
        if (selectedLocker) {
            const fetchResources = async () => {
                try {
                    const token = Cookies.get('authToken');
                    const response = await fetch(`http://localhost:8000/get-resources-user-locker/?locker_name=${selectedLocker}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Basic ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) {
                        throw new Error('Failed to fetch resources');
                    }
                    const data = await response.json();
                    if (data.success) {
                        setResources(data.resources);
                    } else {
                        setError(data.message || 'Failed to fetch resources');
                    }
                } catch (error) {
                    console.error('Error fetching resources:', error);
                    setError('An error occurred while fetching resources');
                }
            };
            fetchResources();
        }
    }, [selectedLocker]);

    const handleSubmit = async () => {
        const resourcesData = {
            Transfer: [
                ...resources.map(resource => resource.document_name),
                ...Object.values(termValues).filter(value => value.includes("documents/"))
            ]
        };

        const payload = {
            connection_name: connectionName,
            host_locker_name: hostLockerName,
            guest_locker_name: guestLockerName,
            host_user_username: hostUserUsername,
            guest_user_username: guestUserUsername,
            terms_value: {
                ...Object.fromEntries(
                    Object.entries(termValues).map(([key, value]) => [key, `${value}; F`])
                ),
                ...Object.fromEntries(
                    Object.entries(selectedResources).map(([key, resource]) => [key, `${resource.document_name}; F`])
                ),
            },
            resources: resourcesData
        };

        try {
            const token = Cookies.get('authToken');
            const response = await fetch(`http://localhost:8000/update-connection-terms/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${token}`
                },
                body: JSON.stringify(payload)
                
            });

            console.log("payload", payload);
            if (!response.ok) {
                throw new Error('Failed to update terms');
            }

            const data = await response.json();
            if (data.success) {
                console.log('Terms successfully updated');
                navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
            } else {
                setError(data.error || 'Failed to update terms');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    const content = (
        <>
            <div className="navbarBrand">{curruser ? curruser.username : 'None'}</div>
            <div className="description">{curruser ? curruser.description : 'None'}</div>
        </>
    );

    return (
        <div>
            <Navbar content={content} />

            <div className={showResources ? "split-view" : ""}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Sno</th>
                                <th>Name</th>
                                <th>Enter value</th>
                                <th>Restrictions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {res?.obligations.map((obligation, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>{obligation.labelName}</td>
                                    <td>{renderInputField(obligation)}</td>
                                    <td>{obligation.labelDescription}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {showResources && (
                    <div className="resource-container">
                        <h3>Resources for {selectedLocker}</h3>
                        {error && <p className="error">{error}</p>}
                        <ul>
                            {resources.map((resource, index) => (
                                <li key={index}>
                                    <div>
                                        <label>
                                            <input
                                                type="radio"
                                                name="selectedResource"
                                                value={resource.document_name}
                                                checked={selectedResources[currentLabelName]?.document_name === resource.document_name}
                                                onChange={() => handleResourceSelection(resource)}
                                            />
                                            {resource.document_name}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setShowResources(false)}>Select</button>
                    </div>
                )}
            </div>

            <div>
                <button onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
};

