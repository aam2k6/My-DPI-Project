
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { apiFetch } from '../../utils/api';
import { usercontext } from '../../usercontext';

export const CompleteProfile = () => {
    const [username, setUsername] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const { user, setUser } = useContext(usercontext);

    useEffect(() => {
        if (user?.is_profile_complete) {
            navigate('/home');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !description) {
            setMessage("Please fill in both fields.");
            return;
        }

        try {
            const accessToken = Cookies.get("access_token");
            const response = await apiFetch.post(
                '/auth/google/complete-profile/',
                { username, description },
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (response.status === 200) {
                setMessage("Profile updated successfully!");
                setUser({ ...user, username, description, is_profile_complete: true });
                navigate('/home');
            }
        } catch (error) {
            setMessage(error.response?.data?.error || "Failed to update profile.");
            console.error("Error completing profile:", error.response?.data || error.message);
        }
    };

    return (
        <div style={{ maxWidth: 500, margin: "auto", padding: 20 }}>
            <h2>Complete Your Profile</h2>
            <p>Welcome! Please choose a username and add a short description to finish setting up your account.</p>
            <form onSubmit={handleSubmit}>
                <label>Username:</label>
                <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onBlur={e => setUsername(e.target.value.trim())}
                    required
                    style={{ width: "100%", padding: 8, marginBottom: 15 }}
                />
                <label>Description:</label>
                <textarea
                    placeholder="Tell us about yourself..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    style={{ width: "100%", padding: 8, minHeight: 100, marginBottom: 15 }}
                />
                <button
                    type="submit"
                    style={{ width: "100%", padding: 10, backgroundColor: "#007BFF", color: "#fff", border: "none", cursor: "pointer" }}
                >
                    Complete Profile
                </button>
            </form>
            {message && <p style={{ color: message.includes("successfully") ? "green" : "red", marginTop: 15 }}>{message}</p>}
        </div>
    );
};
