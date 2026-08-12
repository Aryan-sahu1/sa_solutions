const tHeadMasterRepository = require("../repository/tHeadMaster.repository");

const create = async (body) => {
    if (!body.name) {
        throw new Error("name is required");
    }

    return await tHeadMasterRepository.create(body);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await tHeadMasterRepository.findAll({
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id) => {
    const data = await tHeadMasterRepository.findById(id);

    if (!data) {
        throw new Error("T head master not found");
    }

    return data;
};

const update = async (id, body) => {
    if (!body.name) {
        throw new Error("name is required");
    }

    const existingData = await tHeadMasterRepository.findById(id);

    if (!existingData) {
        throw new Error("T head master not found");
    }

    await tHeadMasterRepository.update(id, body);

    return await tHeadMasterRepository.findById(id);
};

const remove = async (id) => {
    const existingData = await tHeadMasterRepository.findById(id);

    if (!existingData) {
        throw new Error("T head master not found");
    }

    await tHeadMasterRepository.remove(id);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
