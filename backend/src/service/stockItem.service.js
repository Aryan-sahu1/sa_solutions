const stockItemRepository = require("../repository/stockItem.repository");
const productCategoryRepository = require("../repository/productCategory.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateStockItem = (body) => {
    if (!body.name) {
        throw createError("name is required");
    }

    if (!body.pid && body.product_category_id) {
        body.pid = body.product_category_id;
    }

    if (!body.pid) {
        throw createError("pid is required");
    }

    if (Number.isNaN(Number(body.pid))) {
        throw createError("pid must be a valid product category id");
    }
};

const validateProductCategory = async (productCategoryId, userId) => {
    const productCategory = await productCategoryRepository.findById(
        productCategoryId,
        userId
    );

    if (!productCategory) {
        throw createError("Selected product category does not exist", 404);
    }
};

const create = async (body, userId) => {
    validateStockItem(body);
    await validateProductCategory(body.pid, userId);

    return await stockItemRepository.create(body, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;
    const pid =
        options.pid || options.productCategoryId || options.product_category_id || "";

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    if (pid) {
        await validateProductCategory(pid, options.userId);
    }

    return await stockItemRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        pid
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

    await validateProductCategory(body.pid, userId);
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
