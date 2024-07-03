// import React from "react";
// import { Link } from "react-router-dom";

// export const Login = () => {
//     return (
//         <div>
//             <nav className="navigationBar">
//                 Consent Management System
//             </nav>

//             <div className="loginContainer">

//             </div>
//         </div>
//     );
// }

import React, { useEffect } from 'react';
// import $ from 'jquery';
//import 'datatables.net-dt/css/jquery.dataTables.min.css';
// import 'datatables.net';
import { useNavigate } from "react-router-dom";


import './login.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';

export const Login =()=> {
//   useEffect(() => {
//     $('#example').DataTable();
//   }, []);
  const navigate = useNavigate();
   
    const gotohome=()=>{
        navigate('/home');
    };


  return (
    <div className='loginpage'>
      <div className="headerlogin" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* <img src="/static/img/IUDX_logo.jpg" alt="logo" className="logo" style={{ marginRight: '10px' }} /> */}
         <h1 style={{marginLeft:'0rem',marginTop:'0rem', fontSize: '3rem', backgroundColor: 'rgba(23, 22, 75)', color: '#ffffff', textAlign: 'center', flex: 1 ,height: '6rem'}}> 
        {/* <h1 style={{ fontSize: '2rem', textAlign: 'center', flex: 1 }}> */}
        
          Consent Management System
        </h1>
      </div>

      <div className="containerlogin">
        <form className="signup-form" action="/" method="post" autoComplete="off">
          <input type="hidden" name="csrfmiddlewaretoken" value="ls5W5IAX3rBofNSq9PbmEN2YxkkrjPdJKlct6dDqtJU06b2O5TlxemEldGjZ2A9i" />
          <div className="form-headers">
            <h1><u>SIGN IN</u></h1>
          </div>
          <div className="error-message" style={{ color: 'red' }}></div>
          <div className="form-input">
            <label>USERNAME :</label>
            <input type="text" placeholder="Abc Xyz" name="username" required />
          </div>
          <div className="form-input">
            <label>PASSWORD :</label>
            <input type="password" placeholder="abc&123" name="password" required />
          </div>
          <button className="submit-btn" type="submit" onClick={gotohome}>LOGIN</button>
          {/* <hr style={{ width: '80%', textAlign: 'left', marginLeft: '0' }} />
          <br />
          <a href="https://youtu.be/0X1C7FFhzHM">Click for Demo Walkthrough</a> Username: guest || Password: 120503
          <hr /> */}
        </form>
      </div>
    </div>
  );
}

