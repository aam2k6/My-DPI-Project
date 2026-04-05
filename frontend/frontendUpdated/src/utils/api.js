
// /* +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
// import axios from 'axios';
// import Cookies from 'js-cookie';
// import { frontend_host } from '../config'; // Import the variable

// export const apiFetch = axios.create({
//   baseURL: frontend_host
// });

// // Request: attach access token from JS cookies
// apiFetch.interceptors.request.use(
//   (config) => {
//     const accessToken = Cookies.get('access_token'); // JS cookie
//     if (accessToken) {
//       config.headers.Authorization = `Bearer ${accessToken}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Response: handle token expiry using refresh token from JS cookies
// apiFetch.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response && error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         // Get refresh token from JS cookie
//         const refreshToken = Cookies.get('refresh_token');

//         if (!refreshToken) {
//           throw new Error("No refresh token available");
//         }

//         // Call refresh endpoint with refresh token in body
//         const res = await axios.post(
//           `${frontend_host}/api/token/refresh/`,
//           { refresh: refreshToken } // Send JS cookie token in body
//         );

//         const newAccessToken = res.data.access;

//         // Store new access token in JS cookie
//         Cookies.set('access_token', newAccessToken, { expires: 1 / 24 });

//         // Attach updated access token to the original request
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//         return apiFetch(originalRequest);

//       } catch (refreshError) {
//         // Failed to refresh → clear tokens and redirect to login
//         Cookies.remove('access_token');
//         Cookies.remove('refresh_token');
//         window.location.href = '/';
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

import axios from 'axios';
import Cookies from 'js-cookie';
import { frontend_host } from '../config';

// Create Axios instance
export const apiFetch = axios.create({
  baseURL: frontend_host
});

// -------- Refresh Token Queue Control --------
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

// -------- Request Interceptor: Attach Access Token --------
apiFetch.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get('access_token'); // from JS cookies
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// -------- Response Interceptor: Handle 401 and Refresh --------
apiFetch.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 from API, avoid infinite loop
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If refresh is already happening, queue the request
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiFetch(originalRequest));
          });
        });
      }

      // Start refresh process
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token found');
        }

        // Send refresh request with refresh token in body
        const res = await axios.post(
          `${frontend_host}/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = res.data.access;

        // Store new access token in JS cookie
        Cookies.set('access_token', newAccessToken, { expires: 1 / 24 });

        // Update all queued requests with the new token
        onRefreshed(newAccessToken);

        isRefreshing = false;

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiFetch(originalRequest);

      } catch (refreshError) {
        // Refresh failed — clear cookies & redirect to login
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        isRefreshing = false;
        refreshSubscribers = [];
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
