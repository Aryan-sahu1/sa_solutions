const vehicleMasterRepository = require("../repository/vehicleMaster.repository");
const partyRepository = require("../repository/party.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateVehicle = (body) => {
    const vehicleNo = body.vehicle_no || body.vehicleNo;

    if (!body.name) {
        throw createError("name is required");
    }

    if (!vehicleNo) {
        throw createError("vehicle_no is required");
    }

    if (body.balance === undefined || body.balance === null || body.balance === "") {
        throw createError("balance is required");
    }

    if (!body.sid) {
        throw createError("sid is required");
    }

    if (Number.isNaN(Number(body.sid))) {
        throw createError("sid must be a valid party id");
    }
};

const validateParty = async (sid, userId) => {
    const party = await partyRepository.findById(sid, userId);

    if (!party) {
        throw createError("Selected party does not exist", 404);
    }
};

const create = async (body, userId) => {
    validateVehicle(body);
    await validateParty(body.sid, userId);

    return await vehicleMasterRepository.create(body, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await vehicleMasterRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await vehicleMasterRepository.findById(id, userId);

    if (!data) {
        throw createError("Vehicle not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validateVehicle(body);

    const existingData = await vehicleMasterRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Vehicle not found", 404);
    }

    await validateParty(body.sid, userId);
    await vehicleMasterRepository.update(id, body, userId);

    return await vehicleMasterRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await vehicleMasterRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Vehicle not found", 404);
    }

    await vehicleMasterRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
