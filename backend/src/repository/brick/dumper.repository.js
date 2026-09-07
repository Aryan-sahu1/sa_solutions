const db = require("../../config/db");

const DUMPER_TYPE = "D";

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
            \`round\`,
            rate
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.pid,
        body.crid,
        body.date,
        DUMPER_TYPE,
        null,
        body.remarks || null,
        body.amt,
        userId,
        body.round,
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
    const params = [userId, DUMPER_TYPE];

    if (date && String(date).trim() !== "") {
        where += ` AND DATE(tr.date) = ?`;
        params.push(String(date).trim());
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                tr.remarks LIKE ?
                OR tr.amt LIKE ?
                OR tr.\`round\` LIKE ?
                OR tr.rate LIKE ?
                OR selected_party.name LIKE ?
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
            tr.\`round\` AS round,
            tr.rate,
            tr.created_at,
            tr.updated_at,
            tr.deleted_at,
            dumper_party.name AS dumper_account_name,
            selected_party.name AS party_name
        FROM tran tr
        LEFT JOIN party dumper_party
            ON dumper_party.id = tr.pid
            AND dumper_party.cid = tr.cid
            AND dumper_party.deleted_at IS NULL
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
                tr.\`round\` AS round,
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
        [id, userId, DUMPER_TYPE]
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
            \`round\` = ?,
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
        body.round,
        body.rate,
        id,
        userId,
        DUMPER_TYPE
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

    const [result] = await db.query(sql, [id, userId, DUMPER_TYPE]);

    return result;
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
