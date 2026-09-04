const db = require("../../config/db");

const JCB_TYPE = "J";

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
            cid,
            start_time,
            end_time,
            total_time,
            rate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        JCB_TYPE,
        null,
        body.remarks || null,
        body.amt,
        userId,
        body.start_time,
        body.end_time,
        body.total_time,
        body.rate
    ]);

    return { id: result.insertId };
};

const findAll = async ({ userId, page = 1, limit = 10, search = "", date = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `
        WHERE tr.deleted_at IS NULL
        AND tr.cid = ?
        AND tr.type = ?
        AND tr.type1 IS NULL
    `;
    const params = [userId, JCB_TYPE];

    if (date && String(date).trim() !== "") {
        where += ` AND DATE(tr.date) = ?`;
        params.push(String(date).trim());
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                tr.remarks LIKE ?
                OR tr.amt LIKE ?
                OR tr.start_time LIKE ?
                OR tr.end_time LIKE ?
                OR tr.total_time LIKE ?
                OR tr.rate LIKE ?
                OR selected_party.name LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
            tr.start_time,
            tr.end_time,
            tr.total_time,
            tr.rate,
            tr.created_at,
            tr.updated_at,
            tr.deleted_at,
            jcb_party.name AS jcb_account_name,
            selected_party.name AS party_name
        FROM tran tr
        LEFT JOIN party jcb_party
            ON jcb_party.id = tr.pid
            AND jcb_party.cid = tr.cid
            AND jcb_party.deleted_at IS NULL
        LEFT JOIN party selected_party
            ON selected_party.id = tr.crid
            AND selected_party.cid = tr.cid
            AND selected_party.deleted_at IS NULL
        ${where}
        ORDER BY tr.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM tran tr
        LEFT JOIN party selected_party
            ON selected_party.id = tr.crid
            AND selected_party.cid = tr.cid
            AND selected_party.deleted_at IS NULL
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
    const [rows] = await db.query(
        `
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
                tr.start_time,
                tr.end_time,
                tr.total_time,
                tr.rate,
                selected_party.name AS party_name
            FROM tran tr
            LEFT JOIN party selected_party
                ON selected_party.id = tr.crid
                AND selected_party.cid = tr.cid
                AND selected_party.deleted_at IS NULL
            WHERE tr.id = ?
            AND tr.cid = ?
            AND tr.type = ?
            AND tr.type1 IS NULL
            AND tr.deleted_at IS NULL
            LIMIT 1
        `,
        [id, userId, JCB_TYPE]
    );

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE tran
        SET pid = ?,
            crid = ?,
            date = ?,
            remarks = ?,
            amt = ?,
            start_time = ?,
            end_time = ?,
            total_time = ?,
            rate = ?
        WHERE id = ?
        AND cid = ?
        AND type = ?
        AND type1 IS NULL
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        body.remarks || null,
        body.amt,
        body.start_time,
        body.end_time,
        body.total_time,
        body.rate,
        id,
        userId,
        JCB_TYPE
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE tran
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND cid = ?
        AND type = ?
        AND type1 IS NULL
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [id, userId, JCB_TYPE]);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
