import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./ConnectionTermsGlobal.css";
import Navbar from "../Navbar/Navbar";

import Cookies from "js-cookie";
import { usercontext } from "../../usercontext";

export const ConnectionTermsGlobal = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the state passed from the previous page
  const { connectionTypeName, connectionTypeDescription, existingTerms } = location.state || {};

  useEffect(() => {
    if (location.state) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        globalName: connectionTypeName || "",
        globalDescription: connectionTypeDescription || "",
      }));
      console.log("existing terms ", existingTerms);
      if (existingTerms && existingTerms.length > 0) {
      // Map existing terms to the formData structure
      const mappedTerms = existingTerms.map((term) => ({
        labelName: term.data_element_name || "", // Map data_element_name to labelName
        typeOfAction: term.data_type || "text",
        typeOfSharing: term.sharing_type || "share",
        labelDescription: term.description || "",
        hostPermissions: term.host_permissions || [],
        // canShareMore: term.permissions.canShareMoreData,
        // canDownload: term.permissions.canDownloadData,
        canShareMore: false,
        canDownload: false,
        globalName: connectionTypeName || "",
        globalDescription: connectionTypeDescription || "",
      }));
      setObligations(mappedTerms);
      }
    }
  }, [location.state]);


  const initialFormData = {
    labelName: "",
    typeOfAction: "text",
    typeOfSharing: "share",
    labelDescription: "",
    hostPermissions: [],
    canShareMore: false,
    canDownload: false,
    globalName: "",
    globalDescription: "",
  };
  const [formData, setFormData] = useState(initialFormData);
  const [obligations, setObligations] = useState([]); // Change to an array
  const [error, setError] = useState(null);
  const { curruser, setUser } = useContext(usercontext);
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
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

    if (
      formData.globalName.trim() === "" ||
      formData.globalDescription.trim() === ""
    ) {
      alert("Please fill out both the Name and Description fields.");
      return; // Prevent form submission if fields are empty
    }

    const token = Cookies.get("authToken");

    const connectionTermsData = {
      connection_terms_obligations: obligations,
      connection_terms_permissions: {
        canShareMoreData: formData.canShareMore,
        canDownloadData: formData.canDownload,
      },
    };

    console.log(connectionTermsData);
    console.log(formData.globalName);
    console.log(formData.globalDescription);

    fetch("http://172.16.192.201:8000/create-global-terms/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`, // Include your authentication token
      },
      body: JSON.stringify(connectionTermsData),
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error("Failed to create global terms");
        }
      })
      .then((data) => {
        console.log("Global terms created successfully.");

        // Extract terms_id from the response
        const termsIDs = data.terms.map((term) => term.terms_id);

        const globalTemplateData = {
          global_connection_type_name: formData.globalName,
          global_connection_type_description: formData.globalDescription,
          global_terms_IDs: termsIDs,
        };

        console.log(globalTemplateData);

        // Trigger the second API call with the terms_ids
        return fetch("http://172.16.192.201:8000/add-global-template/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`, // Include your authentication token
          },
          body: JSON.stringify(globalTemplateData),
        });
      })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw new Error("Failed to add global template");
        }
      })
      .then((data) => {
        alert("Global template added successfully.");
        // navigate("/admin");
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

  // const handleHomeClick = () => {
  //   navigate("/home");
  // };

  // const handleDPIDirectory = () => {
  //   navigate("/dpi-directory");
  // };

  // const handleAdmin = () => {
  //   navigate("/admin");
  // };

  // const handleLogout = () => {
  //   Cookies.remove("authToken");
  //   localStorage.removeItem("curruser");
  //   setUser(null);
  //   navigate("/");
  // };

  // const toggleDropdown = () => {
  //   setIsOpen(!isOpen);
  // };

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
  }, [curruser]);

  const token = Cookies.get("authToken");

  return (
    <div>
      <Navbar />

      <div className="connectionTerms-heroContainer">
        <label className="obligation-label">
          <span>Name</span>
          <input
            type="text"
            name="globalName"
            placeholder="Global Connection Type Name"
            value={formData.globalName}
            onChange={handleInputChange}
          />
        </label>

        <label className="obligation-label">
          <span>Description</span>
          <input
            type="text"
            name="globalDescription"
            placeholder="Description"
            value={formData.globalDescription}
            onChange={handleInputChange}
          />
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
                        resource, but the recipient cannot modify the contents
                        of what you have conferred. You still have rights over
                        this resource.
                      </span>
                      <br></br>
                      <span>
                        Share: You are not transferring ownership of this
                        resource, but the recipient can view your resource. The
                        recipient cannot do anything else.
                      </span>
                      <br></br>
                      <span>
                        Collateral: You are temporarily transferring ownership
                        to the recipient. After this operation, you cannot
                        change anything in the resource and can use this as
                        agreed with the recipient.
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
                        checked={formData.hostPermissions.includes("reshare")}
                        onChange={handleHostPermissionsChange}
                      />
                      Reshare
                    </label>
                    <label key="download">
                      <input
                        type="checkbox"
                        value="download"
                        checked={formData.hostPermissions.includes("download")}
                        onChange={handleHostPermissionsChange}
                      />
                      Download
                    </label>
                    <label key="aggregate">
                      <input
                        type="checkbox"
                        value="aggregate"
                        checked={formData.hostPermissions.includes("aggregate")}
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
  );
};
