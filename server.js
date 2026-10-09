// =========================================================
// MY WEBSITE - COMPLETE BACKEND
// Node.js + Express + MongoDB + JWT + bcrypt
// =========================================================

require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// APP
const app = express();
const PORT = process.env.PORT || 3000;

// JWT SECRET
const JWT_SECRET =
    process.env.JWT_SECRET ||
    "mywebsite_secret_change_this_later";

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// MONGODB
if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

let db;
let usersCollection;
let messagesCollection;

// SAFE USER
function safeUser(user) {
    return {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        dob: user.dob || "",
        gender: user.gender || "",
        country: user.country || "",
        city: user.city || "",
        createdAt: user.createdAt || null
    };
}

// CREATE JWT TOKEN
function createToken(user) {
    return jwt.sign(
        {
            id: user._id.toString(),
            email: user.email
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );
}

// AUTHENTICATION MIDDLEWARE
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        const parts = authHeader.split(" ");

        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format."
            });
        }

        const token = parts[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.id || !ObjectId.isValid(decoded.id)) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        const user = await usersCollection.findOne({
            _id: new ObjectId(decoded.id)
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication Error:", error);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
}

// HEALTH CHECK
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Backend is running successfully.",
        database: db ? "connected" : "not connected"
    });
});

// SIGN UP
app.post("/api/signup", async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            dob,
            gender,
            country,
            city,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (cleanName.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid name."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters."
            });
        }

        const existingUser = await usersCollection.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name: cleanName,
            email: cleanEmail,
            mobile: mobile ? mobile.trim() : "",
            dob: dob || "",
            gender: gender || "",
            country: country || "",
            city: city ? city.trim() : "",
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
            resetToken: null,
            resetTokenExpiry: null
        };

        const result = await usersCollection.insertOne(newUser);

        console.log("New account created:", cleanEmail);

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            userId: result.insertedId.toString()
        });
    } catch (error) {
        console.error("Signup Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during signup."
        });
    }
});

// LOGIN
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const user = await usersCollection.findOne({
            email: cleanEmail
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const token = createToken(user);

        console.log("====================================");
        console.log("USER LOGIN SUCCESS");
        console.log("Email:", user.email);
        console.log("JWT TOKEN CREATED");
        console.log("====================================");

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token: token,
            user: safeUser(user)
        });
    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
});

// CURRENT USER
app.get("/api/me", authenticateToken, async (req, res) => {
    return res.json({
        success: true,
        user: safeUser(req.user)
    });
});

// UPDATE PROFILE
app.put("/api/profile", authenticateToken, async (req, res) => {
    try {
        const {
            name,
            mobile,
            dob,
            gender,
            country,
            city
        } = req.body;

        const updateData = {
            updatedAt: new Date()
        };

        if (typeof name === "string") updateData.name = name.trim();
        if (typeof mobile === "string") updateData.mobile = mobile.trim();
        if (typeof dob === "string") updateData.dob = dob;
        if (typeof gender === "string") updateData.gender = gender;
        if (typeof country === "string") updateData.country = country;
        if (typeof city === "string") updateData.city = city.trim();

        await usersCollection.updateOne(
            { _id: req.user._id },
            { $set: updateData }
        );

        const updatedUser = await usersCollection.findOne({
            _id: req.user._id
        });

        return res.json({
            success: true,
            message: "Profile updated successfully.",
            user: safeUser(updatedUser)
        });
    } catch (error) {
        console.error("Profile Update Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update profile."
        });
    }
});
// =========================================================
// CHANGE PASSWORD
// =========================================================

app.post(
    "/api/change-password",
    authenticateToken,
    async (req, res) => {
        try {
            const {
                currentPassword,
                newPassword
            } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: "Current and new passwords are required."
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "New password must be at least 6 characters."
                });
            }

            const passwordMatch = await bcrypt.compare(
                currentPassword,
                req.user.password
            );

            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Current password is incorrect."
                });
            }

            const hashedPassword = await bcrypt.hash(
                newPassword,
                10
            );

            await usersCollection.updateOne(
                { _id: req.user._id },
                {
                    $set: {
                        password: hashedPassword,
                        updatedAt: new Date()
                    }
                }
            );

            return res.json({
                success: true,
                message: "Password changed successfully."
            });

        } catch (error) {
            console.error("Change Password Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to change password."
            });
        }
    }
);


// =========================================================
// FORGOT PASSWORD
// =========================================================

app.post(
    "/api/forgot-password",
    async (req, res) => {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter your email."
                });
            }

            const cleanEmail = email.trim().toLowerCase();

            const user = await usersCollection.findOne({
                email: cleanEmail
            });

            // Avoid revealing whether the email is registered.
            if (!user) {
                return res.json({
                    success: true,
                    message:
                        "If an account exists, a reset request has been created."
                });
            }

            const resetToken = crypto
                .randomBytes(32)
                .toString("hex");

            const resetTokenExpiry = new Date(
                Date.now() + 15 * 60 * 1000
            );

            await usersCollection.updateOne(
                { _id: user._id },
                {
                    $set: {
                        resetToken: resetToken,
                        resetTokenExpiry: resetTokenExpiry
                    }
                }
            );

            console.log(
                "Password reset token created for:",
                cleanEmail
            );

            // Development/testing only:
            // Do not expose reset tokens in a production response.
            return res.json({
                success: true,
                message: "Password reset request created.",
                resetToken: resetToken
            });

        } catch (error) {
            console.error("Forgot Password Error:", error);

            return res.status(500).json({
                success: false,
                message: "Server error."
            });
        }
    }
);


// =========================================================
// RESET PASSWORD
// =========================================================

app.post(
    "/api/reset-password",
    async (req, res) => {
        try {
            const {
                token,
                newPassword
            } = req.body;

            if (!token || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Reset token and new password are required."
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password must be at least 6 characters."
                });
            }

            const user = await usersCollection.findOne({
                resetToken: token,
                resetTokenExpiry: {
                    $gt: new Date()
                }
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired reset token."
                });
            }

            const hashedPassword = await bcrypt.hash(
                newPassword,
                10
            );

            await usersCollection.updateOne(
                { _id: user._id },
                {
                    $set: {
                        password: hashedPassword,
                        updatedAt: new Date()
                    },
                    $unset: {
                        resetToken: "",
                        resetTokenExpiry: ""
                    }
                }
            );

            return res.json({
                success: true,
                message: "Password reset successfully."
            });

        } catch (error) {
            console.error("Reset Password Error:", error);

            return res.status(500).json({
                success: false,
                message: "Server error."
            });
        }
    }
);
// =========================================================
// CONTACT MESSAGE - SAVE MESSAGE
// =========================================================

app.post("/api/messages", async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "Name, email and message are required."
            });
        }

        const result = await messagesCollection.insertOne({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: message.trim(),
            date: new Date(),
            read: false
        });

        console.log("New message saved:", result.insertedId);

        return res.status(201).json({
            success: true,
            message: "Message sent successfully."
        });

    } catch (error) {
        console.error("Message Save Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to save message."
        });
    }
});


// =========================================================
// TOTAL MESSAGE COUNT
// =========================================================

app.get(
    "/api/messages/count",
    authenticateToken,
    async (req, res) => {
        try {
            const count = await messagesCollection.countDocuments();

            return res.json({
                success: true,
                count: count
            });

        } catch (error) {
            console.error("Message Count Error:", error);

            return res.status(500).json({
                success: false,
                count: 0
            });
        }
    }
);


// =========================================================
// UNREAD MESSAGE COUNT
// =========================================================

app.get(
    "/api/messages/unread-count",
    authenticateToken,
    async (req, res) => {
        try {
            const count = await messagesCollection.countDocuments({
                read: false
            });

            return res.json({
                success: true,
                count: count
            });

        } catch (error) {
            console.error("Unread Count Error:", error);

            return res.status(500).json({
                success: false,
                count: 0
            });
        }
    }
);


// =========================================================
// GET ALL MESSAGES
// =========================================================

app.get(
    "/api/messages",
    authenticateToken,
    async (req, res) => {
        try {
            const allMessages = await messagesCollection
                .find({})
                .sort({ date: -1 })
                .toArray();

            return res.json({
                success: true,
                messages: allMessages
            });

        } catch (error) {
            console.error("Get Messages Error:", error);

            return res.status(500).json({
                success: false,
                messages: []
            });
        }
    }
);


// =========================================================
// MARK MESSAGE AS READ
// =========================================================

app.put(
    "/api/messages/:id/read",
    authenticateToken,
    async (req, res) => {
        try {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid message ID."
                });
            }

            const result = await messagesCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { read: true } }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Message not found."
                });
            }

            return res.json({
                success: true,
                message: "Message marked as read."
            });

        } catch (error) {
            console.error("Mark Read Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update message."
            });
        }
    }
);


// =========================================================
// DELETE MESSAGE
// =========================================================

app.delete(
    "/api/messages/:id",
    authenticateToken,
    async (req, res) => {
        try {
            const id = req.params.id;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid message ID."
                });
            }

            const result = await messagesCollection.deleteOne({
                _id: new ObjectId(id)
            });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Message not found."
                });
            }

            return res.json({
                success: true,
                message: "Message deleted successfully."
            });

        } catch (error) {
            console.error("Delete Message Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to delete message."
            });
        }
    }
);


// =========================================================
// TOTAL USERS COUNT
// =========================================================

app.get(
    "/api/users/count",
    authenticateToken,
    async (req, res) => {
        try {
            const count = await usersCollection.countDocuments();

            return res.json({
                success: true,
                count: count
            });

        } catch (error) {
            console.error("Users Count Error:", error);

            return res.status(500).json({
                success: false,
                count: 0
            });
        }
    }
);


// =========================================================
// RECENT USERS
// =========================================================

app.get(
    "/api/users/recent",
    authenticateToken,
    async (req, res) => {
        try {
            const users = await usersCollection
                .find(
                    {},
                    {
                        projection: {
                            password: 0,
                            resetToken: 0,
                            resetTokenExpiry: 0
                        }
                    }
                )
                .sort({ createdAt: -1 })
                .limit(10)
                .toArray();

            return res.json({
                success: true,
                users: users
            });

        } catch (error) {
            console.error("Recent Users Error:", error);

            return res.status(500).json({
                success: false,
                users: []
            });
        }
    }
);
// =========================================================
// DASHBOARD API
// =========================================================

app.get(
    "/api/dashboard",
    authenticateToken,
    async (req, res) => {
        try {
            const totalUsers =
                await usersCollection.countDocuments();

            const totalMessages =
                await messagesCollection.countDocuments();

            const unreadMessages =
                await messagesCollection.countDocuments({
                    read: false
                });

            // Count messages matching the logged-in user's email.
            const userMessages =
                await messagesCollection.countDocuments({
                    email: req.user.email.toLowerCase()
                });

            const recentMessages =
                await messagesCollection
                    .find({})
                    .sort({ date: -1 })
                    .limit(5)
                    .toArray();

            return res.json({
                success: true,

                user: safeUser(req.user),

                stats: {
                    totalUsers: totalUsers,
                    totalMessages: totalMessages,
                    unreadMessages: unreadMessages
                },

                userMessages: userMessages,

                recentMessages: recentMessages
            });

        } catch (error) {
            console.error("Dashboard Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load dashboard."
            });
        }
    }
);


// =========================================================
// STATISTICS API
// =========================================================

app.get(
    "/api/statistics",
    authenticateToken,
    async (req, res) => {
        try {
            const totalUsers =
                await usersCollection.countDocuments();

            const totalMessages =
                await messagesCollection.countDocuments();

            const unreadMessages =
                await messagesCollection.countDocuments({
                    read: false
                });

            const lastSevenDays = new Date();
            lastSevenDays.setDate(
                lastSevenDays.getDate() - 7
            );

            const newUsersLast7Days =
                await usersCollection.countDocuments({
                    createdAt: {
                        $gte: lastSevenDays
                    }
                });

            const messagesLast7Days =
                await messagesCollection.countDocuments({
                    date: {
                        $gte: lastSevenDays
                    }
                });

            return res.json({
                success: true,

                statistics: {
                    totalUsers: totalUsers,
                    totalMessages: totalMessages,
                    unreadMessages: unreadMessages,
                    newUsersLast7Days: newUsersLast7Days,
                    messagesLast7Days: messagesLast7Days
                }
            });

        } catch (error) {
            console.error("Statistics Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load statistics."
            });
        }
    }
);


// =========================================================
// API 404 HANDLER
// =========================================================

app.use("/api", (req, res) => {
    return res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});


// =========================================================
// START SERVER
// =========================================================

async function startServer() {
    try {
        await client.connect();

        console.log("MongoDB Connected Successfully! ✅");

        db = client.db("mywebsite");

        usersCollection = db.collection("users");
        messagesCollection = db.collection("messages");

        // Create unique index for user emails.
        try {
            await usersCollection.createIndex(
                { email: 1 },
                { unique: true }
            );

            console.log("User email index ready. ✅");

        } catch (error) {
            console.error(
                "User email index setup error:",
                error.message
            );

            throw error;
        }

        // Index messages by date.
        await messagesCollection.createIndex({
            date: -1
        });

        console.log("Message date index ready. ✅");

        app.listen(PORT, () => {
            console.log("====================================");
            console.log("MY WEBSITE BACKEND STARTED 🚀");
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`Health check: http://localhost:${PORT}/api/health`);
            console.log("====================================");
        });

    } catch (error) {
        console.error("❌ Server Startup Error:", error);
        process.exit(1);
    }
}


// =========================================================
// RUN SERVER
// =========================================================

startServer();