const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
        INSERT INTO customer_petrol (
            date,
            ship_no,
            pid,
            sid,
            qty,
            rate,
            amount,
            cid
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.date,
        body.ship_no,
        body.pid,
        body.sid,
        body.qty,
        body.rate,
        body.amount,
        userId
    ]);

    return result;
};

const findAll = async ({
    userId,
    page = 1,
    limit = 10,
    search = "",
    pid = "",
    sid = ""
} = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE cp.deleted_at IS NULL AND cp.cid = ?`;
    const params = [userId];

    if (pid && String(pid).trim() !== "") {
        where += ` AND cp.pid = ?`;
        params.push(pid);
    }

    if (sid && String(sid).trim() !== "") {
        where += ` AND cp.sid = ?`;
        params.push(sid);
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                cp.ship_no LIKE ?
                OR cp.qty LIKE ?
                OR cp.rate LIKE ?
                OR cp.amount LIKE ?
                OR p.name LIKE ?
                OR si.name LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm
        );
    }

    const dataSql = `
        SELECT
            cp.id,
            cp.date,
            cp.ship_no,
            cp.pid,
            cp.sid,
            cp.qty,
            cp.rate,
            cp.amount,
            cp.cid,
            cp.created_at,
            cp.updated_at,
            cp.deleted_at,
            p.name AS party_name,
            si.name AS stock_item_name,
            si.inLtr AS stock_item_in_ltr,
            si.measure_unit AS stock_item_measure_unit
        FROM customer_petrol cp
        LEFT JOIN party p
            ON p.id = cp.pid
            AND p.cid = cp.cid
            AND p.deleted_at IS NULL
        LEFT JOIN stock_item si
            ON si.id = cp.sid
            AND si.cid = cp.cid
            AND si.deleted_at IS NULL
        ${where}
        ORDER BY cp.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM customer_petrol cp
        LEFT JOIN party p
            ON p.id = cp.pid
            AND p.cid = cp.cid
            AND p.deleted_at IS NULL
        LEFT JOIN stock_item si
            ON si.id = cp.sid
            AND si.cid = cp.cid
            AND si.deleted_at IS NULL
        ${where}
    `;

    const [rows] = await db.query(dataSql, [
        ...params,
        limit,
        offset
    ]);
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
            cp.id,
            cp.date,
            cp.ship_no,
            cp.pid,
            cp.sid,
            cp.qty,
            cp.rate,
            cp.amount,
            cp.cid,
            cp.created_at,
            cp.updated_at,
            cp.deleted_at,
            p.name AS party_name,
            si.name AS stock_item_name,
            si.inLtr AS stock_item_in_ltr,
            si.measure_unit AS stock_item_measure_unit
        FROM customer_petrol cp
        LEFT JOIN party p
            ON p.id = cp.pid
            AND p.cid = cp.cid
            AND p.deleted_at IS NULL
        LEFT JOIN stock_item si
            ON si.id = cp.sid
            AND si.cid = cp.cid
            AND si.deleted_at IS NULL
        WHERE cp.id = ?
        AND cp.cid = ?
        AND cp.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE customer_petrol
        SET date = ?,
            ship_no = ?,
            pid = ?,
            sid = ?,
            qty = ?,
            rate = ?,
            amount = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.date,
        body.ship_no,
        body.pid,
        body.sid,
        body.qty,
        body.rate,
        body.amount,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE customer_petrol
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [id, userId]);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
