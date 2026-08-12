const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
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
    `;

    const [result] = await db.query(sql, [
        body.name || null,
        userId,
        body.address || null,
        body.phone_no || null,
        body.openbal,
        body.sid,
        body.sid1 || null,
        body.salary || null
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "" } = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE p.deleted_at IS NULL AND p.cid = ?`;
    const params = [userId];

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                p.name LIKE ?
                OR p.address LIKE ?
                OR p.phone_no LIKE ?
                OR p.openbal LIKE ?
                OR p.salary LIKE ?
                OR hm.name LIKE ?
                OR thm.name LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(
            searchTerm,
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
            p.id,
            p.name,
            p.cid,
            p.address,
            p.phone_no,
            p.openbal,
            p.sid,
            p.sid1,
            p.salary,
            p.created_at,
            p.updated_at,
            p.deleted_at,
            hm.name AS head_master_name,
            hm.head_type AS head_master_type,
            thm.name AS t_head_master_name
        FROM party p
        LEFT JOIN head_master hm
            ON hm.id = p.sid
            AND hm.cid = p.cid
            AND hm.deleted_at IS NULL
        LEFT JOIN t_head_master thm
            ON thm.id = p.sid1
            AND thm.deleted_at IS NULL
        ${where}
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM party p
        LEFT JOIN head_master hm
            ON hm.id = p.sid
            AND hm.cid = p.cid
            AND hm.deleted_at IS NULL
        LEFT JOIN t_head_master thm
            ON thm.id = p.sid1
            AND thm.deleted_at IS NULL
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
            p.id,
            p.name,
            p.cid,
            p.address,
            p.phone_no,
            p.openbal,
            p.sid,
            p.sid1,
            p.salary,
            p.created_at,
            p.updated_at,
            p.deleted_at,
            hm.name AS head_master_name,
            hm.head_type AS head_master_type,
            thm.name AS t_head_master_name
        FROM party p
        LEFT JOIN head_master hm
            ON hm.id = p.sid
            AND hm.cid = p.cid
            AND hm.deleted_at IS NULL
        LEFT JOIN t_head_master thm
            ON thm.id = p.sid1
            AND thm.deleted_at IS NULL
        WHERE p.id = ?
        AND p.cid = ?
        AND p.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE party
        SET name = ?,
            address = ?,
            phone_no = ?,
            openbal = ?,
            sid = ?,
            sid1 = ?,
            salary = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name || null,
        body.address || null,
        body.phone_no || null,
        body.openbal,
        body.sid,
        body.sid1 || null,
        body.salary || null,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE party
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
