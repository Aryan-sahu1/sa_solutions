const db = require("../config/db");

const create = async (body, userId) => {
    const sql = `
        INSERT INTO staff (name, pid, password, cid)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.pid,
        body.password,
        userId
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "" } = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE s.deleted_at IS NULL AND s.cid = ?`;
    const params = [userId];

    if (search && String(search).trim() !== "") {
        where += ` AND (s.name LIKE ? OR sc.name LIKE ? OR p.name LIKE ?)`;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    const dataSql = `
        SELECT
            s.id,
            s.name,
            s.pid,
            s.cid,
            s.created_at,
            s.updated_at,
            s.deleted_at,
            sc.name AS staff_category_name,
            p.name AS product_name
        FROM staff s
        LEFT JOIN staff_categories sc
            ON sc.id = s.pid
            AND sc.deleted_at IS NULL
        LEFT JOIN products p
            ON p.id = sc.product_id
            AND p.deleted_at IS NULL
        ${where}
        ORDER BY s.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM staff s
        LEFT JOIN staff_categories sc
            ON sc.id = s.pid
            AND sc.deleted_at IS NULL
        LEFT JOIN products p
            ON p.id = sc.product_id
            AND p.deleted_at IS NULL
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
            s.id,
            s.name,
            s.pid,
            s.cid,
            s.created_at,
            s.updated_at,
            s.deleted_at,
            sc.name AS staff_category_name,
            p.name AS product_name
        FROM staff s
        LEFT JOIN staff_categories sc
            ON sc.id = s.pid
            AND sc.deleted_at IS NULL
        LEFT JOIN products p
            ON p.id = sc.product_id
            AND p.deleted_at IS NULL
        WHERE s.id = ?
        AND s.cid = ?
        AND s.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE staff
        SET name = ?,
            pid = ?,
            password = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.pid,
        body.password,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE staff
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [id, userId]);

    return result;
};

const findByName=async(name)=>{
const sql = `SELECT id, name,password FROM staff WHERE name=? AND deleted_at IS NULL`
const [rows]= await db.query(sql,name)
console.log(rows,"kkkkkkkkk")
return rows;
}


module.exports = {
    create,
    findAll,
    findById,
    update,
    remove,findByName
};
