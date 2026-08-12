const customerRepository = require("../repository/customer.repository");
const bcrypt = require("bcrypt")
const {generateToken} = require("../utils/jwt")

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const create = async (body) => {
    if (!body.name) {
        throw createError("Customer name is required");
    }

    if (!body.username) {
        throw createError("Username is required");
    }

    if (!body.password) {
        throw createError("Password is required");
    }

    if (body.password.length < 6) {
        throw createError("Password must be at least 6 characters");
    }

    const existingCustomer = await customerRepository.findByUsername(body.username);

    if (existingCustomer) {
        throw createError("Username already exists");
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const result = await customerRepository.create({
        ...body,
        password: hashedPassword
    });

    return result;
};


const findAll = async (page, limit, search) => {
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    const data = await customerRepository.findAll(page, limit, search);
    return data;
};


const findById = async (id) => {
    const data = await customerRepository.findById(id);

    if (!data) {
        throw new Error("Customer not found");
    }

    return data;
};


const update = async (id, body) => {
    const existingCustomer =
        await customerRepository.findById(id);

    if (!existingCustomer) {
        throw createError("Customer not found", 404);
    }

    if (!body.name) {
        throw createError("Customer name is required");
    }

    let password = null;

    if (body.password) {
        if (body.password.length < 6) {
            throw createError("Password must be at least 6 characters");
        }

        password = await bcrypt.hash(body.password, 10);
    }

    const result = await customerRepository.update(id, {
        ...body,
        password
    });

    return result;
};


const remove = async (id) => {
    const existingCustomer =
        await customerRepository.findById(id);

    if (!existingCustomer) {
        throw new Error("Customer not found");
    }

    const result = await customerRepository.remove(id);
    return result;
};
const loginUser = async (username, password) => {

    // Find user
    const user =
        await customerRepository.findByUsername(username);
    if (!user) {
        throw createError("Invalid username or password", 401);
    }

    // Compare password
    const isPasswordValid =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!isPasswordValid) {
        throw createError("Invalid username or password", 401);
    }

    // Generate JWT
    const token = generateToken({
        id: user.id,
        username: user.username,
    });

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
        },
    };
};

const verifyCustomer = async (userId) => {
    const customer = await customerRepository.findById(userId);

    if (!customer) {
        throw new Error("Customer Not Found...");
    }

    return customer;
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const customer = await customerRepository.findByIdWithPassword(userId);

    if (!customer) {
        throw createError("Customer not found", 404);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, customer.password);

    if (!isPasswordValid) {
        throw createError("Current password is invalid", 400);
    }

    const isSamePassword = await bcrypt.compare(newPassword, customer.password);

    if (isSamePassword) {
        throw createError("New password must be different from current password", 400);

    }

    const hashNewPassword = await bcrypt.hash(newPassword, 10);
    await customerRepository.updatePassword(userId, hashNewPassword);

    return true;

}


module.exports = {
    create,
    findAll,
    findById,
    update,
    remove,
    loginUser,
    verifyCustomer,
    changePassword
};
