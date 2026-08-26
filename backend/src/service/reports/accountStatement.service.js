const accountStatementRepository =
    require("../../repository/reports/accountStatement.repository");

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

const isValidDate = (value) => {
    if (!value) {
        return false;
    }

    const date = new Date(value);
    return !Number.isNaN(date.getTime());
};

const findAll = async (options = {}) => {
    if (!options.userId) {
        throw createError("userId is required");
    }

    if (isEmpty(options.partyId) || Number.isNaN(Number(options.partyId))) {
        throw createError("partyId is required");
    }

    if (!isValidDate(options.fromDate)) {
        throw createError("fromDate must be a valid date");
    }

    if (!isValidDate(options.toDate)) {
        throw createError("toDate must be a valid date");
    }

    if (new Date(options.fromDate) > new Date(options.toDate)) {
        throw createError("fromDate cannot be greater than toDate");
    }

    const result = await accountStatementRepository.findAll({
        userId: options.userId,
        partyId: Number(options.partyId),
        fromDate: String(options.fromDate).trim(),
        toDate: String(options.toDate).trim()
    });

    if (!result) {
        throw createError("Selected party does not exist", 404);
    }

    return result;
};

module.exports = {
    findAll
};
