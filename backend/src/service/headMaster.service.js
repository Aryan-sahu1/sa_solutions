const headMasterRepository = require("../repository/headMaster.repository");

const create = async (body, userId) => {
    if (!body.name) {
        throw new Error("name is required");
    }

    if (!body.head_type) {
        throw new Error("head_type is required");
    }

    return await headMasterRepository.create(body, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await headMasterRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await headMasterRepository.findById(id, userId);

    if (!data) {
        throw new Error("Head master not found");
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

    const existingData = await headMasterRepository.findById(id, userId);

    if (!existingData) {
        throw new Error("Head master not found");
    }

    await headMasterRepository.update(id, body, userId);

    return await headMasterRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await headMasterRepository.findById(id, userId);

    if (!existingData) {
        throw new Error("Head master not found");
    }

    await headMasterRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
