const jwt = require("jsonwebtoken")
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN;
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username
        },
        JWT_SECRET,
        {
            expiresIn: expiresIn || "1d"
        }
    )
}

const verifyToken = (token) => {
    return jwt.verify(
        token, JWT_SECRET
    );
};

module.exports={generateToken,verifyToken}
