const partyRepository = require("../repository/party.repository");
const headMasterRepository = require("../repository/headMaster.repository");
const tHeadMasterRepository = require("../repository/tHeadMaster.repository");
const stockItemRepository = require("../repository/stockItem.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateParty = (body) => {
    

    if (!body.sid) {
        throw createError("sid is required");
    }

    if (Number.isNaN(Number(body.sid))) {
        throw createError("sid must be a valid head_master id");
    }

    if (
        body.sid1 !== undefined &&
        body.sid1 !== null &&
        body.sid1 !== "" &&
        Number.isNaN(Number(body.sid1))
    ) {
        throw createError("sid1 must be a valid t_head_master id");
    }

    if (
        body.brick_type !== undefined &&
        body.brick_type !== null &&
        body.brick_type !== "" &&
        Number.isNaN(Number(body.brick_type))
    ) {
        throw createError("brick_type must be a valid stock_item id");
    }
};

const validatePartyRelations = async (body, userId) => {
    const headMaster = await headMasterRepository.findById(body.sid, userId);

    if (!headMaster) {
        throw createError("Selected head master does not exist", 404);
    }

    if (body.sid1 !== undefined && body.sid1 !== null && body.sid1 !== "") {
        const tHeadMaster = await tHeadMasterRepository.findById(body.sid1, userId);

        if (!tHeadMaster) {
            throw createError("Selected t head master does not exist", 404);
        }
    }

    if (body.brick_type === undefined || body.brick_type === null || body.brick_type === "") {
        return;
    }

    const stockItem = await stockItemRepository.findById(body.brick_type, userId);

    if (!stockItem) {
        throw createError("Selected brick type does not exist", 404);
    }
};

const create = async (body, userId) => {
    validateParty(body);
    await validatePartyRelations(body, userId);

    return await partyRepository.create(body, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await partyRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await partyRepository.findById(id, userId);

    if (!data) {
        throw createError("Party not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validateParty(body);

    const existingParty = await partyRepository.findById(id, userId);

    if (!existingParty) {
        throw createError("Party not found", 404);
    }

    await validatePartyRelations(body, userId);

    await partyRepository.update(id, body, userId);

    return await partyRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingParty = await partyRepository.findById(id, userId);

    if (!existingParty) {
        throw createError("Party not found", 404);
    }

    await partyRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
