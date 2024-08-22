import React, { useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';
import { usercontext } from "../../usercontext";
import "./page4.css";
import Navbar from '../Navbar/Navbar';


export const UploadResource = () => {
  const location = useLocation();
  const locker = location.state ? location.state.locker : null;
  const { curruser, setUser } = useContext(usercontext);
  const [resourceName, setResourceName] = useState("");
  const [document, setDocument] = useState(null);
  const [visibility, setVisibility] = useState("public"); // Default value set to Public
  const navigate = useNavigate();



  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, [curruser, navigate]);



  const handleSubmit = (event) => {
    event.preventDefault();

    const data = new FormData();
    data.append('locker_name', locker.name);
    data.append('resource_name', resourceName);
    data.append('type', visibility);
    data.append('document', document);

    const token = Cookies.get('authToken');

    fetch('http://172.16.192.201:8000/upload-resource/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${token}`
      },
      body: data,
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log("Resource uploaded:", data);
        navigate("/view-locker",{state: {locker}});
      } else {
        console.error("Error:", data.error);
        alert(data.error);
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("An error occurred while uploading the resource");
    });
  };


  
  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
  };


  const content = (
    <>
    <div className="navbarLockerName">Locker: {locker.name}</div>
          <div className="navbarLockerOwner">Owner: {curruser.username}</div>
    </>
  );

  return (
    <div>
    <Navbar content = {content} />

      <div className="descriptionLocker">
        <p>{locker.description}</p>
      </div>

      <div className="page4heroContainer">
        <div className="page4resourceHeading">Resources</div>
        <div className="page4lockerForm">
          <form onSubmit={handleSubmit}>
            <label>
              <span>Name</span>
              <input
                type="text"
                name="resourceName"
                placeholder="Resource Name"
                onChange={(e) => setResourceName(e.target.value)}
                required
              />
            </label>
            <label>
              <span>Select File</span>
              <input
                type="file"
                name="document"
                onChange={(e) => setDocument(e.target.files[0])}
                required
              />
            </label>
            <label>
              <span>Visibility</span>
              <select
                name="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                required
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
            <button type="submit">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};
