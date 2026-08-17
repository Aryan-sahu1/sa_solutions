const voucherRepository = require("../repository/voucher.repository");
const partyRepository = require("../repository/party.repository");

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

const validatePayload = (body) => {
    if (isEmpty(body.date)) {
        throw createError("date is required");
    }

    if (isEmpty(body.pid)) {
        throw createError("Debit party is required");
    }

    if (Number.isNaN(Number(body.pid))) {
        throw createError("Debit party must be a valid party id");
    }

    if (isEmpty(body.crid)) {
        throw createError("Credit party is required");
    }

    if (Number.isNaN(Number(body.crid))) {
        throw createError("Credit party must be a valid party id");
    }

    if (isEmpty(body.amt)) {
        throw createError("Amount is required");
    }

    if (Number.isNaN(Number(body.amt))) {
        throw createError("Amount must be a valid number");
    }
};

const normalizePayload = async (body, userId) => {
    const debitParty = await partyRepository.findById(body.pid, userId);

    if (!debitParty) {
        throw createError("Selected debit party does not exist", 404);
    }

    const creditParty = await partyRepository.findById(body.crid, userId);

    if (!creditParty) {
        throw createError("Selected credit party does not exist", 404);
    }

    return {
        date: String(body.date).trim().replace("T", " "),
        pid: Number(body.pid),
        crid: Number(body.crid),
        type: "O",
        remarks: String(body.remarks || "").trim(),
        amt: String(body.amt).trim()
    };
};

const create = async (body, userId) => {
    validatePayload(body);

    const payload = await normalizePayload(body, userId);

    return await voucherRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await voucherRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        date: options.date || ""
    });
};

const findById = async (id, userId) => {
    const data = await voucherRepository.findById(id, userId);

    if (!data) {
        throw createError("Voucher entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await voucherRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Voucher entry not found", 404);
    }

    const payload = await normalizePayload(body, userId);
    await voucherRepository.update(id, payload, userId);

    return await voucherRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await voucherRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Voucher entry not found", 404);
    }

    await voucherRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
