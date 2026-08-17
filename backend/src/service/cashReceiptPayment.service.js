const cashReceiptPaymentRepository = require("../repository/cashReceiptPayment.repository");
const partyRepository = require("../repository/party.repository");

const CASH_HEAD_NAME = "cash-in-hand";

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

    if (isEmpty(body.party_id)) {
        throw createError("party_id is required");
    }

    if (Number.isNaN(Number(body.party_id))) {
        throw createError("party_id must be a valid party id");
    }

    if (isEmpty(body.amt)) {
        throw createError("amt is required");
    }

    if (Number.isNaN(Number(body.amt))) {
        throw createError("amt must be a valid number");
    }

    if (!["Receipt", "Payment"].includes(body.type1)) {
        throw createError("type1 must be Receipt or Payment");
    }
};

const normalizePayload = async (body, userId) => {
    const party = await partyRepository.findById(body.party_id, userId);

    if (!party) {
        throw createError("Selected party does not exist", 404);
    }

    const cashHead = await partyRepository.findByName(CASH_HEAD_NAME, userId);

    if (!cashHead) {
        throw createError(`${CASH_HEAD_NAME} party does not exist`, 404);
    }

    const partyId = Number(body.party_id);
    const cashHeadId = Number(cashHead.id);
    const type1 = String(body.type1).trim();

    if (partyId === cashHeadId) {
        throw createError(`${CASH_HEAD_NAME} cannot be selected as party`);
    }

    return {
        date: String(body.date).trim().replace("T", " "),
        pid: type1 === "Receipt" ? cashHeadId : partyId,
        crid: type1 === "Receipt" ? partyId : cashHeadId,
        type: "C",
        type1,
        remarks: String(body.remarks || "").trim(),
        amt: String(body.amt).trim()
    };
};

const create = async (body, userId) => {
    validatePayload(body);

    const payload = await normalizePayload(body, userId);

    return await cashReceiptPaymentRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await cashReceiptPaymentRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await cashReceiptPaymentRepository.findById(id, userId);

    if (!data) {
        throw createError("Cash receipt/payment entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await cashReceiptPaymentRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Cash receipt/payment entry not found", 404);
    }

    const payload = await normalizePayload(body, userId);
    await cashReceiptPaymentRepository.update(id, payload, userId);

    return await cashReceiptPaymentRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await cashReceiptPaymentRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Cash receipt/payment entry not found", 404);
    }

    await cashReceiptPaymentRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
