const db = require("../../config/db");

const selectColumns = `
    sm.id,
    sm.mid,
    sm.name,
    sm.amount,
    sm.cid,
    sm.created_at,
    sm.updated_at,
    sm.deleted_at,
    m.name AS master_name,
    ml.name AS master_list_name,
    ml.pid AS product_id
`;

const create = async (body, userId) => {
    const [result] = await db.query(
        `
            INSERT INTO masterc (
                mid,
                name,
                amount,
                cid
            )
            VALUES (?, ?, ?, ?)
        `,
        [body.mid, body.name, body.amount, userId]
    );

    return { id: result.insertId };
};

const findMasterOptionsByProductId = async (productId) => {
    const [rows] = await db.query(
        `
            SELECT
                m.id,
                m.sid,
                m.name,
                ml.name AS master_list_name,
                ml.pid AS product_id
            FROM master m
            INNER JOIN masterlist ml
                ON ml.id = m.sid
                AND ml.deleted_at IS NULL
            WHERE m.deleted_at IS NULL
            AND ml.pid = ?
            ORDER BY m.id ASC
        `,
        [productId]
    );

    return rows;
};

const findMasterOptionByIdAndProductId = async (id, productId) => {
    const [rows] = await db.query(
        `
            SELECT
                m.id,
                m.sid,
                m.name,
                ml.name AS master_list_name,
                ml.pid AS product_id
            FROM master m
            INNER JOIN masterlist ml
                ON ml.id = m.sid
                AND ml.deleted_at IS NULL
            WHERE m.id = ?
            AND m.deleted_at IS NULL
            AND ml.pid = ?
            LIMIT 1
        `,
        [id, productId]
    );

    return rows[0] || null;
};

const findAll = async ({ userId, productId, page = 1, limit = 10, search = "", mid = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `WHERE sm.deleted_at IS NULL AND sm.cid = ? AND ml.pid = ?`;
    const params = [userId, productId];

    if (mid && String(mid).trim() !== "") {
        where += ` AND sm.mid = ?`;
        params.push(mid);
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                sm.name LIKE ?
                OR sm.amount LIKE ?
                OR m.name LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    const [rows] = await db.query(
        `
            SELECT ${selectColumns}
            FROM masterc sm
            INNER JOIN master m
                ON m.id = sm.mid
                AND m.deleted_at IS NULL
            INNER JOIN masterlist ml
                ON ml.id = m.sid
                AND ml.deleted_at IS NULL
            ${where}
            ORDER BY sm.id DESC
            LIMIT ? OFFSET ?
        `,
        [...params, limit, offset]
    );

    const [countRows] = await db.query(
        `
            SELECT COUNT(*) AS total
            FROM masterc sm
            INNER JOIN master m
                ON m.id = sm.mid
                AND m.deleted_at IS NULL
            INNER JOIN masterlist ml
                ON ml.id = m.sid
                AND ml.deleted_at IS NULL
            ${where}
        `,
        params
    );

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

const findById = async (id, userId, productId) => {
    const [rows] = await db.query(
        `
            SELECT ${selectColumns}
            FROM masterc sm
            INNER JOIN master m
                ON m.id = sm.mid
                AND m.deleted_at IS NULL
            INNER JOIN masterlist ml
                ON ml.id = m.sid
                AND ml.deleted_at IS NULL
            WHERE sm.id = ?
            AND sm.cid = ?
            AND ml.pid = ?
            AND sm.deleted_at IS NULL
            LIMIT 1
        `,
        [id, userId, productId]
    );

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const [result] = await db.query(
        `
            UPDATE masterc
            SET mid = ?,
                name = ?,
                amount = ?
            WHERE id = ?
            AND cid = ?
            AND deleted_at IS NULL
        `,
        [body.mid, body.name, body.amount, id, userId]
    );

    return result;
};

const remove = async (id, userId) => {
    const [result] = await db.query(
        `
            UPDATE masterc
            SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = ?
            AND cid = ?
            AND deleted_at IS NULL
        `,
        [id, userId]
    );

    return result;
};

module.exports = {
    create,
    findMasterOptionsByProductId,
    findMasterOptionByIdAndProductId,
    findAll,
    findById,
    update,
    remove
};
