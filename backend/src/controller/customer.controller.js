const customerService = require("../service/customer.service");


// CREATE
const create = async (req, res, next) => {
    try {
        const result = await customerService.create(req.body);

        return res.status(201).json({
            status: true,
            message: "Customer created successfully",
            data: result
        });

    } catch (error) {
        next(error)
    }
};


// GET ALL
const findAll = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";

        const data = await customerService.findAll(page, limit, search);

        return res.status(200).json({
            status: true,
            message: "Customers fetched successfully",
            data: data.data,
            pagination: data.pagination
        });

    } catch (error) {
        next(error);
    }
};


// GET BY ID
const findById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const data = await customerService.findById(id);

        return res.status(200).json({
            status: true,
            message: "Customer fetched successfully",
            data
        });

    } catch (error) {
        next(error);
    }
};


// UPDATE
const update = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await customerService.update(
            id,
            req.body
        );

        return res.status(200).json({
            status: true,
            message: "Customer updated successfully",
            data: result
        });

    } catch (error) {
        next(error);
    }
};


// DELETE
const remove = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await customerService.remove(id);

        return res.status(200).json({
            status: true,
            message: "Customer deleted successfully",
            data: result
        });

    } catch (error) {
        next(error)
    }
};

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required",
            });
        }
        const result = await customerService.loginUser(
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

const verifyCustomer = async (req, res, next) => {
    try {
        const customer = req.customer || await customerService.verifyCustomer(req.user.id);

        return res.status(200).json({
            status: true,
            message: "Customer verified successfully",
            data: customer
        });
    } catch (error) {
        next(error);
    }
};


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
                    "New password must be at least 6 characters",
            });
        }

        const userId = req.user.id;
        await customerService.changePassword(userId, currentPassword, newPassword)

        return res.status(200).json({
            status: true,
            message:
                "Password updated successfully",
        });
    } catch (error) {
        console.error("Change Password Error:", error);

        next(error);
    }
}

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove,
    login,
    verifyCustomer,
    changePassword
};
