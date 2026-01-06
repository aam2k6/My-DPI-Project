// // import React, { useEffect } from "react";
// // import "./Modal.css";

// // const FullscreenIframeModal = ({ show, url, onClose }) => {
// //   useEffect(() => {
// //     document.body.style.overflow = show ? "hidden" : "auto";
// //     return () => (document.body.style.overflow = "auto");
// //   }, [show]);

// //   if (!show || !url) return null;

// //   // ✅ Convert any Drive /preview or /viewer link into embed form
// //   const safeUrl = (() => {
// //   const match = url.match(/\/file\/d\/([^/]+)/);
// //   if (match && match[1]) {
// //     return `https://drive.google.com/file/d/${match[1]}/preview`;
// //   }
// //   return url;
// // })();


// //   return (
// //     <div className="iframe-modal-overlay">
// //       <div className="iframe-header">
// //         <button className="iframe-close-btn" onClick={onClose}>✕</button>
// //       </div>

// //       <iframe
// //         src={safeUrl}
// //         title="Document Viewer"
// //         className="iframe-fullscreen"
// //         allow="autoplay; encrypted-media"
// //         sandbox="allow-scripts allow-same-origin allow-popups"
// //       ></iframe>
// //     </div>
// //   );
// // };

// // export default FullscreenIframeModal;



// import React, { useEffect } from "react";
// import "./Modal.css";

// const FullscreenIframeModal = ({ show, url, onClose }) => {
//   useEffect(() => {
//     document.body.style.overflow = show ? "hidden" : "auto";
//     return () => (document.body.style.overflow = "auto");
//   }, [show]);

//   if (!show || !url) return null;

//   const safeUrl = (() => {
//     const match = url.match(/\/file\/d\/([^/]+)/);
//     if (match && match[1]) {
//       return `https://drive.google.com/file/d/${match[1]}/preview`;
//     }
//     const idMatch = url.match(/[?&]id=([^&]+)/);
//     if (idMatch && idMatch[1]) {
//       return `https://drive.google.com/uc?export=preview&id=${idMatch[1]}`;
//     }
//     return url;
//   })();

//   return (
//     <div className="iframe-modal-overlay">
//       <div className="iframe-wrapper">
//         <iframe
//           src={safeUrl}
//           title="Document Viewer"
//           className="iframe-fullscreen"
//           allow="autoplay; encrypted-media"
//           sandbox="allow-scripts allow-same-origin allow-popups"
//         ></iframe>

//         {/* ✅ Overlay close button on the top-right of the iframe (on popout area) */}
//        <button
//   className="iframe-overlay-close-btn"
//   onClick={onClose}
//   aria-label="Close"
// >
//   ✕
// </button>

//       </div>
//     </div>
//   );
// };

// export default FullscreenIframeModal;


// import React, { useEffect, useState } from "react";
// import "./Modal.css";
// import { apiFetch } from "../../utils/api";   // <-- your axios instance
// import { frontend_host } from "../../config";

// const FullscreenIframeModal = ({ show, xnodeId, onClose }) => {
//   if (!show) return null;

//   const token = localStorage.getItem("access_token");
//   const streamUrl = `${frontend_host}/resource/stream/?xnode_id=${xnodeId}&token=${token}`;

//   return (
//     <div className="iframe-modal-overlay">
//       <div className="iframe-wrapper">
//         <iframe
//           src={streamUrl}
//           className="iframe-fullscreen"
//           title="Document Viewer"
//           sandbox="allow-scripts allow-same-origin allow-popups"
//         ></iframe>

//         <button onClick={onClose} className="iframe-overlay-close-btn">
//           ✕
//         </button>
//       </div>
//     </div>
//   );
// };


// export default FullscreenIframeModal;


// import React, { useEffect, useState } from "react";
// import "./Modal.css";
// import { apiFetch } from "../../utils/api";

// const FullscreenIframeModal = ({ show, xnodeId, onClose }) => {
//   const [fileUrl, setFileUrl] = useState(null);

//   useEffect(() => {
//     if (!show || !xnodeId) return;

//     const fetchFile = async () => {
//       try {
//         const res = await apiFetch.get(
//           `/resource/stream/?xnode_id=${xnodeId}`,
//           { responseType: "blob" }
//         );

//         const blobUrl = URL.createObjectURL(res.data);
//         setFileUrl(blobUrl);
//       } catch (err) {
//         console.error("Failed to load file:", err);
//       }
//     };

//     fetchFile();

//     return () => {
//       if (fileUrl) URL.revokeObjectURL(fileUrl);
//     };
//   }, [show, xnodeId]);

//   if (!show) return null;

//   return (
//     <div className="iframe-modal-overlay">
//       <div className="iframe-wrapper">
//         {fileUrl ? (
//           <iframe
//             src={fileUrl}
//             className="iframe-fullscreen"
//             title="Document Viewer"
//           ></iframe>
//         ) : (
//           <div className="loading-text">Loading...</div>
//         )}

//         <button onClick={onClose} className="iframe-overlay-close-btn">
//           ✕
//         </button>
//       </div>
//     </div>
//   );
// };

// export default FullscreenIframeModal;

// import React, { useEffect, useState } from "react";
// // import { Document, Page, pdfjs } from "react-pdf";
// import { Document, Page } from "react-pdf";
// import { apiFetch } from "../../utils/api";
// // import workerSrc from "pdfjs-dist/build/pdf.worker.min.js";

// // pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;


// const ViewerModal = ({ show, xnodeId, onClose }) => {
//   const [blobUrl, setBlobUrl] = useState(null);
//   const [mime, setMime] = useState("");

//   useEffect(() => {
//     if (!show || !xnodeId) return;

//     const loadFile = async () => {
//       try {
//         const res = await apiFetch.get(
//           `/resource/stream/?xnode_id=${xnodeId}`,
//           { responseType: "blob" }
//         );

//         setMime(res.data.type);
//         const url = URL.createObjectURL(res.data);
//         setBlobUrl(url);
//       } catch (err) {
//         console.error("Error loading file:", err);
//       }
//     };

//     loadFile();

//     return () => {
//       blobUrl && URL.revokeObjectURL(blobUrl);
//     };
//   }, [show, xnodeId]);

//   if (!show) return null;

//   const renderFile = () => {
//     if (!blobUrl) return <p>Loading...</p>;

//     // --- PDF ---
//     if (mime === "application/pdf") {
//       return (
//         <div style={{ overflowY: "auto", height: "100%" }}>
//           <Document file={blobUrl}>
//             <Page pageNumber={1} />
//           </Document>
//         </div>
//       );
//     }

//     // --- Images ---
//     if (mime.startsWith("image/")) {
//       return (
//         <img
//           src={blobUrl}
//           alt="Preview"
//           style={{ maxWidth: "100%", height: "auto" }}
//         />
//       );
//     }

//     // --- Audio ---
//     if (mime.startsWith("audio/")) {
//       return <audio src={blobUrl} controls />;
//     }

//     // --- Video ---
//     if (mime.startsWith("video/")) {
//       return <video src={blobUrl} width="100%" controls />;
//     }

//     // --- ZIP, DOCX, Others ---
//     return (
//       <div style={{ textAlign: "center", padding: "40px" }}>
//         <h3>Preview Not Available</h3>
//         <p>This file type cannot be previewed here.</p>
//       </div>
//     );
//   };

//   return (
//     <div className="iframe-modal-overlay">
//       <div className="iframe-wrapper">
//         {renderFile()}
//         <button onClick={onClose} className="iframe-overlay-close-btn">✕</button>
//       </div>
//     </div>
//   );
// };

// export default ViewerModal;

// import React, { useEffect, useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { apiFetch } from "../../utils/api";
// // import { pdfjs } from "react-pdf";
// pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;


// const ViewerModal = ({ show, xnodeId, onClose }) => {
//   const [blobUrl, setBlobUrl] = useState(null);
//   const [mime, setMime] = useState("");
//   const [numPages, setNumPages] = useState(null);

//   useEffect(() => {
//     if (!show || !xnodeId) return;

//     const loadFile = async () => {
//       try {
//         const res = await apiFetch.get(
//           `/resource/stream/?xnode_id=${xnodeId}`,
//           { responseType: "arraybuffer" } // important
//         );

//         const contentType = res.headers["content-type"];
//         setMime(contentType);

//         // Convert arraybuffer to Blob URL
//         const blob = new Blob([res.data], { type: "application/pdf" });
//         const url = URL.createObjectURL(blob);
//         setBlobUrl(url);


//       } catch (err) {
//         console.error("Error loading file:", err);
//       }
//     };

//     loadFile();

//     return () => {
//       if (blobUrl) URL.revokeObjectURL(blobUrl);
//       setBlobUrl(null);
//       setNumPages(null);
//     };
//   }, [show, xnodeId]);

//   if (!show) return null;

//   const renderFile = () => {
//     if (!blobUrl) return <p>Loading...</p>;

//     // PDF preview
//     if (mime === "application/pdf") {
//       return (
//         <div style={{ overflowY: "auto", height: "80vh" }}>
//           <Document
//             file={blobUrl}
//             onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//             onLoadError={(err) => console.error("PDF load error:", err)}
//           >
//             {Array.from(new Array(numPages), (_, index) => (
//               <Page key={index} pageNumber={index + 1} width={800} />
//             ))}
//           </Document>
//         </div>
//       );
//     }

//     // Image preview
//     if (mime.startsWith("image/")) {
//       return <img src={blobUrl} alt="Preview" style={{ maxWidth: "100%" }} />;
//     }

//     // Audio preview
//     if (mime.startsWith("audio/")) {
//       return <audio src={blobUrl} controls />;
//     }

//     // Video preview
//     if (mime.startsWith("video/")) {
//       return <video src={blobUrl} width="100%" controls />;
//     }

//     // Unsupported file
//     return (
//       <div style={{ textAlign: "center", padding: "40px" }}>
//         <h3>Preview Not Available</h3>
//         <p>This file type cannot be previewed here.</p>
//       </div>
//     );
//   };

//   return (
//     <div
//       className="iframe-modal-overlay"
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         width: "100vw",
//         height: "100vh",
//         backgroundColor: "rgba(0,0,0,0.6)",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         zIndex: 9999,
//       }}
//     >
//       <div
//         className="iframe-wrapper"
//         style={{
//           position: "relative",
//           backgroundColor: "#fff",
//           padding: "20px",
//           borderRadius: "8px",
//           maxHeight: "90vh",
//           overflow: "auto",
//         }}
//       >
//         {renderFile()}
//         <button
//           onClick={onClose}
//           style={{
//             position: "absolute",
//             top: 10,
//             right: 10,
//             fontSize: "18px",
//             border: "none",
//             background: "transparent",
//             cursor: "pointer",
//           }}
//         >
//           ✕
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ViewerModal;


// // ViewerModal.jsx
// import React, { useEffect, useState } from "react";
// import { Document, Page, pdfjs } from "react-pdf";
// import { apiFetch } from "../../utils/api";

// // Use CDN worker to avoid path issues
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// const ViewerModal = ({ show, xnodeId, onClose }) => {
//   const [fileBlob, setFileBlob] = useState(null);
//   const [mime, setMime] = useState("");
//   const [numPages, setNumPages] = useState(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!show || !xnodeId) return;

//     let isCancelled = false;

//     const loadFile = async () => {
//       setLoading(true);
//       try {
//         const res = await apiFetch.get(`/resource/stream/?xnode_id=${xnodeId}`, {
//           responseType: "arraybuffer",
//         });

//         const contentType =
//           res.headers["content-type"]?.split(";")[0] || "application/octet-stream";
//         if (isCancelled) return;

//         setMime(contentType);

//         const blob = new Blob([res.data], { type: contentType });
//         setFileBlob(blob);
//       } catch (err) {
//         console.error("Error loading file:", err);
//       } finally {
//         if (!isCancelled) setLoading(false);
//       }
//     };

//     loadFile();

//     return () => {
//       isCancelled = true;
//       setFileBlob(null);
//       setNumPages(null);
//     };
//   }, [show, xnodeId]);

//   if (!show) return null;

//   const renderFile = () => {
//     if (loading) return <p>Loading...</p>;
//     if (!fileBlob) return <p>No file loaded.</p>;

//     // PDF preview
//     if (mime === "application/pdf" || mime.startsWith("application/pdf")) {
//       return (
//         <div style={{ overflowY: "auto", height: "80vh" }}>
//           <Document
//             file={fileBlob}
//             onLoadSuccess={({ numPages }) => setNumPages(numPages)}
//             onLoadError={(err) => console.error("PDF load error:", err)}
//           >
//             {Array.from(new Array(numPages), (_, index) => (
//               <Page key={index} pageNumber={index + 1} width={800} />
//             ))}
//           </Document>
//         </div>
//       );
//     }

//     // Image preview
//     if (mime.startsWith("image/")) {
//       const url = URL.createObjectURL(fileBlob);
//       return <img src={url} alt="Preview" style={{ maxWidth: "100%" }} />;
//     }

//     // Audio preview
//     if (mime.startsWith("audio/")) {
//       const url = URL.createObjectURL(fileBlob);
//       return <audio src={url} controls />;
//     }

//     // Video preview
//     if (mime.startsWith("video/")) {
//       const url = URL.createObjectURL(fileBlob);
//       return <video src={url} width="100%" controls />;
//     }

//     // Unsupported file
//     return (
//       <div style={{ textAlign: "center", padding: "40px" }}>
//         <h3>Preview Not Available</h3>
//         <p>This file type cannot be previewed here.</p>
//       </div>
//     );
//   };

//   return (
//     <div
//       className="iframe-modal-overlay"
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         width: "100vw",
//         height: "100vh",
//         backgroundColor: "rgba(0,0,0,0.6)",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         zIndex: 9999,
//       }}
//     >
//       <div
//         className="iframe-wrapper"
//         style={{
//           position: "relative",
//           backgroundColor: "#fff",
//           padding: "20px",
//           borderRadius: "8px",
//           maxHeight: "90vh",
//           overflow: "auto",
//           maxWidth: "90vw",
//         }}
//       >
//         {renderFile()}

//         <button
//           onClick={onClose}
//           style={{
//             position: "absolute",
//             top: 10,
//             right: 10,
//             fontSize: "18px",
//             border: "none",
//             background: "transparent",
//             cursor: "pointer",
//           }}
//         >
//           ✕
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ViewerModal;
import React, { useEffect, useState } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { apiFetch } from "../../utils/api";

const ViewerModal = ({ show, xnodeId, onClose }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [mime, setMime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
// useEffect(() => {
//   const disableRightClick = (e) => e.preventDefault();

//   const disableKeys = (e) => {
//     if (
//       e.key === "PrintScreen" ||
//       (e.ctrlKey && e.key.toLowerCase()  === "p") ||
//       (e.ctrlKey && e.key.toLowerCase() === "s")
//     ) {
//       e.preventDefault();
//       alert("Action disabled for security reasons");
//     }
//   };

//   document.addEventListener("contextmenu", disableRightClick);
//   document.addEventListener("keydown", disableKeys);

//   return () => {
//     document.removeEventListener("contextmenu", disableRightClick);
//     document.removeEventListener("keydown", disableKeys);
//   };
// }, []);

  // useEffect(() => {
  //   if (!show || !xnodeId) return;
  //   let cancelled = false;

  //   const load = async () => {
  //     setLoading(true);
  //     try {
  //       const res = await apiFetch.get(`/resource/stream/?xnode_id=${xnodeId}`, {
  //         responseType: "blob",
  //       });
  //       if (cancelled) return;

  //       const contentType =
  //         res.headers["content-type"]?.split(";")[0] || "application/octet-stream";
  //       console.log("MIME from backend:", contentType);
  //       setMime(contentType);

  //       const blob = new Blob([res.data], { type: contentType });
  //       const url = URL.createObjectURL(blob);
  //       setFileUrl(url);
  //     } catch (e) {
  //       console.error("Error loading file:", e.response.data.message);
  //       console.error("Error loading file:", e);
  //       setError("Failed to load file.");
  //     } finally {
  //       if (!cancelled) setLoading(false);
  //     }
  //   };

  //   load();

  //   return () => {
  //     cancelled = true;
  //     if (fileUrl) URL.revokeObjectURL(fileUrl);
  //     setFileUrl(null);
  //     setError(null);
  //   };
  // }, [show, xnodeId]);

  useEffect(() => {
  if (!show || !xnodeId) return;

  let cancelled = false;

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch.get(
        `/resource/stream/?xnode_id=${xnodeId}`,
        { responseType: "blob" }
      );

      if (cancelled) return;

      const contentType =
        res.headers["content-type"]?.split(";")[0] ||
        "application/octet-stream";

      console.log("MIME from backend:", contentType);

      // ✅ SUCCESS PATH (actual file)
      if (!contentType.includes("application/json")) {
        const blob = new Blob([res.data], { type: contentType });
        const url = URL.createObjectURL(blob);
        setMime(contentType);
        setFileUrl(url);
        return;
      }

      // ❌ ERROR PATH (JSON blob)
      const text = await res.data.text();
      const json = JSON.parse(text);
      throw new Error(json.message || "File not available");

    } catch (e) {
      let message = "Failed to load file";

      // ✅ Decode backend error if blob
      if (e.response?.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const json = JSON.parse(text);
          message = json.message;
          console.error("Backend error:", json);
        } catch {
          console.error("Blob error could not be parsed");
        }
      } else {
        console.error("Error loading file:", e);
      }

      setError(message);
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  load();

  return () => {
    cancelled = true;
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setError(null);
  };
}, [show, xnodeId]);


  if (!show) return null;

  const renderContent = () => {
    if (loading) return <p>Loading...</p>;
    if (!fileUrl) return <p>{error}</p>;

    // PDF
    if (mime.startsWith("application/pdf")) {
      return (
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          <div style={{ width: "100%", height: "100%" }}>
            <Viewer fileUrl={fileUrl} defaultScale={1.2} />
          </div>
        </Worker>
      );
    }

    // Image
    if (mime.startsWith("image/")) {
      return (
        <img
          src={fileUrl}
          alt="Preview"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      );
    }

    // Video
    if (mime.startsWith("video/")) {
      return <video src={fileUrl} width="100%" height="100%" controls />;
    }

    // Audio
    if (mime.startsWith("audio/")) {
      return <audio src={fileUrl} controls />;
    }

    // Excel / Office
    if (
      mime.includes("sheet") ||
      mime === "application/vnd.ms-excel" ||
      mime.includes("officedocument")
    ) {
      return (
        <iframe
          src={fileUrl}
          title="Document preview"
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      );
    }

    // Text files (.txt)
if (mime.startsWith("text/")) {
  return (
    <iframe
      src={fileUrl}
      title="Text preview"
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        // backgroundColor: "#f8f8f8",
      }}
    />
  );
}
if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  return (
    <iframe
      src={officeUrl}
      title="Word preview"
      style={{ width: "100%", height: "100%", border: "none" }}
    />
  );
}

if (mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation") {
  const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
  return (
    <iframe
      src={officeUrl}
      title="PowerPoint preview"
      style={{ width: "100%", height: "100%", border: "none" }}
    />
  );
}


    // Fallback
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h3>Preview not available</h3>
        <p>This file type cannot be previewed here.</p>
      </div>
    );
  };

  return (
    <div 
      style={{
        position: "fixed",
        inset: 0,
        // backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >

{!loading && fileUrl && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      pointerEvents: "none",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: 0.35,
      fontSize: "40px",
      color: "red",
      transform: "rotate(-30deg)",
      textAlign: "center",
    }}
  >
    Anumati <br />
    {/* {localStorage.getItem("username")} <br /> */}
    {new Date().toLocaleString()}
  </div>
)}


      <div
        style={{
          position: "relative",
          backgroundColor: "#fff",
          padding: "40px",
          borderRadius: "8px",
          maxWidth: "100vw",
          maxHeight: "120vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div
          id="secure-viewer-container"
          style={{
            width: "120vw",
            height: "90vh",
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {renderContent()}
        </div>

        <div className="close-detail">
              <button
                type="button"
                className="position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0"
                onClick={onClose}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#007bff", // Light red for a subtle look
                  color: "white", // Darker red for contrast
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  transition: "0.3s ease-in-out",
                }}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: "22px" }}></i>
              </button>
            </div>
      </div>
    </div>
  );
};

export default ViewerModal;


