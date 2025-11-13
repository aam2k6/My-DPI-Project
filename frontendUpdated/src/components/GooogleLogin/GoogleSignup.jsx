
import React, { useContext } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { apiFetch } from '../../utils/api';
import { usercontext } from '../../usercontext';
import { useAuth } from '../../contexts/Authcontext';
const GoogleSignupComponent = ({onSignupSuccess, onSignupError}) => {
    const navigate = useNavigate();
    const { setUser } = useContext(usercontext);
    const { login } = useAuth();
    const signup = useGoogleLogin({
        flow: 'auth-code',
        // scope: 'https://www.googleapis.com/auth/drive.file',
        onSuccess: async (codeResponse) => {
            try {
                const res = await apiFetch.post('/dj-rest-auth/google/signup/', {
                    // access_token: codeResponse.access_token,
                    code: codeResponse.code,
                });

                const { access, refresh, user } = res.data;
                Cookies.set('access_token', access, { expires: 1 / 24 });
                Cookies.set('refresh_token', refresh, { expires: 7 });
                setUser(user);

                login(user, access);
                onSignupSuccess(user);
                // localStorage.setItem("googleAccessToken", codeResponse.access_token);

                // if (!user.is_profile_complete) {
                //     navigate('/complete-profile');
                // } else {
                //     alert('This account is already registered. Please log in.');
                //     navigate('/');
                // }
            } catch (err) {
                // if (err.response?.status === 403) {
                //     alert('This account is already registered. Please log in.');
                //     navigate('/');
                // }
                console.log("Error", err);
                 const message =
                    err.response?.data?.detail ||
                    'Sign up failed.';

                Cookies.remove('access_token');
                Cookies.remove('refresh_token');

                if (onSignupError) {
                    onSignupError(message);  // ✅ send error back to parent
                }
                Cookies.remove('access_token');
                Cookies.remove('refresh_token');
            }
        },
        onError: (error) => {
           if (onSignupError) {
                onSignupError('Google login failed. Please try again.');
            }
        },
    });

    return (
    <>
        <button
                            type="button"
                            onClick={signup}
                            className="google-button"
                        >
                            <svg className="google-icon" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign up with Google
                        </button>
    </>
    );
};

export default GoogleSignupComponent;
