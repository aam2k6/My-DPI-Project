import React, { useEffect, useState, useContext } from 'react';
import { usercontext } from '../../usercontext';
import Cookies from 'js-cookie';
import './SettingsPage.css';
import Navbar from '../Navbar/Navbar';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import { frontend_host } from '../../config';
import { Button, Box } from '@mui/material';
import Sidebar from '../Sidebar/Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { apiFetch } from '../../utils/api';

export default function SettingsPage() {
    const { curruser, setUser } = useContext(usercontext);

    const [mode, setMode] = useState('VIEW'); // 'VIEW' or 'EDIT'
    const [newUsername, setNewUsername] = useState('');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    // DPDP Fields
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [disability, setDisability] = useState('');
    const [guardianUsername, setGuardianUsername] = useState('');
    const [guardianDescription, setGuardianDescription] = useState('');
    
    // DPDP Checker Box State
    const [showDpdpBox, setShowDpdpBox] = useState(false);
    const [dpdpCheckState, setDpdpCheckState] = useState('IDLE'); // 'NEEDS_DATA', 'COMPLIANT', 'NON_COMPLIANT'

    // Layout States
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState("Home");
    const [openSubmenus, setOpenSubmenus] = useState({
        directory: false,
        settings: false,
    });
    const [notifications, setNotifications] = useState([]);

    const capitalizeFirstLetter = (string) => {
        if (!string) return "";
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const toggleSubmenu = (menu) =>
        setOpenSubmenus((prev) => ({
            ...prev,
            [menu]: !prev[menu],
        }));

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await apiFetch.get(`/notification/list/`);
                if (response.status >= 200 && response.status < 300) {
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
        if (curruser) {
            setNewUsername(curruser.username || '');
            setDescription(curruser.description || '');
            setAge(curruser.age || '');
            setGender(curruser.gender || '');
            setDisability(curruser.disability || '');
            setGuardianUsername(curruser.guardian_username || '');
            setGuardianDescription(curruser.guardian_description || '');
        }
    }, [curruser]);

    if (!curruser) {
        return <div>Loading...</div>;
    }

    const handleCancel = () => {
        if (curruser) {
            setNewUsername(curruser.username || '');
            setDescription(curruser.description || '');
            setAge(curruser.age || '');
            setGender(curruser.gender || '');
            setDisability(curruser.disability || '');
            setGuardianUsername(curruser.guardian_username || '');
            setGuardianDescription(curruser.guardian_description || '');
        }
        setMode('VIEW');
        setErrorMessage('');
    };

    const onAgeChange = (e) => {
        const val = e.target.value;
        if (val === '' || /^[0-9]+$/.test(val)) {
            setAge(val);
        }
    };

    // Core API save function
    const finalizeSave = async () => {
        const updatedUser = {
            username: curruser.username,
            new_name: newUsername,
            new_description: description,
            new_password: password,
            age: age,
            gender: gender,
            disability: disability,
            guardian_username: guardianUsername,
            guardian_description: guardianDescription
        };

        try {
            const response = await apiFetch.put('/auth/signup/', updatedUser);
            const data = response.data;
            if (data.success) {
                setUser({ ...curruser, ...updatedUser, username: newUsername });
                setMode('VIEW');
                setErrorMessage('');
                alert("Profile updated successfully.");
                return true;
            } else {
                console.error("Error:", data.error);
                setErrorMessage(data.error);
                alert(data.error);
                return false;
            }
        } catch (error) {
            console.error("Error:", error);
            setErrorMessage("An error occurred during profile update.");
            alert("An error occurred during profile update.");
            return false;
        }
    };

    const handleMainSave = async () => {
        await finalizeSave();
    };

    // --- DPDP Check Logic ---
    const handleDpdpCheckClick = () => {
        setMode('VIEW'); // Exit normal edit mode
        setErrorMessage('');
        
        // Check current data state
        if (!age || !gender || !disability) {
            setDpdpCheckState('NEEDS_DATA');
        } else if (parseInt(age, 10) >= 18 && disability === 'No') {
            setDpdpCheckState('COMPLIANT');
        } else {
            setDpdpCheckState('NON_COMPLIANT');
        }
        setShowDpdpBox(true);
    };

    const handleCheckComplianceInsideBox = async () => {
        if (!age || !gender || !disability) {
            setErrorMessage("Please fill out all DPDP fields (Age, Gender, Disability).");
            return;
        }

        if (parseInt(age, 10) >= 18 && disability === 'No') {
            setDpdpCheckState('COMPLIANT');
            await finalizeSave(); // Save newly entered age/gender/disability
        } else {
            setDpdpCheckState('NON_COMPLIANT');
            // State transitions to NON_COMPLIANT to ask for guardian details
        }
    };

    const handleGuardianSave = async () => {
        if (!guardianUsername || !guardianDescription) {
            setErrorMessage("Please fill out Guardian/Scribe details.");
            return;
        }
        const success = await finalizeSave();
        if (success) {
            setShowDpdpBox(false);
        }
    };

    const handleEditToggle = () => {
        setMode('EDIT');
        setShowDpdpBox(false); // Close DPDP box if opening Edit mode
    };

    const breadcrumbs = (
        <div className="breadcrumbs">
            <a href="/home" className="breadcrumb-item">
                Home
            </a>
            <span className="breadcrumb-separator">▶</span>
            <span className="breadcrumb-item current">User Settings</span>
        </div>
    );

    const content = (
        <>
            <div className="navbarBrands">User Settings</div>
        </>
    );

    return (
        <>
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

            {/* MAIN USER PROFILE BOX */}
            <Box className="settings-page" style={{ border: "2px solid rgb(107, 120, 231)" }} marginTop={{ xs: "1%", md: "5%" }}>
                <h1>User Profile</h1>
                {errorMessage && mode === 'EDIT' && <div className="error-message">{errorMessage}</div>}
                
                <div style={{ alignItems: "center" }}>
                    <div className="profile-info">
                        <label>Username:</label>
                        {mode === 'EDIT' ? (
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                        ) : (
                            <p>{newUsername}</p>
                        )}
                    </div>
                    <div className="profile-info">
                        <label>Description:</label>
                        {mode === 'EDIT' ? (
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        ) : (
                            <p>{description}</p>
                        )}
                    </div>
                </div>

                {mode === 'EDIT' && (
                    <div className="profile-info">
                        <label>Password:</label>
                        <div className="password-wrapper">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Leave blank to keep unchanged"
                            />
                            <span
                                className="toggle-password"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                )}

                {/* DPDP Fields (Visible if they exist or if in Edit mode) */}
                {(mode === 'EDIT' || age) && (
                    <>
                        <div className="profile-info">
                            <label>Age:</label>
                            {mode === 'EDIT' ? (
                                <input type="text" value={age} onChange={onAgeChange} placeholder="Enter integer" />
                            ) : (
                                <p>{age}</p>
                            )}
                        </div>
                        <div className="profile-info">
                            <label>Gender:</label>
                            {mode === 'EDIT' ? (
                                <select className="custom-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            ) : (
                                <p>{gender}</p>
                            )}
                        </div>
                        <div className="profile-info">
                            <label>Disability Conditions:</label>
                            {mode === 'EDIT' ? (
                                <select className="custom-select" value={disability} onChange={(e) => setDisability(e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            ) : (
                                <p>{disability}</p>
                            )}
                        </div>
                    </>
                )}

                {/* Guardian Info (Visible if previously saved) */}
                {(guardianUsername || guardianDescription) && (
                    <>
                        <div className="profile-info">
                            <label>Guardian/Scribe Username:</label>
                            {mode === 'EDIT' ? (
                                <input type="text" value={guardianUsername} onChange={(e) => setGuardianUsername(e.target.value)} />
                            ) : (
                                <p>{guardianUsername}</p>
                            )}
                        </div>
                        <div className="profile-info">
                            <label>Guardian/Scribe Description:</label>
                            {mode === 'EDIT' ? (
                                <input type="text" value={guardianDescription} onChange={(e) => setGuardianDescription(e.target.value)} />
                            ) : (
                                <p>{guardianDescription}</p>
                            )}
                        </div>
                    </>
                )}

                {/* Main Box Action Buttons */}
                {mode === 'VIEW' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px', alignItems: 'flex-start' }}>
                        <Button variant="contained" onClick={handleEditToggle}>
                            EDIT PROFILE
                        </Button>
                        <div className="tooltip-container">
                            <Button variant="contained" color="primary" style={{ backgroundColor: '#2f5ba1' }} onClick={handleDpdpCheckClick}>
                                DPDP COMPLIANT
                            </Button>
                            <div className="tooltip-dropdown">
                                Data collected in accordance to Section 2(f), Section 9(1), Section 9(3) – DPDP Act, 2023 (Child data provisions).
                                Rule 10(1) – DPDP Rules, 2025 (Verifiable parental consent for children).
                                Section 2(j)(ii) – DPDP Act, 2023 and Rule 11(1) – DPDP Rules, 2025 (Guardian consent for persons with disability).
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'EDIT' && (
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '20px' }}>
                        <Button variant="contained" color="inherit" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleMainSave}>
                            Save Changes
                        </Button>
                    </div>
                )}
            </Box>

            {/* DPDP EVALUATION BOX */}
            {showDpdpBox && (
                <Box className="settings-page" style={{ border: dpdpCheckState === 'COMPLIANT' ? "2px solid #4caf50" : "2px solid rgb(231, 107, 107)" }} marginTop={{ xs: "2%", md: "2%" }}>
                    
                    {dpdpCheckState === 'COMPLIANT' && (
                        <>
                            <h3 style={{ color: '#4caf50', textAlign: 'center', marginBottom: '20px' }}>
                                You are DPDP compliant
                            </h3>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Button variant="contained" onClick={() => setShowDpdpBox(false)}>
                                    Close
                                </Button>
                            </div>
                        </>
                    )}

                    {dpdpCheckState === 'NON_COMPLIANT' && (
                        <>
                            <h3 style={{ color: '#d32f2f', textAlign: 'center', marginBottom: '10px' }}>
                                No, you are not DPDP compliant
                            </h3>
                            <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.1rem', color: '#555' }}>
                                Guardian/Scribe details needed for DPDP compliance
                            </p>
                            {errorMessage && <div className="error-message">{errorMessage}</div>}
                            <div className="profile-info">
                                <label>Guardian/Scribe Username:</label>
                                <input
                                    type="text"
                                    value={guardianUsername}
                                    onChange={(e) => setGuardianUsername(e.target.value)}
                                />
                            </div>
                            <div className="profile-info">
                                <label>Guardian/Scribe Description:</label>
                                <input
                                    type="text"
                                    value={guardianDescription}
                                    onChange={(e) => setGuardianDescription(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
                                <Button variant="contained" color="inherit" onClick={() => setShowDpdpBox(false)}>
                                    Cancel
                                </Button>
                                <Button variant="contained" color="primary" onClick={handleGuardianSave}>
                                    Save Changes
                                </Button>
                            </div>
                        </>
                    )}

                    {dpdpCheckState === 'NEEDS_DATA' && (
                        <>
                            <h3 style={{ color: '#333', textAlign: 'center', marginBottom: '20px' }}>
                                Enter Details to Check DPDP Compliance
                            </h3>
                            {errorMessage && <div className="error-message">{errorMessage}</div>}
                            <div className="profile-info">
                                <label>Age:</label>
                                <input type="text" value={age} onChange={onAgeChange} placeholder="Enter integer" />
                            </div>
                            <div className="profile-info">
                                <label>Gender:</label>
                                <select className="custom-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="profile-info">
                                <label>Disability Conditions:</label>
                                <select className="custom-select" value={disability} onChange={(e) => setDisability(e.target.value)}>
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', alignItems: 'center', marginTop: '20px' }}>
                                <Button variant="contained" color="inherit" onClick={() => setShowDpdpBox(false)}>
                                    Cancel
                                </Button>
                                <Button variant="contained" color="primary" onClick={handleCheckComplianceInsideBox}>
                                    Check Condition
                                </Button>
                            </div>
                        </>
                    )}

                </Box>
            )}
        </>
    );
}