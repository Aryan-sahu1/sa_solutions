const db = require("../../config/db");

const toNumber = (value) => Number(value || 0);

const findOpeningBalance = async ({ userId, partyId, fromDate }) => {
    const [rows] = await db.query(
        `
            SELECT
                p.id AS party_id,
                p.name AS party_name,
                p.phone_no,
                p.address,
                p.openbal,
                COALESCE(SUM(
                    CASE
                        WHEN tr.pid = p.id THEN COALESCE(tr.amt, 0)
                        ELSE 0
                    END
                ), 0) AS opening_debit,
                COALESCE(SUM(
                    CASE
                        WHEN tr.crid = p.id THEN COALESCE(tr.amt, 0)
                        ELSE 0
                    END
                ), 0) AS opening_credit
            FROM party p
            LEFT JOIN tran tr
                ON tr.cid = p.cid
                AND tr.deleted_at IS NULL
                AND DATE(tr.date) < ?
                AND (tr.pid = p.id OR tr.crid = p.id)
            WHERE p.deleted_at IS NULL
            AND p.cid = ?
            AND p.id = ?
            GROUP BY p.id
            LIMIT 1
        `,
        [fromDate, userId, partyId]
    );

    const party = rows[0] || null;

    if (!party) {
        return null;
    }

    const openingBalance =
        toNumber(party.openbal) +
        toNumber(party.opening_debit) -
        toNumber(party.opening_credit);

    return {
        party_id: party.party_id,
        party_name: party.party_name,
        phone_no: party.phone_no,
        address: party.address,
        opening_balance: openingBalance
    };
};

const findTransactions = async ({ userId, partyId, fromDate, toDate }) => {
    const [rows] = await db.query(
        `
            SELECT
                tr.id,
                tr.date,
                tr.type,
                tr.type1,
                tr.remarks,
                tr.amt,
                tr.pid,
                tr.crid,
                tr.slip_no,
                tr.vehicle_no,
                td.id AS detail_id,
                td.product_id,
                td.iid,
                td.qty,
                td.rate,
                td.amt AS detail_amt,
                pc.name AS product_name,
                si.name AS item_name,
                vm.name AS vehicle_name,
                debit_party.name AS debit_party_name,
                credit_party.name AS credit_party_name
            FROM tran tr
            LEFT JOIN trande td
                ON td.sid = tr.id
                AND td.deleted_at IS NULL
            LEFT JOIN product_category pc
                ON pc.id = td.product_id
                AND pc.cid = tr.cid
                AND pc.deleted_at IS NULL
            LEFT JOIN stock_item si
                ON si.id = td.iid
                AND si.cid = tr.cid
                AND si.deleted_at IS NULL
            LEFT JOIN vehicle_master vm
                ON vm.id = tr.vehicle_no
                AND vm.cid = tr.cid
                AND vm.deleted_at IS NULL
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
            AND DATE(tr.date) >= ?
            AND DATE(tr.date) <= ?
            AND (tr.pid = ? OR tr.crid = ?)
            ORDER BY tr.date ASC, tr.id ASC, td.id ASC
        `,
        [userId, fromDate, toDate, partyId, partyId]
    );

    return rows;
};

const findAll = async ({ userId, partyId, fromDate, toDate }) => {
    const opening = await findOpeningBalance({
        userId,
        partyId,
        fromDate
    });

    if (!opening) {
        return null;
    }

    const transactions = await findTransactions({
        userId,
        partyId,
        fromDate,
        toDate
    });

    let runningBalance = opening.opening_balance;

    const data = transactions.map((transaction) => {
        const isDebit = Number(transaction.pid) === Number(partyId);
        const amount = transaction.detail_id
            ? toNumber(transaction.detail_amt)
            : toNumber(transaction.amt);
        const debit = isDebit ? amount : 0;
        const credit = isDebit ? 0 : amount;

        runningBalance = runningBalance + debit - credit;

        return {
            id: transaction.id,
            date: transaction.date,
            type: transaction.type,
            type1: transaction.type1,
            slip_no: transaction.slip_no,
            vehicle_no: transaction.vehicle_no,
            vehicle_name: transaction.vehicle_name,
            item: transaction.product_name || transaction.item_name,
            qty: transaction.qty,
            rate: transaction.rate,
            remarks: transaction.remarks,
            particular: isDebit
                ? transaction.credit_party_name
                : transaction.debit_party_name,
            debit,
            credit,
            balance: runningBalance,
            balance_type: runningBalance >= 0 ? "Dr" : "Cr"
        };
    });

    const totals = data.reduce(
        (acc, row) => ({
            debit: acc.debit + row.debit,
            credit: acc.credit + row.credit
        }),
        { debit: 0, credit: 0 }
    );

    return {
        party: {
            id: opening.party_id,
            name: opening.party_name,
            phone_no: opening.phone_no,
            address: opening.address
        },
        opening_balance: opening.opening_balance,
        closing_balance: runningBalance,
        data,
        totals
    };
};

module.exports = {
    findAll
};
