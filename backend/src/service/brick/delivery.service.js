const brickDeliveryRepository = require("../../repository/brick/delivery.repository");
const partyRepository = require("../../repository/party.repository");
const stockItemRepository = require("../../repository/stockItem.repository");
const vehicleMasterRepository = require("../../repository/vehicleMaster.repository");

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

const validateOptionalNumber = (body, field, label) => {
    if (!isEmpty(body[field]) && Number.isNaN(Number(body[field]))) {
        throw createError(`${label} must be a valid number`);
    }
};

const validatePayload = (body) => {
    if (isEmpty(body.date)) throw createError("Date is required");
    if (isEmpty(body.party_id)) throw createError("Party is required");
    if (isEmpty(body.iid)) throw createError("Item is required");
    if (isEmpty(body.vehicle_no)) throw createError("Vehicle is required");
    if (isEmpty(body.qty)) throw createError("Quantity is required");
    if (isEmpty(body.amt)) throw createError("Amount is required");

    if (Number.isNaN(Number(body.party_id))) throw createError("Party must be a valid id");
    if (Number.isNaN(Number(body.iid))) throw createError("Item must be a valid id");
    if (Number.isNaN(Number(body.vehicle_no))) throw createError("Vehicle must be a valid id");
    if (Number.isNaN(Number(body.qty))) throw createError("Quantity must be a valid number");
    if (Number.isNaN(Number(body.amt))) throw createError("Amount must be a valid number");

    validateOptionalNumber(body, "vamt", "Vehicle amount");
    validateOptionalNumber(body, "dqty", "Diesel qty");
    validateOptionalNumber(body, "damt", "Diesel amount");
    validateOptionalNumber(body, "lamt", "Labour amount");
};

const normalizePayload = async (body, userId) => {
    const selectedParty = await partyRepository.findById(body.party_id, userId);

    if (!selectedParty) {
        throw createError("Selected party does not exist", 404);
    }

    const salesAccount =
        await partyRepository.findByName("Sales", userId) ||
        await partyRepository.findByName("Sale", userId);

    if (!salesAccount) {
        throw createError("First create Sales account in party");
    }

    const stockItem = await stockItemRepository.findById(body.iid, userId);

    if (!stockItem) {
        throw createError("Selected item does not exist", 404);
    }

    const vehicle = await vehicleMasterRepository.findById(body.vehicle_no, userId);

    if (!vehicle) {
        throw createError("Selected vehicle does not exist", 404);
    }

    if (Number(vehicle.sid) !== Number(body.party_id)) {
        throw createError("Selected vehicle does not belong to selected party");
    }

    return {
        date: String(body.date).trim().replace("T", " "),
        pid: Number(body.party_id),
        crid: Number(salesAccount.id),
        iid: Number(body.iid),
        qty: String(body.qty).trim(),
        amt: String(body.amt).trim(),
        remarks: isEmpty(body.remarks) ? "" : String(body.remarks).trim(),
        vehicle_no: Number(body.vehicle_no),
        vamt: isEmpty(body.vamt) ? null : String(body.vamt).trim(),
        dqty: isEmpty(body.dqty) ? null : String(body.dqty).trim(),
        damt: isEmpty(body.damt) ? null : String(body.damt).trim(),
        lamt: isEmpty(body.lamt) ? null : String(body.lamt).trim(),
        creturn: body.creturn === true ||
            body.creturn === 1 ||
            body.creturn === "1" ||
            body.creturn === "true"
    };
};

const create = async (body, userId) => {
    validatePayload(body);
    const payload = await normalizePayload(body, userId);
    return await brickDeliveryRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await brickDeliveryRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        date: options.date || ""
    });
};

const findById = async (id, userId) => {
    const data = await brickDeliveryRepository.findById(id, userId);

    if (!data) {
        throw createError("Delivery entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await brickDeliveryRepository.findById(id, userId);
    if (!existingData) throw createError("Delivery entry not found", 404);

    const payload = await normalizePayload(body, userId);
    await brickDeliveryRepository.update(id, payload, userId);

    return await brickDeliveryRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await brickDeliveryRepository.findById(id, userId);
    if (!existingData) throw createError("Delivery entry not found", 404);

    await brickDeliveryRepository.remove(id, userId);
    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
