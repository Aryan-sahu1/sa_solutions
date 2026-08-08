
const bcrypt = require("bcrypt")
const db = require("../config/db")
const authRepository = require("../repository/auth.repository");
const { generateToken } = require("../utils/jwt");


const register = async (body) => {
    const companyExist = await authRepository.findByUsername(
        body.username
    );

    if (companyExist) {
        throw new Error("Username already exists");
    }

    const hashPassword = await bcrypt.hash(body.password, 10);

    const companyData = {
        ...body,
        password: hashPassword
    };

    return await authRepository.createCompany(companyData);
};


const loginUser = async (username, password) => {

    // Find user
    const user =
        await authRepository.findByUsername(username); 
    if (!user) { 
        throw new Error("Invalid username or password");
    }

    // Compare password
    const isPasswordValid =
        await bcrypt.compare(
            password,
            user.password
        );

    if (!isPasswordValid) {
        throw new Error("Invalid username or passwordfverfgr");
    }
 
    // Generate JWT
    const token = generateToken({
        id: user.id,
        username: user.username,
    });

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
        },
    };
};

const findAll = async () => {
    try {
        const data = await authRepository.findAll();
        return data;
    } catch (error) { 
        return error.message;
    }
}

const changePassword = async (userId, currentPassword, newPassword) => { 
    const company = await authRepository.findById(userId);
    if (!company) {
        throw new Error("Company Not Found...")
    } 
    const ispasswordvalid = await bcrypt.compare(currentPassword, company.password) 

    if (!ispasswordvalid) {
        throw new Error("Password is INvalid")
    }
    const isSamePassword = await bcrypt.compare(newPassword, company.password)
    if (isSamePassword) {
        throw new Error("New password must be different from current password")

    }
    const hashNewPassword = await bcrypt.hash(newPassword, 10)
    await authRepository.updatePassword(userId, hashNewPassword)
    return true;

}

module.exports = { register, loginUser, findAll, changePassword }