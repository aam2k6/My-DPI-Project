
import React, { useContext } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { apiFetch } from '../../utils/api';
import { usercontext } from '../../usercontext';

const GoogleSignupComponent = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(usercontext);

    const signup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await apiFetch.post('/dj-rest-auth/google/signup/', {
                    access_token: tokenResponse.access_token,
                });

                const { access, refresh, user } = res.data;
                Cookies.set('access_token', access, { expires: 1 / 24 });
                Cookies.set('refresh_token', refresh, { expires: 7 });
                setUser(user);

                if (!user.is_profile_complete) {
                    navigate('/complete-profile');
                } else {
                    alert('This account is already registered. Please log in.');
                    navigate('/');
                }
            } catch (err) {
                if (err.response?.status === 403) {
                    alert('This account is already registered. Please log in.');
                    navigate('/');
                }
                Cookies.remove('access_token');
                Cookies.remove('refresh_token');
            }
        },
        onError: (error) => {
            console.error('Google signup error:', error);
        },
    });

    return <button onClick={signup}>Sign Up with Google</button>;
};

export default GoogleSignupComponent;
