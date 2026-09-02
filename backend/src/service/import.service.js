const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const db = require("../config/db");

const execFileAsync = promisify(execFile);

const parserPath = path.join(__dirname, "../scripts/parseXlsx.php");
const xlsConverterPath = path.join(__dirname, "../scripts/convertXlsToXlsx.ps1");

const sheetAliases = {
    productcategory: "product_category",
    product_category: "product_category",
    stockitem: "stock_item",
    stock_item: "stock_item",
    vehiclemaster: "vehicle_master",
    vehicle_master: "vehicle_master",
    headmaster: "head_master",
    head_master: "head_master",
    party: "party",
    sheet4: "party",
    sheet1: ' vehicle_master'
};

const normalizeName = (value) => (
    String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
);

const normalizeHeadType = (value) => {
    const normalized = String(value || "").trim().toUpperCase();

    if (normalized === "B/S" || normalized === "BS" || normalized === "BALANCE SHEET") {
        return "Balance Sheet";
    }

    if (normalized === "P/L" || normalized === "PL" || normalized === "PROFIT/LOSS") {
        return "Profit/Loss";
    }

    if (normalized === "TRADING") {
        return "Trading";
    }

    return "Balance Sheet";
};

const tableConfigs = {
    head_master: {
        columns: ["name", "head_type", "cid"],
        map: "head_master",
        values: (row, ctx) => [
            row.name,
            normalizeHeadType(row.head_type || row.headtype),
            ctx.customerId
        ]
    },
    product_category: {
        columns: ["name", "cid", "unit"],
        map: "product_category",
        values: (row, ctx) => [row.name, ctx.customerId, row.unit || ""]
    },
    t_head_master: {
        columns: ["name"],
        map: "t_head_master",
        values: (row) => [row.name]
    },
    party: {
        columns: ["name", "cid", "address", "phone_no", "openbal", "sid", "sid1", "salary"],
        map: "party",
        values: async (row, ctx) => [
            row.name || null,
            ctx.customerId,
            row.address || null,
            row.phone_no || null,
            row.openbal || 0,
            row.head_master_name
                ? await ctx.resolveOrCreateByName("head_master", row.head_master_name, {
                    head_type: row.head_type
                })
                : ctx.mapId("head_master", row.sid, "party.sid"),
            row.sid1
                ? ctx.mapOptionalId("t_head_master", row.sid1, "party.sid1")
                : null,
            row.salary || null
        ]
    },
    stock_item: {
        columns: ["name", "inLtr", "pid", "measure_unit", "o_quantity", "o_rate", "gst", "gst_code", "cid", "measurement_data"],
        map: "stock_item",
        values: async (row, ctx) => [
            row.name,
            row.inltr || row.inLtr || null,
            row.product_category_name
                ? await ctx.resolveOrCreateByName("product_category", row.product_category_name, {
                    unit: row.measure_unit || row.unit
                })
                : ctx.mapId("product_category", row.pid, "stock_item.pid", true),
            row.measure_unit || null,
            row.o_quantity || null,
            row.o_rate || null,
            row.gst || null,
            row.gst_code || null,
            ctx.customerId,
            row.measurement_data || null
        ]
    },
    vehicle_master: {
        columns: ["name", "balance", "sid", "cid"],
        map: "vehicle_master",
        values: async (row, ctx) => [
            row.name,
            row.balance || 0,
            row.party_name
                ? await ctx.resolveOrCreateByName("party", row.party_name)
                : ctx.mapId("party", row.sid, "vehicle_master.sid"),
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

const canonicalSheetName = (name) => {
    const normalized = normalizeSheetName(name);
    return sheetAliases[normalized] || normalized;
};

const fieldAliases = {
    "stockitem.name": "name",
    "vehiclemaster.name": "name",
    "productcategory.name": "product_category_name",
    "partyname": "party_name",
    "headmaster.name": "head_master_name",
    "headmaster.headtype": "head_type",
    headtype: "head_type",
    add: "address",
    add1: "address1",
    phoneno: "phone_no",
    cperson: "contact_person",
    tinno: "gstno",
    oqty: "o_quantity",
    pcsltr: "measurement_data",
    vat: "gst",
    vatcode: "gst_code",
    unit: "measure_unit",
};

const normalizeRow = (row, sheetName) => {
    return Object.entries(row).reduce((acc, [key, value]) => {
        const normalizedKey = String(key).trim().toLowerCase();
        const canonicalKey = normalizedKey === "party.name"
            ? (sheetName === "party" ? "name" : "party_name")
            : fieldAliases[normalizedKey] || normalizedKey;
        acc[normalizedKey] = typeof value === "string" ? value.trim() : value;
        acc[canonicalKey] = typeof value === "string" ? value.trim() : value;
        return acc;
    }, {});
};

const parseWorkbook = async (buffer) => {
    const isXls = buffer.slice(0, 8).equals(
        Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    );

    const tmpPath = path.join(
        os.tmpdir(),
        `petrol-import-${Date.now()}-${Math.random().toString(16).slice(2)}.${isXls ? "xls" : "xlsx"}`
    );
    const convertedPath = isXls
        ? tmpPath.replace(/\.xls$/i, ".xlsx")
        : tmpPath;

    await fs.writeFile(tmpPath, buffer);

    try {
        if (isXls) {
            await execFileAsync(
                "powershell",
                [
                    "-NoProfile",
                    "-ExecutionPolicy",
                    "Bypass",
                    "-File",
                    xlsConverterPath,
                    tmpPath,
                    convertedPath
                ],
                {
                    maxBuffer: 20 * 1024 * 1024,
                    windowsHide: true
                }
            );
        }

        const { stdout } = await execFileAsync("php", [parserPath, convertedPath], {
            maxBuffer: 20 * 1024 * 1024
        });

        return JSON.parse(stdout);
    } finally {
        await fs.unlink(tmpPath).catch(() => {});
        if (convertedPath !== tmpPath) {
            await fs.unlink(convertedPath).catch(() => {});
        }
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

const preloadNameMaps = async (connection, customerId) => {
    const nameMap = {
        head_master: {},
        product_category: {},
        party: {}
    };

    const [headMasters] = await connection.query(
        `
            SELECT id, name
            FROM head_master
            WHERE cid = ?
            AND deleted_at IS NULL
        `,
        [customerId]
    );

    for (const row of headMasters) {
        nameMap.head_master[normalizeName(row.name)] = row.id;
    }

    const [productCategories] = await connection.query(
        `
            SELECT id, name
            FROM product_category
            WHERE cid = ?
            AND deleted_at IS NULL
        `,
        [customerId]
    );

    for (const row of productCategories) {
        nameMap.product_category[normalizeName(row.name)] = row.id;
    }

    const [parties] = await connection.query(
        `
            SELECT id, name
            FROM party
            WHERE cid = ?
            AND deleted_at IS NULL
        `,
        [customerId]
    );

    for (const row of parties) {
        nameMap.party[normalizeName(row.name)] = row.id;
    }

    return nameMap;
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
        const sheetName = canonicalSheetName(name);
        acc[sheetName] = [
            ...(acc[sheetName] || []),
            ...rows.map((row) => normalizeRow(row, sheetName))
        ];
        return acc;
    }, {});

    const idMap = {};
    const summary = {};
    const connection = await db.getConnection();

    const ctx = {
        customerId: Number(customerId),
        connection,
        nameMap: {
            head_master: {},
            product_category: {},
            party: {}
        },
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
            if (!mapped && idMap[table]) {
                throw new Error(`${label} old id ${oldId} mapping not found`);
            }
            return mapped || oldId;
        },
        mapOptionalId(table, oldId, label) {
            if (!idMap[table]) {
                return oldId;
            }

            return this.mapId(table, oldId, label);
        },
        async resolveOrCreateByName(table, name, extra = {}) {
            const cleanName = String(name || "").trim();
            const key = normalizeName(cleanName);

            if (!cleanName) {
                throw new Error(`${table} name is required for relation mapping`);
            }

            if (this.nameMap[table]?.[key]) {
                return this.nameMap[table][key];
            }

            let result;

            if (table === "head_master") {
                [result] = await this.connection.query(
                    `
                        INSERT INTO head_master (name, cid, head_type)
                        VALUES (?, ?, ?)
                    `,
                    [
                        cleanName,
                        this.customerId,
                        normalizeHeadType(extra.head_type)
                    ]
                );
            } else if (table === "product_category") {
                [result] = await this.connection.query(
                    `
                        INSERT INTO product_category (name, cid, unit)
                        VALUES (?, ?, ?)
                    `,
                    [
                        cleanName,
                        this.customerId,
                        extra.unit || ""
                    ]
                );
            } else if (table === "party") {
                const defaultHeadId = await this.resolveOrCreateByName(
                    "head_master",
                    extra.head_master_name || "SUNDRY DEBTORS",
                    {
                        head_type: extra.head_type || "Balance Sheet"
                    }
                );

                [result] = await this.connection.query(
                    `
                        INSERT INTO party (
                            name,
                            cid,
                            address,
                            phone_no,
                            openbal,
                            sid,
                            sid1,
                            salary
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        cleanName,
                        this.customerId,
                        extra.address || null,
                        extra.phone_no || null,
                        extra.openbal || 0,
                        defaultHeadId,
                        null,
                        null
                    ]
                );
            } else {
                throw new Error(`Unsupported name mapping table ${table}`);
            }

            this.nameMap[table] = this.nameMap[table] || {};
            this.nameMap[table][key] = result.insertId;
            summary[table] = (summary[table] || 0) + 1;

            return result.insertId;
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

        ctx.nameMap = await preloadNameMaps(connection, ctx.customerId);

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
                const values = await config.values(row, ctx);
                const [result] = await connection.query(sql, values);

                if (oldId !== undefined && oldId !== null && oldId !== "") {
                    idMap[config.map][String(oldId)] = result.insertId;
                }

                if (
                    (tableName === "head_master" || tableName === "product_category") &&
                    row.name
                ) {
                    ctx.nameMap[tableName][normalizeName(row.name)] = result.insertId;
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
