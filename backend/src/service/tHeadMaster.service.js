const tHeadMasterRepository = require("../repository/tHeadMaster.repository");

const create = async (body, userId) => {
    if (!body.name) {
        throw new Error("name is required");
    }

    if (!body.head_type) {
        throw new Error("head_type is required");
    }

    return await tHeadMasterRepository.create(body, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await tHeadMasterRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await tHeadMasterRepository.findById(id, userId);

    if (!data) {
        throw new Error("T head master not found");
    }

    return data;
};

const update = async (id, body, userId) => {
    if (!body.name) {
        throw new Error("name is required");
    }

    if (!body.head_type) {
        throw new Error("head_type is required");
    }

    const existingData = await tHeadMasterRepository.findById(id, userId);

    if (!existingData) {
        throw new Error("T head master not found");
    }

    await tHeadMasterRepository.update(id, body, userId);

    return await tHeadMasterRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await tHeadMasterRepository.findById(id, userId);

    if (!existingData) {
        throw new Error("T head master not found");
    }

    await tHeadMasterRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
