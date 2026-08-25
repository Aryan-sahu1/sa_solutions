const db = require("../../config/db");

const toNumber = (value) => Number(value || 0);

const buildDateFilter = ({ fromDate = "", toDate = "" } = {}) => {
    const where = [];
    const params = [];

    if (fromDate && String(fromDate).trim() !== "") {
        where.push("DATE(tr.date) >= ?");
        params.push(String(fromDate).trim());
    }

    if (toDate && String(toDate).trim() !== "") {
        where.push("DATE(tr.date) <= ?");
        params.push(String(toDate).trim());
    }

    return {
        sql: where.length ? ` AND ${where.join(" AND ")}` : "",
        params
    };
};

const findAll = async ({
    userId,
    fromDate = "",
    toDate = "",
    partyId = "",
    search = "",
    includeZero = false
} = {}) => {
    const periodFilter = buildDateFilter({ fromDate, toDate });
    const openingFilter = fromDate && String(fromDate).trim() !== ""
        ? " AND DATE(tr.date) < ?"
        : "";

    const openingParams = fromDate && String(fromDate).trim() !== ""
        ? [String(fromDate).trim()]
        : [];

    let partyWhere = "WHERE p.deleted_at IS NULL AND p.cid = ?";
    const partyParams = [userId];

    if (partyId && String(partyId).trim() !== "") {
        partyWhere += " AND p.id = ?";
        partyParams.push(Number(partyId));
    }

    if (search && String(search).trim() !== "") {
        partyWhere += " AND p.name LIKE ?";
        partyParams.push(`%${String(search).trim()}%`);
    }

    const sql = `
        SELECT
            p.id AS party_id,
            p.name AS party_name,
            p.phone_no,
            p.openbal AS party_opening_balance,
            hm.name AS head_master_name,
            hm.head_type AS head_master_type,
            COALESCE(opening_movement.opening_debit, 0) AS opening_debit,
            COALESCE(opening_movement.opening_credit, 0) AS opening_credit,
            COALESCE(period_movement.period_debit, 0) AS period_debit,
            COALESCE(period_movement.period_credit, 0) AS period_credit
        FROM party p
        LEFT JOIN head_master hm
            ON hm.id = p.sid
            AND hm.cid = p.cid
            AND hm.deleted_at IS NULL
        LEFT JOIN (
            SELECT
                party_id,
                SUM(debit_amount) AS opening_debit,
                SUM(credit_amount) AS opening_credit
            FROM (
                SELECT
                    tr.pid AS party_id,
                    SUM(COALESCE(tr.amt, 0)) AS debit_amount,
                    0 AS credit_amount
                FROM tran tr
                WHERE tr.deleted_at IS NULL
                AND tr.cid = ?
                ${openingFilter}
                GROUP BY tr.pid

                UNION ALL

                SELECT
                    tr.crid AS party_id,
                    0 AS debit_amount,
                    SUM(COALESCE(tr.amt, 0)) AS credit_amount
                FROM tran tr
                WHERE tr.deleted_at IS NULL
                AND tr.cid = ?
                ${openingFilter}
                GROUP BY tr.crid
            ) opening_entries
            WHERE party_id IS NOT NULL
            GROUP BY party_id
        ) opening_movement
            ON opening_movement.party_id = p.id
        LEFT JOIN (
            SELECT
                party_id,
                SUM(debit_amount) AS period_debit,
                SUM(credit_amount) AS period_credit
            FROM (
                SELECT
                    tr.pid AS party_id,
                    SUM(COALESCE(tr.amt, 0)) AS debit_amount,
                    0 AS credit_amount
                FROM tran tr
                WHERE tr.deleted_at IS NULL
                AND tr.cid = ?
                ${periodFilter.sql}
                GROUP BY tr.pid

                UNION ALL

                SELECT
                    tr.crid AS party_id,
                    0 AS debit_amount,
                    SUM(COALESCE(tr.amt, 0)) AS credit_amount
                FROM tran tr
                WHERE tr.deleted_at IS NULL
                AND tr.cid = ?
                ${periodFilter.sql}
                GROUP BY tr.crid
            ) period_entries
            WHERE party_id IS NOT NULL
            GROUP BY party_id
        ) period_movement
            ON period_movement.party_id = p.id
        ${partyWhere}
        ORDER BY p.name ASC
    `;

    const params = [
        userId,
        ...openingParams,
        userId,
        ...openingParams,
        userId,
        ...periodFilter.params,
        userId,
        ...periodFilter.params,
        ...partyParams
    ];

    const [rows] = await db.query(sql, params);

    const data = rows
        .map((row) => {
            const openingBalance =
                toNumber(row.party_opening_balance) +
                toNumber(row.opening_debit) -
                toNumber(row.opening_credit);
            const debitTotal = toNumber(row.period_debit);
            const creditTotal = toNumber(row.period_credit);
            const closingBalance = openingBalance + debitTotal - creditTotal;

            return {
                party_id: row.party_id,
                party_name: row.party_name,
                phone_no: row.phone_no,
                head_master_name: row.head_master_name,
                head_master_type: row.head_master_type,
                opening_balance: openingBalance,
                debit_total: debitTotal,
                credit_total: creditTotal,
                closing_balance: closingBalance,
                trial_debit: closingBalance > 0 ? closingBalance : 0,
                trial_credit: closingBalance < 0 ? Math.abs(closingBalance) : 0
            };
        })
        .filter((row) => (
            includeZero ||
            row.opening_balance !== 0 ||
            row.debit_total !== 0 ||
            row.credit_total !== 0 ||
            row.closing_balance !== 0
        ));

    const totals = data.reduce(
        (acc, row) => ({
            opening_balance: acc.opening_balance + row.opening_balance,
            debit_total: acc.debit_total + row.debit_total,
            credit_total: acc.credit_total + row.credit_total,
            closing_balance: acc.closing_balance + row.closing_balance,
            trial_debit: acc.trial_debit + row.trial_debit,
            trial_credit: acc.trial_credit + row.trial_credit
        }),
        {
            opening_balance: 0,
            debit_total: 0,
            credit_total: 0,
            closing_balance: 0,
            trial_debit: 0,
            trial_credit: 0
        }
    );

    return {
        data,
        totals
    };
};

module.exports = {
    findAll
};
