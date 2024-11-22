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
export default function Modal({ message, onClose, type, revoke, onRevoke, viewTerms,onConfirm,
  children }) {
    const modalClass = type === 'success' ? 'modal-success' : type === 'failure' ? 'modal-failure' : type === 'confirmation'
    ? 'modal-confirmation': '';
  
    return (
      <div className="modal-overlay">
        <div className={`modals ${modalClass}`}>
          <p>{message}</p>
          {children} {/* Render children here */}
          {type === 'confirmation' ? (
          <div className="modal-buttons">
            <button onClick={onConfirm} className="modal-yes">
              Yes
            </button>
            <button onClick={onClose} className="modal-no">
              No
            </button>
          </div>
        ) : (
          <button onClick={onClose} className="modal-close">
            Close
          </button>
        )}
          {/* <button onClick={onClose}>Close</button> */}
          {revoke && <button onClick={onRevoke}>Revoke</button>}
          {revoke && <button onClick={ viewTerms}>View Terms</button>}
          
        </div>
      </div>
    );
  }
  