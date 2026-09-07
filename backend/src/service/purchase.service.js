const purchaseRepository = require("../repository/purchase.repository");
const partyRepository = require("../repository/party.repository");
const productCategoryRepository = require("../repository/productCategory.repository");
const stockItemRepository = require("../repository/stockItem.repository");
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
    if (isEmpty(body.date)) throw createError("Date is required");
    if (isEmpty(body.slip_no)) throw createError("Slip no is required");
    if (isEmpty(body.pid)) throw createError("Party is required");
    if (isEmpty(body.vehicle_no)) throw createError("Vehicle no is required");
    if (isEmpty(body.amt)) throw createError("Amount is required");

    if (Number.isNaN(Number(body.pid))) throw createError("Party must be a valid id");
    if (Number.isNaN(Number(body.vehicle_no))) throw createError("Vehicle must be a valid id");
    if (Number.isNaN(Number(body.amt))) throw createError("Amount must be a valid number");

    if (!Array.isArray(body.items) || body.items.length === 0) {
        throw createError("At least one item is required");
    }

    body.items.forEach((item, index) => {
        if (isEmpty(item.product_id)) throw createError(`Product is required at row ${index + 1}`);
        if (isEmpty(item.iid)) throw createError(`Item is required at row ${index + 1}`);
        if (isEmpty(item.qty)) throw createError(`Quantity is required at row ${index + 1}`);
        if (isEmpty(item.rate)) throw createError(`Rate is required at row ${index + 1}`);
        if (isEmpty(item.amt)) throw createError(`Item amount is required at row ${index + 1}`);

        if (Number.isNaN(Number(item.product_id))) {
            throw createError(`Product must be a valid id at row ${index + 1}`);
        }

        if (Number.isNaN(Number(item.iid))) {
            throw createError(`Item must be a valid stock item id at row ${index + 1}`);
        }

        if (Number.isNaN(Number(item.qty))) {
            throw createError(`Quantity must be a valid number at row ${index + 1}`);
        }

        if (Number.isNaN(Number(item.rate))) {
            throw createError(`Rate must be a valid number at row ${index + 1}`);
        }

        if (Number.isNaN(Number(item.amt))) {
            throw createError(`Item amount must be a valid number at row ${index + 1}`);
        }
    });
};

const normalizePayload = async (body, userId) => {
    const party = await partyRepository.findById(body.pid, userId);
    if (!party) throw createError("Selected party does not exist", 404);

    const purchaseAccount =
        await partyRepository.findByName("Purchase", userId) ||
        await partyRepository.findByName("Purchases", userId);

    if (!purchaseAccount) {
        throw createError("First create Purchase account in party");
    }

    const vehicle = await vehicleMasterRepository.findById(body.vehicle_no, userId);
    if (!vehicle) throw createError("Selected vehicle does not exist", 404);

    if (Number(vehicle.sid) !== Number(body.pid)) {
        throw createError("Selected vehicle does not belong to selected party");
    }

    const items = [];

    for (const item of body.items) {
        const productCategory = await productCategoryRepository.findById(
            item.product_id,
            userId
        );

        if (!productCategory) throw createError("Selected product does not exist", 404);

        const stockItem = await stockItemRepository.findById(item.iid, userId);

        if (!stockItem) {
            throw createError("Selected item does not exist", 404);
        }

        if (Number(stockItem.pid) !== Number(item.product_id)) {
            throw createError(
                `${stockItem.name} does not belong to selected product category`
            );
        }

        items.push({
            product_id: Number(item.product_id),
            iid: Number(item.iid),
            qty: Number(item.qty),
            rate: String(item.rate).trim(),
            amt: String(item.amt).trim()
        });
    }

    return {
        date: String(body.date).trim().replace("T", " "),
        slip_no: String(body.slip_no).trim(),
        pid: Number(purchaseAccount.id),
        crid: Number(body.pid),
        vehicle_no: Number(body.vehicle_no),
        amt: String(body.amt).trim(),
        items
    };
};

const create = async (body, userId) => {
    validatePayload(body);
    const payload = await normalizePayload(body, userId);
    return await purchaseRepository.create(payload, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await purchaseRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || "",
        date: options.date || "",
        type1: null
    });
};

const findById = async (id, userId) => {
    const data = await purchaseRepository.findById(id, userId);

    if (!data) {
        throw createError("Purchase entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await purchaseRepository.findById(id, userId);
    if (!existingData) throw createError("Purchase entry not found", 404);

    const payload = await normalizePayload(body, userId);
    await purchaseRepository.update(id, payload, userId);

    return await purchaseRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await purchaseRepository.findById(id, userId);
    if (!existingData) throw createError("Purchase entry not found", 404);

    await purchaseRepository.remove(id, userId);
    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
