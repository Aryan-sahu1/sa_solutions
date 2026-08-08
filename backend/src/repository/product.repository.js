const db = require("../config/db")

const create = async (body) => {
    const sql = ` INSERT INTO products(name) VALUES(?)`
    const [result] = await db.query(sql, [body.name])
    return result;
}

const findAll = async () => {
    const sql = "SELECT * FROM products";
    const [rows] = await db.query(sql);
    return rows;
};

module.exports = {
    create,
    findAll

};