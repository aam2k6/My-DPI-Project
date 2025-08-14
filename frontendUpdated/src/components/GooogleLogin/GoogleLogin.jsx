// // components/GooogleLogin/GoogleLogin.js
// import React, { useContext } from 'react';
// import { useGoogleLogin } from '@react-oauth/google';
// import axios from 'axios';
// import Cookies from 'js-cookie'; // Import Cookies library
// import { useNavigate } from 'react-router-dom';
// import { usercontext } from '../../usercontext';
// import { frontend_host } from "../../config";

// const GoogleLoginComponent = () => {
//     const navigate = useNavigate();
//     const { setUser } = useContext(usercontext);

//     const login = useGoogleLogin({
//         onSuccess: async (tokenResponse) => {
//             try {
//                 // Step 1: Send the Google access token to your backend to get JWTs.
//                 const res = await axios.post(`${frontend_host}/dj-rest-auth/google/`, {
//                     access_token: tokenResponse.access_token,
//                 });
//                 
//                 // The backend returns 'access' and 'refresh' tokens
//                 const { access, refresh } = res.data; 

//                 // Store the JWTs in cookies
//                 Cookies.set('access_token', access, { expires: 1/24 });
//                 Cookies.set('refresh_token', refresh, { expires: 7 }); 
//                 
//                 // Step 2: Use the new JWT to fetch user details.
//                 const userRes = await axios.get(`${frontend_host}/dj-rest-auth/user/`, {
//                     headers: {
//                         // Use the 'Bearer' prefix for JWT authentication
//                         Authorization: `Bearer ${access}`,
//                     },
//                 });

//                 if (userRes.status === 200) {
//                     console.log('User data fetched successfully:', userRes.data);
//                     setUser(userRes.data);
//                     navigate('/home');
//                 } else {
//                     console.log("Failed to fetch user details.");
//                 }
//             } catch (err) {
//                 console.error('Google login failed:', err.response?.data || err.message);
//             }
//         },
//         onError: (error) => {
//             console.error('Google login error:', error);
//         },
//         flow: 'implicit',
//     });

//     return (
//         <button onClick={login}>
//             Sign in with Google
//         </button>
//     );
// };

// export default GoogleLoginComponent;/


// -----------------------------------------------------------------------------------------------------------------------------

// components/GooogleLogin/GoogleLogin.js

import React, { useContext } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {apiFetch} from '../../utils/api'; // Import the centralized API instance
import { usercontext } from '../../usercontext';
// import { backend_api_url } from "../../config"; // Import the correct backend URL

const GoogleLoginComponent = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(usercontext);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                // Step 1: Send the Google access token to your backend
                // Use the centralized 'api' instance for the API call
                const res = await apiFetch.post('/dj-rest-auth/google/', {
                    access_token: tokenResponse.access_token,
                });
                
                const { access, refresh } = res.data; 

                // Store the JWTs in cookies
                Cookies.set('access_token', access, { expires: 1 / 24 });
                Cookies.set('refresh_token', refresh, { expires: 7 }); 
                
                // Step 2: Use the centralized 'api' instance to fetch user details
                // The interceptor will automatically add the Authorization header
                const userRes = await apiFetch.get('/dj-rest-auth/user/');

                if (userRes.status === 200) {
                    console.log('User data fetched successfully:', userRes.data);
                    setUser(userRes.data);
                    navigate('/home');
                } else {
                    console.log("Failed to fetch user details.");
                }
            } catch (err) {
                console.error('Google login failed:', err.response?.data || err.message);
                // On failure, clear any cookies that might have been set
                Cookies.remove('access_token');
                Cookies.remove('refresh_token');
            }
        },
        onError: (error) => {
            console.error('Google login error:', error);
        },
        flow: 'implicit',
    });

    return (
        <button onClick={login}>
            Sign in with Google
        </button>
    );
};

export default GoogleLoginComponent;