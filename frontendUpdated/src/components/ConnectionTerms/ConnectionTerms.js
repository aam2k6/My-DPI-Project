import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./connectionTerms.css";

import Cookies from "js-cookie";
import { usercontext } from "../../usercontext";
import { ConnectionContext } from "../../ConnectionContext";

import Navbar from "../Navbar/Navbar";
import Panel from "../Panel/Panel";
import { frontend_host } from "../../config";

export const ConnectionTerms = () => {
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
    labelDescription: "",
    hostPermissions: [],
    canShareMore: false,
    canDownload: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [obligations, setObligations] = useState([]); // Change to an array
  const [error, setError] = useState(null);
  const { curruser } = useContext(usercontext);

  const [globalTemplates, setGlobalTemplates] = useState([]); // To store global templates
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]); // To store selected template IDs
  const [isDropdownVisible, setDropdownVisible] = useState(false); // To toggle dropdown visibility

  const fetchGlobalTemplates = () => {
    const token = Cookies.get("authToken");
    fetch(`http://${frontend_host}/get-template-or-templates/`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setGlobalTemplates(data.data); // Store fetched templates
        setDropdownVisible(true); // Show dropdown
      })
      .catch((error) => {
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
        `http://${frontend_host}/get-connection-terms-for-global-template/?template_Id=${templateId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          const newObligations = data.data.map((term) => ({
            labelName: term.data_element_name,
            typeOfAction: term.data_type,
            typeOfSharing: term.sharing_type,
            labelDescription: term.description,
            hostPermissions: term.host_permissions,
            canShareMore: false,
            canDownload: false,
          }));
          setObligations((prev) => [...prev, ...newObligations]);
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
    setObligations(obligations.filter((_, i) => i !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const token = Cookies.get("authToken");

    const connectionTermsData = {
      ...connectionData,
      obligations: obligations, // Now an array
      permissions: {
        canShareMoreData: formData.canShareMore,
        canDownloadData: formData.canDownload,
      },
    };

    setConnectionTermsData(connectionTermsData);

    console.log(connectionTermsData);

    navigate("/connection");

    fetch(
      "http://host/create-connection-type-and-terms/".replace(
        /host/,
        frontend_host
      ),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${token}`, // Include your authentication token
        },
        body: JSON.stringify(connectionTermsData),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log(
            data.connection_type_message,
            data.connection_terms_message
          );
          navigate("/admin");
        } else {
          console.error("Error:", data.error);
          setError(data.error);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setError("An error occurred while submitting the data.");
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
      <div className="navbarLockerName">Locker : {locker_conn?.name}</div>
      <div className="navbarLockerOwner">Owner : {curruser.username}</div>
    </>
  );

  return (
    <div>
      <Navbar content={content}></Navbar>
      <div className="page-container">
        <Panel />
        <div className="Panelcontent">
          <div className="connectionTerms-heroContainer-nonglobal">
            <div className="main-heading">Guest Terms Of Service</div>

            <div className="parent-container">
              <div className="parent-left-heading">
                <div className="parent-left-heading-title">
                  <div className="connectionTerms-resourceHeading">
                    Guest Obligations
                  </div>
                  <button
                    className="handle-obligation"
                    type="button"
                    onClick={handleAddObligation}
                  >
                    Add Obligations
                  </button>
                  <button
                    className="import-template-btn"
                    onClick={fetchGlobalTemplates}
                  >
                    Import Global Connection Template
                  </button>

                  {isDropdownVisible && (
                    <div className="template-dropdown">
                      <label>Select Templates:</label>
                      {globalTemplates.map((template) => (
                        <div key={template.global_connection_type_template_id}>
                          <label>
                            <input
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
                          </label>
                        </div>
                      ))}
                      <button onClick={handleFetchObligations}>
                        Add Selected Templates
                      </button>
                    </div>
                  )}
                </div>

                <div className="connectionTerms-lockerForm">
                  <form
                    className="connectionTerms-lockerForm"
                    onSubmit={handleSubmit}
                  >
                    <label className="obligation-label">
                      <span>Label</span>
                      <input
                        type="text"
                        name="labelName"
                        placeholder="Label of data shared"
                        value={formData.labelName}
                        onChange={handleInputChange}
                      />
                    </label>

                    <label className="obligation-label">
                      <span>Type of Action</span>
                      <select
                        className="Title"
                        name="typeOfAction"
                        value={formData.typeOfAction}
                        onChange={handleInputChange}
                      >
                        <option value="text">Add Value</option>
                        <option value="file">Upload File</option>
                        <option value="date">Add Date</option>
                      </select>
                      <span className="tooltip">
                        ?
                        <span className="tooltiptext">
                          Choose the action type: Share, Transfer, Confer, or
                          Collateral.
                        </span>
                      </span>
                    </label>

                    <label className="obligation-label">
                      <span>Type of Sharing</span>
                      <select
                        className="Title"
                        name="typeOfSharing"
                        value={formData.typeOfSharing}
                        onChange={handleInputChange}
                      >
                        <option value="share">Share</option>
                        <option value="transfer">Transfer</option>
                        <option value="confer">Confer</option>
                        <option value="collateral">Collateral</option>
                      </select>
                      <span className="tooltip">
                        ?
                        <span className="tooltiptext">
                          <span>
                            Transfer: You are transferring ownership of this
                            resource. You will no longer have access to this
                            resource after this operation.
                          </span>
                          <br></br>
                          <span>
                            Confer: You are going to transfer ownership of the
                            resource, but the recipient cannot modify the
                            contents of what you have conferred. You still have
                            rights over this resource.
                          </span>
                          <br></br>
                          <span>
                            Share: You are not transferring ownership of this
                            resource, but the recipient can view your resource.
                            The recipient cannot do anything else.
                          </span>
                          <br></br>
                          <span>
                            Collateral: You are temporarily transferring
                            ownership to the recipient. After this operation,
                            you cannot change anything in the resource and can
                            use this as agreed with the recipient.
                          </span>
                          <br></br>
                        </span>
                      </span>
                    </label>

                    <label className="obligation-label">
                      <span>Description</span>
                      <input
                        type="text"
                        name="labelDescription"
                        placeholder="Description of the obligation"
                        value={formData.labelDescription}
                        onChange={handleInputChange}
                      />
                    </label>

                    <label className="obligation-label">
                      <span>Host Permissions</span>
                      <div className="multiselect-container">
                        <label key="reshare">
                          <input
                            type="checkbox"
                            value="reshare"
                            checked={formData.hostPermissions.includes(
                              "reshare"
                            )}
                            onChange={handleHostPermissionsChange}
                          />
                          Reshare
                        </label>
                        <label key="download">
                          <input
                            type="checkbox"
                            value="download"
                            checked={formData.hostPermissions.includes(
                              "download"
                            )}
                            onChange={handleHostPermissionsChange}
                          />
                          Download
                        </label>
                        <label key="aggregate">
                          <input
                            type="checkbox"
                            value="aggregate"
                            checked={formData.hostPermissions.includes(
                              "aggregate"
                            )}
                            onChange={handleHostPermissionsChange}
                          />
                          Aggregate
                        </label>
                      </div>
                      <span className="tooltip">
                        ?
                        <span className="tooltiptext">
                          Select host permissions: Reshare, Download, or
                          Aggregate.
                        </span>
                      </span>
                    </label>

                    <h2>Permissions</h2>
                    <label className="permission-label" key="canShareMore">
                      <span className="permission-labels">
                        Can the guest share more data
                      </span>
                      <input
                        type="checkbox"
                        name="canShareMore"
                        checked={formData.canShareMore}
                        onChange={handleCheckboxChange}
                      />
                    </label>

                    <label className="permission-label" key="canDownload">
                      <span className="permission-labels">
                        Can they download the data
                      </span>
                      <input
                        type="checkbox"
                        name="canDownload"
                        checked={formData.canDownload}
                        onChange={handleCheckboxChange}
                      />
                    </label>

                    <div className="connectionTerms-btn">
                      <button type="submit">Submit</button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="parent-right-heading">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
