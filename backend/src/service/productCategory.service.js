const productCategoryRepository = require("../repository/productCategory.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateProductCategory = (body) => {
    if (!body.name) {
        throw createError("name is required");
    }

    if (!body.unit) {
        throw createError("unit is required");
    }
};

const create = async (body, userId) => {
    validateProductCategory(body);

    return await productCategoryRepository.create(body, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await productCategoryRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await productCategoryRepository.findById(id, userId);

    if (!data) {
        throw createError("Product category not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validateProductCategory(body);

    const existingData = await productCategoryRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Product category not found", 404);
    }

    await productCategoryRepository.update(id, body, userId);

    return await productCategoryRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await productCategoryRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Product category not found", 404);
    }

    await productCategoryRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
