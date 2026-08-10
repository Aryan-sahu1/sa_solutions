import React, { useState } from "react";
import axios from "axios"
import { useNavigate } from "react-router-dom";
const CompanyLogin = () => {
    const [data, setdata] = useState({
        username: "",
        password: ""
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setdata((prev) => ({
            ...prev, [name]: value,
        }));
    };


    const submitForm = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("")
        try {
            const res = await axios.post(`http://localhost:4000/api/auth/login`, {
                username: data.username,
                password: data.password
            },
                {
                    headers: {
                        "Content-Type": "application/json",
                    }
                }
            );

            if (res.data.token) {
                localStorage.setItem("token", res.data.token);
                await axios.get("http://localhost:4000/api/auth/verify-company", {
                    headers: {
                        Authorization: `Bearer ${res.data.token}`,
                    },
                });

                setMessage("Login Successfully")
                navigate("/dashboard");
            }

        } catch (error) {
            localStorage.removeItem("token");
            console.error("Login Error:", error); setMessage(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="container">
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-md-5">
                    <div className="card shadow">
                        <div className="card-body p-4">
                            <h3 className="text-center mb-4">Login</h3>
                            {message && (<div className="alert alert-info"> {message} </div>)}
                            <form onSubmit={submitForm}>
                                <div className="mb-3">
                                    <label className="form-label">Username</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter username"
                                        name="username"
                                        value={data.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Enter password"
                                        name="password"
                                        value={data.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                    {loading ? "Logging in..." : "Login"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyLogin;
