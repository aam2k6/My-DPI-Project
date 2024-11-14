import React, { useContext, useEffect, useState } from "react";
import "./page3.css";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useLocation, useParams } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import { QrReader } from "react-qr-reader";
import Modal from "../Modal/Modal"; 
import { Grid } from "@mui/material"
// import {PDFViewer} from "../PDFViewer/PDFViewer.js";
export const ViewLocker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locker = location.state ? location.state.locker : null;

  const [isOpen, setIsOpen] = useState(false);
  const { curruser, setUser } = useContext(usercontext);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const [connections, setConnections] = useState({
    incoming_connections: [],
    outgoing_connections: [],
  });
  const [otherConnections, setOtherConnections] = useState([]);
  const [trackerData, setTrackerData] = useState({});
  const [scanning, setScanning] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceVisibility, setResourceVisibility] = useState("private");
  const [modalMessage, setModalMessage] = useState(null)
  const [VnodeResources, setVnodeResources] = useState([]);
  const [activeTab, setActiveTab] = useState("incoming");
  const [xnodes, setXnodes] = useState([]);
  // const [correspondingNames, setCorrespondingNames] = useState([]);
  // const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (locker) {
      fetchConnectionsAndOtherConnections(); // Combine the two fetches
      fetchResources(); // Keep resources fetch separate
      fetchVnodeResources();
      fetchXnodes();
    }
  }, [locker]);

  const fetchXnodes = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_id: locker.locker_id });

      const response = await fetch(
        `host/get-all-xnodes-for-locker/?${params}`.replace(
          /host/,
          frontend_host
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Xnodes");
      }

      const data = await response.json();
      console.log(data.message || data.error, "mssg");
      console.log("xnode data", data);

      if (data.xnode_list ) {
        setXnodes(data.xnode_list);
        // setCorrespondingNames(data.corresponding_document_name_list);
      } else {
        setError(data.message || data.error || "Failed to fetch Xnodes");
        console.log("msg", data.message || data.error);
      }
    } catch (error) {
      console.error("Error fetching Xnodes:", error);
      setError("An error occurred while fetching Xnodes");
    }
  };

  // console.log("locker", locker);
  // console.log("resources", resources);
  const fetchConnectionsAndOtherConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_name: locker.name });

      // Fetch connections
      const [connectionsResponse, otherConnectionsResponse] = await Promise.all(
        [
          fetch(
            `host/get-connections-user-locker/?${params}`.replace(
              /host/,
              frontend_host
            ),
            {
              method: "GET",
              headers: {
                Authorization: `Basic ${token}`,
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `host/connection_types/?${params}`.replace(/host/, frontend_host),
            {
              method: "GET",
              headers: {
                Authorization: `Basic ${token}`,
                "Content-Type": "application/json",
              },
            }
          ),
        ]
      );

      // Handle connections response
      if (!connectionsResponse.ok)
        throw new Error("Failed to fetch connections");
      const connectionsData = await connectionsResponse.json();
      if (connectionsData.success) {
        setConnections(connectionsData.connections);
        fetchAllTrackerData(connectionsData.connections.outgoing_connections);

        // Count incoming connections for each connection type
        const incomingConnectionCounts = {};
        connectionsData.connections.incoming_connections.forEach(
          (connection) => {
            const typeId = connection.connection_type;
            if (incomingConnectionCounts[typeId]) {
              incomingConnectionCounts[typeId]++;
            } else {
              incomingConnectionCounts[typeId] = 1;
            }
          }
        );

        // Handle other connections response
        if (!otherConnectionsResponse.ok)
          throw new Error("Failed to fetch other connections");
        const otherConnectionsData = await otherConnectionsResponse.json();
        if (otherConnectionsData.success) {
          // Update otherConnections with the count of incoming connections
          setOtherConnections(
            otherConnectionsData.connection_types.map((connection) => ({
              ...connection,
              incoming_count:
                incomingConnectionCounts[connection.connection_type_id] || 0,
            }))
          );
        } else {
          setError(
            otherConnectionsData.message || "Failed to fetch other connections"
          );
        }
      } else {
        setError(connectionsData.message || "Failed to fetch connections");
      }
    } catch (error) {
      console.error("Error fetching connections and other connections:", error);
      setError(
        "An error occurred while fetching connections or other connections"
      );
    }
  };

  const fetchResources = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_name: locker.name });
      const response = await fetch(
        `host/get-resources-user-locker/?${params}`.replace(
          /host/,
          frontend_host
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
      const data = await response.json();
      console.log("resour", data);
      if (data.success) {
        setResources(data.resources);
      } else {
        setError(data.message || "Failed to fetch resources");
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      setError("An error occurred while fetching resources");
    }
  };
  // console.log(locker);
  const fetchVnodeResources = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ host_locker_id: locker.locker_id });

      const response = await fetch(
        `host/get-vnodes/?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data = await response.json();
      // console.log("data", data);
      // console.log("vnodes", data.data);

      //if (data.success) {
      setVnodeResources(data.data);
      //} else {
      //setError(data.message || "Failed to fetch resources");
      //}
      //}
    } catch (error) {
      console.error("Error fetching resources:", error);
      setError("An error occurred while fetching resources");
    }
  };

  const fetchAllTrackerData = (outgoingConnections) => {
    outgoingConnections.forEach((connection) => {
      fetchTrackerData(connection);
    });
  };

  const fetchTrackerData = async (connection) => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        connection_name: connection.connection_name,
        host_locker_name: connection.host_locker.name,
        guest_locker_name: connection.guest_locker.name,
        host_user_username: connection.host_user.username,
        guest_user_username: connection.guest_user.username,
      });
      const response = await fetch(
        `host/get-terms-status/?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tracker data");
      }
      const data = await response.json();
      if (data.success) {
        console.log("view locker", data);
        setTrackerData((prevState) => ({
          ...prevState,
          [connection.connection_id]: {
            count_T: data.count_T,
            count_F: data.count_F,
            count_R: data.count_R,
            filled: data.filled,
            empty: data.empty,
          },
        }));
      } else {
        setError(data.message || "Failed to fetch tracker data");
      }
    } catch (error) {
      console.error("Error fetching tracker data:", error);
      setError("An error occurred while fetching tracker data");
    }
  };

  const getStatusColor = (tracker) => {
    const totalObligations =
      tracker.count_T + tracker.count_F + tracker.count_R;
    if (tracker.count_T === totalObligations && tracker.count_R === 0) {
      return "green";
    } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
      return "red";
    } else {
      return "orange";
    }
  };

  const calculateRatio = (tracker) => {
    const totalObligations =
      tracker.count_T + tracker.count_F + tracker.count_R;
    return totalObligations > 0
      ? `${tracker.filled}/${totalObligations}`
      : "0/0";
  };

  const handleUploadResource = () => {
    navigate("/upload-resource", { state: { locker } });
  };

  const handleResourceClick = (filePath) => {
    const url = `host/media/${filePath}`.replace(/host/, frontend_host);
    window.open(url, "_blank");
  };

  const handleNewLockerClick = () => {
    navigate("/create-locker");
  };

  const handleTracker = (connection) => {
    console.log("navigate view-terms-by-type", {
      connection,
      guest_locker_id: connection.guest_locker?.locker_id,
      host_locker_id: connection.host_locker?.locker_id,
    });
    navigate("/view-terms-by-type", {
      state: {
        connection: connection,
        connection_id: connection.connection_id,
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
        hostLockerName: connection.host_locker?.name,
        guestLockerName: connection.guest_locker?.name,
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        locker: locker,
        guest_locker_id: connection.guest_locker?.locker_id,
        host_locker_id: connection.host_locker?.locker_id,
      },
    });
  };

  const handleDocsClick = () => {
    // console.log("Open Docs button clicked");
  };

  const handleEducationClick = () => {
    // console.log("Open Education button clicked");
    navigate("/view-locker");
  };

  const handleConnectionClick = (connection) => {
    console.log("navigate show-guest-users", {
      connection,
      locker,
    });
    navigate("/show-guest-users", { state: { connection, locker } });
  };
  const handleIncomingInfo = (connection) => {
    navigate("/display-terms", {
      state: {
        hostLockerName: connection.host_locker?.name,
        connectionTypeName: connection.connection_type_name,
        connectionDescription: connection.connection_description,
        createdtime: connection.created_time,
        validitytime: connection.validity_time,
        hostUserUsername: connection.host_user?.username,
        locker: locker,
      },
    });
  };
  const handleInfo = (connection) => {
    // Split the connection_name by the hyphen and take the last part as the connection_type_name
    const connectionTypeName = connection.connection_name
      .split("-")
      .shift()
      .trim();
    // console.log("conntype",connectionTypeName)

    console.log("Navigating with state:", {
      connectionName: connection.connection_name,
      hostLockerName: connection.host_locker?.name,
      connectionTypeName, // Pass the extracted connection_type_name
      hostUserUsername: connection.host_user?.username,
      locker: locker,
    });

    navigate("/show-connection-terms", {
      state: {
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
        hostLockerName: connection.host_locker?.name,
        connectionTypeName, // Pass the extracted connection_type_name
        hostUserUsername: connection.host_user?.username,
        locker: locker.name,
        showConsent: false,
        guest_locker_id: connection.guest_locker?.id,
        host_locker_id: connection.host_locker?.id,
        lockerComplete: locker,
      },
    });
  };

  const handleConsentAndInfo = (connection) => {
    // Split the connection_name by the hyphen and take the last part as the connection_type_name
    const connectionTypeName = connection.connection_name
      .split("-")
      .shift()
      .trim();
    // console.log("conntype",connectionTypeName)

    console.log("Navigating with state:", {
      connectionName: connection.connection_name,
      hostLockerName: connection.host_locker?.name,
      connectionTypeName, // Pass the extracted connection_type_name
      hostUserUsername: connection.host_user?.username,
      locker: locker,
      guest_locker_id: connection.guest_locker?.id,
      host_locker_id: connection.host_locker?.id,
      connection_id: connection.connection_id,
    });

    navigate("/show-connection-terms", {
      state: {
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
        hostLockerName: connection.host_locker?.name,
        connectionTypeName, // Pass the extracted connection_type_name
        // connectionTypeName: connection.connection_type_name,
        hostUserUsername: connection.host_user?.username,
        locker: locker.name,
        showConsent: true,
        guest_locker_id: connection.guest_locker?.id,
        host_locker_id: connection.host_locker?.id,
        connection_id: connection.connection_id,
        lockerComplete: locker,
      },
    });
  };

  useEffect(() => {
    if (scanning) {
      // When scanning starts, make sure QR reader is active
    } else {
      // Stop the QR reader or camera when scanning is false
      setQrResult(null); // Reset the result when scanning stops
    }
  }, [scanning]);

  // const handleQrScan = (data) => {
  //   if (data) {
  //     try {
  //       const parsedData = JSON.parse(data);
  //       console.log("Scanned QR Data:", parsedData);

  //       // Navigate and reload the page after navigating
  //       navigate("/show-connection-terms", {
  //         state: {
  //           connectionTypeName: parsedData.connection_type_name,
  //           connectionDescription: parsedData.connection_description,
  //           locker: locker,
  //           hostUserUsername: parsedData.host_username,
  //           hostLockerName: parsedData.host_locker_name,
  //           connectionName: parsedData.connection_name,
  //           connection_id: parsedData.connection_id,
  //           showConsent: true,
  //           guest_locker_id: parsedData.guest_locker?.id,
  //           host_locker_id: parsedData.host_locker?.id,
  //           lockerComplete: locker,
  //         },
  //       });

  //       // Stop scanning and reload the page
  //       setScanning(false);
  //       window.location.reload(); // This will reload the page after navigating
  //     } catch (error) {
  //       console.error("Invalid QR Code:", error);
  //     }
  //   }
  // };

  // const handleQrError = (error) => {
  //   console.error("QR Reader Error:", error);
  // };

  // const closeScanner = () => {
  //   // Stop the QR scanner
  //   setScanning(false);

  //   // Manually stop all video streams from the camera
  //   const videoElement = document.querySelector("video");
  //   if (videoElement && videoElement.srcObject) {
  //     const stream = videoElement.srcObject;
  //     const tracks = stream.getTracks();

  //     tracks.forEach((track) => {
  //       track.stop(); // Stop each track (both video and audio)
  //     });

  //     videoElement.srcObject = null; // Clear the video element source
  //   }

  //   // Refresh the page when closing the scanner
  //   window.location.reload();
  // };

  const handleClick = async (xnode_id) => {

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`host/access-resource/?xnode_id=${xnode_id}`.replace(
                  /host/,
                  frontend_host
                ), {
        method: 'GET',
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to access the resource');
      }

      const data = await response.json();
      console.log(data);
      const { link_To_File } = data;
      // console.log("link to file", link_To_File);
      if (link_To_File) {
        console.log("link to file", link_To_File);
        window.open(link_To_File, '_blank');
        // setPdfUrl(link_To_File);
      } else {
        setError('Unable to retrieve the file link.');
        console.log(error);
      }
    } catch (err) {
      // setError(`Error: ${err.message}`);
      console.log(err);
    } finally {
      // setLoading(false);
    }
  };
  console.log("doc",locker.name,curruser.username,xnodes.resource_name);
xnodes.forEach((xnode) => {
  console.log("Full xnode object:", xnode);
});

const handleEditClick = (xnode) => {
  setSelectedResource(xnode);
  setResourceName(xnode.resource_name); 
  setResourceVisibility(xnode.visibility); // Set current visibility from the xnode
  setShowEditModal(true);
};

const handleSaveResource = async (xnode) => {
  console.log("xnode in handleSaveResource:", xnode);

  if (!xnode || !xnode.resource_name) {
    console.error("Invalid resource structure or missing resource_name.");
    return;
  }

  // Access the res object through the foreign key in xnode
  const res = xnode.res;  
  const currentVisibility = res ? res.visibility : undefined; // Access current visibility

  const payload = {
    locker_name: locker.name,
    owner_name: curruser.username,
    document_name: xnode.resource_name,
    new_document_name: resourceName,
    new_visibility: resourceVisibility || currentVisibility, 
  };

  console.log("Payload:", payload);

  try {
    const token = Cookies.get("authToken");
    const response = await fetch(`${frontend_host}/edit-delete-resource/`, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Response Status:", response.status);
    const data = await response.json();
    console.log("Response Data:", data);

    if (response.ok) {
      
      setXnodes((prevXnodes) =>
        prevXnodes.map((item) =>
          item.id === xnode.id
            ? { ...item, resource_name: resourceName, visibility: resourceVisibility || currentVisibility }
            : item
        )
      );

      setModalMessage({ message: "Resource updated successfully!", type: "success" });
      setShowEditModal(false);
    } else {
      setModalMessage({ message: data.message || "Failed to update resource.", type: "failure" });
    }
  } catch (error) {
    console.error("Error updating resource:", error);
    setModalMessage({ message: "An error occurred while updating the resource.", type: "failure" });
  }
};


  
// console.log("doc",locker.name,curruser.username,xnodes.resource_name);
// xnodes.forEach((xnode) => {
//   console.log("Resource Name:", xnode.resource_name); // Log each resource_name
// });
const handleDeleteClick = async (xnode) => {
  console.log("Xnode to be deleted:", xnode);  // Log the entire xnode object

  if (!xnode.resource_name) {
    console.error("Document name is missing in xnode!");
    return;  // Exit the function if resource_name is missing
  }

  if (window.confirm("Do you want to delete this resource?")) {
    const lockerName = locker.name; 
    const documentName = xnode.resource_name;  
    const ownerName = curruser.username; 

    const payload = {
      locker_name: lockerName,
      owner_name: ownerName,
      document_name: documentName,  
    };

    console.log("Payload to be sent:", payload);  

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`${frontend_host}/edit-delete-resource/`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response from backend:", response);
      const data = await response.json();
      console.log("Response data:", data);

      if (response.ok) {
        
        setXnodes((prevXnodes) =>
          prevXnodes.filter((item) => item.id !== xnode.id)
        );
        
        setModalMessage({ message: "Resource deleted successfully!", type: "success" });
      } else {
        setModalMessage({ message: data.message || "Failed to delete resource.", type: "failure" });
      }
    } catch (error) {
      setModalMessage({ message: "An error occurred while deleting the resource.", type: "failure" });
      console.error("Error during delete:", error);
    }
  }
};



  const handleFileChange = (e) => {
    setResourceFile(e.target.files[0]);
  };

  const handleCloseModal = () => {
    setModalMessage(null);
  };



  const content = (
    <>
      <div className="navbarBrand">
        {locker ? `Locker: ${locker.name}` : "Locker"}
      </div>
    </>
  );
  // console.log("res vnode", VnodeResources);
  console.log("xnodes", xnodes);

  return (
    <div>
      <Navbar content={content} lockerAdmin={true} lockerObj={locker} />
      <div className="containers" style={{marginTop:"150px"}}>
        <div className="locker-description">
          {locker ? ` ${locker.description}` : "Description"}
        </div>
        {/* QR Scanner Section
        {scanning && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-box">
              <QrReader
                onResult={(result, error) => {
                  if (!!result) {
                    handleQrScan(result?.text);
                  }
                  if (!!error) {
                    handleQrError(error);
                  }
                }}
                constraints={{ facingMode: "environment" }} // Use the environment (back) camera
                style={{ width: "100%", height: "100%" }}
              />
              <button className="qr-scanner-close" onClick={closeScanner}>
                Close
              </button>
            </div>
          </div>
        )} */}
        {/* <div className="qr-scan-section">
          {!scanning && (
            <button className="qrbutton" onClick={() => setScanning(true)}>
              Start QR Scan
            </button>
          )}
        </div> */}

        <Grid container padding={{md:"50px",xs:"20px"}}>
          <Grid item md={5.5} xs={12} className="a">
            <div className="res">
              <h3>Resources</h3>
            </div>
            <div className="container-3 clearfix">
              <div className="aa">
                {/* {resources.length > 0 ? (
                  resources.map((resource, index) => (
                    <div key={resource.resource_id} className="resource-item">
                      <div className="resource-details">
                        <div
                          id="documents"
                          onClick={() =>
                            handleResourceClick(resource.i_node_pointer)
                          }
                        >
                          {resource.document_name}
                        </div>
                        <div className="public-private">
                          {resource.type === "private" ? (
                            <>Private</>
                          ) : (
                            "Public"
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="not-found">No resources found.</p>
                )}

                {VnodeResources.length > 0 ? (
                  [...VnodeResources].map((resource, index) => (
                    <div
                      key={resource.resource.resource_id}
                      className="resource-item"
                    >
                      <div className="resource-details">
                        <div
                          id="documents-byShare"
                          onClick={() =>
                            handleResourceClick(
                              resource.resource.i_node_pointer
                            )
                          }
                        >
                          {resource.resource.document_name}
                        </div>
                        <div className="public-private">
                          {resource.resource.type === "private" ? (
                            <>Private</>
                          ) : (
                            "Public"
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="not-found"></p>
                )} */}
                {/*                   
      {xnodes.length > 0 ? (
        <ul>
          {xnodes.map((xnode, index) => (
            <li
              key={xnode.id}
              className="resource-item"
              style={{
                color: xnode.xnode_Type === 'INODE' ? 'blue' : 'red', // Apply color based on type
              }}>
            >
             {correspondingNames[index]}
            </li>
          ))}
        </ul>
      ) : (
        <p>No Resources available</p>
      )} */}
                {xnodes.length > 0 ? (
                  <ul style={{paddingTop:"40px"}}>
                    {xnodes.map((xnode, index) => (
                      <div
                        key={xnode.id}
                        className="resource-item"
                        // style={{
                        //   color: xnode.xnode_Type === 'INODE' ? 'blue' : 'red',}}
                      >
                        <div className="resource-details">
                          <div
                            id={
                              xnode.xnode_Type === "INODE"
                                ? "documents"
                                : "documents-byShare"
                            }
                            style={{ display: 'flex'}}
                          >
                            <span onClick={() =>
                              handleClick(xnode.id)
                            }>{xnode.resource_name}</span>
                            
                          <span className="resource-icons" style={{ marginLeft: "auto" }}>
                            <i
                              className="fa-regular fa-pen-to-square"
                              style={{ paddingRight: "20px", cursor: "pointer" }}
                              onClick={() => handleEditClick(xnode)}
                            />
                            <i
                              className="fa-regular fa-trash-can"
                              style={{ cursor: "pointer" }}
                              onClick={() => handleDeleteClick(xnode)}
                            />
                          </span>
                          </div>
                          {/* <div className="public-private">
                            {xnode.type === "private" ? <>Private</> : "Public"}
                          </div> */}
                        </div>
                      </div>
                    ))}
                  </ul>
                ) : (
                  <p className="not-found">No Resources found.</p>
                )}
              </div>
            </div>
            <button className="page3button" onClick={handleUploadResource}>
              Upload resource
            </button>
          </Grid>
          <Grid item md={1} xs={12} marginBottom={{md:"", xs:"50px"}}></Grid>
          <Grid item md={5.5} xs={12} className="b">
            <h3 id="mycon">My Connections:</h3>
            <div className="tabs">
              <div
                className={`tab-header ${
                  activeTab === "incoming" ? "active" : ""
                }`}
                onClick={() => setActiveTab("incoming")}
              >
                Incoming Connections
              </div>
              <div
                className={`tab-header ${
                  activeTab === "outgoing" ? "active" : ""
                }`}
                onClick={() => setActiveTab("outgoing")}
              >
                Outgoing Connections
              </div>
            </div>
            <div className="tab-content">
              {activeTab === "incoming" && (
                //               <div className="tab-panel">
                //   <h4 id="headingconnection">Incoming Connection types</h4>
                //   <div className="conn">
                //     {otherConnections.length > 0 ? (
                //       otherConnections.map((connection) => (
                //         <div
                //           key={connection.connection_type_id}
                //           className="viewlockerconnections"
                //         >
                //           <h4 id="connectiontype">
                //             <button
                //               className="connection-name-button"
                //               onClick={() => handleConnectionClick(connection)}
                //               style={{
                //                 textDecoration: "underline",
                //                 background: "none",
                //                 border: "none",
                //                 padding: 0,
                //                 cursor: "pointer",
                //                 color: "inherit",
                //               }}
                //             >
                //               <u>{connection.connection_type_name}</u>
                //             </button>
                //             {" "} (users: {connection.incoming_count})
                //           </h4>
                //           <button
                //             className="info-button2"
                //             onClick={() => handleIncomingInfo(connection)}
                //           >
                //             i
                //           </button>
                //           <div id="conntent">
                //                 {connection.connection_description}
                //               </div>
                //               <div id="conntent">
                //                 Created On:{" "}
                //                 {new Date(connection.created_time).toLocaleString()}
                //               </div>
                //               <div id="conntent">
                //                 Valid Until:{" "}
                //                 {new Date(connection.validity_time).toLocaleString()}
                //               </div>

                //         </div>
                //       ))
                //     ) : (
                //       <p>No connections found.</p>
                //     )}
                //   </div>
                // </div>

                <div className="tab-panel">
                  <h4 id="headingconnection">Incoming Connection types</h4>
                  <div className="conn">
                    {otherConnections.length > 0 ? (
                      otherConnections.map((connection) => (
                        <Grid container
                          key={connection.connection_type_id}
                          className="viewlockerconnections"
                        >
                          <Grid item md={11} xs={10}>
                            <h4 id="connectiontype">
                              <button
                                className="connection-name-button"
                                onClick={() => handleConnectionClick(connection)}
                                style={{
                                  textDecoration: "none",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  color: "inherit",
                                }}
                              >
                                <u>{connection.connection_type_name}</u>
                              </button>{" "}
                              (users: {connection.incoming_count})
                            </h4>
                          </Grid>

                          <Grid item md={1} xs={1}>
                            <i class="bi bi-info-circle " style={{fontSize:"20px", fontWeight:"bold"}} onClick={() => handleIncomingInfo(connection)}></i>

                            {/* <button
                              className="info-button2"
                              onClick={() => handleIncomingInfo(connection)}
                            >
                              i
                            </button> */}
                          </Grid>
                        </Grid>
                      ))
                    ) : (
                      <p>No connections found.</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Edit Resource Modal */}
              {showEditModal && (
  <div className="edit-modal">
    <div className="modal-content">
      <h3>Edit Resource</h3>
      <label>Resource Name:</label>
      <input
        type="text"
        value={resourceName}
        onChange={(e) => setResourceName(e.target.value)}
      />

      <label>Visibility:</label>
      <select
        value={resourceVisibility}
        onChange={(e) => setResourceVisibility(e.target.value)}
      >
        <option value="private">Private</option>
        <option value="public">Public</option>
      </select>

      <div className="modal-buttons">
        {/* Use an anonymous function to call handleSaveResource */}
        <button onClick={() => handleSaveResource(selectedResource)}>Save</button>
        <button onClick={() => setShowEditModal(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}


        {/* Success/Failure Modal */}
        {modalMessage && (
          <Modal
            message={modalMessage.message}
            type={modalMessage.type}
            onClose={handleCloseModal}
          />
        )}
      

              {activeTab === "outgoing" && (
                <div className="tab-panel">
                  <h4 id="headingconnection">Outgoing Connections</h4>
                  <div className="conn">
                    {connections.outgoing_connections.length > 0 ? (
                      connections.outgoing_connections.map(
                        (connection, index) => {
                          const tracker = trackerData[connection.connection_id];
                          const color = tracker
                            ? getStatusColor(tracker)
                            : "gray";
                          const ratio = tracker
                            ? calculateRatio(tracker)
                            : "Loading...";

                          return (
                            <Grid container 
                              key={connection.connection_id}
                              className="viewlockerconnections"
                            >
                             
                             <Grid item md={7.9} xs={12}>
                                <div id="conntent">
                                  <button
                                    className="connection-name-button"
                                    onClick={() => handleTracker(connection)}
                                    style={{
                                      textDecoration: "underline",
                                      background: "none",
                                      border: "none",
                                      padding: 0,
                                      cursor: "pointer",
                                      color: "inherit",
                                    }}
                                  >
                                    {connection.connection_name}
                                  </button>
                                </div>
                                <div id="conntent">
                                  {connection.guest_locker.name} &lt;&gt;{" "}
                                  {connection.host_locker.name}
                                </div>
                                <div id="conntent">
                                  Created On:{" "}
                                  {new Date(
                                    connection.created_time
                                  ).toLocaleString()}
                                </div>
                                <div id="conntent">
                                  Valid Until:{" "}
                                  {new Date(
                                    connection.validity_time
                                  ).toLocaleString()}
                                </div>
                             </Grid>
                              <Grid item  paddingTop={{md:"50px",xs:""}} md={4.1} xs={12}>
                                <button
                                  className="info-button"
                                  onClick={() =>
                                    handleConsentAndInfo(connection)
                                  }
                                >
                                  c
                                </button>
                                <button
                                  className="info-button"
                                  onClick={() => handleInfo(connection)}
                                >
                                  i{" "}
                                </button>
                                <button
                                  onClick={() => handleTracker(connection)}
                                  style={{ backgroundColor: color }}
                                >
                                  {ratio}
                                </button>
                              </Grid>
                            </Grid>
                          );
                        }
                      )
                    ) : (
                      <p>No outgoing connections found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Grid>
        </Grid>
        
      </div>
      {/* {pdfUrl && <PDFViewer pdfUrl={pdfUrl} />} */}
      
    </div>
    
  );
};
