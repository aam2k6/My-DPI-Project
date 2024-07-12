import React, { useState } from 'react';
import Cookies from 'js-cookie';
import './login.css';
import { useNavigate } from "react-router-dom";

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // useNavigate hook for redirecting

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Convert username and password to Base64
        const token = btoa(`${username}:${password}`);

        console.log('Token:', token);
        console.log('Payload:', { username, password });

        // Send data to the backend with the Authorization header
        fetch('http://localhost:8000/login-user/', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("Login successful:", data);
                    //save token into cookies
                    Cookies.set('authToken', token);
                    // Redirect to another page or show success message
                    
                    navigate('/home', { state: { user: data.user } });

                } else {
                    console.error("Error:", data.error);
                    // Show error message
                    alert(data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                // Show error message
                alert("An error occurred during login");
            });
    };

    return (
        <div className='loginpage'>
            <div className="headerlogin" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ marginLeft: '0rem', marginTop: '0rem', fontSize: '3rem', backgroundColor: 'rgba(23, 22, 75)', color: '#ffffff', textAlign: 'center', flex: 1, height: '6rem' }}>
                    Consent Management System
                </h1>
            </div>

            <div className="containerlogin">
                <form className="signup-form" onSubmit={handleSubmit} autoComplete="off">
                    <div className="form-headers">
                        <h1><u>SIGN IN</u></h1>
                    </div>
                    {message && <div className="error-message" style={{ color: 'red' }}>{message}</div>}
                    <div className="form-input">
                        <label>USERNAME :</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-input">
                        <label>PASSWORD :</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="submit-btn" type="submit">LOGIN</button>
                </form>
            </div>
        </div>
    );
};