const db = require("../config/db");

const getVehicleNo = (body) => {
    return body.name || body.name;
};

const create = async (body, userId) => {
    console.log(body,"body")
    const sql = `
        INSERT INTO vehicle_master (name, balance, sid, cid)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [ 
        getVehicleNo(body),
        body.balance,
        body.sid,
        userId
    ]);

    return result;
};

const findAll = async ({ userId, page = 1, limit = 10, search = "", sid = "" } = {}) => {
    const offset = (page - 1) * limit;

    let where = `WHERE vm.deleted_at IS NULL AND vm.cid = ?`;
    const params = [userId];

    if (sid && String(sid).trim() !== "") {
        where += ` AND vm.sid = ?`;
        params.push(sid);
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                vm.name LIKE ? 
                OR vm.balance LIKE ?
                OR p.name LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        console.log(searchTerm,"searchTerm")
        params.push(searchTerm, searchTerm, searchTerm);
    }

    const dataSql = `
        SELECT
            vm.id,
            vm.name, 
            vm.balance,
            vm.sid,
            vm.cid,
            vm.created_at,
            vm.updated_at,
            vm.deleted_at,
            p.name AS party_name
        FROM vehicle_master vm
        LEFT JOIN party p
            ON p.id = vm.sid
            AND p.cid = vm.cid
            AND p.deleted_at IS NULL
        ${where}
        ORDER BY vm.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM vehicle_master vm
        LEFT JOIN party p
            ON p.id = vm.sid
            AND p.cid = vm.cid
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
            vm.id,
            vm.name,
            vm.balance,
            vm.sid,
            vm.cid,
            vm.created_at,
            vm.updated_at,
            vm.deleted_at,
            p.name AS party_name
        FROM vehicle_master vm
        LEFT JOIN party p
            ON p.id = vm.sid
            AND p.cid = vm.cid
            AND p.deleted_at IS NULL
        WHERE vm.id = ?
        AND vm.cid = ?
        AND vm.deleted_at IS NULL
    `;

    const [rows] = await db.query(sql, [id, userId]);

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE vehicle_master
        SET name = ?,
            balance = ?,
            sid = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.balance,
        body.sid,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const sql = `
        UPDATE vehicle_master
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
