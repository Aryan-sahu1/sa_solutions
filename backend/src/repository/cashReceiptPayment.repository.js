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
        body.type1,
        body.remarks,
        body.amt,
        userId
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `WHERE tr.deleted_at IS NULL AND tr.cid = ? AND tr.type = 'C'`;
    const params = [userId];

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                party.name LIKE ?
                OR cash_party.name LIKE ?
                OR tr.type1 LIKE ?
                OR tr.remarks LIKE ?
                OR tr.amt LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
            CASE
                WHEN tr.type1 = 'Receipt' THEN party.name
                ELSE payment_party.name
            END AS party_name,
            cash_party.name AS cash_head_name
        FROM tran tr
        LEFT JOIN party party
            ON party.id = tr.crid
            AND party.cid = tr.cid
            AND party.deleted_at IS NULL
        LEFT JOIN party payment_party
            ON payment_party.id = tr.pid
            AND payment_party.cid = tr.cid
            AND payment_party.deleted_at IS NULL
        LEFT JOIN party cash_party
            ON cash_party.id = CASE
                WHEN tr.type1 = 'Receipt' THEN tr.pid
                ELSE tr.crid
            END
            AND cash_party.cid = tr.cid
            AND cash_party.deleted_at IS NULL
        ${where}
        ORDER BY tr.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM tran tr
        LEFT JOIN party party
            ON party.id = tr.crid
            AND party.cid = tr.cid
            AND party.deleted_at IS NULL
        LEFT JOIN party payment_party
            ON payment_party.id = tr.pid
            AND payment_party.cid = tr.cid
            AND payment_party.deleted_at IS NULL
        LEFT JOIN party cash_party
            ON cash_party.id = CASE
                WHEN tr.type1 = 'Receipt' THEN tr.pid
                ELSE tr.crid
            END
            AND cash_party.cid = tr.cid
            AND cash_party.deleted_at IS NULL
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
            CASE
                WHEN tr.type1 = 'Receipt' THEN party.name
                ELSE payment_party.name
            END AS party_name
        FROM tran tr
        LEFT JOIN party party
            ON party.id = tr.crid
            AND party.cid = tr.cid
            AND party.deleted_at IS NULL
        LEFT JOIN party payment_party
            ON payment_party.id = tr.pid
            AND payment_party.cid = tr.cid
            AND payment_party.deleted_at IS NULL
        WHERE tr.id = ?
        AND tr.cid = ?
        AND tr.type = 'C'
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
            type1 = ?,
            remarks = ?,
            amt = ?
        WHERE id = ?
        AND cid = ?
        AND type = 'C'
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        body.type,
        body.type1,
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
        AND type = 'C'
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
