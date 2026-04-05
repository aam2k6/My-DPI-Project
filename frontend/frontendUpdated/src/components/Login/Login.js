import React, { useState, useContext } from 'react';
import Cookies from 'js-cookie';
import './login.css';
import { useNavigate } from 'react-router-dom';
import { usercontext } from '../../usercontext';
import { frontend_host } from '../../config';
import { Box, Grid } from '@mui/material';
import IIITLogo from '../../assets/iiitb_image.png';
import WebScienceLogo from '../../assets/Web_science_image.png';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLoginComponent from '../GooogleLogin/GoogleLogin';
import GoogleSignupComponent from '../GooogleLogin/GoogleSignup';
import { apiFetch } from '../../utils/api';

export const Login = () => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [description, setDescription] = useState(""); // Added for signup
    const [message, setMessage] = useState('');
    const [isSignup, setIsSignup] = useState(false); // To toggle between login and signup
    const navigate = useNavigate();
    const { setUser } = useContext(usercontext)
   
//     const handleSubmit = async (event) => {
//     event.preventDefault();

//     const data = new FormData();
//     data.append('username', username);
//     data.append('password', password);

//     if (isSignup) {
//         data.append('description', description);
//     }

//     const url = isSignup ? 'host/signup-user/'.replace(/host/, frontend_host) : 'host/login-user/'.replace(/host/, frontend_host);
//     const headers = {};

//     if (!isSignup) {
//         headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
//     }

//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: headers,
//             body: data,
//         });

//         const responseData = await response.json();

//         if (response.ok && responseData.success) {
//             console.log(isSignup ? "Signup successful:" : "Login successful:", responseData);
//             if (isSignup) {
//                 setIsSignup(false);
//                 alert("Signup successful. Please log in.");
//             } else {
//                 // Correctly store the authentication type and credentials
//                 const basicAuthToken = btoa(`${username}:${password}`);
                
//                 // Set the cookie with the Basic Auth string
//                 Cookies.set('authToken', basicAuthToken, { expires: 7 }); 
                
//                 // Set the authentication type in localStorage
//                 localStorage.setItem('authType', 'Basic');

//                 // Assuming the login response contains user data directly
//                 // If not, you'd need to make another API call to get it
//                 if (responseData.user) {
//                     setUser(responseData.user);
//                     localStorage.setItem('curruser', JSON.stringify(responseData.user));
//                     navigate('/home');
//                 } else {
//                     console.error("Login successful, but user data is missing in the response.");
//                     alert("Login successful, but a problem occurred.");
//                 }
//             }
//         } else {
//             console.error("Error:", responseData.error);
//             alert("Invalid Credentials" || responseData.error);
//         }
//     } catch (error) {
//         console.error("Error:", error);
//         alert(`An error occurred during ${isSignup ? 'signup' : 'login'}`);
//     }
// };
const handleSubmit = async (event) => {
    event.preventDefault();

    const url = isSignup ? '/auth/signup/' : '/auth/login/';
    
    // Send credentials in the request body, not a header.
    const requestData = {
        username: username,
        password: password,
        ...(isSignup && { email: email, description: description })
    };

    try {
        const response = await apiFetch.post(url, requestData);

        if (response.status === 200) {
            console.log("Login successful:", response.data);
            
            // Assuming your backend returns access and refresh tokens
            const { access, refresh, user } = response.data;
            
            // Store the JWTs from the backend response
            Cookies.set('access_token', access, { expires: 1 / 24 });
            Cookies.set('refresh_token', refresh, { expires: 7 }); 
            localStorage.setItem('curruser', JSON.stringify(user));
            setUser(user);
            
            navigate('/home');
        }
    } catch (error) {
        console.error("Login Error:", error.response?.data || error.message);
        alert(error.response?.data?.error || "An error occurred during login.");
    }
};

    return (
        <>
            <div className='loginpage'>
                <div className="headerlogin" >
                    <h1>
                       Anumati - Consent Management System
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
                                     {isSignup && (
                        <div className="form-input" id='form-inplogin-email'>
                            <label>EMAIL :</label>
                            <input 
                                type="email" 
                                id="email"
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                    )}
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
                        <Box style={{ dispay: 'flex', justifyContent: 'center' }}>
                            <button className="submit-btnlogin1" type="submit">{isSignup ? 'SIGN UP' : 'LOGIN'}</button>
                            <button
                                className="submit-btnlogin2"
                                type="button"
                                onClick={() => setIsSignup(!isSignup)}
                            >
                                {isSignup ? 'LOGIN' : 'SIGNUP'}
                            </button>
                        </Box>

                    </form>

                     <GoogleOAuthProvider clientId="191215085646-hngqosqgf5nhn648vqekr1tulslmofjb.apps.googleusercontent.com">
                    <GoogleLoginComponent ></GoogleLoginComponent>
                    <GoogleSignupComponent></GoogleSignupComponent>
                    </GoogleOAuthProvider>

                </div>

            </div>
            <Grid container className="logo-container">
                <Grid item md={3} sm={12} xs={12}></Grid>
                <Grid item md={3} sm={6} xs={6} container justifyContent="center" alignItems="center">
                    <img className='iiitlogo' src={IIITLogo} alt="IIIT Logo" />

                </Grid>
                <Grid item md={3} sm={6} xs={6} container justifyContent="center" alignItems="center">
                    <img className='websciencelogo' src={WebScienceLogo} alt="Web Science Logo" />

                </Grid>
                <Grid item md={3} sm={12} xs={12}></Grid>
            </Grid>
        </>
    );
};
