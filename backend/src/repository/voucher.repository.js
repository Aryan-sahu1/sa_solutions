const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
        INSERT INTO tran (
            pid,
            crid,
            date,
            type,
            type1,
            remarks,
            amt,
            cid
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        body.type,
        null,
        body.remarks,
        body.amt,
        userId
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "", date = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `WHERE tr.deleted_at IS NULL AND tr.cid = ? AND tr.type = 'O'`;
    const params = [userId];

    if (date && String(date).trim() !== "") {
        where += ` AND DATE(tr.date) = ?`;
        params.push(String(date).trim());
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                debit_party.name LIKE ?
                OR credit_party.name LIKE ?
                OR tr.remarks LIKE ?
                OR tr.amt LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const dataSql = `
        SELECT
            tr.id,
            tr.pid,
            tr.crid,
            tr.date,
            tr.type,
            tr.type1,
            tr.remarks,
            tr.amt,
            tr.cid,
            tr.created_at,
            tr.updated_at,
            tr.deleted_at,
            debit_party.name AS debit_party_name,
            credit_party.name AS credit_party_name
        FROM tran tr
        LEFT JOIN party debit_party
            ON debit_party.id = tr.pid
            AND debit_party.cid = tr.cid
            AND debit_party.deleted_at IS NULL
        LEFT JOIN party credit_party
            ON credit_party.id = tr.crid
            AND credit_party.cid = tr.cid
            AND credit_party.deleted_at IS NULL
        ${where}
        ORDER BY tr.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM tran tr
        LEFT JOIN party debit_party
            ON debit_party.id = tr.pid
            AND debit_party.cid = tr.cid
            AND debit_party.deleted_at IS NULL
        LEFT JOIN party credit_party
            ON credit_party.id = tr.crid
            AND credit_party.cid = tr.cid
            AND credit_party.deleted_at IS NULL
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
            tr.id,
            tr.pid,
            tr.crid,
            tr.date,
            tr.type,
            tr.type1,
            tr.remarks,
            tr.amt,
            tr.cid,
            tr.created_at,
            tr.updated_at,
            tr.deleted_at,
            debit_party.name AS debit_party_name,
            credit_party.name AS credit_party_name
        FROM tran tr
        LEFT JOIN party debit_party
            ON debit_party.id = tr.pid
            AND debit_party.cid = tr.cid
            AND debit_party.deleted_at IS NULL
        LEFT JOIN party credit_party
            ON credit_party.id = tr.crid
            AND credit_party.cid = tr.cid
            AND credit_party.deleted_at IS NULL
        WHERE tr.id = ?
        AND tr.cid = ?
        AND tr.type = 'O'
        AND tr.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE tran
        SET pid = ?,
            crid = ?,
            date = ?,
            type = ?,
            type1 = NULL,
            remarks = ?,
            amt = ?
        WHERE id = ?
        AND cid = ?
        AND type = 'O'
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        body.type,
        body.remarks,
        body.amt,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE tran
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND cid = ?
        AND type = 'O'
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
