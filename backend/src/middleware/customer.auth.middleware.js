const customerRepository = require("../repository/customer.repository");
const { verifyToken } = require("../utils/jwt");

const authenticateCustomerToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization header required",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token required",
            });
        }

        const decoded = verifyToken(token);
        const customer = await customerRepository.findById(decoded.id);

        if (!customer) {
            return res.status(401).json({
                status: false,
                message: "Customer does not exist",
            });
        }

        req.user = decoded;
        req.customer = customer;
        req.authType = decoded.user_type || "customer";

        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token",
        });
    }
};

module.exports = authenticateCustomerToken;
