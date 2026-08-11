const staffMemberRepository = require("../repository/staffMember.repository");
const productRepository = require("../repository/product.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateStaffMember = (body) => {
    if (!body.name) {
        throw createError("name is required");
    }

    if (!body.pid) {
        throw createError("pid is required");
    }

    if (!body.password) {
        throw createError("password is required");
    }

    if (Number.isNaN(Number(body.pid))) {
        throw createError("pid must be a valid product id");
    }
};

const validateProduct = async (pid) => {
    const product = await productRepository.findById(pid);

    if (!product) {
        throw createError("Selected product does not exist", 404);
    }
};

const create = async (body, userId) => {
    validateStaffMember(body);
    await validateProduct(body.pid);

    return await staffMemberRepository.create(body, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await staffMemberRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await staffMemberRepository.findById(id, userId);

    if (!data) {
        throw createError("Staff member not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validateStaffMember(body);

    const existingData = await staffMemberRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Staff member not found", 404);
    }

    await validateProduct(body.pid);
    await staffMemberRepository.update(id, body, userId);

    return await staffMemberRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await staffMemberRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Staff member not found", 404);
    }

    await staffMemberRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
