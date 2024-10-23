import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./ConnectionTermsGlobal.css";
import Navbar from "../Navbar/Navbar";

import Cookies from "js-cookie";
import { usercontext } from "../../usercontext";
import { frontend_host } from "../../config";

export const ConnectionTermsGlobal = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the state passed from the previous page
  const { connectionTypeName, connectionTypeDescription, existingTerms } =
    location.state || {};
  const [purpose, setPurpose] = useState(""); // Ensure it's initialized

  // Separate states for global and obligation form data
  const initialObligationForm = {
    labelName: "",
    typeOfAction: "text",
    typeOfSharing: "share",
    purpose: "",
    labelDescription: "",
    hostPermissions: [],
    canShareMore: false,
    canDownload: false,
    forbidden: false, // Add forbidden state
  };

  const initialGlobalForm = {
    globalName: "",
    globalDescription: "",
    globaltype: "",
    domain: "",
  };

  const [globalFormData, setGlobalFormData] = useState(initialGlobalForm);
  const [obligationFormData, setObligationFormData] = useState(
    initialObligationForm
  );
  const [obligations, setObligations] = useState([]); // Obligations array
  const [error, setError] = useState(null);
  const { curruser, setUser } = useContext(usercontext);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (location.state) {
      setGlobalFormData({
        globalName: connectionTypeName || "",
        globalDescription: connectionTypeDescription || "",
      });

      const { forbidden, obligations } = existingTerms || {};
      console.log("existing terms ", forbidden, obligations); // Debugging logs

      if (obligations && obligations.length > 0) {
        setObligations(
          obligations.map((term) => ({
            labelName: term.labelName || "",
            typeOfAction: term.typeOfAction || "text",
            typeOfSharing: term.typeOfSharing || "share",
            purpose: term.purpose || "",
            labelDescription: term.labelDescription || "",
            hostPermissions: term.hostPermissions || [],
            canShareMore: false,
            canDownload: false,
            forbidden: false,
          }))
        );
      }
    }
  }, [
    location.state,
    connectionTypeName,
    connectionTypeDescription,
    existingTerms,
  ]);

  const { globalName, globalDescription, globaltype } = globalFormData;

  // Handle changes for global fields
  const handleGlobalChange = (event) => {
    const { name, value } = event.target;
    setGlobalFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes for obligation fields
  const handleObligationChange = (event) => {
    const { name, value } = event.target;
    setObligationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setObligationFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAddObligation = () => {
    if (obligationFormData.labelName.trim() !== "") {
      setObligations([...obligations, { ...obligationFormData }]);
      setObligationFormData(initialObligationForm); // Reset only obligation fields
    } else {
      alert("Label Name is required to add an obligation.");
    }
  };

  const handleLoadObligation = (index) => {
    const obligationToLoad = obligations[index];

    // Assuming you have access to the existing permissions and forbidden states
    const { permissions, forbidden } = existingTerms || {};

    setObligationFormData((prev) => ({
      ...prev,
      labelName: obligationToLoad.labelName || "",
      typeOfAction: obligationToLoad.typeOfAction || "text",
      typeOfSharing: obligationToLoad.typeOfSharing || "share",
      purpose: obligationToLoad.purpose || "",
      labelDescription: obligationToLoad.labelDescription || "",
      hostPermissions: obligationToLoad.hostPermissions || [],
      canShareMore: permissions?.canShareMoreData || false, // Check from the global permissions
      canDownload: permissions?.canDownloadData || false, // Check from the global permissions
      forbidden: forbidden, // If there are forbidden terms, set it to true
    }));
  };

  const handleRemoveObligation = (index) => {
    setObligations(obligations.filter((_, i) => i !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (globalName.trim() === "" || globalDescription.trim() === "") {
      alert("Please fill out both the Name and Description fields.");
      return; // Prevent form submission if fields are empty
    }

    const token = Cookies.get("authToken");

    const connectionTermsData = {
      connection_terms_obligations: obligations,
      connection_terms_permissions: {
        canShareMoreData: obligationFormData.canShareMore,
        canDownloadData: obligationFormData.canDownload,
      },
      forbidden: obligationFormData.forbidden, // Include forbidden state in form submission
    };

    console.log(connectionTermsData);
    console.log(globalName);
    console.log(globalDescription);
    fetch(`${frontend_host}/create-global-terms/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`, // Corrected template literal
      },
      body: JSON.stringify(connectionTermsData),
    })
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          return response.json();
        } else {
          throw new Error("Failed to create global terms");
        }
      })
      .then((data) => {
        console.log("Global terms created successfully.");
        navigate("/create-global-connection-type");
        const termsIDs = data.terms.map((term) => term.terms_id);

        const globalTemplateData = {
          global_connection_type_name: globalFormData.globalName,
          global_connection_type_description: globalFormData.globalDescription,
          global_terms_IDs: termsIDs,
          globaltype: globalFormData.globaltype,
          domain: globalFormData.domain, // Include domain here
        };
        console.log(globalTemplateData);
        return fetch(`${frontend_host}/add-global-template/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify(globalTemplateData),
        });
      })
      .then((response) => {
        if (response.status === 200 || response.status === 201) {
          return response.json();
        } else {
          throw new Error("Failed to add global template");
        }
      })
      .then(() => {
        alert("Global template added successfully.");
      })
      .catch((error) => {
        console.error("Error:", error);
        setError("An error occurred while submitting the data.");
      });
  };

  const handleHostPermissionsChange = (event) => {
    const { value, checked } = event.target;

    setObligationFormData((prev) => {
      let updatedPermissions = prev.hostPermissions;

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
        ...prev,
        hostPermissions: updatedPermissions,
      };
    });
  };

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
  }, [curruser, navigate]);

  const token = Cookies.get("authToken");

  return (
    <div>
      <Navbar />

      <div className="connectionTerms-heroContainer">
        {/* Global Name and Description */}
        <label className="obligation-label">
          <span>Name</span>
          <input
            type="text"
            name="globalName"
            placeholder="Global Connection Type Name"
            value={globalFormData.globalName}
            onChange={handleGlobalChange}
          />
        </label>

        <label className="obligation-label">
          <span>Description</span>
          <input
            type="text"
            name="globalDescription"
            placeholder="Description"
            value={globalFormData.globalDescription}
            onChange={handleGlobalChange}
          />
        </label>
        <label className="obligation-label">
          <span>Template/Policy</span>{" "}
          <select
            name="globaltype"
            value={globalFormData.globaltype} // Bind it to the state
            onChange={handleGlobalChange} // Handle changes
          >
            <option value="">Select Template/Policy</option>{" "}
            <option value="template">template</option>{" "}
            <option value="policy">policy</option>{" "}
          </select>
        </label>
        <label className="obligation-label">
          <span>Domain</span>{" "}
          <select
            name="domain"
            value={globalFormData.domain} // Bind it to the state
            onChange={handleGlobalChange} // Handle changes
          >
            <option value="">Select Domain</option>{" "}
            <option value="health">Healthcare</option>{" "}
            <option value="finance">Finance</option>{" "}
            <option value="education">Education</option>{" "}
            <option value="technology">Technology</option>
            {/*     <option value="other">Other</option> */}{" "}
          </select>
        </label>

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
                    value={obligationFormData.labelName}
                    onChange={handleObligationChange}
                  />
                </label>

                <label className="obligation-label">
                  <span>Type of Action</span>
                  <select
                    className="Title"
                    name="typeOfAction"
                    value={obligationFormData.typeOfAction}
                    onChange={handleObligationChange}
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
                    value={obligationFormData.typeOfSharing}
                    onChange={handleObligationChange}
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
                      <br />
                      <span>
                        Confer: You are going to transfer ownership of the
                        resource, but the recipient cannot modify the contents
                        of what you have conferred. You still have rights over
                        this resource.
                      </span>
                      <br />
                      <span>
                        Share: You are not transferring ownership of this
                        resource, but the recipient can view your resource. The
                        recipient cannot do anything else.
                      </span>
                      <br />
                      <span>
                        Collateral: You are temporarily transferring ownership
                        to the recipient. After this operation, you cannot
                        change anything in the resource and can use this as
                        agreed with the recipient.
                      </span>
                      <br />
                    </span>
                  </span>
                </label>
                <label className="obligation-label">
                  <span>Purpose</span>
                  <input
                    type="text"
                    name="purpose"
                    value={obligationFormData.purpose}
                    onChange={(e) =>
                      setObligationFormData({
                        ...obligationFormData,
                        purpose: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="obligation-label">
                  <span>Description</span>
                  <input
                    type="text"
                    name="labelDescription"
                    placeholder="Description of the obligation"
                    value={obligationFormData.labelDescription}
                    onChange={handleObligationChange}
                  />
                </label>

                <label className="obligation-label">
                  <span>Host Permissions</span>
                  <div className="multiselect-container">
                    <label key="reshare">
                      <input
                        type="checkbox"
                        value="reshare"
                        checked={obligationFormData.hostPermissions.includes(
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
                        checked={obligationFormData.hostPermissions.includes(
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
                        checked={obligationFormData.hostPermissions.includes(
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
                      Select host permissions: Reshare, Download, or Aggregate.
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
                    checked={obligationFormData.canShareMore}
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
                    checked={obligationFormData.canDownload}
                    onChange={handleCheckboxChange}
                  />
                </label>

                <h2>Forbidden</h2>
                <label className="permission-label">
                  <span>You cannot unilaterally close the connection</span>
                  <input
                    type="checkbox"
                    name="forbidden"
                    checked={obligationFormData.forbidden}
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
  );
};
