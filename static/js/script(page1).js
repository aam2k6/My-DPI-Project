document.addEventListener('DOMContentLoaded', (event) => {
    const newLockerBtn = document.getElementById('newLockerBtn');
    newLockerBtn.addEventListener('click', () => {
        let lockerName = prompt("Enter the name of new locker");
        if (lockerName) {
            fetch('/create-locker/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ name: lockerName })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert(`New Locker '${lockerName}' created!`);
                    // Add the new locker to the list
                    const lockerList = document.getElementById('lockerList');
                    const newLocker = document.createElement('div');
                    newLocker.classList.add('locker-box');
                    newLocker.innerHTML = `<h4>${data.name}</h4><button class="openBtn btn btn-secondary">Open</button>`;
                    lockerList.appendChild(newLocker);
                } else {
                    alert('Error creating locker: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error creating locker');
            });
        }
    });
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
