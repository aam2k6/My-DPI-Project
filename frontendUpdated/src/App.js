import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import { Login } from './components/Login/Login';
import { Home } from './components/Home/Home';
import { CreateLocker } from './components/CreateLocker/CreateLocker';
import { ViewLocker } from './components/ViewLocker/ViewLocker';
import { UploadResource } from './components/UploadResource/UploadResource';
import { DPIdirectory } from './components/DPIdirectory/DPIdirectory';
import { TargetUserView } from './components/TargetUserView/TargetUserView';
import { Connection } from './components/Connection/Connection';
import { ConnectionTerms } from './components/ConnectionTerms/ConnectionTerms';
import { TargetLockerView } from './components/TargetLockerView/TargetLockerView';
import { Admin } from './components/Admin/Admin';
import { CreateConnectionType } from './components/CreateConnectionType/CreateConnectionType';
import { CreateConnectionTerms } from './components/CreateConnectionTerms/CreateConnectionTerms';
import { usercontext } from './usercontext';
import { ViewTermsByType } from './components/ViewTermsByTypeUser/ViewTermsByType';
import { Guestusers } from './components/Guest-users/Guestusers';
import { Guesttermsreview } from './components/GuestTermsReview/Guesttermsreview';
import ManageUsers from './components/ManageUsers/ManageUsers'; 
import FreezeLockerConnection from './components/FreezeLockerConnection/FreezeLockerConnection';
<<<<<<< HEAD
import CreateGlobalConnectionType from "./components/CreateGlobalConnectionType/CreateGlobalConnectionType";


=======
// import  CreateGlobalConnTypesTerms  from './components/GlobalConnectionType/CreateGlobalConnTypesTerms';
>>>>>>> e90cc3daa799e40d894e933be8bb534a37989238

function App() {
    const [curruser, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load user from localStorage if available
        const storedUser = localStorage.getItem('curruser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false); // Set loading to false after attempting to load user
    }, []);

    useEffect(() => {
        // Save user to localStorage whenever it changes
        if (curruser) {
            localStorage.setItem('curruser', JSON.stringify(curruser));
        } else {
            localStorage.removeItem('curruser');
        }
    }, [curruser]);

    if (loading) {
        return <div>Loading...</div>; // Render a loading indicator while checking localStorage
    }

    return (
        <div className="App">
            <Router>
                <usercontext.Provider value={{ curruser, setUser }}>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                        <Route path="/create-locker" element={<ProtectedRoute><CreateLocker /></ProtectedRoute>} />
                        <Route path="/view-locker" element={<ProtectedRoute><ViewLocker /></ProtectedRoute>} />
                        <Route path="/upload-resource" element={<ProtectedRoute><UploadResource /></ProtectedRoute>} />
                        <Route path="/dpi-directory" element={<ProtectedRoute><DPIdirectory /></ProtectedRoute>} />
                        <Route path="/target-user-view" element={<ProtectedRoute><TargetUserView /></ProtectedRoute>} />
                        <Route path="/connection" element={<ProtectedRoute><Connection /></ProtectedRoute>} />
                        <Route path="/connectionTerms" element={<ProtectedRoute><ConnectionTerms /></ProtectedRoute>} />
                        <Route path="/target-locker-view" element={<ProtectedRoute><TargetLockerView /></ProtectedRoute>} />
                        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                        <Route path="/create-connection-type" element={<ProtectedRoute><CreateConnectionType /></ProtectedRoute>} />
                        <Route path="/create-connection-terms" element={<ProtectedRoute><CreateConnectionTerms /></ProtectedRoute>} />
                        <Route path="/view-terms-by-type" element={<ProtectedRoute><ViewTermsByType /></ProtectedRoute>} />
                        <Route path="/make-connection" element={<ProtectedRoute><CreateConnectionType /></ProtectedRoute>} />
                        <Route path="/show-connection-terms" element={<ProtectedRoute><CreateConnectionTerms /></ProtectedRoute>} />
                        <Route path="/show-guest-users" element={<ProtectedRoute><Guestusers /></ProtectedRoute>} />
                        <Route path="/guest-terms-review" element={<ProtectedRoute><Guesttermsreview /></ProtectedRoute>} />
                        <Route path="/create-global-connection-type" element={<CreateGlobalConnectionType />}/>
                        <Route path="/manage-moderators" element={<ProtectedRoute><ManageUsers role = "moderator"/></ProtectedRoute>} />
                        <Route path="/manage-admins" element={<ProtectedRoute><ManageUsers role = "sys_admin"/></ProtectedRoute>} />
                        <Route path="/freeze-locker-connection" element={<ProtectedRoute><FreezeLockerConnection/></ProtectedRoute>} />
                        {/* <Route path="/create-global-connection-type" element={<ProtectedRoute><CreateGlobalConnTypesTerms/></ProtectedRoute>} /> */}


                        <Route path="*" element={<h1>Page Not Found</h1>} />
                    </Routes>
                </usercontext.Provider>
            </Router>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { curruser } = useContext(usercontext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!curruser) {
            navigate('/');
        }
    }, [curruser, navigate]);

    return curruser ? children : null;
}

export default App;
