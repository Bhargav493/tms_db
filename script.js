function submitAdmin(event) {
    event.preventDefault();
    const formData = {
        name: document.getElementById('adminName').value,
        email: document.getElementById('adminEmail').value,
        password: document.getElementById('adminPassword').value,
        mobile: document.getElementById('adminMobile').value
    };
    fetch('/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        // Update admin table here
        alert('Admin added successfully!');
    })
    .catch(error => console.error('Error:', error));
}

// Additional functions for Users, Leaves, Tasks similarly structured

document.addEventListener('DOMContentLoaded', function() {
    // Initial data loading functions
});
