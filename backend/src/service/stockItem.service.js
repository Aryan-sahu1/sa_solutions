const stockItemRepository = require("../repository/stockItem.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateStockItem = (body) => {
    if (!body.name) {
        throw createError("name is required");
    }

    if (body.inLtr === undefined || body.inLtr === null || body.inLtr === "") {
        throw createError("inLtr is required");
    }
};

const create = async (body, userId) => {
    validateStockItem(body);

    return await stockItemRepository.create(body, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await stockItemRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await stockItemRepository.findById(id, userId);

    if (!data) {
        throw createError("Stock item not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validateStockItem(body);

    const existingData = await stockItemRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Stock item not found", 404);
    }

    await stockItemRepository.update(id, body, userId);

    return await stockItemRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await stockItemRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Stock item not found", 404);
    }

    await stockItemRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
