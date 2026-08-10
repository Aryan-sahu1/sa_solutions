const customerRepository = require("../repository/customer.repository");

const create = async (body) => {
    if (!body.name) {
        throw new Error("Customer name is required");
    }

    if (!body.username) {
        throw new Error("Username is required");
    }

    if (!body.password) {
        throw new Error("Password is required");
    }

    const result = await customerRepository.create(body);

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
        throw new Error("Customer not found");
    }

    if (!body.name) {
        throw new Error("Customer name is required");
    }

    const result = await customerRepository.update(id, body);

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


module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
