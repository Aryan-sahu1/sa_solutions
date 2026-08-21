const db = require("../config/db");

const SALE_TYPE = "S";
const SALE_TYPE1 = null;

const create = async (body, userId) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [tranResult] = await connection.query(
            `
                INSERT INTO tran (
                    pid,
                    crid,
                    date,
                    type,
                    type1,
                    remarks,
                    amt,
                    cid,
                    vehicle_no,
                    slip_no
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                body.pid,
                body.crid,
                body.date,
                SALE_TYPE,
                SALE_TYPE1,
                body.slip_no,
                body.amt,
                userId,
                body.vehicle_no,
                body.slip_no
            ]
        );

        const tranId = tranResult.insertId;

        for (const item of body.items) {
            await connection.query(
                `
                    INSERT INTO trande (
                        sid,
                        product_id,
                        iid,
                        qty,
                        rate,
                        amt
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `,
                [tranId, item.product_id, item.iid, item.qty, item.rate, item.amt]
            );
        }

        await connection.commit();

        return { id: tranId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const findAll = async ({ userId, page = 1, limit = 10, search = "", date = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `WHERE tr.deleted_at IS NULL AND tr.cid = ? AND tr.type = ?`;
    const params = [userId, SALE_TYPE];

    if (date && String(date).trim() !== "") {
        where += ` AND DATE(tr.date) = ?`;
        params.push(String(date).trim());
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                tr.slip_no LIKE ?
                OR tr.remarks LIKE ?
                OR tr.amt LIKE ?
                OR p.name LIKE ?
                OR vm.name LIKE ?
                OR detail_pc.name LIKE ?
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
            tr.id,
            tr.pid,
            tr.crid,
            tr.date,
            tr.type,
            tr.type1,
            tr.remarks,
            tr.amt,
            tr.cid,
            tr.vehicle_no,
            tr.slip_no,
            tr.created_at,
            tr.updated_at,
            tr.deleted_at,
            p.name AS party_name,
            vm.name AS vehicle_name,
            GROUP_CONCAT(DISTINCT detail_pc.name ORDER BY detail_pc.name SEPARATOR ', ') AS product_category_name
        FROM tran tr
        LEFT JOIN party p
            ON p.id = tr.pid
            AND p.cid = tr.cid
            AND p.deleted_at IS NULL
        LEFT JOIN vehicle_master vm
            ON vm.id = tr.vehicle_no
            AND vm.cid = tr.cid
            AND vm.deleted_at IS NULL
        LEFT JOIN trande detail_td
            ON detail_td.sid = tr.id
            AND detail_td.deleted_at IS NULL
        LEFT JOIN product_category detail_pc
            ON detail_pc.id = detail_td.product_id
            AND detail_pc.cid = tr.cid
            AND detail_pc.deleted_at IS NULL
        ${where}
        GROUP BY tr.id
        ORDER BY tr.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM tran tr
        LEFT JOIN party p
            ON p.id = tr.pid
            AND p.cid = tr.cid
            AND p.deleted_at IS NULL
        LEFT JOIN vehicle_master vm
            ON vm.id = tr.vehicle_no
            AND vm.cid = tr.cid
            AND vm.deleted_at IS NULL
        LEFT JOIN trande detail_td
            ON detail_td.sid = tr.id
            AND detail_td.deleted_at IS NULL
        LEFT JOIN product_category detail_pc
            ON detail_pc.id = detail_td.product_id
            AND detail_pc.cid = tr.cid
            AND detail_pc.deleted_at IS NULL
        ${where}
    `;

    const [rows] = await db.query(dataSql, [...params, limit, offset]);
    const [countRows] = await db.query(countSql, params);
    const ids = rows.map((row) => row.id);
    let detailsByTranId = {};

    if (ids.length > 0) {
        const [details] = await db.query(
            `
                SELECT
                    td.id,
                    td.sid,
                    td.product_id,
                    td.iid,
                    td.qty,
                    td.rate,
                    td.amt,
                    si.name AS item_name,
                    pc.name AS product_category_name
                FROM trande td
                LEFT JOIN stock_item si
                    ON si.id = td.iid
                    AND si.cid = ?
                    AND si.deleted_at IS NULL
                LEFT JOIN product_category pc
                    ON pc.id = td.product_id
                    AND pc.cid = ?
                    AND pc.deleted_at IS NULL
                WHERE td.deleted_at IS NULL
                AND td.sid IN (?)
                ORDER BY td.id ASC
            `,
            [userId, userId, ids]
        );

        detailsByTranId = details.reduce((acc, detail) => {
            acc[detail.sid] = acc[detail.sid] || [];
            acc[detail.sid].push(detail);
            return acc;
        }, {});
    }

    const total = countRows[0].total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
        data: rows.map((row) => ({
            ...row,
            items: detailsByTranId[row.id] || []
        })),
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
                tr.vehicle_no,
                tr.slip_no,
                p.name AS party_name,
                vm.name AS vehicle_name
            FROM tran tr
            LEFT JOIN party p
                ON p.id = tr.pid
                AND p.cid = tr.cid
                AND p.deleted_at IS NULL
            LEFT JOIN vehicle_master vm
                ON vm.id = tr.vehicle_no
                AND vm.cid = tr.cid
                AND vm.deleted_at IS NULL
            WHERE tr.id = ?
            AND tr.cid = ?
            AND tr.type = ?
            AND tr.deleted_at IS NULL
        `,
        [id, userId, SALE_TYPE]
    );

    if (!rows[0]) {
        return null;
    }

    const [items] = await db.query(
        `
            SELECT
                td.id,
                td.sid,
                td.product_id,
                td.iid,
                td.qty,
                td.rate,
                td.amt,
                si.name AS item_name,
                pc.name AS product_category_name
            FROM trande td
            LEFT JOIN stock_item si
                ON si.id = td.iid
                AND si.cid = ?
                AND si.deleted_at IS NULL
            LEFT JOIN product_category pc
                ON pc.id = td.product_id
                AND pc.cid = ?
                AND pc.deleted_at IS NULL
            WHERE td.sid = ?
            AND td.deleted_at IS NULL
            ORDER BY td.id ASC
        `,
        [userId, userId, id]
    );

    return {
        ...rows[0],
        items
    };
};

const update = async (id, body, userId) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `
                UPDATE tran
                SET pid = ?,
                    crid = ?,
                    date = ?,
                    type1 = ?,
                    remarks = ?,
                    amt = ?,
                    vehicle_no = ?,
                    slip_no = ?
                WHERE id = ?
                AND cid = ?
                AND type = ?
                AND deleted_at IS NULL
            `,
            [
                body.pid,
                body.crid,
                body.date,
                SALE_TYPE1,
                body.slip_no,
                body.amt,
                body.vehicle_no,
                body.slip_no,
                id,
                userId,
                SALE_TYPE
            ]
        );

        await connection.query(
            `
                UPDATE trande
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE sid = ?
                AND deleted_at IS NULL
            `,
            [id]
        );

        for (const item of body.items) {
            await connection.query(
                `
                    INSERT INTO trande (
                        sid,
                        product_id,
                        iid,
                        qty,
                        rate,
                        amt
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `,
                [id, item.product_id, item.iid, item.qty, item.rate, item.amt]
            );
        }

        await connection.commit();

        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const remove = async (id, userId) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `
                UPDATE tran
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE id = ?
                AND cid = ?
                AND type = ?
                AND deleted_at IS NULL
            `,
            [id, userId, SALE_TYPE]
        );

        await connection.query(
            `
                UPDATE trande
                SET deleted_at = CURRENT_TIMESTAMP
                WHERE sid = ?
                AND deleted_at IS NULL
            `,
            [id]
        );

        await connection.commit();

        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = {
    create,
    findAll,
    findById,
    update,
    remove
};
