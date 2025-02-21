import React, { useState, useContext } from 'react';
import Cookies from 'js-cookie';
import './login.css';
import { useNavigate } from 'react-router-dom';
import { usercontext } from '../../usercontext';
import { frontend_host } from '../../config';
import { Box, Grid } from '@mui/material';
import IIITLogo from '../../assets/iiitb_image.png';
import WebScienceLogo from '../../assets/Web_science_image.png';

export const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useContext(usercontext);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const data = new FormData();
        data.append('username', username);
        data.append('password', password);

        if (isSignup) {
            data.append('description', description);
        }

        const url = isSignup 
            ? 'host/signup-user/'.replace(/host/, frontend_host) 
            : 'http://127.0.0.1:8000/login-user/'.replace(/host/, frontend_host);

        const headers = {
            'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
            'Content-Type': 'application/json',
        };

        fetch(url, {
            method: 'POST',
            headers: headers,
            body: data,
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    if (isSignup) {
                        setIsSignup(false);
                        alert("Signup successful. Please log in.");
                    } else {
                        Cookies.set('authToken', btoa(`${username}:${password}`));
                        setUser(data.user);
                        localStorage.setItem('curruser', JSON.stringify(data.user));
                        navigate('/home');
                    }
                } else {
                    alert("Invalid Credentials" || data.error);
                }
            })
            .catch(error => {
                alert(`An error occurred during ${isSignup ? 'signup' : 'login'}`);
            });
    };

    return (
        <>
            <div className='loginpage'>
                <div className="headerlogin">
                    <h1>Consent Management System</h1>
                </div>

                <div className="containerlogin">
                    <form className="signup-form" onSubmit={handleSubmit} autoComplete="off">
                        <div className="form-headers">
                            <h1><u>{isSignup ? 'SIGN UP' : 'SIGN IN'}</u></h1>
                        </div>

                        {message && <div className="error-message" style={{ color: 'red' }}>{message}</div>}

                        <div className="form-input">
                            <label>USERNAME:</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>

                        <div className="form-input">
                            <label>PASSWORD:</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        {isSignup && (
                            <div className="form-input">
                                <label>DESCRIPTION:</label>
                                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required />
                            </div>
                        )}

                        <Box className="submit-buttons">
                            <button className="submit-btnlogin1" type="submit">{isSignup ? 'SIGN UP' : 'LOGIN'}</button>
                            <button className="submit-btnlogin2" type="button" onClick={() => setIsSignup(!isSignup)}>
                                {isSignup ? 'LOGIN' : 'SIGNUP'}
                            </button>
                        </Box>
                    </form>
                </div>
            </div>
        </>
    );
};