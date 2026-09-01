const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const db = require("../config/db");

const execFileAsync = promisify(execFile);

const parserPath = path.join(__dirname, "../scripts/parseXlsx.php");

const tableConfigs = {
    head_master: {
        columns: ["name", "head_type", "cid"],
        map: "head_master",
        values: (row, ctx) => [row.name, row.head_type, ctx.customerId]
    },
    product_category: {
        columns: ["name", "cid", "unit"],
        map: "product_category",
        values: (row, ctx) => [row.name, ctx.customerId, row.unit]
    },
    t_head_master: {
        columns: ["name"],
        map: "t_head_master",
        values: (row) => [row.name]
    },
    party: {
        columns: ["name", "cid", "address", "phone_no", "openbal", "sid", "sid1", "salary"],
        map: "party",
        values: (row, ctx) => [
            row.name || null,
            ctx.customerId,
            row.address || null,
            row.phone_no || null,
            row.openbal || 0,
            ctx.mapId("head_master", row.sid, "party.sid"),
            row.sid1
                ? ctx.mapOptionalId("t_head_master", row.sid1, "party.sid1")
                : null,
            row.salary || null
        ]
    },
    stock_item: {
        columns: ["name", "inLtr", "pid", "measure_unit", "o_quantity", "o_rate", "gst", "gst_code", "cid"],
        map: "stock_item",
        values: (row, ctx) => [
            row.name,
            row.inltr || row.inLtr || null,
            ctx.mapId("product_category", row.pid, "stock_item.pid", true),
            row.measure_unit || null,
            row.o_quantity || null,
            row.o_rate || null,
            row.gst || null,
            row.gst_code || null,
            ctx.customerId
        ]
    },
    vehicle_master: {
        columns: ["name", "balance", "sid", "cid"],
        map: "vehicle_master",
        values: (row, ctx) => [
            row.name,
            row.balance || 0,
            ctx.mapId("party", row.sid, "vehicle_master.sid"),
            ctx.customerId
        ]
    },
    nozel: {
        columns: ["name", "snno", "pid", "cid"],
        map: "nozel",
        values: (row, ctx) => [
            row.name,
            row.snno,
            ctx.mapId("product_category", row.pid, "nozel.pid"),
            ctx.customerId
        ]
    },
    tran: {
        columns: ["pid", "crid", "date", "type", "type1", "remarks", "amt", "cid", "vehicle_no", "slip_no"],
        map: "tran",
        values: (row, ctx) => [
            ctx.mapId("party", row.pid, "tran.pid"),
            ctx.mapId("party", row.crid, "tran.crid"),
            ctx.dateValue(row.date),
            row.type || "O",
            row.type1 || null,
            row.remarks || "",
            row.amt || 0,
            ctx.customerId,
            row.vehicle_no ? ctx.mapId("vehicle_master", row.vehicle_no, "tran.vehicle_no") : null,
            row.slip_no || null
        ]
    },
    trande: {
        columns: ["iid", "sid", "product_id", "qty", "rate", "amt"],
        map: "trande",
        values: (row, ctx) => [
            ctx.mapId("stock_item", row.iid, "trande.iid"),
            ctx.mapId("tran", row.sid, "trande.sid"),
            row.product_id ? ctx.mapId("product_category", row.product_id, "trande.product_id") : null,
            row.qty || 0,
            row.rate || null,
            row.amt || 0
        ]
    },
    bill: {
        columns: ["sdate", "edate", "date", "billno", "vehicleno", "party", "remarks", "amt", "type", "tcs", "cid"],
        map: "bill",
        values: (row, ctx) => [
            ctx.dateValue(row.sdate),
            ctx.dateValue(row.edate),
            ctx.dateValue(row.date),
            row.billno || null,
            row.vehicleno ? ctx.mapId("vehicle_master", row.vehicleno, "bill.vehicleno") : null,
            row.party ? ctx.mapId("party", row.party, "bill.party") : null,
            row.remarks || null,
            row.amt || 0,
            row.type || null,
            row.tcs || 0,
            ctx.customerId
        ]
    },
    customer_petrol: {
        columns: ["date", "ship_no", "pid", "sid", "qty", "rate", "amount", "cid"],
        map: "customer_petrol",
        values: (row, ctx) => [
            ctx.dateValue(row.date),
            row.ship_no,
            ctx.mapId("party", row.pid, "customer_petrol.pid"),
            ctx.mapId("stock_item", row.sid, "customer_petrol.sid"),
            row.qty || 0,
            row.rate || 0,
            row.amount || 0,
            ctx.customerId
        ]
    },
    leak1: {
        columns: ["date", "qty", "cid", "iid"],
        map: "leak1",
        values: (row, ctx) => [
            ctx.dateValue(row.date),
            row.qty || 0,
            ctx.customerId,
            ctx.mapId("stock_item", row.iid, "leak1.iid")
        ]
    },
    meter: {
        columns: ["date", "shift", "msp", "hsdp", "ureap", "cngp", "speedp", "msst", "hsdst", "ureast", "cngst", "speedst", "cid"],
        map: "meter",
        values: (row, ctx) => [
            ctx.dateValue(row.date),
            row.shift || null,
            row.msp || 0,
            row.hsdp || 0,
            row.ureap || 0,
            row.cngp || 0,
            row.speedp || 0,
            row.msst || 0,
            row.hsdst || 0,
            row.ureast || 0,
            row.cngst || 0,
            row.speedst || 0,
            ctx.customerId
        ]
    },
    meterde: {
        columns: ["opening", "closing", "cid", "sid", "pid", "iid", "testing", "sale"],
        map: "meterde",
        values: (row, ctx) => [
            row.opening || 0,
            row.closing || 0,
            ctx.customerId,
            ctx.mapId("meter", row.sid, "meterde.sid"),
            ctx.mapId("product_category", row.pid, "meterde.pid"),
            ctx.mapId("nozel", row.iid, "meterde.iid"),
            row.testing || 0,
            row.sale || 0
        ]
    }
};

const importOrder = [
    "head_master",
    "t_head_master",
    "product_category",
    "party",
    "stock_item",
    "vehicle_master",
    "nozel",
    "tran",
    "trande",
    "bill",
    "customer_petrol",
    "leak1",
    "meter",
    "meterde"
];

const quoteIdentifier = (identifier) => `\`${identifier}\``;

const normalizeSheetName = (name) => (
    String(name || "")
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, "_")
);

const normalizeRow = (row) => {
    return Object.entries(row).reduce((acc, [key, value]) => {
        const normalizedKey = String(key).trim().toLowerCase();
        acc[normalizedKey] = typeof value === "string" ? value.trim() : value;
        return acc;
    }, {});
};

const parseWorkbook = async (buffer) => {
    const tmpPath = path.join(
        os.tmpdir(),
        `petrol-import-${Date.now()}-${Math.random().toString(16).slice(2)}.xlsx`
    );

    await fs.writeFile(tmpPath, buffer);

    try {
        const { stdout } = await execFileAsync("php", [parserPath, tmpPath], {
            maxBuffer: 20 * 1024 * 1024
        });

        return JSON.parse(stdout);
    } finally {
        await fs.unlink(tmpPath).catch(() => {});
    }
};

const excelSerialToDate = (value) => {
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial <= 0) {
        return value || null;
    }

    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    return dateInfo.toISOString().slice(0, 19).replace("T", " ");
};

const importWorkbook = async ({ customerId, buffer }) => {
    if (!customerId || Number.isNaN(Number(customerId))) {
        const error = new Error("Customer is required");
        error.statusCode = 400;
        throw error;
    }

    if (!buffer || buffer.length === 0) {
        const error = new Error("Excel file is required");
        error.statusCode = 400;
        throw error;
    }

    const parsed = await parseWorkbook(buffer);
    const sheets = Object.entries(parsed).reduce((acc, [name, rows]) => {
        acc[normalizeSheetName(name)] = rows.map(normalizeRow);
        return acc;
    }, {});

    const idMap = {};
    const summary = {};
    const connection = await db.getConnection();

    const ctx = {
        customerId: Number(customerId),
        dateValue(value) {
            if (value === undefined || value === null || value === "") {
                return null;
            }
            return /^\d+(\.\d+)?$/.test(String(value))
                ? excelSerialToDate(value)
                : value;
        },
        mapId(table, oldId, label, allowZero = false) {
            if ((oldId === undefined || oldId === null || oldId === "") && allowZero) {
                return 0;
            }

            const key = String(oldId);
            const mapped = idMap[table]?.[key];
            if (!mapped) {
                throw new Error(`${label} old id ${oldId} mapping not found`);
            }
            return mapped;
        },
        mapOptionalId(table, oldId, label) {
            if (!idMap[table]) {
                return oldId;
            }

            return this.mapId(table, oldId, label);
        }
    };

    try {
        await connection.beginTransaction();

        const [customerRows] = await connection.query(
            "SELECT id FROM customers WHERE id = ? AND deleted_at IS NULL",
            [ctx.customerId]
        );

        if (!customerRows[0]) {
            const error = new Error("Selected customer does not exist");
            error.statusCode = 404;
            throw error;
        }

        for (const tableName of importOrder) {
            const rows = sheets[tableName] || [];
            const config = tableConfigs[tableName];

            if (!config || rows.length === 0) {
                continue;
            }

            idMap[config.map] = idMap[config.map] || {};
            summary[tableName] = 0;

            const placeholders = config.columns.map(() => "?").join(", ");
            const sql = `
                INSERT INTO ${quoteIdentifier(tableName)}
                    (${config.columns.map(quoteIdentifier).join(", ")})
                VALUES (${placeholders})
            `;

            for (const row of rows) {
                const oldId = row.old_id || row.id;
                const [result] = await connection.query(sql, config.values(row, ctx));

                if (oldId !== undefined && oldId !== null && oldId !== "") {
                    idMap[config.map][String(oldId)] = result.insertId;
                }

                summary[tableName]++;
            }
        }

        await connection.commit();

        return {
            summary,
            importedTables: Object.keys(summary)
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    importWorkbook
};
