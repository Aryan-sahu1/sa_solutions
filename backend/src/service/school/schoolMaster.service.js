const schoolMasterRepository = require("../../repository/school/schoolMaster.repository");

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
    if (isEmpty(body.mid)) throw createError("Master is required");
    if (isEmpty(body.name)) throw createError("Name is required");
    if (isEmpty(body.amount)) throw createError("Amount is required");

    if (Number.isNaN(Number(body.mid))) throw createError("Master must be a valid id");
    if (Number.isNaN(Number(body.amount))) throw createError("Amount must be a valid number");
};

const requireProductId = (productId) => {
    if (isEmpty(productId) || Number.isNaN(Number(productId))) {
        throw createError("Customer product is required", 400);
    }

    return Number(productId);
};

const normalizePayload = async (body, productId) => {
    const scopedProductId = requireProductId(productId);
    const master = await schoolMasterRepository.findMasterOptionByIdAndProductId(
        body.mid,
        scopedProductId
    );

    if (!master) {
        throw createError("Selected master does not exist for school", 404);
    }

    return {
        mid: Number(body.mid),
        name: String(body.name).trim(),
        amount: String(body.amount).trim()
    };
};

const create = async (body, userId, productId) => {
    validatePayload(body);
    return await schoolMasterRepository.create(await normalizePayload(body, productId), userId);
};

const findMasterOptions = async (options = {}) => {
    const productId = requireProductId(options.productId);
    return await schoolMasterRepository.findMasterOptionsByProductId(productId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await schoolMasterRepository.findAll({
        userId: options.userId,
        productId: requireProductId(options.productId),
        page,
        limit,
        search: options.search || "",
        mid: options.mid || ""
    });
};

const findById = async (id, userId, productId) => {
    const data = await schoolMasterRepository.findById(id, userId, requireProductId(productId));

    if (!data) {
        throw createError("School master entry not found", 404);
    }

    return data;
};

const update = async (id, body, userId, productId) => {
    validatePayload(body);

    const scopedProductId = requireProductId(productId);
    const existingData = await schoolMasterRepository.findById(id, userId, scopedProductId);
    if (!existingData) throw createError("School master entry not found", 404);

    const payload = await normalizePayload(body, scopedProductId);
    await schoolMasterRepository.update(id, payload, userId);

    return await schoolMasterRepository.findById(id, userId, scopedProductId);
};

const remove = async (id, userId, productId) => {
    const existingData = await schoolMasterRepository.findById(
        id,
        userId,
        requireProductId(productId)
    );
    if (!existingData) throw createError("School master entry not found", 404);

    await schoolMasterRepository.remove(id, userId);
    return true;
};

module.exports = {
    create,
    findMasterOptions,
    findAll,
    findById,
    update,
    remove
};
