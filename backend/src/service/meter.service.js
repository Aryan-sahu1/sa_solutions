const meterRepository = require("../repository/meter.repository");
const productCategoryRepository = require("../repository/productCategory.repository");
const nozelRepository = require("../repository/nozel.repository");

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

const priceFields = ["msp", "hsdp", "ureap", "cngp", "speedp"];
const stockFields = ["msst", "hsdst", "ureast", "cngst", "speedst"];
const meterExtraFields = [...priceFields, ...stockFields];

const normalizeOptionalNumber = (value, fieldName) => {
    if (isEmpty(value)) {
        return null;
    }

    if (Number.isNaN(Number(value))) {
        throw createError(`${fieldName} must be a valid number`);
    }

    return String(value).trim();
};

const validatePayload = (body) => {
    if (isEmpty(body.date)) throw createError("Date is required");
    if (isEmpty(body.shift)) throw createError("Shift is required");

    if (!Array.isArray(body.items) || body.items.length === 0) {
        throw createError("At least one meter item is required");
    }

    meterExtraFields.forEach((field) => {
        normalizeOptionalNumber(body[field], field);
    });

    body.items.forEach((item, index) => {
        if (isEmpty(item.pid)) throw createError(`Product is required at row ${index + 1}`);
        if (isEmpty(item.iid)) throw createError(`Nozel is required at row ${index + 1}`);
        if (isEmpty(item.opening)) throw createError(`Opening is required at row ${index + 1}`);
        if (isEmpty(item.closing)) throw createError(`Closing is required at row ${index + 1}`);

        if (Number.isNaN(Number(item.pid))) throw createError(`Product must be valid at row ${index + 1}`);
        if (Number.isNaN(Number(item.iid))) throw createError(`Nozel must be valid at row ${index + 1}`);
        if (Number.isNaN(Number(item.opening))) throw createError(`Opening must be number at row ${index + 1}`);
        if (Number.isNaN(Number(item.closing))) throw createError(`Closing must be number at row ${index + 1}`);
        if (!isEmpty(item.testing) && Number.isNaN(Number(item.testing))) {
            throw createError(`Testing must be number at row ${index + 1}`);
        }
    });
};

const normalizePayload = async (body, userId) => {
    const items = [];

    for (const item of body.items) {
        const product = await productCategoryRepository.findById(item.pid, userId);
        if (!product) throw createError("Selected product does not exist", 404);

        const nozel = await nozelRepository.findById(item.iid, userId);
        if (!nozel) throw createError("Selected nozel does not exist", 404);

        if (Number(nozel.pid) !== Number(item.pid)) {
            throw createError(`${nozel.name} does not belong to selected product`);
        }

        const opening = Number(item.opening);
        const closing = Number(item.closing);
        const testing = isEmpty(item.testing) ? 0 : Number(item.testing);
        const sale = closing - opening - testing;

        items.push({
            pid: Number(item.pid),
            iid: Number(item.iid),
            opening: String(item.opening).trim(),
            closing: String(item.closing).trim(),
            testing,
            sale
        });
    }

    return {
        date: String(body.date).trim(),
        shift: String(body.shift).trim(),
        ...meterExtraFields.reduce((acc, field) => {
            acc[field] = normalizeOptionalNumber(body[field], field);
            return acc;
        }, {}),
        items
    };
};

const create = async (body, userId) => {
    validatePayload(body);
    const payload = await normalizePayload(body, userId);
    return await meterRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await meterRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        date: options.date || ""
    });
};

const findById = async (id, userId) => {
    const data = await meterRepository.findById(id, userId);

    if (!data) {
        throw createError("Meter entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await meterRepository.findById(id, userId);
    if (!existingData) throw createError("Meter entry not found", 404);

    const payload = await normalizePayload(body, userId);
    await meterRepository.update(id, payload, userId);

    return await meterRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await meterRepository.findById(id, userId);
    if (!existingData) throw createError("Meter entry not found", 404);

    await meterRepository.remove(id, userId);
    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
