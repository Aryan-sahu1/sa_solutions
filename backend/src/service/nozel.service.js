const nozelRepository = require("../repository/nozel.repository");
const productCategoryRepository = require("../repository/productCategory.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeNozel = async (body, userId) => {
    const name = String(body.name || "").trim();
    const snno = Number(body.snno);

    if (!name) {
        throw createError("name is required");
    }

    if (body.snno === undefined || body.snno === null || String(body.snno).trim() === "") {
        throw createError("snno is required");
    }

    if (Number.isNaN(snno)) {
        throw createError("snno must be a valid number");
    }

    const productId = body.pid || (await productCategoryRepository.findFirst(userId))?.id;

    if (!productId) {
        throw createError("First create product category");
    }

    const product = await productCategoryRepository.findById(productId, userId);

    if (!product) {
        throw createError("Product not found", 404);
    }

    return {
        name,
        snno,
        pid: Number(productId)
    };
};

const create = async (body, userId) => {
    const payload = await normalizeNozel(body, userId);

    return await nozelRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await nozelRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        productId: options.productId || ""
    });
};

const findById = async (id, userId) => {
    const data = await nozelRepository.findById(id, userId);

    if (!data) {
        throw createError("Nozel not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    const payload = await normalizeNozel(body, userId);

    const existingData = await nozelRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Nozel not found", 404);
    }

    await nozelRepository.update(id, payload, userId);

    return await nozelRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await nozelRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Nozel not found", 404);
    }

    await nozelRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
