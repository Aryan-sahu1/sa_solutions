const db = require("../config/db");

const findNextBillNo = async (userId) => {
    const sql = `
        SELECT MAX(CAST(billno AS UNSIGNED)) AS max_bill_no
        FROM bill
        WHERE cid = ?
        AND deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [userId]);
    const nextNumber = Number(rows[0]?.max_bill_no || 0) + 1;

    return String(nextNumber).padStart(3, "0");
};

const findSalesTotal = async ({ userId, party, sdate, edate, vehicleno = "" }) => {
    const params = [userId, party, sdate, edate];
    let vehicleWhere = "";

    if (vehicleno) {
        vehicleWhere = "AND tr.vehicle_no = ?";
        params.push(vehicleno);
    }

    const sql = `
        SELECT COALESCE(SUM(CAST(tr.amt AS DECIMAL(15,2))), 0) AS total_amount
        FROM tran tr
        WHERE tr.deleted_at IS NULL
        AND tr.cid = ?
        AND tr.type = 'S'
        AND tr.pid = ?
        AND DATE(tr.date) BETWEEN ? AND ? AND type='S'
        ${vehicleWhere}
    `;

    const [rows] = await db.query(sql, params);

    return rows[0]?.total_amount || 0;
};

const create = async (body, userId) => {
    const sql = `
        INSERT INTO bill (
            sdate,
            edate,
            date,
            billno,
            vehicleno,
            party,
            remarks,
            amt,
            type,
            tcs,
            cid
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.sdate,
        body.edate,
        body.date,
        body.billno,
        body.vehicleno,
        body.party,
        body.remarks,
        body.amt,
        body.type,
        body.tcs || 0,
        userId
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `WHERE b.deleted_at IS NULL AND b.cid = ?`;
    const params = [userId];

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                b.billno LIKE ?
                OR p.name LIKE ?
                OR vm.name LIKE ?
                OR b.amt LIKE ?
                OR b.type LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const dataSql = `
        SELECT
            b.id,
            b.sdate,
            b.edate,
            b.date,
            b.billno,
            b.vehicleno,
            b.party,
            b.remarks,
            b.amt,
            b.type,
            b.tcs,
            b.cid,
            b.created_at,
            b.updated_at,
            b.deleted_at,
            p.name AS party_name,
            vm.name AS vehicle_name
        FROM bill b
        LEFT JOIN party p
            ON p.id = b.party
            AND p.cid = b.cid
            AND p.deleted_at IS NULL
        LEFT JOIN vehicle_master vm
            ON vm.id = b.vehicleno
            AND vm.cid = b.cid
            AND vm.deleted_at IS NULL
        ${where}
        ORDER BY b.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM bill b
        LEFT JOIN party p
            ON p.id = b.party
            AND p.cid = b.cid
            AND p.deleted_at IS NULL
        LEFT JOIN vehicle_master vm
            ON vm.id = b.vehicleno
            AND vm.cid = b.cid
            AND vm.deleted_at IS NULL
        ${where}
    `;

    const [rows] = await db.query(dataSql, [...params, limit, offset]);
    const [countRows] = await db.query(countSql, params);

    const total = countRows[0].total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
        data: rows,
        pagination: {
            currentPage: page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
};

const findById = async (id, userId) => {
    const sql = `
        SELECT
            b.id,
            b.sdate,
            b.edate,
            b.date,
            b.billno,
            b.vehicleno,
            b.party,
            b.remarks,
            b.amt,
            b.type,
            b.tcs,
            b.cid,
            b.created_at,
            b.updated_at,
            b.deleted_at,
            p.name AS party_name,
            vm.name AS vehicle_name
        FROM bill b
        LEFT JOIN party p
            ON p.id = b.party
            AND p.cid = b.cid
            AND p.deleted_at IS NULL
        LEFT JOIN vehicle_master vm
            ON vm.id = b.vehicleno
            AND vm.cid = b.cid
            AND vm.deleted_at IS NULL
        WHERE b.id = ?
        AND b.cid = ?
        AND b.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const findAnnexureByBillId = async (id, userId) => {
    const bill = await findById(id, userId);

    if (!bill) {
        return null;
    }

    const sql = `
        SELECT
            tr.id AS tran_id,
            tr.slip_no,
            tr.date,
            tr.vehicle_no,
            vm.name AS vehicle_name,
            td.id AS detail_id,
            td.qty,
            td.rate,
            td.amt,
            pc.name AS product_name,
            pc.unit AS product_unit
        FROM tran tr
        INNER JOIN trande td
            ON td.sid = tr.id
            AND td.deleted_at IS NULL
        LEFT JOIN vehicle_master vm
            ON vm.id = tr.vehicle_no
            AND vm.cid = tr.cid
            AND vm.deleted_at IS NULL
        LEFT JOIN product_category pc
            ON pc.id = td.product_id
            AND pc.cid = tr.cid
            AND pc.deleted_at IS NULL
        WHERE tr.deleted_at IS NULL
        AND tr.cid = ?
        AND tr.type = 'S'
        AND tr.pid = ?
        AND tr.vehicle_no = ?
        AND DATE(tr.date) BETWEEN DATE(?) AND DATE(?)
        ORDER BY DATE(tr.date), CAST(tr.slip_no AS UNSIGNED), tr.slip_no, td.id
    `;

    const [rows] = await db.query(sql, [
        userId,
        bill.party,
        bill.vehicleno,
        bill.sdate,
        bill.edate
    ]);

    return {
        bill,
        rows,
        total: rows.reduce((sum, row) => sum + Number(row.amt || 0), 0)
    };
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE bill
        SET sdate = ?,
            edate = ?,
            date = ?,
            billno = ?,
            vehicleno = ?,
            party = ?,
            remarks = ?,
            amt = ?,
            type = ?,
            tcs = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.sdate,
        body.edate,
        body.date,
        body.billno,
        body.vehicleno,
        body.party,
        body.remarks,
        body.amt,
        body.type,
        body.tcs || 0,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE bill
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [id, userId]);

    return result;
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
