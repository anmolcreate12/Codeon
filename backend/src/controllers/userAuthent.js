const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission");

const register = async (req, res) => {
    try {
        validate(req.body);
        const { firstName, emailId, password } = req.body;

        const existingUser = await User.findOne({ emailId: emailId.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists", message: "Email is already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        req.body.password = hashedPassword;
        req.body.role = 'user';

        const user = await User.create(req.body);
        const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: 'user' }, process.env.JWT_KEY, { expiresIn: '1h' });
        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
        };

        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
        });
        
        res.status(201).json({
            user: reply,
            message: "Registered Successfully"
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message, message: err.message });
    }
};

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            return res.status(400).json({ error: "Invalid Credentials", message: "Email and password are required" });
        }

        const user = await User.findOne({ emailId: emailId.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: "Invalid Credentials", message: "Invalid Credentials" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Invalid Credentials", message: "Invalid Credentials" });
        }

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
        };

        const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: user.role }, process.env.JWT_KEY, { expiresIn: '1h' });
        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
        });

        res.status(200).json({
            user: reply,
            message: "Logged In Successfully"
        });
    }
    catch (err) {
        res.status(401).json({ error: err.message, message: err.message });
    }
};

// logOut feature
const logout = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (token) {
            const payload = jwt.decode(token);
            if (payload && payload.exp) {
                try {
                    await redisClient.set(`token:${token}`, 'Blocked');
                    await redisClient.expireAt(`token:${token}`, payload.exp);
                } catch (redisErr) {
                    console.error('Redis error during logout:', redisErr);
                }
            }
        }

        res.cookie("token", "", {
            expires: new Date(0),
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
        });

        res.status(200).json({ message: "Logged Out Successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message, message: "Error logging out" });
    }
};

const adminRegister = async (req, res) => {
    try {
        validate(req.body);
        const { emailId, password } = req.body;

        const existingUser = await User.findOne({ emailId: emailId.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists", message: "Email is already registered" });
        }

        req.body.password = await bcrypt.hash(password, 10);
        req.body.role = 'admin';

        const user = await User.create(req.body);
        const token = jwt.sign({ _id: user._id, emailId: user.emailId, role: user.role }, process.env.JWT_KEY, { expiresIn: '1h' });
        res.cookie('token', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax"
        });

        res.status(201).json({ message: "Admin Registered Successfully", user: { firstName: user.firstName, emailId: user.emailId, role: user.role } });
    }
    catch (err) {
        res.status(400).json({ error: err.message, message: err.message });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.result._id;
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: "Deleted Successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message, message: "Internal Server Error" });
    }
};

module.exports = { register, login, logout, adminRegister, deleteProfile };