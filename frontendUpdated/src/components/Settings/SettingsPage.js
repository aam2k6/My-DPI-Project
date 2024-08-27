import React, { useEffect, useState, useContext } from 'react';
import { usercontext } from '../../usercontext';
import Cookies from 'js-cookie';
import './SettingsPage.css';
import Navbar from '../Navbar/Navbar';

export default function SettingsPage() {
    const { curruser, setUser } = useContext(usercontext);
    
    
    console.log(curruser);
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(curruser?.username);
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState(curruser?.description);

    useEffect(() => {
        if (curruser) {
            setUsername(curruser.username);
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
        const updatedUser = { username, description, password };

        // Log updated user data to ensure they're being set correctly
        console.log("Updated User Data: ", updatedUser);
        const token = Cookies.get('authToken');
        fetch('http://localhost:8000/update-user/', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                setUser(data.curruser);
                setIsEditing(false);
                alert("Profile updated successfully.");
            } else {
                console.error("Error:", data.error);
                alert(data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred during profile update.");
        });
    };

    return (
        <><Navbar />
        <div className="settings-page"> 
            <h1>User Profile</h1>
            <div className="profile-info">
                <label>Username:</label>
                {isEditing ? (
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
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
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
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
};
