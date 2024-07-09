import React, { useState } from 'react';
import axios from 'axios';
import './login.css';
import { useNavigate } from "react-router-dom";

export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate(); // useNavigate hook for redirecting

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = new FormData();
        data.append('username',username);
        data.append('password', password);
   
        // try {
        //     const response = await axios.post('http://localhost:8005/login-user', {
        //         username: username,
        //         password: password
        //     }, {
        //         headers: {
        //             'Content-Type':'application/json'
                
        //           },
        //           body: JSON.stringify(response)
        //     });

        //     if (response.data.success) {
        //         setMessage('Login successful!');
        //         console.log('User data:', response.data.user);
        //         navigate('/dashboard'); // Redirect to dashboard or another page
        //     } else {
        //         setMessage(response.data.error);
        //     }
        // } catch (error) {
        //     if (error.response) {
        //         setMessage(error.response.data.error);
        //     } else {
        //         setMessage('An erronavigate('/home');r occurred. Please try again.');
        //     }
        // }




      // fetch('http://localhost:8005/login-user/',{
      //   method: 'POST',
      //   header: {
      //     'Content-Type' : 'application/json'
      //   },
      //   body : JSON.stringify(data)
      // })
      // .then(response => response.json())
      // .then((data) => {
      //   if(data.status === 200){
      //     console.log("status 200")
      //   }
      // })

    
        // Send data to the backend
        fetch('http://localhost:8005/login-user/', {
          method: 'POST',
          body: data,
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              console.log("Locker created:", data);
              // Redirect to another page or show success message
              navigate('/home');
            } else {
              console.error("Error:", data.error);
              // Show error message
              alert(data.error);
            }
          })
          .catch(error => {
            console.error("Error:", error);
            // Show error message
            alert("An error occurred while creating the locker");
          });
 

    };

    // const getCookie = (name) => {
    //     let cookieValue = null;
    //     if (document.cookie && document.cookie !== '') {
    //         const cookies = document.cookie.split(';');
    //         for (let i = 0; i < cookies.length; i++) {
    //             const cookie = cookies[i].trim();
    //             if (cookie.substring(0, name.length + 1) === (name + '=')) {
    //                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    //                 break;
    //             }
    //         }
    //     }
    //     return cookieValue;
    // };

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
                        <h1><u>SIGN IN</u></h1>
                    </div>
                    {message && <div className="error-message" style={{ color: 'red' }}>{message}</div>}
                    <div className="form-input">
                        <label>USERNAME :</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-input">
                        <label>PASSWORD :</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className="submit-btn" type="submit">LOGIN</button>
                </form>
            </div>
        </div>
    );
};
