import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./connectionTerms.css";

import Cookies from "js-cookie";
import { usercontext } from "../../usercontext";
import { ConnectionContext } from "../../ConnectionContext";

import Navbar from "../Navbar/Navbar";
import Panel from "../Panel/Panel";
import { frontend_host } from "../../config";
import Modal from "../Modal/Modal.jsx";
import {Grid } from '@mui/material'

export const ConnectionTermsHost = () => {
  const navigate = useNavigate();
  const { locker_conn, connectionData, setConnectionTermsData } =
    useContext(ConnectionContext);

  const location = useLocation();
  // console.log("connection terms loc", location.state);
  // const locker = location.state ? location.state.locker : null;
  // const connectionData = location.state ? location.state.connectionData : null;
  // console.log("connection terms locker", locker);
  // console.log("connection terms connection data", connectionData);
  const initialFormData = {
    labelName: "",
    typeOfAction: "text",
    typeOfSharing: "share",
    purpose:"",
    labelDescription: "",
    hostPermissions: [],
    canShareMore: false,
    canDownload: false,
    forbidden:false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [obligations, setObligations] = useState([]); // Change to an array
  const [error, setError] = useState(null);
  const { curruser } = useContext(usercontext);

  const [globalTemplates, setGlobalTemplates] = useState([]); // To store global templates
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]); // To store selected template IDs
  const [isDropdownVisible, setDropdownVisible] = useState(false); // To toggle dropdown visibility
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false

  );


const fetchGlobalTemplates = () => {
  const token = Cookies.get("authToken");
  fetch("host/get-template-or-templates/".replace(/host/, frontend_host), {
    method: "GET",
    headers: {
      Authorization: `Basic ${token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Fetched Templates:", data); // Log the fetched data
      setGlobalTemplates(data.data); // Store fetched templates
      console.log("global data", data.data);
      setDropdownVisible(true); // Show dropdown
    })
    .catch((error) => {
      console.error("Error fetching templates:", error);
      setError("Failed to fetch templates");
    });
};

  
  const handleTemplateSelection = (templateId) => {
    setSelectedTemplateIds((prev) => {
      const updatedIds = prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId];

      // console.log("Updated Selected Template IDs:", updatedIds); // Log the updated IDs
      return updatedIds;
    });
  };

  const handleFetchObligations = () => {
    const token = Cookies.get("authToken");
    selectedTemplateIds.forEach((templateId) => {
      fetch(
        `host/get-connection-terms-for-global-template/?template_Id=${templateId}`.replace(
          /host/,
          frontend_host
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const { obligations, permissions, forbidden } = data.data;

            const obligationsWithGlobalId = obligations.map((obligation) => ({
              ...obligation,
              global_conn_type_id: templateId,  // Add global_conn_type_id
            }));
  
  
            // Combine obligations, permissions, and forbidden into a single array or separate arrays
            // setObligations((prev) => [
            //   ...prev, 
            //   ...obligations, // Add the fetched obligations
            // ]);

            setObligations((prev) => [
              ...prev, 
              ...obligationsWithGlobalId, // Add fetched obligations with global_conn_type_id
            ]);
  
            // Handle permissions
            setFormData((prevFormData) => ({
              ...prevFormData,
              canShareMore: permissions.canShareMoreData,
              canDownload: permissions.canDownloadData,
            }));
  
            // Handle forbidden terms (you can also update another state for forbidden terms)
            // if you want to show them somewhere else.
          } else {
            setError("Failed to fetch obligations for the selected template.");
          }
        })
        .catch((error) => {
          setError(`Failed to fetch obligations for template ID ${templateId}`);
        });
    });
  
    setDropdownVisible(false); // Hide dropdown after fetching
  };
  

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleAddObligation = () => {
    if (formData.labelName.trim() !== "") {
      setObligations([...obligations, { ...formData }]);
      setFormData(initialFormData);
    }
  };

  const handleLoadObligation = (index) => {
    setFormData(obligations[index]);
  };

  const handleRemoveObligation = (index) => {
    const removedObligation = obligations[index];
  
    // Remove the obligation
    const updatedObligations = obligations.filter((_, i) => i !== index);
  
    // Update the obligations state
    setObligations(updatedObligations);
  
    // Clear the form if the removed obligation is the one currently loaded in the form
    if (
      formData.labelName === removedObligation.labelName &&
      formData.labelDescription === removedObligation.labelDescription &&
      formData.typeOfAction === removedObligation.typeOfAction &&
      formData.typeOfSharing === removedObligation.typeOfSharing &&
      formData.purpose === removedObligation.purpose &&
      formData.hostPermissions.join(",") === removedObligation.hostPermissions.join(",") &&
      formData.canShareMore === removedObligation.canShareMore &&
      formData.canDownload === removedObligation.canDownload
    ) {
      setFormData(initialFormData);
    }
  };


  // const handleSubmit = (event) => {
  //   event.preventDefault();
  //   console.log("Form data before submit:", formData); // Add this line

  //   if (obligations.length === 0) {
  //     setError("At least one obligation must be added.");
  //     setModalMessage({
  //       message: "At least one obligation must be added.",
  //       type: "info",
  //     });
  //     setIsModalOpen(true); // Open modal with info message.
  //     return;
  //   }
  
  //   const token = Cookies.get("authToken");
  //   const forbiddenArray = formData.forbidden ? ["Cannot close unilaterally"] : ["can unilaterally close connection"];

  
  //   const connectionTermsData = {
  //     ...connectionData,
  //     // obligations: obligations,
  //     obligations: obligations.map(obligation => ({
  //       ...obligation,
  //       global_conn_type_id: obligation.global_conn_type_id || null,
  //     })),
  //     permissions: {
  //       canShareMoreData: formData.canShareMore,
  //       canDownloadData: formData.canDownload,
  //     },
  //     forbidden: forbiddenArray,  // Add forbidden array here

  //   };
  
  //   console.log("data",connectionTermsData);
  //   setConnectionTermsData(connectionTermsData);
  
  //   fetch("host/create-connection-type-and-terms/".replace(/host/, frontend_host), {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Basic ${token}`,
  //     },
  //     body: JSON.stringify(connectionTermsData),
  //   })
  //     .then((response) => response.json().then((data) => ({ status: response.status, data })))
  //     .then(({ status, data }) => {
  //       if (status === 201) {
  //         // Success case: show success modal and reset form if needed.
  //         setModalMessage({
  //           message: "Connection Type successfully created!",
  //           type: "success",
  //         });
  //         setIsModalOpen(true);
  //         navigate("/admin"); 
  //         // Optionally, reset the form after successful creation.
  //       } else if (status === 400 && data.error.includes("already exists")) {
  //         // Handle the case where the connection type already exists.
  //         setError("Connection type with this name already exists in the same locker.");
  //         setModalMessage({
  //           message: "Connection type with this name already exists in the same locker.",
  //           type: "error",
  //         });
  //         setIsModalOpen(true);
          
  //       } else {
  //         // General error handling.
  //         console.error("Error:", data.error);
  //         setError(data.error);
  //         setModalMessage({
  //           message: data.error,
  //           type: "error",
  //         });
  //         setIsModalOpen(true); // Open modal with error message.
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //       setError("An error occurred while submitting the data.");
  //       setModalMessage({
  //         message: "An error occurred while submitting the data.",
  //         type: "error",
  //       });
  //       setIsModalOpen(true); // Open modal with error message.
  //     });
  // };


  const handleSubmit = (event) => {
    event.preventDefault();
    if (obligations.length === 0) {
      setError("At least one obligation must be added.");
      setModalMessage({
        message: "At least one obligation must be added.",
        type: "info",
      });
      setIsModalOpen(true); // Open modal with info message.
      return;
    }
    const token = Cookies.get("authToken");

    const finalData = {
      ...connectionData,  // Contains lockerName, connectionName, connectionDescription, validity
      obligations: obligations.map(obligation => ({
         ...obligation,
         global_conn_type_id: obligation.global_conn_type_id || null,  // Optional field if needed by the API
      })),
      permissions: {
         canShareMoreData: formData.canShareMore,
         canDownloadData: formData.canDownload,
      },
      forbidden: formData.forbidden ? ["Cannot close unilaterally"] : ["can unilaterally close connection"],
      from: "HOST",
      to: "GUEST"
   };
   
    console.log("Data to be posted:", finalData); // Verify the structure and values

  
    fetch("host/create-connection-type-and-terms/".replace(/host/, frontend_host), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify(finalData),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          console.log("Data successfully posted:", data);
          navigate("/home"); // Navigate on success
        } else {
          console.error("Failed to post data:", data);
          setError(data.message || "Failed to post data");
        }
      })
      .catch((error) => {
        console.error("Network error:", error);
        setError("An error occurred while submitting data.");
      });
  };
  
  
  const handleHostPermissionsChange = (event) => {
    const { value, checked } = event.target;

    setFormData((prevFormData) => {
      let updatedPermissions = prevFormData.hostPermissions;

      if (checked) {
        if (!updatedPermissions.includes(value)) {
          updatedPermissions = [...updatedPermissions, value];
        }
      } else {
        updatedPermissions = updatedPermissions.filter(
          (permission) => permission !== value
        );
      }

      const validPermissions = ["reshare", "download", "aggregate"];
      updatedPermissions = updatedPermissions.filter((permission) =>
        validPermissions.includes(permission)
      );

      return {
        ...prevFormData,
        hostPermissions: updatedPermissions,
      };
    });
  };

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
  }, [curruser]);

  const token = Cookies.get("authToken");

  const content = (
    <>
      <div className="navbarBrands">Locker : {locker_conn?.name}</div>
      <div className="navbarBrands">Owner : {curruser.username}</div>
    </>
  );
  

  return (
    <div id="connectionTermHost">
    {isModalOpen && (
      <Modal
        message={modalMessage.message}
        onClose={handleCloseModal}
        type={modalMessage.type}
      />
    )}
    <Navbar content={content}></Navbar>
    <div>
      {/* <Panel /> */}
      <div className="Panelcontent" style={{marginTop:"120px"}}>
        <div className="connectionTerms-heroContainer-nonglobal">
          {/* <div className="main-heading">Guest Terms Of Service</div> */}
          <Grid container className="parent-container ">
            <Grid item xs={12} md={8} className="parent-left-heading">
              <div>
                <Grid container>
                  <Grid item md={3.5} xs={12}>
                    <div className="connectionTerms-resourceHeading">
                      Host Obligations
                    </div>
                  </Grid>
                  <Grid item md={3.5} xs={12}>
                    <button
                      className=""
                      type="button"
                      onClick={handleAddObligation}
                    >
                      Add Obligations
                    </button>
                  </Grid>
                  <Grid item md={5} xs={12} paddingTop={{xs:"12px", md:"0px"}}>
                    <button
                      className=""
                      onClick={() => {
                        fetchGlobalTemplates();
                        setIsTemplateModalOpen(true);
                      }}
                    >
                      Import Global Connection Template
                    </button>
                  </Grid>
                  
                </Grid>
                {isTemplateModalOpen && (
                  <Modal
                    message="Select Global Templates"
                    onClose={() => setIsTemplateModalOpen(false)}
                    type="info"
                  >
                    <div className="template-selection-container">
                      {globalTemplates.length > 0 ? (
                        <>
                          <label>Select Templates:</label>
                          {globalTemplates.map((template) => (
                            <div
                              key={
                                template.global_connection_type_template_id
                              }
                            >
                              <label>
                                <input
                                  className="templete"
                                  type="checkbox"
                                  value={
                                    template.global_connection_type_template_id
                                  }
                                  checked={selectedTemplateIds.includes(
                                    template.global_connection_type_template_id
                                  )}
                                  onChange={() =>
                                    handleTemplateSelection(
                                      template.global_connection_type_template_id
                                    )
                                  }
                                />
                                {template.global_connection_type_name} (ID:{" "}
                                {template.global_connection_type_template_id})
                                {/* <br />
              {template.global_connection_type_description} */}
                              </label>
                            </div>
                          ))}
                          <button onClick={handleFetchObligations}>
                            Add Selected Templates
                          </button>
                        </>
                      ) : (
                        <div>Loading templates...</div>
                      )}
                    </div>
                  </Modal>
                )}
              </div>

              <div className="connectionTerms-lockerForm">
                <form
                  onSubmit={handleSubmit}
                >

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Label</label>
                    <div className="col-md-10 col-sm-10 col-xs-10">
                      <input 
                         type="text"
                         name="labelName"
                         placeholder="Label of data shared"
                         value={formData.labelName}
                         onChange={handleInputChange} className="form-control" 
                      />
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Type of Action</label>
                    <div className="col-md-10 col-sm-10 col-xs-10 d-flex">
                      <select className="form-select form-select-md" aria-label="Small select example"
                          name="typeOfAction"
                          value={formData.typeOfAction}
                          onChange={handleInputChange} >
                          <option value="text">Add Value</option>
                          <option value="file">Upload File</option>
                          <option value="date">Add Date</option>
                      </select>
                      {!isTemplateModalOpen && <span className="tooltips">
                      ?
                        <span className="tooltiptext">
                          Choose the action type: Share, Transfer, Confer, or
                          Collateral.
                        </span>
                      </span>}
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Type of Sharing</label>
                    <div className="col-md-10 col-sm-10 col-xs-10 d-flex">
                      <select className="form-select form-select-md" aria-label="Small select example"
                          name="typeOfSharing"
                          value={formData.typeOfSharing}
                          onChange={handleInputChange} >
                          <option value="share">Share</option>
                          <option value="transfer">Transfer</option>
                          <option value="confer">Confer</option>
                          <option value="collateral">Collateral</option>
                      </select>
                      {!isTemplateModalOpen && <span className="tooltips">
                      ?
                      <span className="tooltiptext">
                        <span>
                          Transfer: You are transferring ownership of this
                          resource. You will no longer have access to this
                          resource after this operation.
                        </span>
                        <br />
                        <span>
                          Confer: You are going to transfer ownership of the
                          resource, but the recipient cannot modify the
                          contents of what you have conferred. You still have
                          rights over this resource.
                        </span>
                        <br />
                        <span>
                          Share: You are not transferring ownership of this
                          resource, but the recipient can view your resource.
                          The recipient cannot do anything else.
                        </span>
                        <br />
                        <span>
                          Collateral: You are temporarily transferring
                          ownership to the recipient. After this operation,
                          you cannot change anything in the resource and can
                          use this as agreed with the recipient.
                        </span>
                        <br />
                      </span>
                      </span>}
                      
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Purpose</label>
                    <div className="col-md-10 col-sm-10 col-xs-10">
                      <input 
                         type="text"
                         name="purpose"
                         placeholder="purpose of collecting data"
                         value={formData.purpose}
                         onChange={handleInputChange} className="form-control" 
                      />
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Description</label>
                    <div className="col-md-10 col-sm-10 col-xs-10">
                      <input 
                         type="text"
                         name="labelDescription"
                         placeholder="Description of the obligation"
                         value={formData.labelDescription}
                         onChange={handleInputChange} className="form-control" 
                      />
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-12 col-md-2 col-form-label">Host Permissions</label>
                    <div className="col-md-9 col-sm-12">
                    <div className="row">
                      <div className="col-2">
                        <input
                          type="checkbox"
                          value="reshare"
                            checked={formData.hostPermissions.includes(
                              "reshare"
                            )}
                            onChange={handleHostPermissionsChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label key="reshare"> 
                          Reshare
                        </label>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-2">
                        <input
                          type="checkbox"
                          value="download"
                          checked={formData.hostPermissions.includes(
                            "download"
                          )}
                          onChange={handleHostPermissionsChange}
                        />
                      </div>
                      <div className="col-md-6">
                        <label key="download"> 
                          Download
                        </label>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-2">
                      <input
                        type="checkbox"
                        value="aggregate"
                        checked={formData.hostPermissions.includes(
                          "aggregate"
                        )}
                        onChange={handleHostPermissionsChange}/>
                      </div>
                      <div className="col-md-6">
                        <label key="aggregate"> 
                          Aggregate
                        </label>
                      </div>
                    </div>
                    </div>
                    <div className="col-md-1">
                      {!isTemplateModalOpen && <span className="tooltips">
                      ?
                      <span className="tooltiptext">
                        Select host permissions: Reshare, Download, or Aggregate.
                      </span>
                    </span>}
                  </div>
                  </div>

                  <div className="mb-1 row">
                    <h4><b>Permissions</b></h4>
                  </div>

                  <div className="mb-3 row">
                    <div className="col-md-6 col-xs-12">
                      <label className="col-md-7 col-xs-12 agreeLabel">
                        Can the guest share more data
                      </label>
                    </div>
                    <div className="col-6">
                      <input
                        type="checkbox"
                        name="canShareMore"
                        checked={formData.canShareMore}
                        onChange={handleCheckboxChange}
                      />
                    </div>
                  </div>
                  <div className="mb-3 row">
                    <div className="col-md-6 col-xs-12">
                      <label className="col-md-6 col-xs-12  agreeLabel">
                        Can they download the data
                      </label>
                    </div>
                    <div className="col-6">
                      <input
                        type="checkbox"
                        name="canDownload"
                        checked={formData.canDownload}
                        onChange={handleCheckboxChange}
                      />
                    </div>
                  </div>

                  <div className="mb-1 row">
                    <h4><b>Forbidden</b></h4>
                  </div>

                  <div className="mb-3 row">
                    <div className="col-md-6 col-xs-12">
                      <label className="col-md-6 col-xs-12  agreeLabel">
                        {formData.forbidden
                          ? "You cannot unilaterally close the connection."
                          : "You can unilaterally close the connection."}
                      </label>
                    </div>
                    <div className="col-6">
                      <input
                        type="checkbox"
                        name="forbidden"
                        checked={formData.forbidden}
                        onChange={handleCheckboxChange}
                      />
                    </div>
                  </div>
                  <div className="connectionTerms-btn">
                    <button type="submit">Submit</button>
                  </div>
                </form>
              </div>
            </Grid>

            <Grid item xs={12} md={3} className="parent-right-heading" marginTop={{md:"0px", xs:"30px"}}>
              {obligations.map((obligation, index) => (
                <div key={index}>
                  <button
                    className="obligation-button"
                    onClick={() => handleLoadObligation(index)}
                  >
                    {obligation.labelName}
                  </button>
                  <button
                    className="remove-obligation-button"
                    onClick={() => handleRemoveObligation(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </Grid>
          </Grid>
        </div>
      </div>
    </div>
  </div>
  );
};