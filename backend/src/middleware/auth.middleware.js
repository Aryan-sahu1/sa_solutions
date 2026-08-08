const { verifyToken } = require("../utils/jwt");

const authenticateToken = (req, res, next) => {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization header required",
            });
        }

        // Bearer TOKEN
        const token =
            authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token required",
            });
        }

        const decoded = verifyToken(token);

        // Store logged-in user
        req.user = decoded;

        next();

    } catch (error) {

        return res.status(403).json({
            message: "Invalid or expired token",
        });
    }
};

module.exports = authenticateToken;