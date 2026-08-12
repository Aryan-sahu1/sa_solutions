import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const ChangePassword = () => {
    const { authHeaders } = useAuth();
    const [data, setData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (data.newPassword !== data.confirmPassword) {
            setMessage("New password and confirm password do not match");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await axios.put(
                "http://localhost:4000/api/customers/update-password",
                {
                    currentPassword: data.oldPassword,
                    newPassword: data.newPassword,
                },
                {
                    headers: {
                        ...authHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );

            setMessage(
                res.data?.message || "Password changed successfully"
            );

            setData({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            console.error("Change Password Error:", error);

            setMessage(
                error.response?.data?.message ||
                "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="container-fluid d-flex justify-content-center align-items-center"
            style={{
                minHeight: "calc(100vh - 60px)",
            }}
        >
            <div
                className="card shadow-sm"
                style={{
                    width: "100%",
                    maxWidth: "620px",
                }}
            >
                <div className="card-header">
                    <h4 className="mb-0">
                        Change Password
                    </h4>
                </div>

                <div className="card-body">

                    {message && (
                        <div className="alert alert-info">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* Old Password */}
                        <div className="mb-3">
                            <label className="form-label">
                                Old Password
                            </label>

                            <input
                                type="password"
                                className="form-control"
                                name="oldPassword"
                                value={data.oldPassword}
                                onChange={handleChange}
                                placeholder="Enter old password"
                                required
                            />
                        </div>

                        {/* New Password */}
                        <div className="mb-3">
                            <label className="form-label">
                                New Password
                            </label>

                            <input
                                type="password"
                                className="form-control"
                                name="newPassword"
                                value={data.newPassword}
                                onChange={handleChange}
                                placeholder="Enter new password"
                                required
                            />
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-3">
                            <label className="form-label">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                className="form-control"
                                name="confirmPassword"
                                value={data.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={loading}
                        >
                            {loading
                                ? "Changing Password..."
                                : "Change Password"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
