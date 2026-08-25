const trialBalanceRepository =
    require("../../repository/reports/trialBalance.repository");

const createError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const isValidDate = (value) => {
    if (!value) {
        return true;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime());
};

const toBoolean = (value) => (
    value === true ||
    value === "true" ||
    value === "1" ||
    value === 1
);

const isEmpty = (value) => (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
);

const findAll = async (options = {}) => {
    if (!options.userId) {
        throw createError("userId is required");
    }

    if (!isValidDate(options.fromDate)) {
        throw createError("fromDate must be a valid date");
    }

    if (!isValidDate(options.toDate)) {
        throw createError("toDate must be a valid date");
    }

    if (
        options.fromDate &&
        options.toDate &&
        new Date(options.fromDate) > new Date(options.toDate)
    ) {
        throw createError("fromDate cannot be greater than toDate");
    }

    if (!isEmpty(options.partyId) && Number.isNaN(Number(options.partyId))) {
        throw createError("partyId must be a valid party id");
    }

    return await trialBalanceRepository.findAll({
        userId: options.userId,
        fromDate: options.fromDate || "",
        toDate: options.toDate || "",
        partyId: options.partyId || "",
        search: options.search || "",
        includeZero: toBoolean(options.includeZero)
    });
};

module.exports = {
    findAll
};
