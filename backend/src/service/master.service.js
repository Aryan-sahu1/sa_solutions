const masterRepository = require("../repository/master.repository");

const validateMasterList = async (id) => {
    if (Number.isNaN(Number(id))) {
        throw new Error("product_id must be a valid master list id");
    }

    const masterList = await masterRepository.findMasterListById(id);

    if (!masterList) {
        throw new Error("Selected master list not found");
    }

    return masterList;
};

const create = async (body) => {
    if (!body.product_id || !body.name) {
        throw new Error("product_id and name are required");
    }

    await validateMasterList(body.product_id);

    const result = await masterRepository.create(body);

    return result;
};

const findAll = async (options = {}) => {
    const result = await masterRepository.findAll(options);

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
            id: item.sid,
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

const findReportOptionsByCustomerProduct = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 1000;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1000;

    if (!options.productId) {
        throw new Error("productId is required");
    }

    const result = await masterRepository.findReportOptionsByCustomerProduct({
        productId: options.productId,
        page,
        limit,
        search: options.search || ""
    });

    return {
        rows: result.rows.map((item) => ({
            id: item.id,
            sid: item.sid,
            product_id: item.product_id,
            master_list_name: item.master_list_name,
            name: item.name,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at
        })),
        total: result.total || 0
    };
};

const findById = async (id) => {
    const data = await masterRepository.findById(id);

    if (!data) {
        throw new Error("Staff category not found");
    }

    return data;
};

const update = async (id, body) => {
    if (!body.product_id || !body.name) {
        throw new Error("product_id and name are required");
    }

    await validateMasterList(body.product_id);

    const existingData = await masterRepository.findById(id);

    if (!existingData) {
        throw new Error("Staff category not found");
    }

    const result = await masterRepository.update(id, body);

    return result;
};

const remove = async (id) => {
    const existingData = await masterRepository.findById(id);

    if (!existingData) {
        throw new Error("Staff category not found");
    }

    const result = await masterRepository.remove(id);

    return result;
};

module.exports = {
    create,
    findAll,
    findReportOptionsByCustomerProduct,
    findById,
    update,
    remove
};
