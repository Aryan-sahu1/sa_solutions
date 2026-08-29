const billRepository = require("../repository/bill.repository");
const partyRepository = require("../repository/party.repository");
const vehicleMasterRepository = require("../repository/vehicleMaster.repository");

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

const validatePayload = (body) => {
    if (isEmpty(body.sdate)) throw createError("Start date is required");
    if (isEmpty(body.edate)) throw createError("End date is required");
    if (isEmpty(body.date)) throw createError("Date is required");
    if (isEmpty(body.billno)) throw createError("Bill no is required");
    if (isEmpty(body.party)) throw createError("Party is required");
    if (Number.isNaN(Number(body.party))) throw createError("Party must be a valid party id");
    if (isEmpty(body.vehicleno)) throw createError("Vehicle is required");
    if (body.vehicleno !== "all" && Number.isNaN(Number(body.vehicleno))) {
        throw createError("Vehicle must be a valid vehicle id");
    }
    if (body.vehicleno !== "all") {
        if (isEmpty(body.amt)) throw createError("Amount is required");
        if (Number.isNaN(Number(body.amt))) throw createError("Amount must be a valid number");
    }
    if (!["Others", "Lub"].includes(body.type)) throw createError("Type must be Others or Lub");
};

const normalizePayload = async (body, userId) => {
    const party = await partyRepository.findById(body.party, userId);

    if (!party) {
        throw createError("Selected party does not exist", 404);
    }

    let selectedVehicles = [];

    if (body.vehicleno === "all") {
        const vehicleResult = await vehicleMasterRepository.findAll({
            userId,
            page: 1,
            limit: 10000,
            sid: body.party
        });

        selectedVehicles = vehicleResult.data || [];

        if (selectedVehicles.length === 0) {
            throw createError("No vehicles found for selected party", 404);
        }
    } else {
        const vehicle = await vehicleMasterRepository.findById(body.vehicleno, userId);

        if (!vehicle) {
            throw createError("Selected vehicle does not exist", 404);
        }

        if (Number(vehicle.sid) !== Number(body.party)) {
            throw createError("Selected vehicle does not belong to selected party");
        }

        selectedVehicles = [vehicle];
    }

    const payloads = [];

    for (const vehicle of selectedVehicles) {
        const vehicleAmount = body.vehicleno === "all"
            ? await billRepository.findSalesTotal({
                userId,
                party: Number(body.party),
                sdate: String(body.sdate).trim(),
                edate: String(body.edate).trim(),
                vehicleno: Number(vehicle.id)
            })
            : body.amt;

        if (body.vehicleno === "all" && Number(vehicleAmount || 0) <= 0) {
            continue;
        }

        payloads.push({
            sdate: String(body.sdate).trim(),
            edate: String(body.edate).trim(),
            date: String(body.date).trim(),
            billno: String(Number(body.billno) + payloads.length).padStart(String(body.billno).length, "0"),
            vehicleno: Number(vehicle.id),
            party: Number(body.party),
            remarks: String(body.remarks || "").trim(),
            amt: Number(vehicleAmount || 0).toFixed(2),
            type: String(body.type).trim(),
            tcs: body.tcs || 0
        });
    }

    if (payloads.length === 0) {
        throw createError("No sales amount found for selected vehicles");
    }

    return payloads;
};

const findNextBillNo = async (userId) => {
    return await billRepository.findNextBillNo(userId);
};

const findSalesTotal = async (query, userId) => {
    if (isEmpty(query.sdate)) throw createError("Start date is required");
    if (isEmpty(query.edate)) throw createError("End date is required");
    if (isEmpty(query.party)) throw createError("Party is required");
    if (Number.isNaN(Number(query.party))) throw createError("Party must be a valid party id");

    const party = await partyRepository.findById(query.party, userId);

    if (!party) {
        throw createError("Selected party does not exist", 404);
    }

    const totalAmount = await billRepository.findSalesTotal({
        userId,
        party: Number(query.party),
        sdate: String(query.sdate).trim(),
        edate: String(query.edate).trim(),
        vehicleno: query.vehicleno && query.vehicleno !== "all"
            ? Number(query.vehicleno)
            : ""
    });

    return {
        amt: Number(totalAmount || 0).toFixed(2)
    };
};

const create = async (body, userId) => {
    if (isEmpty(body.billno)) {
        body.billno = await billRepository.findNextBillNo(userId);
    }

    validatePayload(body);
    const payloads = await normalizePayload(body, userId);
    const results = [];

    for (const payload of payloads) {
        results.push(await billRepository.create(payload, userId));
    }

    return {
        ids: results.map((result) => result.insertId),
        count: results.length
    };
};

const findAll = async (options = {}) => {
    let page = Number(options.page) || 1;
    let limit = Number(options.limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;

    return await billRepository.findAll({
        userId: options.userId,
        page,
        limit,
        search: options.search || ""
    });
};

const findById = async (id, userId) => {
    const data = await billRepository.findById(id, userId);

    if (!data) {
        throw createError("Bill entry not found", 404);
    }

    return data;
};

const findAnnexureByBillId = async (id, userId, customer = null) => {
    const data = await billRepository.findAnnexureByBillId(id, userId);

    if (!data) {
        throw createError("Bill entry not found", 404);
    }

    return {
        ...data,
        customer
    };
};

const update = async (id, body, userId) => {
    validatePayload(body);

    const existingData = await billRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Bill entry not found", 404);
    }

    if (body.vehicleno === "all") {
        throw createError("All vehicles option is only available for new bill entries");
    }

    const [payload] = await normalizePayload(body, userId);
    await billRepository.update(id, payload, userId);

    return await billRepository.findById(id, userId);
};

const remove = async (id, userId) => {
    const existingData = await billRepository.findById(id, userId);

    if (!existingData) {
        throw createError("Bill entry not found", 404);
    }

    await billRepository.remove(id, userId);

    return true;
};

module.exports = {
    findNextBillNo,
    findSalesTotal,
    findAnnexureByBillId,
    create,
    findAll,
    findById,
    update,
    remove
};
