
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Sidebar = () => {
    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div
            className="bg-dark text-white d-flex flex-column"
            style={{
                width: "250px",
                minHeight: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
            }}
        >
            {/* Logo */}
            <div className="p-4 border-bottom">
                <h4 className="mb-0">My Company</h4>
            </div>

            {/* Menu */}
            <div className="p-3 flex-grow-1">

                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `d-block text-decoration-none p-3 rounded mb-2 ${isActive
                            ? "bg-primary text-white"
                            : "text-white"
                        }`
                    }
                >
                    Dashboard
                </NavLink>

                <NavLink
                    to="/customers"
                    className={({ isActive }) =>
                        `d-block text-decoration-none p-3 rounded mb-2 ${isActive
                            ? "bg-primary text-white"
                            : "text-white"
                        }`
                    }
                >
                    Customers
                </NavLink>

                <NavLink
                    to="/staff"
                    className={({ isActive }) =>
                        `d-block text-decoration-none p-3 rounded mb-2 ${isActive
                            ? "bg-primary text-white"
                            : "text-white"
                        }`
                    }
                >
                    Staff
                </NavLink>
    <NavLink
                    to="/change-password"
                    className={({ isActive }) =>
                        `d-block text-decoration-none p-3 rounded mb-2 ${isActive
                            ? "bg-primary text-white"
                            : "text-white"
                        }`
                    }
                >
                    Change password
                </NavLink>

            </div>

            {/* Logout */}
            <div className="p-3 border-top">
                <button
                    className="btn btn-danger w-100"
                    onClick={logout}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

