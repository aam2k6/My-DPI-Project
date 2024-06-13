function redirectToEducation(){
    window.location.href = '/sharingpage(page2)/';
}

document.getElementById('educationBtn').addEventListener('click',redirectToEducation);
document.getElementById('docsBtn').addEventListener('click',redirectToEducation);


document.addEventListener('DOMContentLoaded', (event)=>{
    const newConnectionBtn = document.getElementById('newLockerBtn');
    newConnectionBtn.addEventListener('click', () => {
        let lockerName = prompt("Enter the name of new locker");
        if(lockerName){
            alert(`New Locker '${lockerName} created!`);
        }
    })
});