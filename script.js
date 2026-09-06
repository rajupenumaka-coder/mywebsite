function showMessage() {
    alert("Welcome! You clicked the button.");
}
function sendMessage(event) {
    event.preventDefault();

    const form = event.target;

    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const message = form.querySelector("textarea").value;

    // Save latest message
    const latestMessage = {
        name: name,
        email: email,
        message: message
    };

    localStorage.setItem(
        "latestMessage",
        JSON.stringify(latestMessage)
    );

    // Update message count
    let count = Number(localStorage.getItem("messageCount")) || 0;
    count++;

    localStorage.setItem("messageCount", count);

    alert("Message Sent Successfully! ✅");

    form.reset();
}
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");

    const button = document.getElementById("darkModeBtn");

    if (document.body.classList.contains("dark-mode")) {
        button.innerHTML = "☀️ Light Mode";
    } else {
        button.innerHTML = "🌙 Dark Mode";
    }
}
function loginUser(event) {

    event.preventDefault();

    alert("Login Successful! 🎉");

    window.location.href = "dashboard.html";
}
function signupUser(event) {
    event.preventDefault();

    alert("Account Created Successfully! 🎉");
}
function signupUser(event) {
    event.preventDefault();

    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match! ❌");
        return;
    }

    alert("Account Created Successfully! 🎉");
}
function logoutUser() {
    localStorage.removeItem("userName");

    alert("You have been logged out. 👋");

    window.location.href = "index.html";
}
function editProfile() {
    const name = prompt("Enter your name:");

    if (name) {
        alert("Profile updated successfully! 🎉");
    }
}
function updateClock() {
    const now = new Date();

    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();

    document.getElementById("currentTime").innerHTML = time;
    document.getElementById("currentDate").innerHTML = date;
}
function searchWebsite() {
    const searchText = document.getElementById("searchInput").value
        .toLowerCase()
        .trim();

    if (searchText === "") {
        alert("Please enter something to search. 🔍");
        return;
    }

    if (searchText.includes("home")) {
        document.getElementById("home").scrollIntoView({
            behavior: "smooth"
        });
    }
    else if (searchText.includes("about")) {
        document.getElementById("about").scrollIntoView({
            behavior: "smooth"
        });
    }
    else if (searchText.includes("contact")) {
        document.getElementById("contact").scrollIntoView({
            behavior: "smooth"
        });
    }
    else {
        alert("No matching section found ❌");
    }
}