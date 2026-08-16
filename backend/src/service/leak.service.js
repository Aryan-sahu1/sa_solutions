const leakRepository = require("../repository/leak.repository");
const stockItemRepository = require("../repository/stockItem.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isEmpty = (value) => (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
);

const validateLeak = (body) => {
    if (isEmpty(body.date)) {
        throw createError("date is required");
    }

    if (isEmpty(body.iid)) {
        throw createError("iid is required");
    }

    if (Number.isNaN(Number(body.iid))) {
        throw createError("iid must be a valid stock item id");
    }

    if (isEmpty(body.qty)) {
        throw createError("qty is required");
    }

    if (Number.isNaN(Number(body.qty))) {
        throw createError("qty must be a valid number");
    }
};

const validateRelations = async (body, userId) => {
    const stockItem = await stockItemRepository.findById(body.iid, userId);

    if (!stockItem) {
        throw createError("Selected stock item does not exist", 404);
    }
};

const normalizePayload = (body) => ({
    date: String(body.date).trim().replace("T", " "),
    qty: Number(body.qty),
    iid: Number(body.iid)
});

const create = async (body, userId) => {
    validateLeak(body);
    await validateRelations(body, userId);

    return await leakRepository.create(normalizePayload(body), userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await leakRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        iid: options.iid || ""
    });
};

const findById = async (id, userId) => {
    const data = await leakRepository.findById(id, userId);

    if (!data) {
        throw createError("Leak entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validateLeak(body);

    const existingData = await leakRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Leak entry not found", 404);
    }

    await validateRelations(body, userId);
    await leakRepository.update(id, normalizePayload(body), userId);

    return await leakRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await leakRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Leak entry not found", 404);
    }

    await leakRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
