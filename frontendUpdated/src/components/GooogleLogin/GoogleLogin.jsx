
// // export default GoogleLoginComponent;
// import React, { useContext } from 'react';
// import { useGoogleLogin } from '@react-oauth/google';
// import { useNavigate } from 'react-router-dom';
// import Cookies from 'js-cookie';
// import { apiFetch } from '../../utils/api';
// import { usercontext } from '../../usercontext';

// const GoogleLoginComponent = () => {
//     const navigate = useNavigate();
//     const { setUser } = useContext(usercontext);

//     const login = useGoogleLogin({
//         onSuccess: async (tokenResponse) => {
//             try {
//                 // Send the Google access token to the login endpoint
//                 const res = await apiFetch.post('/dj-rest-auth/google/login/', {
//                     access_token: tokenResponse.access_token,
//                 });

//                 // The backend now sends all data in one go
//                 const { access, refresh, user } = res.data; 

//                 // Store tokens and set user state from the single response
//                 Cookies.set('access_token', access, { expires: 1 / 24 });
//                 Cookies.set('refresh_token', refresh, { expires: 7 }); 
//                 setUser(user);
                
//                 // Navigate based on the 'is_profile_complete' field
//                 if (!user.is_profile_complete) {
//                     navigate('/complete-profile');
//                 } else {
//                     navigate('/home'); // Or another appropriate route
//                 }

//             } catch (err) {
//                 console.error('Login failed:', err.response?.data || err.message);
//                 if (err.response?.status === 400) {
//                     // This could be "Profile not complete" or "Account not found"
//                     const message = err.response.data.message || err.response.data.error || 'Login failed.';
//                     alert(message);
//                     navigate('/complete-profile');

//                     if (message.includes('Please complete your profile first.')) {
//                         console.log("Error", message)
//                         // The backend correctly returned a 400 for an incomplete profile
//                     }
//                 } else if (err.response?.status === 409) {
//                     alert('This account is not registered. Please sign up first.');
//                 }
                
//                 // Always clean up invalid tokens on error
//                 Cookies.remove('access_token');
//                 Cookies.remove('refresh_token');
//             }
//         },
//         onError: (error) => {
//             console.error('Google login error:', error);
//         },
//     });

//     return (
//         <button onClick={login}>
//             Sign In with Google
//         </button>
//     );
// };

// export default GoogleLoginComponent;

import React, { useContext } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { apiFetch } from '../../utils/api';
import { usercontext } from '../../usercontext';

const GoogleLoginComponent = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(usercontext);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await apiFetch.post('/dj-rest-auth/google/login/', {
                    access_token: tokenResponse.access_token,
                });

                const { access, refresh, user } = res.data;
                Cookies.set('access_token', access, { expires: 1 / 24 });
                Cookies.set('refresh_token', refresh, { expires: 7 });
                setUser(user);

                // Handle navigation based on profile completion BEFORE showing alerts
                if (!user.is_profile_complete) {
                    navigate('/complete-profile');
                } else {
                    navigate('/home');
                }
            // } catch (err) {
            //     const message = err.response?.data.message || err.response?.data.error || 'Login failed.';

            //     // Navigate first then alert to avoid blocking issues
            //     if (message.includes('Please complete your profile first.')) {
            //         navigate('/complete-profile');
            //         alert(message);
            //     } else {
            //         alert(message);
            //     }
            }catch (err) {
            const message = err.response?.data.message || err.response?.data.error || 'Login failed.';

            if (typeof message === "string" && message.toLowerCase().includes("please complete your profile first")) {
                console.log("Navigating to /complete-profile");
                navigate('/complete-profile');
                console.log("Navigation called");
                //alert(message);
            } else {
                alert(message);
            }
                Cookies.remove('access_token');
                Cookies.remove('refresh_token');
            }
        },
        onError: (error) => {
            console.error('Google login error:', error);
        },
    });

    return <button onClick={login}>Sign In with Google</button>;
};

export default GoogleLoginComponent;
