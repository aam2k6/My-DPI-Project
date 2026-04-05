import React, { useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
// import { gapi } from 'gapi-script';
import useDrivePicker from 'react-google-drive-picker';
import { useNavigate, useLocation } from 'react-router-dom';
import { usercontext } from "../../usercontext";
import "./page4.css";
import Navbar from '../Navbar/Navbar';
import Modal from '../Modal/Modal';
import { frontend_host } from '../../config';
import { Grid, TextField, Button, Select, MenuItem, InputLabel, Typography, Box, Container } from '@mui/material';
import { Padding } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../Sidebar/Sidebar';
import { apiFetch } from "../../utils/api"

export const UploadResource = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  const location = useLocation();
  const locker = location.state ? location.state.locker : null;
  const { curruser, setUser } = useContext(usercontext);
  const [resourceName, setResourceName] = useState("");
  const [document, setDocument] = useState(null);
  const [visibility, setVisibility] = useState("private");
  const [validityTime, setValidityTime] = useState(null);
  const navigate = useNavigate();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [permissions, setPermissions] = useState({
    share: true,
    download: false,
    subset: true,
    confer: true,
    collateral: true,
    transfer: true,
  });
  const [visibilityModal, setVisibilityModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [notifications, setNotifications] = useState([]);
   const [openPicker, authResponse] = useDrivePicker();
  const [selectFile, setSelectFile] = useState([]);

  
  const clientId = "191215085646-3hhsj0k4r4u9gbarpvohc6mn2lemb8b5.apps.googleusercontent.com";
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  

  // useEffect(() => {
  //   const storedToken = localStorage.getItem("googleAccessToken");
  //   setToken(storedToken);
  // }, []);

  // const getValidGoogleToken = async () => {
  //   try {
  //     const res = await apiFetch.get("/auth/google/refresh/");
  //     return res.data.access_token; // backend returns valid Google token
  //   } catch (err) {
  //     console.error("Failed to get Google token:", err);
  //     alert("Please reconnect your Google account.");
  //     return null;
  //   }
  // };
  
  // useEffect(() => {
  //   const getToken = async () => {
  //     try {
  //       const res = await apiFetch.get("dj-rest-auth/google/get-valid-google-access-token/");
  //       setToken(res.data.access_token); // backend returns valid Google token
  //       console.log("Google token:", res.data.access_token);
  //     } catch(err) {
  //       console.error("Failed to get Google token:", err);
  //       alert("Please reconnect your Google account.");
  //   }
  // }
//   if (curruser) {
//       getToken();
//     }
// }, []);
useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await apiFetch.get(`/notification/list/`);

        if (response.ok) {
          console.log("response", response.data)
          const data = response.data;
          if (data.success) {
            setNotifications(data.notifications || []);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications");
      }
    };

    if (curruser) {
      fetchNotifications();
    }
  }, [curruser, isSidebarOpen]);
  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, [curruser, navigate]);

  console.log("JSON Data", JSON.stringify(permissions))

  const handleOpenPicker = async () => {
  try {
    // 1️⃣ Get a fresh valid Google token from backend
    const res = await apiFetch.get("auth/google/get-valid-google-access-token/");
    const googleToken = res.data.access_token;


    if (!googleToken) {
      alert("Please reconnect your Google account.");
      return;
    }

    // 2️⃣ Open the Google Picker with the valid token
    openPicker({
      clientId: clientId,
      developerKey: "AIzaSyCvZMxa3Ki9fSMYUXw6UKHZrzCuQJa5Cbk",
      token: googleToken, // ✅ use fresh token
      viewId: "PDF", // lowercase
      showUploadFolders: true,
      supportDrives: true,
      callbackFunction: (data) => {
        console.log("data:", data);
        if (data.action === "picked") {
          console.log("Picked files:", data.docs);
          setSelectFile(data.docs);
        }
      },
    });

  } catch (err) {
    console.error("Failed to get Google token:", err);
    alert("Please reconnect your Google account.");
  }
};

//  const handleOpenPicker = async () => {
//   // const googleToken = await getValidGoogleToken();
//   //   if (!googleToken) return;
//     openPicker({
//       clientId: clientId,
//       developerKey: "AIzaSyCvZMxa3Ki9fSMYUXw6UKHZrzCuQJa5Cbk",
//       token: token,
//       viewId: "PDF",  // ✅ lowercase "viewId", not "viewID"
//       showUploadFolders: true,
//       // showUploadView: true,
//       supportDrives: true,
//       callbackFunction: (data) => {
//         console.log("data:", data);
//         if (data.action === "picked") {
//           console.log("Picked files:", data.docs);
//           setSelectFile(data.docs);
//         }
//       },
//     });
//   };
const handleSubmit = (e) => {
  e.preventDefault();
  uploadResource();  // open popup
};

const uploadResource = ()=>{
  if (!selectFile.length) {
    alert("Please select a file from Google Drive.");
    return;
  }
    if(visibility==="private"){
      setModalMessage(`Set to ${visibility}? Only permitted users can access this resource.`);
      setVisibilityModal(true);
    }else{
      setModalMessage(`Set to ${visibility}? All users can access this resource.`);
      setVisibilityModal(true);
    }
}

  const submitResource = async (event) => {
    // event.preventDefault();
    // if (document && document.type !== 'application/pdf') {
    //   setErrorModalMessage('Only PDF files are allowed.');
    //   setIsErrorModalOpen(true);
    //   return;
    // }
 try {
    const data = new FormData();
    data.append('locker_name', locker.name);
    data.append('resource_name', resourceName);
    data.append('type', visibility);
    // data.append('document', document);
    data.append('validity_time', validityTime); // Add validity time
    // data.append("reshare", permissions.reshare);
    // data.append("download", permissions.download);
    // data.append("aggregate", permissions.aggregate);
    data.append('post_conditions', JSON.stringify(permissions))
    data.append('drive_file_id', selectFile[0]?.id);
    data.append('drive_file_name', selectFile[0]?.name);
    data.append('drive_mime_type', selectFile[0]?.mimeType);
    data.append('drive_owner_email', curruser?.email);
   
    const response =  await apiFetch.post('/resource/upload/', data)
     const resData = response.data
      if (resData.success) {
          console.log("Resource uploaded:", resData);
          navigate("/view-locker", { state: { locker } });
        } else {
          console.error("Error:", resData.error);
          alert(resData.error);
        }
      } catch(error) {
        console.error("Error:", error);
        alert(error?.response?.data?.error || "An error occurred while uploading the resource");
      };
  };

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [name]: checked,
    }));
  };

  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
  };
const handleModalSubmit = () => {
  setVisibilityModal(false);
  submitResource();   // final submit
};


const handleModalCancel = () => {
  setVisibilityModal(false);
};



  const content = (
    <>
      <div className="navbarBrands">Locker: {locker.name}</div>
      <div className="navbarBrands">Owner: {capitalizeFirstLetter(curruser.username)}</div>
      {/* <span className='uploadDescription'><p>{locker.description}</p></span> */}
    </>
  );

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleClick(locker)} class="breadcrumb-item">View Locker</span>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">Upload Resource</span>
    </div>
  )

  return (
    <div>
      <div className={`user-greeting-container shadow ${isSidebarOpen ? "d-none" : ""}`}>
        <button
            className="hamburger-btn me-2 position-relative"
            onClick={toggleSidebar}
        >
            <FontAwesomeIcon icon={faBars} />
            {notifications.some((n) => !n.is_read) && (
                <span className="notification-dot"></span>
            )}
        </button>
        <span className="fw-semibold fs-6 text-dark">
          Hi, {capitalizeFirstLetter(curruser.username)}
        </span>
      </div>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
      />
      <div className="locker-header">
        <div className="locker-text">
          <div className="navbar-content">{content}</div>
        </div>
        <div className="navbar-breadcrumbs">{breadcrumbs}</div>
      </div>
      {/* <Navbar content={content} breadcrumbs={breadcrumbs} /> */}
      {isErrorModalOpen && (
        <Modal
          message={errorModalMessage}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}

      <div style={{ marginTop: "50px" }}>
        {/* <div className='uploadDescriptions'>
          <p>{locker.description}</p>
        </div> */}
        <div className="container">
          <Box className="row justify-content-center" margin={{ md: "0", xs: "1px" }}>
            <div className="col-md-8 col-sm-12 p-4 border border-primary rounded shadow">
              <h2 className="text-center mb-4 page4resourceHeading">Resources</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="resourceName" className="form-label fw-bold">Resource Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="resourceName"
                    placeholder="Enter resource name"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    required
                  />
                </div>
                {/* <div className="mb-3">
                  <label htmlFor="document" className="form-label fw-bold">Select File</label>
                  <button onClick={handleOpenPicker}>Select from google drive</button>
                <p>{selectFile[0]?.name}</p>
                  
                </div> */}
              {/* <div className="mb-3">
                <label htmlFor="document" className="form-label fw-bold">Select File</label>
                <div className="input-group" id="google-drive-picker">
                  <input
                  type="text"
                  className="form-control"
                  placeholder="No file selected"
                  value={selectFile[0]?.name || ""}
                  readOnly
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleOpenPicker}
                    >
                    Select from Google Drive
                  </button>
                </div>
              </div> */}

              <div className="mb-3">
  <label htmlFor="document" className="form-label fw-bold">Select File</label>
  <div className="input-group">
    <input
      type="text"
      className="form-control"
      placeholder="No file selected"
      value={selectFile[0]?.name || ""}
      readOnly
      required
    />
    <button
      type="button"
      className="btn google-drive-btn d-flex align-items-center justify-content-center gap-2"
      onClick={handleOpenPicker}
    >
      <img
        src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
        alt="Google Drive"
        width="20"
        height="20"
      />
      <span>Choose from Drive</span>
    </button>
  </div>
</div>



                <div className="mb-3">
                  <label htmlFor="visibility" className="form-label fw-bold">Visibility</label>
                  <select
                    className="form-select"
                    id="visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    required
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                    
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="validityTime" className="form-label fw-bold">Validity Time</label>
                  <input
                    type="date"
                    className="form-control"
                    id="validityTime"
                    value={validityTime}
                    onChange={(e) => setValidityTime(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-3">
                  <label className="form-label fw-bold mb-2">Permissions</label>
                  <Grid container md={8} sm={8} xs={12} style={{ marginLeft: "3px" }}>
                  <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="transfer"
                        name="transfer"
                        checked={permissions.transfer}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.transfer ? "checked" : ""}`} htmlFor="transfer">
                        Transfer
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="subset"
                        name="subset"
                        checked={permissions.subset}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.subset ? "checked" : ""}`} htmlFor="subset">
                        Subset
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="share"
                        name="share"
                        checked={permissions.share}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.share ? "checked" : ""}`} htmlFor="share">
                        Reshare
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="confer"
                        name="confer"
                        checked={permissions.confer}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.confer ? "checked" : ""}`} htmlFor="confer">
                        Confer
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="collateral"
                        name="collateral"
                        checked={permissions.collateral}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.collateral ? "checked" : ""}`} htmlFor="collateral">
                        Collateral
                      </label>
                    </Grid>
                    {/* <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="transfer"
                        name="transfer"
                        checked={permissions.transfer}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.transfer ? "checked" : ""}`} htmlFor="transfer">
                        Transfer
                      </label>
                    </Grid> */}
                  </Grid>
                </div>



                <div className="text-center">
                  <button type="submit" className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </Box>
        </div>
      </div>

   {visibilityModal && (
  <div className="edits-modal">
    <div className="modal-content">
      <p>{modalMessage}</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
        <button className="btn btn-primary p-2" onClick={handleModalSubmit}>
          Submit
        </button>

        <button className="btn btn-secondary p-2" onClick={handleModalCancel}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
};
