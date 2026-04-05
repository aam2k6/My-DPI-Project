import React, { useState, useContext, useEffect } from 'react';
import './LoginSignUp.css';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { apiFetch } from '../../utils/api';
import { usercontext } from '../../usercontext';
import GoogleSignupComponent from '../GooogleLogin/GoogleSignup';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLoginComponent from '../GooogleLogin/GoogleLogin';
import { Box, Grid } from '@mui/material';
// import IIITLogo from '../../assets/iiitb_image.png';
import IIITLogo from '../../assets/iiitb_logo.png';
// import WebScienceLogo from '../../assets/Web_science_image.png';
import WebScienceLogo from '../../assets/WSL.jpg';
import { useAuth } from '../../contexts/Authcontext';

const LoginSignUp = () => {
    const navigate = useNavigate();
    const { user, setUser } = useContext(usercontext);
    const [activeTab, setActiveTab] = useState('signin');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [completeProfile, setCompleteProfile] = useState(false);
    const [googleUser, setGoogleUser] = useState(null);
    const [showDescriptionStep, setShowDescriptionStep] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [description, setDescription] = useState("");
    const [signInData, setSignInData] = useState({ email: '', password: '' });
    const [signUpData, setSignUpData] = useState({ email: '', username: '', password: '', description: '' });
    const [googleDescription, setGoogleDescription] = useState('');



    useEffect(() => {
        if (user?.is_profile_complete && completeProfile) {
            navigate('/home');
        }
    }, [user, navigate]);
    
 const { login } = useAuth(); 
    const handleGoogleLogin = (user) => {
        if (!user.is_profile_complete) {
            showMessage('info', 'Please complete your profile to continue');
            setCompleteProfile(true);
        } else {
            showMessage('success', `Welcome back, ${user?.username}!`);
            setTimeout(() => {
                navigate('/home');
            }, 2000);
        }
    };

    const handleGoogleError = (message) => {
        showMessage('error', message);
    };


    const handleGoogleSignup = (user) => {
        if (!user.is_profile_complete) {
            showMessage('info', 'Please complete your profile to continue');
            setShowDescriptionStep(true);
        } else {
            showMessage('success', `Signup successful!, Please sign in to continue`);
            setTimeout(() => {
                setActiveTab('signin');
            }, 2000);
        }

    }

    const handleGoogleSignupError = (message) => {
        showMessage('error', message);
    }

    // Message handling
    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    // Tab switching
    const switchTab = (tab) => {
        setActiveTab(tab);
        setMessage({ type: '', text: '' });
        resetForms();
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !description) {
            alert("Please fill in both fields.");
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
                // setMessage("Profile updated successfully!");
                setUser({ ...user, username, description, is_profile_complete: true });
                showMessage('success', `Welcome, ${username}!`);

                setTimeout(() => {
                    navigate('/home');
                }, 2000); // waits 2 seconds before navigating
            }
        } catch (error) {
            console.log(error)
            showMessage('error', `${error.response?.data?.error}`);
            console.error("Error completing profile:", error.response?.data || error.message);
        }
    };


    // Reset forms
    const resetForms = () => {
        setSignInData({ email: '', password: '' });
        setSignUpData({ email: '', password: '', description: '' });
        setGoogleDescription('');
        setShowDescriptionStep(false);
        setGoogleUser(null);
    };

    // Handle sign in
    // const handleLogin = async (event) => {
    //     event.preventDefault();
    //     try {
    //         const response = await apiFetch.post("/login-user/", {
    //             username: signInData.email,
    //             password: signInData.password,
    //         });

    //         if (response.status === 200) {
    //             console.log("Login Response:", response);
    //             const { access, refresh, user } = response.data;

    //             Cookies.set("access_token", access, { expires: 1 / 24 });
    //             Cookies.set("refresh_token", refresh, { expires: 7 });
    //             localStorage.setItem("curruser", JSON.stringify(user));
    //             setUser(user);

    //             showMessage('success', `Welcome back, ${user?.username}!`);
    //             console.log('User after login:', user);
    //             setTimeout(() => {
    //                 navigate('/home');
    //             }, 2000);
    //             // navigate('/home');

    //         }
    //     } catch (error) {
    //         //   console.error("Login Error:", error.response?.data || error.message);
    //         showMessage("error", error.response?.data?.error || "Invalid credentials.");
    //     }
    // };

    const handleLogin = async (event) => {
    event.preventDefault();
    try {
        const response = await apiFetch.post("/auth/login/", {
            username: signInData.email,
            password: signInData.password,
        });

        if (response.status === 200) {
            const { access, refresh, user } = response.data;


            Cookies.set("access_token", access, { path: "/", expires: 1 / 24 });
            Cookies.set("refresh_token", refresh, { path: "/", expires: 7 });
            localStorage.setItem("curruser", JSON.stringify(user));
            localStorage.setItem("access_token", access);

            login(user, access);

            setUser(user);

            showMessage('success', `Welcome back, ${user?.username}!`);

            setTimeout(() => {
                navigate('/home', { replace: true });
            }, 2000);
        }

    } catch (error) {
        showMessage("error", error.response?.data?.error || "Invalid credentials.");
    }
};


    // Handle sign up

    // 🔹 SIGNUP
    const handleSignup = async (event) => {
        event.preventDefault();

        if (signUpData.password !== signUpData.confirmPassword) {
            showMessage('error', 'Passwords must match.');
            return;
        }

        showMessage('info', 'Creating your account...');
        setTimeout(async () => {
            try {
                const response = await apiFetch.post("/auth/signup/", {
                    username: signUpData.username,
                    email: signUpData.email,
                    password: signUpData.password,
                    description: signUpData.description,
                });

                if (response.success == true || response.status === 201) {
                    showMessage('success', 'Sign up successful. Please sign in.');
                    setTimeout(() => {
                        setActiveTab('signin');
                    }, 2000);
                }
            } catch (error) {
                console.error("Signup Error:", error.response?.data || error.message);
                showMessage('error', error.response?.data?.error || "An error occurred during signup.");
            }
        }, 1000);
    };


    // Cancel Google signup
    const cancelGoogleSignup = () => {
        resetGoogleSignup();
        showMessage('error', 'Google signup cancelled.');
    };

    // Reset Google signup
    const resetGoogleSignup = () => {
        setGoogleUser(null);
        setShowDescriptionStep(false);
        setGoogleDescription('');
    };

    return (

        <>

            <Grid
                container
                alignItems="center"
                justifyContent="center"
                className="logo-container headerlogins"
            >

                <Grid item xs={2} sm={2} md={1} container justifyContent="center">
                    <img className="iiitlogo" src={IIITLogo} alt="IIIT Logo" />
                </Grid>


                <Grid item xs={8} sm={8} md={10} container justifyContent="center">
                    <h1>Anumati - Consent Management System</h1>
                </Grid>


                <Grid item xs={2} sm={2} md={1} container justifyContent="center">
                    <img className="websciencelogo" src={WebScienceLogo} alt="Web Science Logo" />
                </Grid>
            </Grid>

            



            <div className="auth-container">

                {/* <div className='loginpage'> */}

                {/* </div> */}
                <div className="auth-card">
                    {/* Header gradient line */}
                    {/* <div className="card-header-line"></div> */}

                    {/* Header */}
                    {/* <div className="header-text">
                    <h1 className="header-title">Welcome</h1>
                    <p className="header-subtitle">Sign in to your account or create a new one</p>
                </div> */}

                    {/* Tabs */}
                    <div className="tabs-container">
                        <button
                            onClick={() => { switchTab('signin'); setShowPassword(false); }}
                            className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { switchTab('signup'); setCompleteProfile(false); setShowPassword(false) }}
                            className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Messages */}
                    {message.text && (
                        <div className={`message-box ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Sign In Form */}
                    {activeTab === 'signin' && !completeProfile && (
                        <div className="form-container">


                            <GoogleOAuthProvider clientId="191215085646-hngqosqgf5nhn648vqekr1tulslmofjb.apps.googleusercontent.com">

                                <GoogleLoginComponent onLoginSuccess={handleGoogleLogin} onLoginError={handleGoogleError}></GoogleLoginComponent>
                            </GoogleOAuthProvider>

                            <div className="divider">
                                <span className="divider-text">or</span>
                            </div>

                            <form onSubmit={handleLogin}>
                                <div>
                                    <label className="col-form-label">Email/Username</label>
                                    {/* <div className="col-sm-9"> */}
                                    <input
                                        type="text"
                                        value={signInData.email}
                                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                                        required
                                        placeholder="Enter your email/username"
                                        className="form-input"
                                    />
                                    {/* </div> */}
                                </div>



                                <div>
                                    <label className="col-form-label">Password</label>
                                    <div className="position-relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={signInData.password}
                                            onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                                            required
                                            placeholder="Enter your password"
                                            // className="form-input"
                                            className="form-input input-with-icon"
                                        />
                                        <i
                                            className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} icon-eye`}
                                            onClick={() => setShowPassword(!showPassword)}
                                        ></i>
                                    </div>
                                </div>

                                <button
                                    // onClick={handleSignIn}
                                    type='submit'
                                    className="primary-button mt-4"
                                >
                                    Sign In
                                </button>
                            </form>


                        </div>
                    )}
                    {completeProfile && (
                        <div className="form-container">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <label className="col-sm-3 col-form-label">Username</label>
                                    <div className="col-sm-9">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            onBlur={e => setUsername(e.target.value.trim())}
                                            required
                                            placeholder="Enter username"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="row mt-3">
                                    <label className="col-sm-3 col-form-label">Description</label>
                                    <div className="col-sm-9">
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            required
                                            placeholder="Enter description"
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <button
                                    // onClick={handleSignIn}
                                    type='submit'
                                    className="primary-button mt-4"
                                >
                                    Complete Profile
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Sign Up Form */}
                    {activeTab === 'signup' && !showDescriptionStep && (
                        <div className="form-container">
                            <GoogleOAuthProvider clientId="191215085646-hngqosqgf5nhn648vqekr1tulslmofjb.apps.googleusercontent.com">

                                <GoogleSignupComponent onSignupSuccess={handleGoogleSignup} onSignupError={handleGoogleSignupError}></GoogleSignupComponent>
                            </GoogleOAuthProvider>

                            <div className="divider">
                                <span className="divider-text">or</span>
                            </div>
                            <form onSubmit={handleSignup} className="form-container">
                                <div className="row">
                                    <label className="col-sm-3 col-form-label">Username</label>
                                    <div className="col-sm-9">
                                        <input
                                            type="text"
                                            value={signUpData.username}
                                            onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                                            onBlur={(e) =>
                                                setSignUpData({ ...signUpData, username: e.target.value.trim() })
                                            }
                                            required
                                            placeholder="Enter username"
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <label className="col-sm-3 col-form-label">Email</label>
                                    <div className="col-sm-9">
                                        <input
                                            type="email"
                                            value={signUpData.email}
                                            onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                                            required
                                            placeholder="Enter your email"
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <label className="col-sm-3 col-form-label">Description</label>
                                    <div className="col-sm-9">
                                        <input
                                            value={signUpData.description}
                                            onChange={(e) => setSignUpData({ ...signUpData, description: e.target.value })}
                                            required
                                            placeholder="Enter description"
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="row">
                                    <label className="col-sm-3 col-form-label">Password</label>
                                    <div className="col-sm-9">
                                        <div className="position-relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={signUpData.password}
                                                onChange={(e) =>
                                                    setSignUpData({ ...signUpData, password: e.target.value })
                                                }
                                                required
                                                placeholder="Create a password"
                                                className="form-input input-with-icon"
                                            />
                                            <i
                                                className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} icon-eye`}
                                                onClick={() => setShowPassword(!showPassword)}
                                            ></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="row">
                                    <label className="col-sm-3 col-form-label">Confirm Password</label>
                                    <div className="col-sm-9">
                                        <div className="position-relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={signUpData.confirmPassword}
                                                onChange={(e) =>
                                                    setSignUpData({ ...signUpData, confirmPassword: e.target.value })
                                                }
                                                required
                                                placeholder="Confirm password"
                                                className="form-input input-with-icon"
                                            />
                                            <i
                                                className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"} icon-eye`}
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            ></i>
                                        </div>
                                    </div>
                                </div>


                                <button
                                    className="primary-button"
                                    type='submit'
                                >
                                    Sign Up
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Google Description Step */}
                    {activeTab === 'signup' && showDescriptionStep && (
                        <div className="form-container">
                            <div className="dot-indicator">
                                <div className="dot"></div>
                                <div className="dot"></div>
                            </div>

                            <div className="header-text">
                                <h1 className="header-title">Almost Done!</h1>
                                <p className="header-subtitle">Tell us a bit about yourself to complete your profile</p>
                            </div>

                            <div className="form-container">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <label className="col-sm-3 col-form-label">Username</label>
                                        <div className="col-sm-9">
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                onBlur={e => setUsername(e.target.value.trim())}
                                                required
                                                placeholder="Enter username"
                                                className="form-input"
                                            />
                                        </div>
                                    </div>
                                    <div className="row mt-3">
                                        <label className="col-sm-3 col-form-label">Description</label>
                                        <div className="col-sm-9">
                                            <input
                                                type="text"
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                required
                                                placeholder="Enter description"
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        // onClick={handleSignIn}
                                        type='submit'
                                        className="primary-button mt-4"
                                    >
                                        Complete Profile
                                    </button>
                                </form>
                            </div>

                            <button
                                onClick={cancelGoogleSignup}
                                className="secondary-button"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default LoginSignUp;