const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit"); // ← import the helper

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        // normalize the IP through the library's helper, then combine with email
        return `${ipKeyGenerator(req)}-${req.body?.email || "unknown"}`;
    },
    message: {
        message: "Too many failed login attempts for this account. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        message: "Too many requests from this IP. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };