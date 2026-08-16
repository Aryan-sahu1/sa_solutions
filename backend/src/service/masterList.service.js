const masterListRepository = require("../repository/masterList.repository");

const create = async (body) => {
    if (!body.product_id || !body.name) {
        throw new Error("product_id and name are required");
    }

    const result = await masterListRepository.create(body);

    return result;
};

const findAll = async (options = {}) => {
    const result = await masterListRepository.findAll(options);

    let rows = [];
    let total = 0;

    if (Array.isArray(result)) {
        rows = result;
        total = rows.length;
    } else if (result && Array.isArray(result.rows)) {
        rows = result.rows;
        total = result.total || rows.length;
    }

    const mapped = rows.map((item) => ({
        id: item.id,
        product: {
            id: item.pid,
            name: item.product_name
        },
        name: item.name,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at
    }));

    if (!options || Object.keys(options).length === 0) {
        return mapped;
    }

    return { rows: mapped, total };
};

const findById = async (id) => {
    const data = await masterListRepository.findById(id);

    if (!data) {
        throw new Error("Staff category not found");
    }

    return data;
};

const update = async (id, body) => {
    if (!body.product_id || !body.name) {
        throw new Error("product_id and name are required");
    }

    const existingData = await masterListRepository.findById(id);

    if (!existingData) {
        throw new Error("Staff category not found");
    }

    const result = await masterListRepository.update(id, body);

    return result;
};

const remove = async (id) => {
    const existingData = await masterListRepository.findById(id);

    if (!existingData) {
        throw new Error("Staff category not found");
    }

    const result = await masterListRepository.remove(id);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
