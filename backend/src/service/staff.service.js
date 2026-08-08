const staffCategoryRepository = require("../repository/staff.repository");

const create = async (body) => {
    if (!body.product_id || !body.name) {
        throw new Error("product_id and name are required");
    }

    const result = await staffCategoryRepository.create(body);

    return result;
};

const findAll = async () => {
    const rows = await staffCategoryRepository.findAll();

    return rows.map((item) => ({
        id: item.id,

        product: {
            id: item.product_id,
            name: item.product_name
        },

        name: item.name,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at
    }));
};

const findById = async (id) => {
    const data = await staffCategoryRepository.findById(id);

    if (!data) {
        throw new Error("Staff category not found");
    }

    return data;
};

const update = async (id, body) => {
    if (!body.product_id || !body.name) {
        throw new Error("product_id and name are required");
    }

    const existingData = await staffCategoryRepository.findById(id);

    if (!existingData) {
        throw new Error("Staff category not found");
    }

    const result = await staffCategoryRepository.update(id, body);

    return result;
};

const remove = async (id) => {
    const existingData = await staffCategoryRepository.findById(id);

    if (!existingData) {
        throw new Error("Staff category not found");
    }

    const result = await staffCategoryRepository.remove(id);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};