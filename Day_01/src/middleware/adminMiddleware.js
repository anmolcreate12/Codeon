const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      throw new Error("Token is not present");
    }

    // 1. Check blacklist first (FASTEST CHECK)
    const isBlocked = await redisClient.exists(`token:${token}`);
    if (isBlocked === 1) {
      throw new Error("Token is blocked");
    }

    // 2. Verify token
    const payload = jwt.verify(token, process.env.JWT_KEY);

    // 3. Get user from DB (source of truth)
    const user = await User.findById(payload._id);
    if (!user) {
      throw new Error("User does not exist");
    }

    // 4. Check role from DB (more secure)
    if (user.role !== "admin") {
      throw new Error("Admin access required");
    }

    req.result = user;
    next();

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = adminMiddleware;