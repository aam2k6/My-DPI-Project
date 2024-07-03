import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import {Login} from './components/Login/Login'
import {Home} from './components/Home/Home';
import {CreateLocker} from './components/CreateLocker/CreateLocker';
import {ViewLocker} from './components/ViewLocker/ViewLocker';
import {UploadResource} from './components/UploadResource/UploadResource';
import {DPIdirectory} from './components/DPIdirectory/DPIdirectory';
import {TargetUserView} from './components/TargetUserView/TargetUserView';
import {Connection} from './components/Connection/Connection';
import {ConnectionTerms} from './components/ConnectionTerms/ConnectionTerms';
import {TargetLockerView} from './components/TargetLockerView/TargetLockerView';
import {Admin} from './components/Admin/Admin';
import {CreateConnectionType} from './components/CreateConnectionType/CreateConnectionType';
import { CreateConnectionTerms } from './components/CreateConnectionTerms/CreateConnectionTerms';


function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home/>} />
          <Route path="/create-locker" element={<CreateLocker/>} />
          <Route path="/view-locker" element={<ViewLocker/>} />
          <Route path="/upload-resource" element={<UploadResource/>} />
          <Route path="/dpi-directory" element={<DPIdirectory/>} />
          <Route path="/target-user-view" element={<TargetUserView/>} />
          <Route path="/connection" element={<Connection/>}/>
          <Route path="/connectionTerms" element={<ConnectionTerms/>}/>
          <Route path="/target-locker-view" element={<TargetLockerView/>}/>
          <Route path="/admin" element={<Admin/>}/>
          <Route path="/create-connection-type" element={<CreateConnectionType/>}/>
          <Route path="/create-connection-terms" element={<CreateConnectionTerms/>}/>
          <Route path="*" element={<h1>Page Not Found</h1>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
