const studentRepository = require("../../repository/school/student.repository");

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

const optionalText = (value) => (isEmpty(value) ? null : String(value).trim());
const optionalDate = (value) => (isEmpty(value) ? null : String(value).trim());

const validateOptionalNumber = (body, field, label) => {
    if (!isEmpty(body[field]) && Number.isNaN(Number(body[field]))) {
        throw createError(`${label} must be a valid number`);
    }
};

const validatePayload = (body) => {
    if (isEmpty(body.name)) throw createError("Student name is required");

    validateOptionalNumber(body, "opening_balance", "Opening balance");
    validateOptionalNumber(body, "discount", "Discount");
};

const normalizePayload = (body) => ({
    name: String(body.name).trim(),
    address: optionalText(body.address),
    father_name: optionalText(body.father_name),
    mother_name: optionalText(body.mother_name),
    opening_balance: isEmpty(body.opening_balance) ? null : String(body.opening_balance).trim(),
    mobile: optionalText(body.mobile),
    gender: optionalText(body.gender),
    discount: isEmpty(body.discount) ? null : String(body.discount).trim(),
    class_name: optionalText(body.class_name),
    second_mobile_no: optionalText(body.second_mobile_no),
    admission_no: optionalText(body.admission_no),
    fee_type: optionalText(body.fee_type),
    category: optionalText(body.category),
    left_date: optionalDate(body.left_date),
    dob: optionalDate(body.dob),
    admission_date: optionalDate(body.admission_date),
    convenience_start_date: optionalDate(body.convenience_start_date),
    aadhar_no: optionalText(body.aadhar_no),
    house: optionalText(body.house),
    sr_no: optionalText(body.sr_no),
    pan_no: optionalText(body.pan_no)
});

const create = async (body, userId) => {
    validatePayload(body);
    return await studentRepository.create(normalizePayload(body), userId);
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await studentRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await studentRepository.findById(id, userId);

    if (!data) {
        throw createError("Student not found", 404);
    }

    return data;
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await studentRepository.findById(id, userId);
    if (!existingData) throw createError("Student not found", 404);

    await studentRepository.update(id, normalizePayload(body), userId);
    return await studentRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await studentRepository.findById(id, userId);
    if (!existingData) throw createError("Student not found", 404);

    await studentRepository.remove(id, userId);
    return true;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
