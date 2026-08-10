
const bcrypt = require("bcrypt")
const db = require("../config/db")
const productRepository = require("../repository/product.repository")


const create = async (body) => {
        const data = await productRepository.create(body)
        return data;
   
}
const findAll = async (page,limit,search) => {
       page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
        return await productRepository.findAll(page,limit,search);
     
     
}

module.exports = { create, findAll }