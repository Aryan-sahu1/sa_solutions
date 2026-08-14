import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CompanyLogin = () => {
    const [data, setdata] = useState({
        username: "",
        password: ""
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const navigate = useNavigate();
    const { isAuthenticated, isCheckingAuth, login, logout } = useAuth();

    useEffect(() => {
        if (!isCheckingAuth && isAuthenticated) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, isCheckingAuth, navigate]);

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
            await login({
                username: data.username,
                password: data.password
            });

            setMessage("Login Successfully")
            navigate("/dashboard", { state: { showWelcome: true } });

        } catch (error) {
            logout();
            console.error("Login Error:", error);
            setMessage(error.response?.data?.message || error.message || "Something went wrong");
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
