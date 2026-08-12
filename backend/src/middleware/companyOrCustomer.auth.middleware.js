const authRepository = require("../repository/auth.repository");
const customerRepository = require("../repository/customer.repository");
const { verifyToken } = require("../utils/jwt");

const authenticateCompanyOrCustomerToken = async (req, res, next) => {
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
        const company = await authRepository.findCompanyById(decoded.id);

        if (company) {
            req.user = decoded;
            req.company = company;
            req.authType = "company";
            return next();
        }

        const customer = await customerRepository.findById(decoded.id);

        if (customer) {
            req.user = decoded;
            req.customer = customer;
            req.authType = "customer";
            return next();
        }

        return res.status(401).json({
            status: false,
            message: "User does not exist",
        });
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token",
        });
    }
};

module.exports = authenticateCompanyOrCustomerToken;
