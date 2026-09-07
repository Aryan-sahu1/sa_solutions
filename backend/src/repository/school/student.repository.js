const db = require("../../config/db");

const columns = `
    id,
    name,
    address,
    father_name,
    mother_name,
    opening_balance,
    mobile,
    gender,
    discount,
    class_name,
    second_mobile_no,
    admission_no,
    fee_type,
    category,
    left_date,
    dob,
    admission_date,
    convenience_start_date,
    aadhar_no,
    house,
    sr_no,
    pan_no,
    cid,
    created_at,
    updated_at,
    deleted_at
`;

const create = async (body, userId) => {
    const sql = `
        INSERT INTO school_student (
            name,
            address,
            father_name,
            mother_name,
            opening_balance,
            mobile,
            gender,
            discount,
            class_name,
            second_mobile_no,
            admission_no,
            fee_type,
            category,
            left_date,
            dob,
            admission_date,
            convenience_start_date,
            aadhar_no,
            house,
            sr_no,
            pan_no,
            cid
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.address,
        body.father_name,
        body.mother_name,
        body.opening_balance,
        body.mobile,
        body.gender,
        body.discount,
        body.class_name,
        body.second_mobile_no,
        body.admission_no,
        body.fee_type,
        body.category,
        body.left_date,
        body.dob,
        body.admission_date,
        body.convenience_start_date,
        body.aadhar_no,
        body.house,
        body.sr_no,
        body.pan_no,
        userId
    ]);

    return { id: result.insertId };
};

const findAll = async ({ userId, page = 1, limit = 10, search = "" } = {}) => {
    const offset = (page - 1) * limit;
    let where = `WHERE deleted_at IS NULL AND cid = ?`;
    const params = [userId];

    if (search && String(search).trim() !== "") {
        where += `
            AND (
                name LIKE ?
                OR father_name LIKE ?
                OR mother_name LIKE ?
                OR mobile LIKE ?
                OR second_mobile_no LIKE ?
                OR admission_no LIKE ?
                OR class_name LIKE ?
                OR category LIKE ?
                OR house LIKE ?
                OR sr_no LIKE ?
                OR pan_no LIKE ?
                OR aadhar_no LIKE ?
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
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm,
            searchTerm
        );
    }

    const [rows] = await db.query(
        `
            SELECT ${columns}
            FROM school_student
            ${where}
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `,
        [...params, limit, offset]
    );

    const [countRows] = await db.query(
        `
            SELECT COUNT(*) AS total
            FROM school_student
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

const findById = async (id, userId) => {
    const [rows] = await db.query(
        `
            SELECT ${columns}
            FROM school_student
            WHERE id = ?
            AND cid = ?
            AND deleted_at IS NULL
            LIMIT 1
        `,
        [id, userId]
    );

    return rows[0] || null;
};

const update = async (id, body, userId) => {
    const sql = `
        UPDATE school_student
        SET name = ?,
            address = ?,
            father_name = ?,
            mother_name = ?,
            opening_balance = ?,
            mobile = ?,
            gender = ?,
            discount = ?,
            class_name = ?,
            second_mobile_no = ?,
            admission_no = ?,
            fee_type = ?,
            category = ?,
            left_date = ?,
            dob = ?,
            admission_date = ?,
            convenience_start_date = ?,
            aadhar_no = ?,
            house = ?,
            sr_no = ?,
            pan_no = ?
        WHERE id = ?
        AND cid = ?
        AND deleted_at IS NULL
    `;

    const [result] = await db.query(sql, [
        body.name,
        body.address,
        body.father_name,
        body.mother_name,
        body.opening_balance,
        body.mobile,
        body.gender,
        body.discount,
        body.class_name,
        body.second_mobile_no,
        body.admission_no,
        body.fee_type,
        body.category,
        body.left_date,
        body.dob,
        body.admission_date,
        body.convenience_start_date,
        body.aadhar_no,
        body.house,
        body.sr_no,
        body.pan_no,
        id,
        userId
    ]);

    return result;
};

const remove = async (id, userId) => {
    const [result] = await db.query(
        `
            UPDATE school_student
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
    findAll,
    findById,
    update,
    remove
};
