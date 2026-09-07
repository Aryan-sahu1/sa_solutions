const brickJcbRepository = require("../../repository/brick/jcb.repository");
const partyRepository = require("../../repository/party.repository");

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
    if (isEmpty(body.party_id)) throw createError("Party is required");
    if (isEmpty(body.start_time)) throw createError("Start time is required");
    if (isEmpty(body.end_time)) throw createError("End time is required");
    if (isEmpty(body.total_time)) throw createError("Total time is required");
    if (isEmpty(body.rate)) throw createError("Rate is required");
    if (isEmpty(body.amt)) throw createError("Amount is required");

    if (Number.isNaN(Number(body.party_id))) {
        throw createError("Party must be a valid id");
    }

    if (Number.isNaN(Number(body.total_time))) {
        throw createError("Total time must be a valid number");
    }

    if (Number.isNaN(Number(body.rate))) {
        throw createError("Rate must be a valid number");
    }

    if (Number.isNaN(Number(body.amt))) {
        throw createError("Amount must be a valid number");
    }
};

const normalizePayload = async (body, userId) => {
    const selectedParty = await partyRepository.findById(body.party_id, userId);

    if (!selectedParty) {
        throw createError("Selected party does not exist", 404);
    }

    const jcbAccount =
        await partyRepository.findByName("JCB", userId) ||
        await partyRepository.findByName("Jcb", userId);

    if (!jcbAccount) {
        throw createError("First create JCB account in party");
    }

    return {
        date: String(body.date).trim().replace("T", " "),
        pid: Number(jcbAccount.id),
        crid: Number(body.party_id),
        start_time: String(body.start_time).trim(),
        end_time: String(body.end_time).trim(),
        total_time: String(body.total_time).trim(),
        rate: String(body.rate).trim(),
        amt: String(body.amt).trim(),
        remarks: isEmpty(body.remarks) ? null : String(body.remarks).trim()
    };
};

const create = async (body, userId) => {
    validatePayload(body);
    const payload = await normalizePayload(body, userId);
    return await brickJcbRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await brickJcbRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        date: options.date || ""
    });
};

const findById = async (id, userId) => {
    const data = await brickJcbRepository.findById(id, userId);

    if (!data) {
        throw createError("JCB entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await brickJcbRepository.findById(id, userId);
    if (!existingData) throw createError("JCB entry not found", 404);

    const payload = await normalizePayload(body, userId);
    await brickJcbRepository.update(id, payload, userId);

    return await brickJcbRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await brickJcbRepository.findById(id, userId);
    if (!existingData) throw createError("JCB entry not found", 404);

    await brickJcbRepository.remove(id, userId);
    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
