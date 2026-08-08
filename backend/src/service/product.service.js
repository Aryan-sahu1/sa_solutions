
const bcrypt = require("bcrypt")
const db = require("../config/db")
const productRepository = require("../repository/product.repository")


const create = async (body) => {
    try {
        // const productExist = await productRepository.findByUsername(body)
        // if (companyExist) {
        //     throw new Error("Username already exists");
        // }
 

      

        const data = await productRepository.create(body)
        return data;
    } catch (error) {
        console.log(error)
    }
}
const findAll = async () => {
    try {
        const data =await productRepository.findAll();
        return data;
    } catch (error) {
        console.log(error)
        return error.message;
    }
}

module.exports = { create, findAll }