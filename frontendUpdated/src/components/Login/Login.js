import React, { useState, useContext } from 'react';
import Cookies from 'js-cookie';
import './login.css';
import { useNavigate } from 'react-router-dom';
import { usercontext } from '../../usercontext';

export const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [description, setDescription] = useState(""); // Added for signup
    const [message, setMessage] = useState('');
    const [isSignup, setIsSignup] = useState(false); // To toggle between login and signup
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

        // Log form values to ensure they're being set correctly
        console.log("Form Values: ", { username, password, description });

        const url = isSignup ? 'http://localhost:8000/signup-user/' : 'http://localhost:8000/login-user/';
        const headers = {};

        if (!isSignup) {
            headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
        }

        fetch(url, {
            method: 'POST',
            headers: headers,
            body: data,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(isSignup ? "Signup successful:" : "Login successful:", data);
                if (isSignup) {
                    setIsSignup(false); // Switch to login form after successful signup
                    alert("Signup successful. Please log in.");
                } else {
                    Cookies.set('authToken', btoa(`${username}:${password}`));
                    setUser(data.user);
                    localStorage.setItem('curruser', JSON.stringify(data.user));
                    navigate('/home');
                }
            } else {
                console.error("Error:", data.error);
                alert(data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert(`An error occurred during ${isSignup ? 'signup' : 'login'}`);
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
                        <h1><u>{isSignup ? 'SIGN UP' : 'SIGN IN'}</u></h1>
                    </div>
                    {message && <div className="error-message" style={{ color: 'red' }}>{message}</div>}
                    <div className="form-input" id='form-inplogin1'>
                        <label>USERNAME :</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-input" id='form-inplogin2'>
                        <label>PASSWORD :</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {isSignup && (
                        <div className="form-input" id='form-inplogin3'>
                            <label>DESCRIPTION :</label>
                            <input
                                type="text"
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <button className="submit-btnlogin1" type="submit">{isSignup ? 'SIGN UP' : 'LOGIN'}</button>
                    <button
                        className="submit-btnlogin2"
                        type="button"
                        onClick={() => setIsSignup(!isSignup)}
                    >
                        {isSignup ? 'LOGIN' : 'SIGNUP'}
                    </button>
                </form>
            </div>
        </div>
    );
};
