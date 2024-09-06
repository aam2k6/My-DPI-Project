// import React, { useEffect, useState, useContext } from 'react';
// import { usercontext } from '../../usercontext';
// import Cookies from 'js-cookie';
// import './SettingsPage.css';
// import Navbar from '../Navbar/Navbar';

// export default function SettingsPage() {
//     const { curruser, setUser } = useContext(usercontext);
    
//     console.log(curruser);
//     const [isEditing, setIsEditing] = useState(false);
//     const [newUsername, setNewUsername] = useState(curruser?.username || '');
//     const [password, setPassword] = useState('');
//     const [description, setDescription] = useState(curruser?.description || '');
//     const [errorMessage, setErrorMessage] = useState('');

//     useEffect(() => {
//         if (curruser) {
//             setNewUsername(curruser.username);
//             setDescription(curruser.description);
//         }
//     }, [curruser]);

//     if (!curruser) {
//         return <div>Loading...</div>;
//     }

//     const handleEditToggle = () => {
//         setIsEditing(!isEditing);
//     };

//     const handleSave = async () => {
//         const updatedUser = {
//             username: curruser.username, // Keep current username for reference
//             new_name: newUsername,       // New username
//             new_description: description,
//             new_password: password
//         };

//         console.log("Updated User Data: ", updatedUser);
//         const token = Cookies.get('authToken');
//         fetch('localhost:8000/signup-user/', {
//             method: 'PUT',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(updatedUser),
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 setUser({ ...curruser, username: newUsername, description: description });
//                 setIsEditing(false);
//                 setErrorMessage('');
//                 alert("Profile updated successfully.");
//             } else {
//                 console.error("Error:", data.error);
//                 setErrorMessage(data.error);
//                 alert(data.error);
//             }
//         })
//         .catch(error => {
//             console.error("Error:", error);
//             setErrorMessage("An error occurred during profile update.");
//             alert("An error occurred during profile update.");
//         });
//     };

//     return (
//         <>
//             <Navbar />
//             <div className="settings-page">
//                 <h1>User Profile</h1>
//                 {errorMessage && <div className="error-message">{errorMessage}</div>}
//                 <div className="profile-info">
//                     <label>Username:</label>
//                     {isEditing ? (
//                         <input
//                             type="text"
//                             value={newUsername}
//                             onChange={(e) => setNewUsername(e.target.value)}
//                         />
//                     ) : (
//                         <p>{curruser.username}</p>
//                     )}
//                 </div>
//                 <div className="profile-info">
//                     <label>Description:</label>
//                     {isEditing ? (
//                         <input
//                             type="text"
//                             value={description}
//                             onChange={(e) => setDescription(e.target.value)}
//                         />
//                     ) : (
//                         <p>{curruser.description}</p>
//                     )}
//                 </div>
//                 {isEditing && (
//                     <div className="profile-info">
//                         <label>Password:</label>
//                         <input
//                             type="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                         />
//                     </div>
//                 )}
//                 <div className="profile-actions">
//                     <button onClick={handleEditToggle}>
//                         {isEditing ? 'Cancel' : 'Edit Profile'}
//                     </button>
//                     {isEditing && (
//                         <button onClick={handleSave}>
//                             Save Changes
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </>
//     );
// }
import React, { useEffect, useState, useContext } from 'react';
import { usercontext } from '../../usercontext';
import Cookies from 'js-cookie';
import './SettingsPage.css';
import Navbar from '../Navbar/Navbar';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Using FontAwesome icons
import { frontend_host } from '../../config';

export default function SettingsPage() {
    const { curruser, setUser } = useContext(usercontext);
    
    console.log(curruser);
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState(curruser?.username || '');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState(curruser?.description || '');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (curruser) {
            setNewUsername(curruser.username);
            setDescription(curruser.description);
        }
    }, [curruser]);

    if (!curruser) {
        return <div>Loading...</div>;
    }

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        const updatedUser = {
            username: curruser.username, // Keep current username for reference
            new_name: newUsername,       // New username
            new_description: description,
            new_password: password
        };

        console.log("Updated User Data: ", updatedUser);
        const token = Cookies.get('authToken');
        fetch('host/signup-user/'.replace(/host/g, frontend_host), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setUser({ ...curruser, username: newUsername, description: description });
                setIsEditing(false);
                setErrorMessage('');
                alert("Profile updated successfully.");
            } else {
                console.error("Error:", data.error);
                setErrorMessage(data.error);
                alert(data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            setErrorMessage("An error occurred during profile update.");
            alert("An error occurred during profile update.");
        });
    };

    return (
        <>
            <Navbar />
            <div className="settings-page">
                <h1>User Profile</h1>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <div className="profile-info">
                    <label>Username:</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                        />
                    ) : (
                        <p>{curruser.username}</p>
                    )}
                </div>
                <div className="profile-info">
                    <label>Description:</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    ) : (
                        <p>{curruser.description}</p>
                    )}
                </div>
                {isEditing && (
                    <div className="profile-info">
                        <label>Password:</label>
                        <div className="password-wrapper">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <span 
                                className="toggle-password"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                )}
                <div className="profile-actions">
                    <button onClick={handleEditToggle}>
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                    {isEditing && (
                        <button onClick={handleSave}>
                            Save Changes
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

