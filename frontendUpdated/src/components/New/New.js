import React, { useState, useContext, useEffect } from 'react';
import './New.css';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { apiFetch } from '../../utils/api';
import { usercontext } from '../../usercontext';
import GoogleSignupComponent from '../GooogleLogin/GoogleSignup';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLoginComponent from '../GooogleLogin/GoogleLogin';
import { Box, Grid } from '@mui/material';
import IIITLogo from '../../assets/iiitb_image.png';
import WebScienceLogo from '../../assets/Web_science_image.png';

const New = () => {
    const navigate = useNavigate();
    const {user, setUser } = useContext(usercontext);
    // State management
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
    // const { user, setUser } = useContext(usercontext);
    // Form data states
    const [signInData, setSignInData] = useState({ email: '', password: '' });
    const [signUpData, setSignUpData] = useState({ email: '',username:'', password: '', description: '' });
    const [googleDescription, setGoogleDescription] = useState('');

    // Mock Google accounts data

console.log("Megha", showDescriptionStep)
    useEffect(() => {
            if (user?.is_profile_complete && completeProfile) {
                navigate('/home');
            }
        }, [user, navigate]);
    const googleAccounts = [
        {
            id: 'sachin.poojary',
            name: 'Sachin Poojary',
            email: 'sachikrishna1997@gmail.com',
            avatar: 'S',
            color: '#8e24aa'
        },
        {
            id: 'sachin.p',
            name: 'sachin p',
            email: 'sachinkundar001@gmail.com',
            avatar: 'S',
            color: '#f57c00'
        }
    ];

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
    console.log("Megha", message)
  showMessage('error', message);
};


const handleGoogleSignup = (user) => {
    if (!user.is_profile_complete) {
        console.log("Megha", user)
        showMessage('info', 'Please complete your profile to continue');
        setShowDescriptionStep(true);
    }else {
        showMessage('success', `Signup successful!, Please sign in to continue`);
    setTimeout(() => {
        setActiveTab('signin');
    }, 2000);
    }

}

const handleGoogleSignupError = (message) => {
    showMessage('error', message);
}

// const handleGoogleLogin = (user) => {
//     // showMessage('success', `Welcome back, ${user.name}!`);
//     if (!user.is_profile_complete) {
//         showMessage('info', 'Please complete your profile to continue')
//     //   navigate('/complete-profile');
//       setCompleteProfile(true)
//     } else {
//        showMessage('success', `Welcome back, ${user?.username}!`);
  
//   setTimeout(() => {
//     navigate('/home');
//   }, 2000); // waits 2 seconds before navigating

//     }
//   };
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
                    '/dj-rest-auth/google/complete-profile/',
                    { username, description },
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );
    
                if (response.status === 200) {
                    setMessage("Profile updated successfully!");
                    setUser({ ...user, username, description, is_profile_complete: true });
                    showMessage('success', `Welcome back, ${username}!`);
  
  setTimeout(() => {
    navigate('/home');
  }, 2000); // waits 2 seconds before navigating
                }
            } catch (error) {
                setMessage(error.response?.data?.error || "Failed to update profile.");
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
    const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await apiFetch.post("/login-user/", {
        username: signInData.email,
        password: signInData.password,
      });

      if (response.status === 200) {
        const { access, refresh, user } = response.data;

        Cookies.set("access_token", access, { expires: 1 / 24 });
        Cookies.set("refresh_token", refresh, { expires: 7 });
        localStorage.setItem("curruser", JSON.stringify(user));
        setUser(user);

       showMessage('success', `Welcome back, ${user?.username}!`);
    setTimeout(() => {
      navigate('/home');
    }, 2000);
      }
    } catch (error) {
    //   console.error("Login Error:", error.response?.data || error.message);
      showMessage("error", error.response?.data?.error || "Invalid credentials.");
    }
  };

    // Handle sign up
    const handleSignUps = () => {
        if (!signUpData.email || !signUpData.password || !signUpData.description) {
            showMessage('error', 'Please fill in all fields');
            return;
        }

        showMessage('success', 'Creating your account...');

        setTimeout(() => {
            showMessage('success', 'Account created successfully! Welcome aboard!');
            console.log('Sign Up Data:', signUpData);
        }, 1000);
    };

    // 🔹 SIGNUP
const handleSignup = async (event) => {
  event.preventDefault();

  if (signUpData.password !== signUpData.confirmPassword) {
    showMessage('error', 'Passwords must match.');
    return;
  }

  showMessage('success', 'Creating your account...');
setTimeout(async() => {
  try {
    const response = await apiFetch.post("/signup-user/", {
      username: signUpData.username,
      email: signUpData.email,
      password: signUpData.password,
      description: signUpData.description,
    });

    if (response.status === 201) {
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


    // Show Google account selection modal
    const showGoogleAccountModal = () => {
        setShowGoogleModal(true);
    };

    // Hide Google account selection modal
    const hideGoogleAccountModal = () => {
        setShowGoogleModal(false);
    };

    // Select Google account
    const selectGoogleAccount = (account) => {
        const selectedUser = {
            ...account,
            picture: `https://via.placeholder.com/50x50/${account.color.substring(1)}/ffffff?text=${account.avatar}`
        };

        hideGoogleAccountModal();
        setGoogleUser(selectedUser);

        if (activeTab === 'signup') {
            showMessage('success', `Authenticated as ${selectedUser.name}`);
            setTimeout(() => {
                setShowDescriptionStep(true);
            }, 1000);
        } else {
            showMessage('success', `Welcome back, ${selectedUser.name}!`);
            console.log('Google Sign In:', selectedUser);
        }
    };

    // Add new Google account
    const addGoogleAccount = () => {
        hideGoogleAccountModal();
        showMessage('success', 'Redirecting to Google account selection...');

        setTimeout(() => {
            const newUser = {
                id: 'new.user',
                name: 'New User',
                email: 'newuser@gmail.com',
                picture: 'https://via.placeholder.com/50x50/4285f4/ffffff?text=NU',
                avatar: 'NU',
                color: '#4285f4'
            };

            setGoogleUser(newUser);
            showMessage('success', 'New account authentication completed!');

            if (activeTab === 'signup') {
                setTimeout(() => {
                    setShowDescriptionStep(true);
                }, 500);
            } else {
                console.log('Google Sign In (New Account):', newUser);
            }
        }, 2000);
    };

    // const googleSignup = useGoogleLogin({
    //         onSuccess: async (tokenResponse) => {
    //             try {
    //                 const res = await apiFetch.post('/dj-rest-auth/google/signup/', {
    //                     access_token: tokenResponse.access_token,
    //                 });
    
    //                 const { access, refresh, user } = res.data;
    //                 Cookies.set('access_token', access, { expires: 1 / 24 });
    //                 Cookies.set('refresh_token', refresh, { expires: 7 });
    //                 setUser(user);
    
    //                 if (!user.is_profile_complete) {
    //                     navigate('/complete-profile');
    //                 } else {
    //                     alert('This account is already registered. Please log in.');
    //                     navigate('/');
    //                 }
    //             } catch (err) {
    //                 if (err.response?.status === 403) {
    //                     alert('This account is already registered. Please log in.');
    //                     navigate('/');
    //                 }
    //                 Cookies.remove('access_token');
    //                 Cookies.remove('refresh_token');
    //             }
    //         },
    //         onError: (error) => {
    //             console.error('Google signup error:', error);
    //         },
    //     });

    // Complete Google signup
    const completeGoogleSignup = () => {
        if (!googleDescription.trim()) {
            showMessage('error', 'Please provide a description about yourself.');
            return;
        }

        showMessage('success', 'Completing your registration...');

        setTimeout(() => {
            showMessage('success', `Welcome ${googleUser.name}! Your account has been created successfully.`);

            console.log('Google Signup Complete:', {
                ...googleUser,
                description: googleDescription,
                signupMethod: 'google'
            });

            resetGoogleSignup();
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
        <div className="headerlogins">
      <h1>Anumati - Consent Management System</h1>
    </div>
        {/* <Grid container alignItems="center" justifyContent="center" className="logo-container headerlogins">
  <Grid item xs={12} sm={4} md={3}>
    <img className="iiitlogo" src={IIITLogo} alt="IIIT Logo" />
  </Grid>  <Grid item xs={12} sm={4} md={3}>
    <img className="websciencelogo" src={WebScienceLogo} alt="Web Science Logo" />
  </Grid>

  <Grid item xs={12} sm={4} md={6} container justifyContent="center">
    <div className="">
      <h1>Anumati - Consent Management System</h1>
    </div>
  </Grid>



</Grid> */}


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
                        onClick={() => switchTab('signin')}
                        className={`tab ${activeTab === 'signin' ? 'active' : ''}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => {switchTab('signup'); setCompleteProfile(false)}}
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
                        {/* <button
                            type="button"
                            onClick={showGoogleAccountModal}
                            className="google-button"
                        >
                            <svg className="google-icon" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button> */}

                        <GoogleOAuthProvider clientId="191215085646-hngqosqgf5nhn648vqekr1tulslmofjb.apps.googleusercontent.com">
                        
                        <GoogleLoginComponent onLoginSuccess={handleGoogleLogin}  onLoginError={handleGoogleError}></GoogleLoginComponent>
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
                                    placeholder="Enter description..."
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
                                placeholder="Enter description..."
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



                        {/* <div className="row">
                            <label className="col-sm-3 col-form-label">Description</label>
                            <div className="col-sm-9">
                            <input
                                value={signUpData.description}
                                onChange={(e) => setSignUpData({ ...signUpData, description: e.target.value })}
                                required
                                placeholder="Enter description..."
                                className="form-input"
                            />
                            </div>
                        </div> */}

                        <button
                            // onClick={handleSignUp}
                            className="primary-button"
                            type='submit'
                        >
                            Create Account
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

                        {/* {googleUser && (
                            <div className="google-user-info">
                                <div className="user-info-flex">
                                    <img
                                        src={googleUser.picture}
                                        alt={googleUser.name}
                                        className="user-image"
                                    />
                                    <div>
                                        <div className="user-name">{googleUser.name}</div>
                                        <div className="user-email">{googleUser.email}</div>
                                    </div>
                                </div>
                            </div>
                        )} */}

                         <div className="form-container">
                <form onSubmit={handleSubmit}>
                 <div className="row">
                            <label className="col-sm-3 col-form-label">Username</label>
                            <div className="col-sm-9">
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
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
                                    placeholder="Enter description..."
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

export default New;