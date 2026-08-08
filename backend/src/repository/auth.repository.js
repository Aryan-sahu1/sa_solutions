const db = require("../config/db");

const findByUsername = async (username) => {
    const [rows] = await db.query(
        "SELECT id, name, username, password FROM company WHERE username = ?",
        [username]
    ); 
    return rows[0] || null;
};

const findById = async (id) => {
    const [rows] = await db.query(
        "SELECT id, username,password FROM company WHERE id = ?",
        [id]
    );

    return rows[0] || null;
};

const createCompany = async (body) => {
    const [result] = await db.query(
        "INSERT INTO company (name, username,password) VALUES (?, ?, ?)",
        [body.name, body.username, body.password]
    );
    const [rows] = await db.query(`SELECT id,username FROM company WHERE id=?`, [result.insertId])

    return rows[0]
};

const findAll = async () => {
    const sql = "SELECT * FROM company";

    const [rows] = await db.query(sql);

    return rows;
};

const updatePassword = async(id,password)=>{
    const sql = `UPDATE company SET password =? WHERE id=?`;
    const [result]= await db.query(sql,[password,id]);
    return result;
}


module.exports = {
    findByUsername,
    findById,
    createCompany,
    findAll,
    updatePassword
};