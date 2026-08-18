const billRepository = require("../repository/bill.repository");
const partyRepository = require("../repository/party.repository");
const vehicleMasterRepository = require("../repository/vehicleMaster.repository");

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
    if (isEmpty(body.sdate)) throw createError("Start date is required");
    if (isEmpty(body.edate)) throw createError("End date is required");
    if (isEmpty(body.date)) throw createError("Date is required");
    if (isEmpty(body.billno)) throw createError("Bill no is required");
    if (isEmpty(body.party)) throw createError("Party is required");
    if (Number.isNaN(Number(body.party))) throw createError("Party must be a valid party id");
    if (isEmpty(body.vehicleno)) throw createError("Vehicle is required");
    if (Number.isNaN(Number(body.vehicleno))) throw createError("Vehicle must be a valid vehicle id");
    if (isEmpty(body.amt)) throw createError("Amount is required");
    if (Number.isNaN(Number(body.amt))) throw createError("Amount must be a valid number");
    if (!["Others", "Lub"].includes(body.type)) throw createError("Type must be Others or Lub");
};

const normalizePayload = async (body, userId) => {
    const party = await partyRepository.findById(body.party, userId);

    if (!party) {
        throw createError("Selected party does not exist", 404);
    }

    const vehicle = await vehicleMasterRepository.findById(body.vehicleno, userId);

    if (!vehicle) {
        throw createError("Selected vehicle does not exist", 404);
    }

    return {
        sdate: String(body.sdate).trim(),
        edate: String(body.edate).trim(),
        date: String(body.date).trim(),
        billno: String(body.billno).trim(),
        vehicleno: Number(body.vehicleno),
        party: Number(body.party),
        remarks: String(body.remarks || "").trim(),
        amt: String(body.amt).trim(),
        type: String(body.type).trim(),
        tcs: body.tcs || 0
    };
};

const findNextBillNo = async (userId) => {
    return await billRepository.findNextBillNo(userId);
};

const create = async (body, userId) => {
    if (isEmpty(body.billno)) {
        body.billno = await billRepository.findNextBillNo(userId);
    }

    validatePayload(body);
    const payload = await normalizePayload(body, userId);
    return await billRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await billRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await billRepository.findById(id, userId);

    if (!data) {
        throw createError("Bill entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await billRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Bill entry not found", 404);
    }

    const payload = await normalizePayload(body, userId);
    await billRepository.update(id, payload, userId);

    return await billRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await billRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Bill entry not found", 404);
    }

    await billRepository.remove(id, userId);

    return true;
};

module.exports = {
    findNextBillNo,
    create,
    findAll,
    findById,
    update,
    remove
};
