const brickDumperRepository = require("../../repository/brick/dumper.repository");
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
    if (isEmpty(body.round)) throw createError("Round is required");
    if (isEmpty(body.rate)) throw createError("Rate is required");
    if (isEmpty(body.amt)) throw createError("Amount is required");

    if (Number.isNaN(Number(body.party_id))) {
        throw createError("Party must be a valid id");
    }

    if (Number.isNaN(Number(body.round))) {
        throw createError("Round must be a valid number");
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

    const dumperAccount =
        await partyRepository.findByName("Dumper", userId) ||
        await partyRepository.findByName("DUMPER", userId);

    if (!dumperAccount) {
        throw createError("First create Dumper account in party");
    }

    return {
        date: String(body.date).trim().replace("T", " "),
        pid: Number(dumperAccount.id),
        crid: Number(body.party_id),
        round: String(body.round).trim(),
        rate: String(body.rate).trim(),
        amt: String(body.amt).trim(),
        remarks: isEmpty(body.remarks) ? null : String(body.remarks).trim()
    };
};

const create = async (body, userId) => {
    validatePayload(body);
    const payload = await normalizePayload(body, userId);
    return await brickDumperRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await brickDumperRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        date: options.date || ""
    });
};

const findById = async (id, userId) => {
    const data = await brickDumperRepository.findById(id, userId);

    if (!data) {
        throw createError("Dumper entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await brickDumperRepository.findById(id, userId);
    if (!existingData) throw createError("Dumper entry not found", 404);

    const payload = await normalizePayload(body, userId);
    await brickDumperRepository.update(id, payload, userId);

    return await brickDumperRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await brickDumperRepository.findById(id, userId);
    if (!existingData) throw createError("Dumper entry not found", 404);

    await brickDumperRepository.remove(id, userId);
    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
