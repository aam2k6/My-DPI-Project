function openUploadForm() {
    document.getElementById('uploadModal').style.display = 'block';
}

// Function to close the upload form modal
function closeUploadForm() {
    document.getElementById('uploadModal').style.display = 'none';
}

// Close the modal if the user clicks outside of it
window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target == modal) {
        closeUploadForm();
    }
};

// Event listener for the upload button
document.addEventListener('DOMContentLoaded', function() {
    const uploadButton = document.getElementById('uploadButton');
    if (uploadButton) {
        uploadButton.addEventListener('click', openUploadForm);
    }
});
