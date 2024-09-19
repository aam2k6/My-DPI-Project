import React from 'react';
import './Modal.css';

// export default function Modal({ message, onClose, type }) {
//     const modalClass = type === 'success' ? 'modal-success' : type === 'failure' ? 'modal-failure' : '';

//     return (
//         <div className="modal-overlay">
//             <div className={`modal ${modalClass}`}>
//                 <p>{message}</p>
//                 <button onClick={onClose}>Close</button>
//             </div>
//         </div>
//     );
// }
export default function Modal({ message, onClose, type, children }) {
    const modalClass = type === 'success' ? 'modal-success' : type === 'failure' ? 'modal-failure' : '';
  
    return (
      <div className="modal-overlay">
        <div className={`modal ${modalClass}`}>
          <p>{message}</p>
          {children} {/* Render children here */}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  