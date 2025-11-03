// import React, { useEffect } from "react";
// import "./Modal.css";

// const FullscreenIframeModal = ({ show, url, onClose }) => {
//   useEffect(() => {
//     document.body.style.overflow = show ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [show]);

//   if (!show || !url) return null;

//   // ✅ Convert any Drive /preview or /viewer link into embed form
//   const safeUrl = (() => {
//   const match = url.match(/\/file\/d\/([^/]+)/);
//   if (match && match[1]) {
//     return `https://drive.google.com/file/d/${match[1]}/preview`;
//   }
//   return url;
// })();


//   return (
//     <div className="iframe-modal-overlay">
//       <div className="iframe-header">
//         <button className="iframe-close-btn" onClick={onClose}>✕</button>
//       </div>

//       <iframe
//         src={safeUrl}
//         title="Document Viewer"
//         className="iframe-fullscreen"
//         allow="autoplay; encrypted-media"
//         sandbox="allow-scripts allow-same-origin allow-popups"
//       ></iframe>
//     </div>
//   );
// };

// export default FullscreenIframeModal;



import React, { useEffect } from "react";
import "./Modal.css";

const FullscreenIframeModal = ({ show, url, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [show]);

  if (!show || !url) return null;

  const safeUrl = (() => {
    const match = url.match(/\/file\/d\/([^/]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=preview&id=${idMatch[1]}`;
    }
    return url;
  })();

  return (
    <div className="iframe-modal-overlay">
      <div className="iframe-wrapper">
        <iframe
          src={safeUrl}
          title="Document Viewer"
          className="iframe-fullscreen"
          allow="autoplay; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-popups"
        ></iframe>

        {/* ✅ Overlay close button on the top-right of the iframe (on popout area) */}
       <button
  className="iframe-overlay-close-btn"
  onClick={onClose}
  aria-label="Close"
>
  ✕
</button>

      </div>
    </div>
  );
};

export default FullscreenIframeModal;
