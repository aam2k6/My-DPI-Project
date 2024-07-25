import React, {useState} from "react";

export const GetResource = ({onSubmit}) =>{
    const [selectedResources, setSelectedResources] = useState([]);

    const resources = [
        "Resource 1",
        "Resource 2",
        "Resource 3",
        "Resource 4"
    ];

    const handleCheckboxChange = (resource) => {
        setSelectedResources(prevState => {
            if (prevState.includes(resource)) {
                return prevState.filter(res => res !== resource);
            } else {
                return [...prevState, resource];
            }
        });
    };

    const handleSubmit = () => {
        onSubmit(selectedResources);
    };

    return (
        <div className="resource-list">
            <h3>Select Resources</h3>
            <ul>
                {resources.map(resource => (
                    <li key={resource}>
                        <label>
                            <input
                                type="checkbox"
                                value={resource}
                                onChange={() => handleCheckboxChange(resource)}
                            />
                            {resource}
                        </label>
                    </li>
                ))}
            </ul>
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
}