
const { generateToken } = require("../utils/jwt")

const authService = require("../service/auth.service")

const register = async (req, res, next) => {
    try {

        if (!req.body.username || !req.body.password) {
            return res.json(400).jon({
                message: "username and password are required"
            })
        }

        const data = await authService.register(req.body);

        // Generate JWT
        const token = generateToken(data);
        res.status(200).json({
            status: true,
            message: "company created successfully",
            data: data,
            token: token
        })
    } catch (error) {
        next(error);
    }


}


const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required",
            });
        }
        const result = await authService.loginUser(
            username,
            password
        );

        return res.status(200).json({
            message: "Login successful",
            ...result,
        });

    } catch (error) {
        next(error);
    }
};


const findAll = async (req, res, next) => {
    try {
        const data = await authService.findAll();
        res.status(200).json({
            status: true,
            message: "data fetch successfully",
            data: data
        })
    } catch (error) {
        next(error);
    }
}

const verifyCompany = async (req, res, next) => {
    try {
        const company = req.company || await authService.verifyCompany(req.user.id);

        return res.status(200).json({
            status: true,
            message: "Company verified successfully",
            data: company
        });
    } catch (error) {
        next(error);
    }
}


const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                status: false,
                message:
                    "Current password and new password are required",
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                status: false,
                message:
                    "New Password must be greater that 6 characters",
            });
        }
        const userId = req.user.id;
        await authService.changePassword(userId, currentPassword, newPassword)

        return res.status(200).json({
            status: true,
            message:
                "Password updatated Successfully...",
        });
    } catch (error) {
        console.error("Change Password Error:", error);

        next(error);
    }
}

module.exports = { register, login, findAll, verifyCompany, changePassword }
