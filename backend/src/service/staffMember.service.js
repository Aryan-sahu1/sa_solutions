const staffMemberRepository = require("../repository/staffMember.repository");
const staffCategoryRepository = require("../repository/staff.repository");
const bcrypt = require("bcrypt");
const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const validateStaffMember = (body) => {
    if (!body.name) {
        throw createError("name is required");
    }

    if (!body.pid) {
        throw createError("pid is required");
    }

    if (!body.password) {
        throw createError("password is required");
    }

    if (Number.isNaN(Number(body.pid))) {
        throw createError("pid must be a valid staff category id");
    }
};

const validateStaffCategory = async (pid, customer) => {
    const staffCategory = await staffCategoryRepository.findById(pid);

    if (!staffCategory) {
        throw createError("Selected staff category does not exist", 404);
    }

    if (Number(staffCategory.product_id) !== Number(customer?.product_id)) {
        throw createError(
            "Selected staff category is not available for this customer product",
            400
        );
    }

    return staffCategory;
};

const create = async (body, userId, customer) => {
    validateStaffMember(body);
    await validateStaffCategory(body.pid, customer);
    const staffExist= await staffMemberRepository.findByName(body.name)
    console.log(staffExist,"staffExiststaffExist")
    if (staffExist) {
        throw createError("Staff already exist , Create With different mobile number");
    }
 const hashedPassword = await bcrypt.hash(body.password, 10);
    
    return await staffMemberRepository.create({ ...body,
        password: hashedPassword}, userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await staffMemberRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await staffMemberRepository.findById(id, userId);

    if (!data) {
        throw createError("Staff member not found", 404);
    }

    return data;
};

const update = async (id, body, userId, customer) => {
    validateStaffMember(body);

    const existingData = await staffMemberRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Staff member not found", 404);
    }

    await validateStaffCategory(body.pid, customer);
    const hashedPassword = await bcrypt.hash(body.password, 10);
    await staffMemberRepository.update(
        id,
        {
            ...body,
            password: hashedPassword
        },
        userId
    );

    return await staffMemberRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await staffMemberRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Staff member not found", 404);
    }

    await staffMemberRepository.remove(id, userId);

    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
