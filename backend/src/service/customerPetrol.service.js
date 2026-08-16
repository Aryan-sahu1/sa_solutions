const customerPetrolRepository = require("../repository/customerPetrol.repository");
const partyRepository = require("../repository/party.repository");
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

const validateCustomerPetrol = (body) => {
    if (isEmpty(body.date)) {
        throw createError("date is required");
    }

    if (isEmpty(body.ship_no)) {
        throw createError("ship_no is required");
    }

    if (isEmpty(body.pid)) {
        throw createError("pid is required");
    }

    if (Number.isNaN(Number(body.pid))) {
        throw createError("pid must be a valid party id");
    }

    if (isEmpty(body.sid)) {
        throw createError("sid is required");
    }

    if (Number.isNaN(Number(body.sid))) {
        throw createError("sid must be a valid stock item id");
    }

    if (isEmpty(body.qty)) {
        throw createError("qty is required");
    }

    if (Number.isNaN(Number(body.qty))) {
        throw createError("qty must be a valid number");
    }

    if (isEmpty(body.rate)) {
        throw createError("rate is required");
    }

    if (Number.isNaN(Number(body.rate))) {
        throw createError("rate must be a valid number");
    }

    if (isEmpty(body.amount)) {
        throw createError("amount is required");
    }

    if (Number.isNaN(Number(body.amount))) {
        throw createError("amount must be a valid number");
    }
};

const validateRelations = async (body, userId) => {
    const party = await partyRepository.findById(body.pid, userId);

    if (!party) {
        throw createError("Selected party does not exist", 404);
    }

    const stockItem = await stockItemRepository.findById(body.sid, userId);

    if (!stockItem) {
        throw createError("Selected stock item does not exist", 404);
    }
};

const normalizePayload = (body) => ({
    date: String(body.date).trim().replace("T", " "),
    ship_no: String(body.ship_no).trim(),
    pid: Number(body.pid),
    sid: Number(body.sid),
    qty: Number(body.qty),
    rate: String(body.rate).trim(),
    amount: String(body.amount).trim()
});

const create = async (body, userId) => {
    validateCustomerPetrol(body);
    await validateRelations(body, userId);

    return await customerPetrolRepository.create(
        normalizePayload(body),
        userId
    );
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await customerPetrolRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        pid: options.pid || "",
        sid: options.sid || ""
    });
};

const findById = async (id, userId) => {
    const data = await customerPetrolRepository.findById(id, userId);

    if (!data) {
        throw createError("Customer petrol entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validateCustomerPetrol(body);

    const existingData = await customerPetrolRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Customer petrol entry not found", 404);
    }

    await validateRelations(body, userId);
    await customerPetrolRepository.update(id, normalizePayload(body), userId);

    return await customerPetrolRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await customerPetrolRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Customer petrol entry not found", 404);
    }

    await customerPetrolRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
