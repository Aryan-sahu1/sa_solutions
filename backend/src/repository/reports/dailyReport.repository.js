const db = require("../../config/db");

const toNumber = (value) => Number(value || 0);

const findPumpwiseBreakup = async ({ userId, date }) => {
    const [rows] = await db.query(
        `
            SELECT
                m.id,
                m.shift,
                md.pid AS product_id,
                pc.name AS product_name,
                md.iid AS nozel_id,
                n.name AS pump_name,
                n.snno AS pump_serial_no,
                md.opening,
                md.closing,
                md.testing,
                md.sale,
                CASE
                    WHEN LOWER(pc.name) LIKE '%speed%' THEN m.speedp
                    WHEN LOWER(pc.name) LIKE '%hsd%' THEN m.hsdp
                    WHEN LOWER(pc.name) LIKE '%diesel%' THEN m.hsdp
                    WHEN LOWER(pc.name) LIKE '%urea%' THEN m.ureap
                    WHEN LOWER(pc.name) LIKE '%cng%' THEN m.cngp
                    WHEN LOWER(pc.name) LIKE '%ms%' THEN m.msp
                    WHEN LOWER(pc.name) LIKE '%petrol%' THEN m.msp
                    ELSE 0
                END AS rate
            FROM meter m
            INNER JOIN meterde md
                ON md.sid = m.id
                AND md.cid = m.cid
            LEFT JOIN product_category pc
                ON pc.id = md.pid
                AND pc.cid = m.cid
                AND pc.deleted_at IS NULL
            LEFT JOIN nozel n
                ON n.id = md.iid
                AND n.cid = m.cid
                AND n.deleted_at IS NULL
            WHERE m.cid = ?
            AND DATE(m.date) = ?
            ORDER BY pc.name ASC, n.snno ASC, n.name ASC, md.id ASC
        `,
        [userId, date]
    );

    const totalsByProduct = rows.reduce((acc, row) => {
        const key = row.product_id || row.product_name || "unknown";
        acc[key] = acc[key] || {
            product_id: row.product_id,
            product_name: row.product_name || "Other",
            sale: 0,
            testing: 0,
            amount: 0
        };
        acc[key].sale += toNumber(row.sale);
        acc[key].testing += toNumber(row.testing);
        acc[key].amount += toNumber(row.sale) * toNumber(row.rate);
        return acc;
    }, {});

    return {
        rows,
        totalsByProduct: Object.values(totalsByProduct).map((row) => ({
            ...row,
            qty: row.sale,
            rate: row.sale ? row.amount / row.sale : 0
        }))
    };
};

const findSalesSummary = async ({ userId, date }) => {
    const [productRows] = await db.query(
        `
            SELECT
                td.product_id,
                pc.name AS product_name,
                pc.unit AS product_unit,
                SUM(COALESCE(td.qty, 0)) AS qty,
                CASE
                    WHEN SUM(COALESCE(td.qty, 0)) = 0 THEN 0
                    ELSE SUM(COALESCE(td.amt, 0)) / SUM(COALESCE(td.qty, 0))
                END AS rate,
                SUM(COALESCE(td.amt, 0)) AS amount
            FROM tran tr
            INNER JOIN trande td
                ON td.sid = tr.id
                AND td.deleted_at IS NULL
            LEFT JOIN product_category pc
                ON pc.id = td.product_id
                AND pc.cid = tr.cid
                AND pc.deleted_at IS NULL
            WHERE tr.deleted_at IS NULL
            AND tr.cid = ?
            AND tr.type = 'S'
            AND DATE(tr.date) = ?
            GROUP BY td.product_id, pc.name, pc.unit
            ORDER BY pc.name ASC
        `,
        [userId, date]
    );

    const [partyRows] = await db.query(
        `
            SELECT
                tr.id,
                tr.slip_no,
                tr.vehicle_no,
                p.name AS party_name,
                vm.name AS vehicle_name,
                GROUP_CONCAT(DISTINCT pc.name ORDER BY pc.name SEPARATOR ', ') AS item_name,
                SUM(COALESCE(td.qty, 0)) AS qty,
                COALESCE(tr.amt, SUM(COALESCE(td.amt, 0))) AS amount
            FROM tran tr
            LEFT JOIN party p
                ON p.id = tr.pid
                AND p.cid = tr.cid
                AND p.deleted_at IS NULL
            LEFT JOIN vehicle_master vm
                ON vm.id = tr.vehicle_no
                AND vm.cid = tr.cid
                AND vm.deleted_at IS NULL
            LEFT JOIN trande td
                ON td.sid = tr.id
                AND td.deleted_at IS NULL
            LEFT JOIN product_category pc
                ON pc.id = td.product_id
                AND pc.cid = tr.cid
                AND pc.deleted_at IS NULL
            WHERE tr.deleted_at IS NULL
            AND tr.cid = ?
            AND tr.type = 'S'
            AND DATE(tr.date) = ?
            GROUP BY
                tr.id,
                tr.slip_no,
                tr.vehicle_no,
                p.name,
                vm.name,
                tr.amt
            ORDER BY tr.id ASC
        `,
        [userId, date]
    );

    return {
        products: productRows,
        parties: partyRows,
        totalAmount: productRows.reduce((total, row) => total + toNumber(row.amount), 0),
        totalQty: productRows.reduce((total, row) => total + toNumber(row.qty), 0)
    };
};

const findPurchaseSummary = async ({ userId, date }) => {
    const [rows] = await db.query(
        `
            SELECT
                td.product_id,
                pc.name AS product_name,
                SUM(COALESCE(td.qty, 0)) AS qty,
                SUM(COALESCE(td.amt, 0)) AS amount
            FROM tran tr
            INNER JOIN trande td
                ON td.sid = tr.id
                AND td.deleted_at IS NULL
            LEFT JOIN product_category pc
                ON pc.id = td.product_id
                AND pc.cid = tr.cid
                AND pc.deleted_at IS NULL
            WHERE tr.deleted_at IS NULL
            AND tr.cid = ?
            AND tr.type = 'P'
            AND DATE(tr.date) = ?
            GROUP BY td.product_id, pc.name
            ORDER BY pc.name ASC
        `,
        [userId, date]
    );

    return rows;
};

const findCashEntries = async ({ userId, date }) => {
    const [rows] = await db.query(
        `
            SELECT
                tr.id,
                tr.type1,
                tr.remarks,
                COALESCE(tr.amt, 0) AS amount,
                debit_party.name AS debit_party,
                credit_party.name AS credit_party
            FROM tran tr
            LEFT JOIN party debit_party
                ON debit_party.id = tr.pid
                AND debit_party.cid = tr.cid
                AND debit_party.deleted_at IS NULL
            LEFT JOIN party credit_party
                ON credit_party.id = tr.crid
                AND credit_party.cid = tr.cid
                AND credit_party.deleted_at IS NULL
            WHERE tr.deleted_at IS NULL
            AND tr.cid = ?
            AND tr.type = 'C'
            AND DATE(tr.date) = ?
            ORDER BY tr.id ASC
        `,
        [userId, date]
    );

    return {
        rows,
        receiptTotal: rows
            .filter((row) => row.type1 === "Receipt")
            .reduce((total, row) => total + toNumber(row.amount), 0),
        paymentTotal: rows
            .filter((row) => row.type1 === "Payment")
            .reduce((total, row) => total + toNumber(row.amount), 0)
    };
};

const findLeakSummary = async ({ userId, date }) => {
    const [rows] = await db.query(
        `
            SELECT
                si.pid AS product_id,
                pc.name AS product_name,
                si.name AS item_name,
                SUM(COALESCE(l.qty, 0)) AS qty
            FROM leak1 l
            LEFT JOIN stock_item si
                ON si.id = l.iid
                AND si.cid = l.cid
                AND si.deleted_at IS NULL
            LEFT JOIN product_category pc
                ON pc.id = si.pid
                AND pc.cid = l.cid
                AND pc.deleted_at IS NULL
            WHERE l.deleted_at IS NULL
            AND l.cid = ?
            AND DATE(l.date) = ?
            GROUP BY si.pid, pc.name, si.name
            ORDER BY pc.name ASC, si.name ASC
        `,
        [userId, date]
    );

    return rows;
};

const findStockReport = async ({ userId, date }) => {
    const [rows] = await db.query(
        `
            SELECT
                pc.id AS product_id,
                pc.name AS product_name,
                pc.unit AS product_unit,
                COALESCE(SUM(si.o_quantity), 0)
                    + COALESCE(prev_purchase.qty, 0)
                    - COALESCE(prev_sales.qty, 0)
                    - COALESCE(prev_leak.qty, 0) AS opening_stock,
                COALESCE(today_purchase.qty, 0) AS purchase,
                COALESCE(today_sales.qty, 0) AS sales,
                COALESCE(today_testing.qty, 0) AS testing,
                COALESCE(today_leak.qty, 0) AS leak_qty,
                COALESCE(today_sales.amount, 0) AS sales_amount
            FROM product_category pc
            LEFT JOIN stock_item si
                ON si.pid = pc.id
                AND si.cid = pc.cid
                AND si.deleted_at IS NULL
            LEFT JOIN (
                SELECT td.product_id, SUM(COALESCE(td.qty, 0)) AS qty
                FROM tran tr
                INNER JOIN trande td ON td.sid = tr.id AND td.deleted_at IS NULL
                WHERE tr.deleted_at IS NULL AND tr.cid = ? AND tr.type = 'P' AND DATE(tr.date) < ?
                GROUP BY td.product_id
            ) prev_purchase ON prev_purchase.product_id = pc.id
            LEFT JOIN (
                SELECT md.pid AS product_id, SUM(COALESCE(md.sale, 0)) AS qty
                FROM meter m
                INNER JOIN meterde md ON md.sid = m.id AND md.cid = m.cid
                WHERE m.cid = ? AND DATE(m.date) < ?
                GROUP BY md.pid
            ) prev_sales ON prev_sales.product_id = pc.id
            LEFT JOIN (
                SELECT si.pid AS product_id, SUM(COALESCE(l.qty, 0)) AS qty
                FROM leak1 l
                LEFT JOIN stock_item si ON si.id = l.iid AND si.cid = l.cid AND si.deleted_at IS NULL
                WHERE l.deleted_at IS NULL AND l.cid = ? AND DATE(l.date) < ?
                GROUP BY si.pid
            ) prev_leak ON prev_leak.product_id = pc.id
            LEFT JOIN (
                SELECT td.product_id, SUM(COALESCE(td.qty, 0)) AS qty
                FROM tran tr
                INNER JOIN trande td ON td.sid = tr.id AND td.deleted_at IS NULL
                WHERE tr.deleted_at IS NULL AND tr.cid = ? AND tr.type = 'P' AND DATE(tr.date) = ?
                GROUP BY td.product_id
            ) today_purchase ON today_purchase.product_id = pc.id
            LEFT JOIN (
                SELECT
                    md.pid AS product_id,
                    SUM(COALESCE(md.sale, 0)) AS qty,
                    SUM(
                        COALESCE(md.sale, 0) *
                        CASE
                            WHEN LOWER(pc2.name) LIKE '%speed%' THEN m.speedp
                            WHEN LOWER(pc2.name) LIKE '%hsd%' THEN m.hsdp
                            WHEN LOWER(pc2.name) LIKE '%diesel%' THEN m.hsdp
                            WHEN LOWER(pc2.name) LIKE '%urea%' THEN m.ureap
                            WHEN LOWER(pc2.name) LIKE '%cng%' THEN m.cngp
                            WHEN LOWER(pc2.name) LIKE '%ms%' THEN m.msp
                            WHEN LOWER(pc2.name) LIKE '%petrol%' THEN m.msp
                            ELSE 0
                        END
                    ) AS amount
                FROM meter m
                INNER JOIN meterde md ON md.sid = m.id AND md.cid = m.cid
                LEFT JOIN product_category pc2
                    ON pc2.id = md.pid
                    AND pc2.cid = m.cid
                    AND pc2.deleted_at IS NULL
                WHERE m.cid = ? AND DATE(m.date) = ?
                GROUP BY md.pid
            ) today_sales ON today_sales.product_id = pc.id
            LEFT JOIN (
                SELECT md.pid AS product_id, SUM(COALESCE(md.testing, 0)) AS qty
                FROM meter m
                INNER JOIN meterde md ON md.sid = m.id AND md.cid = m.cid
                WHERE m.cid = ? AND DATE(m.date) = ?
                GROUP BY md.pid
            ) today_testing ON today_testing.product_id = pc.id
            LEFT JOIN (
                SELECT si.pid AS product_id, SUM(COALESCE(l.qty, 0)) AS qty
                FROM leak1 l
                LEFT JOIN stock_item si ON si.id = l.iid AND si.cid = l.cid AND si.deleted_at IS NULL
                WHERE l.deleted_at IS NULL AND l.cid = ? AND DATE(l.date) = ?
                GROUP BY si.pid
            ) today_leak ON today_leak.product_id = pc.id
            WHERE pc.deleted_at IS NULL
            AND pc.cid = ?
            GROUP BY
                pc.id,
                pc.name,
                pc.unit,
                prev_purchase.qty,
                prev_sales.qty,
                prev_leak.qty,
                today_purchase.qty,
                today_sales.qty,
                today_sales.amount,
                today_testing.qty,
                today_leak.qty
            ORDER BY pc.name ASC
        `,
        [
            userId, date,
            userId, date,
            userId, date,
            userId, date,
            userId, date,
            userId, date,
            userId, date,
            userId
        ]
    );

    return rows.map((row) => {
        const stock = toNumber(row.opening_stock) + toNumber(row.purchase) -
            toNumber(row.sales) - toNumber(row.testing) - toNumber(row.leak_qty);

        return {
            ...row,
            stock,
            difference: stock
        };
    });
};

const findAll = async ({ userId, date }) => {
    const [
        pumpwise,
        sales,
        purchase,
        cash,
        leaks,
        stock
    ] = await Promise.all([
        findPumpwiseBreakup({ userId, date }),
        findSalesSummary({ userId, date }),
        findPurchaseSummary({ userId, date }),
        findCashEntries({ userId, date }),
        findLeakSummary({ userId, date }),
        findStockReport({ userId, date })
    ]);

    const meterProducts = pumpwise.totalsByProduct.map((row) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        qty: row.sale,
        rate: row.rate,
        amount: row.amount
    }));
    const meterSalesAmount = meterProducts.reduce(
        (total, row) => total + toNumber(row.amount),
        0
    );

    return {
        date,
        pumpwise,
        sales: {
            ...sales,
            products: meterProducts,
            totalAmount: meterSalesAmount,
            totalQty: meterProducts.reduce((total, row) => total + toNumber(row.qty), 0)
        },
        purchase,
        cash,
        leaks,
        stock,
        totals: {
            meterSale: pumpwise.totalsByProduct.reduce(
                (total, row) => total + toNumber(row.sale),
                0
            ),
            salesAmount: meterSalesAmount,
            purchaseAmount: purchase.reduce(
                (total, row) => total + toNumber(row.amount),
                0
            ),
            receiptAmount: cash.receiptTotal,
            paymentAmount: cash.paymentTotal,
            closingCash: cash.receiptTotal - cash.paymentTotal
        }
    };
};

module.exports = {
    findAll
};
