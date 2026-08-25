const db = require("../config/db");

const priceFields = ["msp", "hsdp", "ureap", "cngp", "speedp"];
const stockFields = ["msst", "hsdst", "ureast", "cngst", "speedst"];
const meterExtraFields = [...priceFields, ...stockFields];

const create = async (body, userId) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [meterResult] = await connection.query(
            `
                INSERT INTO meter (
                    date,
                    shift,
                    msp,
                    hsdp,
                    ureap,
                    cngp,
                    speedp,
                    msst,
                    hsdst,
                    ureast,
                    cngst,
                    speedst,
                    cid,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UNIX_TIMESTAMP(), UNIX_TIMESTAMP())
            `,
            [
                body.date,
                body.shift,
                ...meterExtraFields.map((field) => body[field]),
                userId
            ]
        );

        const meterId = meterResult.insertId;

        for (const item of body.items) {
            await connection.query(
                `
                    INSERT INTO meterde (
                        opening,
                        closing,
                        cid,
                        sid,
                        pid,
                        iid,
                        testing,
                        sale
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    item.opening,
                    item.closing,
                    userId,
                    meterId,
                    item.pid,
                    item.iid,
                    item.testing,
                    item.sale
                ]
            );
        }

        await connection.commit();

        return { id: meterId };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

const findAll = async ({ userId, page = 1, limit = 10, search = "", date = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `WHERE m.cid = ?`;
    const params = [userId];

    if (date && String(date).trim() !== "") {
        where += ` AND m.date = ?`;
        params.push(String(date).trim());
    }

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                m.shift LIKE ?
                OR pc.name LIKE ?
                OR n.name LIKE ?
                OR n.snno LIKE ?
            )
        `;
        const searchTerm = `%${String(search).trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const dataSql = `
        SELECT
            m.id,
            m.date,
            m.shift,
            m.msp,
            m.hsdp,
            m.ureap,
            m.cngp,
            m.speedp,
            m.msst,
            m.hsdst,
            m.ureast,
            m.cngst,
            m.speedst,
            m.cid,
            m.created_at,
            m.updated_at,
            COUNT(md.id) AS item_count,
            COALESCE(SUM(md.sale), 0) AS total_sale,
            GROUP_CONCAT(DISTINCT pc.name ORDER BY pc.name SEPARATOR ', ') AS product_names
        FROM meter m
        LEFT JOIN meterde md
            ON md.sid = m.id
            AND md.cid = m.cid
        LEFT JOIN product_category pc
            ON pc.id = md.pid
            AND pc.cid = m.cid
            AND pc.deleted_at IS NULL
        LEFT JOIN nozel n
            ON n.id = md.iid
            AND n.cid = m.cid
            AND n.deleted_at IS NULL
        ${where}
        GROUP BY m.id
        ORDER BY m.id DESC
        LIMIT ? OFFSET ?
    `;

    const countSql = `
        SELECT COUNT(DISTINCT m.id) AS total
        FROM meter m
        LEFT JOIN meterde md
            ON md.sid = m.id
            AND md.cid = m.cid
        LEFT JOIN product_category pc
            ON pc.id = md.pid
            AND pc.cid = m.cid
            AND pc.deleted_at IS NULL
        LEFT JOIN nozel n
            ON n.id = md.iid
            AND n.cid = m.cid
            AND n.deleted_at IS NULL
        ${where}
    `;

    const [rows] = await db.query(dataSql, [...params, limit, offset]);
    const [countRows] = await db.query(countSql, params);
    const ids = rows.map((row) => row.id);
    let detailsByMeterId = {};

    if (ids.length > 0) {
        const [details] = await db.query(
            `
                SELECT
                    md.id,
                    md.sid,
                    md.pid,
                    md.iid,
                    md.opening,
                    md.closing,
                    md.testing,
                    md.sale,
                    pc.name AS product_name,
                    n.name AS nozel_name,
                    n.snno AS nozel_snno
                FROM meterde md
                LEFT JOIN product_category pc
                    ON pc.id = md.pid
                    AND pc.cid = ?
                    AND pc.deleted_at IS NULL
                LEFT JOIN nozel n
                    ON n.id = md.iid
                    AND n.cid = ?
                    AND n.deleted_at IS NULL
                WHERE md.cid = ?
                AND md.sid IN (?)
                ORDER BY md.id ASC
            `,
            [userId, userId, userId, ids]
        );

        detailsByMeterId = details.reduce((acc, detail) => {
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
            items: detailsByMeterId[row.id] || []
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
                id,
                date,
                shift,
                msp,
                hsdp,
                ureap,
                cngp,
                speedp,
                msst,
                hsdst,
                ureast,
                cngst,
                speedst,
                cid,
                created_at,
                updated_at
            FROM meter
            WHERE id = ?
            AND cid = ?
        `,
        [id, userId]
    );

    if (!rows[0]) {
        return null;
    }

    const [items] = await db.query(
        `
            SELECT
                md.id,
                md.sid,
                md.pid,
                md.iid,
                md.opening,
                md.closing,
                md.testing,
                md.sale,
                pc.name AS product_name,
                n.name AS nozel_name,
                n.snno AS nozel_snno
            FROM meterde md
            LEFT JOIN product_category pc
                ON pc.id = md.pid
                AND pc.cid = ?
                AND pc.deleted_at IS NULL
            LEFT JOIN nozel n
                ON n.id = md.iid
                AND n.cid = ?
                AND n.deleted_at IS NULL
            WHERE md.sid = ?
            AND md.cid = ?
            ORDER BY md.id ASC
        `,
        [userId, userId, id, userId]
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
                UPDATE meter
                SET date = ?,
                    shift = ?,
                    msp = ?,
                    hsdp = ?,
                    ureap = ?,
                    cngp = ?,
                    speedp = ?,
                    msst = ?,
                    hsdst = ?,
                    ureast = ?,
                    cngst = ?,
                    speedst = ?,
                    updated_at = UNIX_TIMESTAMP()
                WHERE id = ?
                AND cid = ?
            `,
            [
                body.date,
                body.shift,
                ...meterExtraFields.map((field) => body[field]),
                id,
                userId
            ]
        );

        await connection.query(
            `
                DELETE FROM meterde
                WHERE sid = ?
                AND cid = ?
            `,
            [id, userId]
        );

        for (const item of body.items) {
            await connection.query(
                `
                    INSERT INTO meterde (
                        opening,
                        closing,
                        cid,
                        sid,
                        pid,
                        iid,
                        testing,
                        sale
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    item.opening,
                    item.closing,
                    userId,
                    id,
                    item.pid,
                    item.iid,
                    item.testing,
                    item.sale
                ]
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
                DELETE FROM meterde
                WHERE sid = ?
                AND cid = ?
            `,
            [id, userId]
        );

        await connection.query(
            `
                DELETE FROM meter
                WHERE id = ?
                AND cid = ?
            `,
            [id, userId]
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
