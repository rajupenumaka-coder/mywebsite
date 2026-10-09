```javascript
// =========================================================
// MY WEBSITE - COMPLETE FRONTEND JAVASCRIPT
// =========================================================


// =========================================================
// API BASE
// =========================================================

const API_BASE = "";


// =========================================================
// GET AUTH TOKEN
// =========================================================

function getAuthToken() {

    return (
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken") ||
        ""
    );

}


// =========================================================
// GET STORED USER
// =========================================================

function getStoredUser() {

    try {

        const user =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");

        if (!user) {
            return null;
        }

        return JSON.parse(user);

    } catch (error) {

        console.error(
            "Stored User Error:",
            error
        );

        return null;

    }

}


// =========================================================
// SAVE USER
// =========================================================

function saveUser(user) {

    if (!user) {
        return;
    }

    const userData =
        JSON.stringify(user);


    if (
        localStorage.getItem("authToken")
    ) {

        localStorage.setItem(
            "user",
            userData
        );

    } else {

        sessionStorage.setItem(
            "user",
            userData
        );

    }

}


// =========================================================
// GET AUTH HEADERS
// =========================================================

function getAuthHeaders() {

    const token =
        getAuthToken();


    return {

        "Content-Type":
            "application/json",

        "Authorization":
            "Bearer " + token

    };

}


// =========================================================
// SIGN UP
// =========================================================

async function signupUser(event) {

    event.preventDefault();


    try {

        const form =
            event.target;


        const name =
            document.getElementById(
                "signupName"
            )?.value.trim();


        const email =
            document.getElementById(
                "signupEmail"
            )?.value.trim();


        const mobile =
            document.getElementById(
                "signupMobile"
            )?.value.trim();


        const dob =
            document.getElementById(
                "signupDOB"
            )?.value || "";


        const gender =
            document.getElementById(
                "signupGender"
            )?.value || "";


        const country =
            document.getElementById(
                "signupCountry"
            )?.value.trim() || "";


        const city =
            document.getElementById(
                "signupCity"
            )?.value.trim() || "";


        const password =
            document.getElementById(
                "signupPassword"
            )?.value;


        const confirmPassword =
            document.getElementById(
                "confirmPassword"
            )?.value;


        if (!name || !email || !password) {

            alert(
                "Please fill all required fields."
            );

            return;

        }


        if (
            confirmPassword &&
            password !== confirmPassword
        ) {

            alert(
                "Passwords do not match."
            );

            return;

        }


        const response =
            await fetch(
                API_BASE + "/api/signup",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            name,
                            email,
                            mobile,
                            dob,
                            gender,
                            country,
                            city,
                            password

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Signup failed."
            );

        }


        alert(
            "Account created successfully! ✅"
        );


        if (form) {
            form.reset();
        }


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Signup Error:",
            error
        );

        alert(
            error.message ||
            "Unable to create account."
        );

    }

}


// =========================================================
// LOGIN
// =========================================================

async function loginUser(event) {

    event.preventDefault();


    try {

        const email =
            document.getElementById(
                "loginEmail"
            )?.value.trim();


        const password =
            document.getElementById(
                "loginPassword"
            )?.value;


        const rememberMe =
            document.getElementById(
                "rememberMe"
            )?.checked;


        if (!email || !password) {

            alert(
                "Please enter email and password."
            );

            return;

        }


        const response =
            await fetch(
                API_BASE + "/api/login",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            email,
                            password

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Login failed."
            );

        }


        // =================================================
        // SAVE TOKEN
        // =================================================

        if (rememberMe) {

            localStorage.setItem(
                "authToken",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            // Keep signupName for compatibility
            localStorage.setItem(
                "signupName",
                data.user.name || ""
            );

        } else {

            sessionStorage.setItem(
                "authToken",
                data.token
            );

            sessionStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

        }


        alert(
            "Login successful! ✅"
        );


        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "Login Error:",
            error
        );

        alert(
            error.message ||
            "Unable to login."
        );

    }

}


// =========================================================
// CHECK LOGIN
// =========================================================

function checkLogin() {

    const token =
        getAuthToken();


    if (!token) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


// =========================================================
// DASHBOARD
// =========================================================

async function loadDashboard() {

    if (!checkLogin()) {
        return;
    }


    try {

        const token =
            getAuthToken();


        if (!token) {

            logoutUser();

            return;

        }


        // =================================================
        // GET DASHBOARD DATA
        // =================================================

        const response =
            await fetch(
                API_BASE + "/api/dashboard",
                {

                    method:
                        "GET",

                    headers: {

                        "Authorization":
                            "Bearer " + token,

                        "Content-Type":
                            "application/json"

                    }

                }
            );


        const data =
            await response.json();


        console.log(
            "Dashboard API Response:",
            data
        );


        // =================================================
        // AUTH ERROR
        // =================================================

        if (
            response.status === 401
        ) {

            console.error(
                "Authentication failed:",
                data
            );

            logoutUser();

            return;

        }


        // =================================================
        // SERVER ERROR
        // =================================================

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Failed to load dashboard."
            );

        }


        // =================================================
        // USER INFORMATION
        // =================================================

        const user =
            data.user ||
            getStoredUser();


        if (user) {

            updateElement(
                "dashboardUserName",
                user.name || "-"
            );


            updateElement(
                "dashboardUserEmail",
                user.email || "-"
            );


            updateElement(
                "welcomeUserName",
                user.name || "User"
            );


            updateElement(
                "profileName",
                user.name || "-"
            );


            updateElement(
                "profileEmail",
                user.email || "-"
            );


            updateElement(
                "profileMobile",
                user.mobile || "-"
            );


            updateElement(
                "profileCountry",
                user.country || "-"
            );


            updateElement(
                "profileCity",
                user.city || "-"
            );

        }


        // =================================================
        // DASHBOARD STATISTICS
        // =================================================

        const stats =
            data.stats || {};


        console.log(
            "Dashboard Stats:",
            stats
        );


        // TOTAL USERS

        updateElement(
            "totalUsers",
            stats.totalUsers ?? 0
        );


        // TOTAL MESSAGES

        updateElement(
            "totalMessages",
            stats.totalMessages ?? 0
        );


        // =================================================
        // MY MESSAGES
        // =================================================

        if (
            data.userMessages !== undefined
        ) {

            updateElement(
                "userMessages",
                data.userMessages
            );

        } else {

            updateElement(
                "userMessages",
                0
            );

        }


        console.log(
            "Dashboard loaded successfully. ✅"
        );


    } catch (error) {

        console.error(
            "Dashboard Error:",
            error
        );

    }

}


// =========================================================
// LOAD PROFILE
// =========================================================

async function loadProfile() {

    if (!checkLogin()) {
        return;
    }


    try {

        const response =
            await fetch(
                API_BASE + "/api/me",
                {

                    method:
                        "GET",

                    headers:
                        getAuthHeaders()

                }
            );


        const data =
            await response.json();


        console.log(
            "Profile API Response:",
            data
        );


        if (
            response.status === 401
        ) {

            logoutUser();

            return;

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to load profile."
            );

        }


        const user =
            data.user;


        if (!user) {
            return;
        }


        saveUser(user);


        // =================================================
        // PROFILE PAGE
        // =================================================

        updateElement(
            "profileDisplayName",
            user.name || "-"
        );


        updateElement(
            "profileDisplayEmail",
            user.email || "-"
        );


        setInputValue(
            "profileName",
            user.name
        );


        setInputValue(
            "profileEmail",
            user.email
        );


        setInputValue(
            "profileMobile",
            user.mobile
        );


        setInputValue(
            "profileDOB",
            user.dob
        );


        setInputValue(
            "profileGender",
            user.gender
        );


        setInputValue(
            "profileCountry",
            user.country
        );


        setInputValue(
            "profileCity",
            user.city
        );


        // =================================================
        // DASHBOARD
        // =================================================

        updateElement(
            "dashboardUserName",
            user.name || "-"
        );


        updateElement(
            "dashboardUserEmail",
            user.email || "-"
        );


        updateElement(
            "welcomeUserName",
            user.name || "User"
        );


        updateElement(
            "profileName",
            user.name || "-"
        );


        updateElement(
            "profileEmail",
            user.email || "-"
        );


        updateElement(
            "profileMobile",
            user.mobile || "-"
        );


        updateElement(
            "profileCountry",
            user.country || "-"
        );


        updateElement(
            "profileCity",
            user.city || "-"
        );


        // =================================================
        // COMPATIBILITY
        // =================================================

        localStorage.setItem(
            "signupName",
            user.name || ""
        );


    } catch (error) {

        console.error(
            "Profile Load Error:",
            error
        );

    }

}


// =========================================================
// UPDATE PROFILE
// =========================================================

async function updateProfile(event) {

    event.preventDefault();


    if (!checkLogin()) {
        return;
    }


    try {

        const name =
            document.getElementById(
                "profileName"
            )?.value.trim();


        const mobile =
            document.getElementById(
                "profileMobile"
            )?.value.trim() || "";


        const dob =
            document.getElementById(
                "profileDOB"
            )?.value || "";


        const gender =
            document.getElementById(
                "profileGender"
            )?.value || "";


        const country =
            document.getElementById(
                "profileCountry"
            )?.value.trim() || "";


        const city =
            document.getElementById(
                "profileCity"
            )?.value.trim() || "";


        if (!name) {

            alert(
                "Name is required."
            );

            return;

        }


        const response =
            await fetch(
                API_BASE + "/api/profile",
                {

                    method:
                        "PUT",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            name,
                            mobile,
                            dob,
                            gender,
                            country,
                            city

                        })

                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {

            logoutUser();

            return;

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Profile update failed."
            );

        }


        saveUser(
            data.user
        );


        localStorage.setItem(
            "signupName",
            data.user.name || ""
        );


        updateElement(
            "profileDisplayName",
            data.user.name || "-"
        );


        updateElement(
            "profileDisplayEmail",
            data.user.email || "-"
        );


        alert(
            "Profile updated successfully! ✅"
        );


    } catch (error) {

        console.error(
            "Profile Update Error:",
            error
        );

        alert(
            error.message ||
            "Unable to update profile."
        );

    }

}


// =========================================================
// CHANGE PASSWORD
// =========================================================

async function changePassword(event) {

    event.preventDefault();


    if (!checkLogin()) {
        return;
    }


    try {

        const currentPassword =
            document.getElementById(
                "currentPassword"
            )?.value;


        const newPassword =
            document.getElementById(
                "newPassword"
            )?.value;


        const confirmNewPassword =
            document.getElementById(
                "confirmNewPassword"
            )?.value;


        if (
            !currentPassword ||
            !newPassword
        ) {

            alert(
                "Please fill all password fields."
            );

            return;

        }


        if (
            newPassword !==
            confirmNewPassword
        ) {

            alert(
                "New passwords do not match."
            );

            return;

        }


        const response =
            await fetch(
                API_BASE +
                "/api/change-password",
                {

                    method:
                        "POST",

                    headers:
                        getAuthHeaders(),

                    body:
                        JSON.stringify({

                            currentPassword,
                            newPassword

                        })

                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {

            logoutUser();

            return;

        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to change password."
            );

        }


        alert(
            "Password changed successfully! ✅"
        );


        const form =
            event.target;


        if (form) {
            form.reset();
        }


    } catch (error) {

        console.error(
            "Change Password Error:",
            error
        );

        alert(
            error.message ||
            "Unable to change password."
        );

    }

}


// =========================================================
// SEND CONTACT MESSAGE
// =========================================================

async function sendMessage(event) {

    event.preventDefault();


    try {

        const form =
            event.target;


        if (!form) {

            alert(
                "Form not found."
            );

            return;

        }


        const nameInput =
            form.querySelector(
                'input[type="text"]'
            );


        const emailInput =
            form.querySelector(
                'input[type="email"]'
            );


        const messageInput =
            form.querySelector(
                "textarea"
            );


        const name =
            nameInput?.value.trim();


        const email =
            emailInput?.value.trim();


        const message =
            messageInput?.value.trim();


        if (
            !name ||
            !email ||
            !message
        ) {

            alert(
                "Please fill all fields."
            );

            return;

        }


        const response =
            await fetch(
                API_BASE +
                "/api/messages",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            name,
                            email,
                            message

                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to send message."
            );

        }


        alert(
            "Message sent successfully! ✅"
        );


        form.reset();


    } catch (error) {

        console.error(
            "Message Error:",
            error
        );

        alert(
            error.message ||
            "Unable to send message."
        );

    }

}


// =========================================================
// LOGOUT
// =========================================================

function logoutUser() {

    localStorage.removeItem(
        "authToken"
    );

    localStorage.removeItem(
        "user"
    );

    localStorage.removeItem(
        "signupName"
    );


    sessionStorage.removeItem(
        "authToken"
    );

    sessionStorage.removeItem(
        "user"
    );


    window.location.href =
        "login.html";

}


// =========================================================
// UPDATE ELEMENT
// =========================================================

function updateElement(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {

        console.warn(
            "Element not found:",
            id
        );

        return;

    }


    element.textContent =
        value ?? "";

}


// =========================================================
// SET INPUT VALUE
// =========================================================

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    element.value =
        value ?? "";

}


// =========================================================
// TOGGLE PASSWORD
// =========================================================

function togglePassword(
    inputId,
    button
) {

    const input =
        document.getElementById(
            inputId
        );


    if (!input) {
        return;
    }


    if (
        input.type ===
        "password"
    ) {

        input.type =
            "text";


        if (button) {
            button.textContent =
                "🙈";
        }

    } else {

        input.type =
            "password";


        if (button) {
            button.textContent =
                "👁️";
        }

    }

}


// =========================================================
// FORGOT PASSWORD
// =========================================================

async function forgotPassword() {

    try {

        const email =
            document.getElementById(
                "forgotEmail"
            )?.value.trim();


        if (!email) {

            alert(
                "Please enter your email."
            );

            return;

        }


        const response =
            await fetch(
                API_BASE +
                "/api/forgot-password",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            email
                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to create reset request."
            );

        }


        if (data.resetToken) {

            console.log(
                "Development Reset Token:",
                data.resetToken
            );


            alert(
                "Reset request created. Check browser console for the reset token."
            );

        } else {

            alert(
                data.message
            );

        }


    } catch (error) {

        console.error(
            "Forgot Password Error:",
            error
        );

        alert(
            error.message ||
            "Unable to process request."
        );

    }

}


// =========================================================
// RESET PASSWORD
// =========================================================

async function resetPassword() {

    try {

        const token =
            document.getElementById(
                "resetToken"
            )?.value.trim();


        const newPassword =
            document.getElementById(
                "resetPassword"
            )?.value;


        if (
            !token ||
            !newPassword
        ) {

            alert(
                "Reset token and new password are required."
            );

            return;

        }


        const response =
            await fetch(
                API_BASE +
                "/api/reset-password",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            token,
                            newPassword

                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Unable to reset password."
            );

        }


        alert(
            "Password reset successfully! ✅"
        );


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Reset Password Error:",
            error
        );

        alert(
            error.message ||
            "Unable to reset password."
        );

    }

}


// =========================================================
// PAGE LOAD
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // =================================================
        // DASHBOARD PAGE
        // =================================================

        if (
            document.getElementById(
                "totalUsers"
            ) &&
            document.getElementById(
                "totalMessages"
            )
        ) {

            if (checkLogin()) {

                await loadDashboard();

                await loadProfile();

            }

        }


        // =================================================
        // PROFILE PAGE
        // =================================================

        if (
            document.getElementById(
                "profileDisplayName"
            )
        ) {

            if (checkLogin()) {

                await loadProfile();

            }

        }

    }
);
```