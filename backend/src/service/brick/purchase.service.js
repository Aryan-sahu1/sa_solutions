const brickPurchaseRepository = require("../../repository/brick/purchase.repository");
const partyRepository = require("../../repository/party.repository");
const stockItemRepository = require("../../repository/stockItem.repository");

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
    if (isEmpty(body.date)) throw createError("Date is required");
    if (isEmpty(body.pid)) throw createError("Party is required");
    if (isEmpty(body.iid)) throw createError("Stock item is required");
    if (isEmpty(body.qty)) throw createError("Quantity is required");
    if (isEmpty(body.amt)) throw createError("Amount is required");

    if (Number.isNaN(Number(body.pid))) throw createError("Party must be a valid id");
    if (Number.isNaN(Number(body.iid))) throw createError("Stock item must be a valid id");
    if (Number.isNaN(Number(body.qty))) throw createError("Quantity must be a valid number");
    if (Number.isNaN(Number(body.amt))) throw createError("Amount must be a valid number");

    ["cash", "cgst", "igst"].forEach((field) => {
        if (!isEmpty(body[field]) && Number.isNaN(Number(body[field]))) {
            throw createError(`${field} must be a valid number`);
        }
    });
};

const normalizePayload = async (body, userId) => {
    const selectedParty = await partyRepository.findById(body.pid, userId);

    if (!selectedParty) {
        throw createError("Selected party does not exist", 404);
    }

    const purchaseAccount =
        await partyRepository.findByName("Purchase", userId) ||
        await partyRepository.findByName("Purchases", userId);

    if (!purchaseAccount) {
        throw createError("First create Purchase account in party");
    }

    const stockItem = await stockItemRepository.findById(body.iid, userId);

    if (!stockItem) {
        throw createError("Selected stock item does not exist", 404);
    }

    return {
        date: String(body.date).trim().replace("T", " "),
        pid: Number(purchaseAccount.id),
        crid: Number(body.pid),
        iid: Number(body.iid),
        qty: String(body.qty).trim(),
        amt: String(body.amt).trim(),
        remarks: isEmpty(body.remarks) ? null : String(body.remarks).trim(),
        vehicle_text: isEmpty(body.vehicle_text) ? null : String(body.vehicle_text).trim(),
        cash: isEmpty(body.cash) ? null : String(body.cash).trim(),
        cgst: isEmpty(body.cgst) ? null : String(body.cgst).trim(),
        igst: isEmpty(body.igst) ? null : String(body.igst).trim()
    };
};

const create = async (body, userId) => {
    validatePayload(body);
    const payload = await normalizePayload(body, userId);
    return await brickPurchaseRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await brickPurchaseRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        date: options.date || ""
    });
};

const findById = async (id, userId) => {
    const data = await brickPurchaseRepository.findById(id, userId);

    if (!data) {
        throw createError("Purchase entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await brickPurchaseRepository.findById(id, userId);
    if (!existingData) throw createError("Purchase entry not found", 404);

    const payload = await normalizePayload(body, userId);
    await brickPurchaseRepository.update(id, payload, userId);

    return await brickPurchaseRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await brickPurchaseRepository.findById(id, userId);
    if (!existingData) throw createError("Purchase entry not found", 404);

    await brickPurchaseRepository.remove(id, userId);
    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
