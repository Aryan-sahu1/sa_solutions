import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    FaTachometerAlt,
    FaBoxOpen,
    FaUserTie,
    FaUsers,
    FaKey,
    FaSignOutAlt,
    FaBars,
    FaTimes,
} from "react-icons/fa";

const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { to: "/product", label: "Create Product", icon: <FaBoxOpen /> },
    { to: "/staff", label: "Create Staff", icon: <FaUserTie /> },
    { to: "/customers", label: "Create Customer", icon: <FaUsers /> },
    { to: "/change-password", label: "Change Password", icon: <FaKey /> },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const logout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile top bar */}
            <div
                className="d-md-none bg-dark text-white d-flex align-items-center justify-content-between p-3"
                style={{ position: "sticky", top: 0, zIndex: 1050 }}
            >
                <h5 className="mb-0">My Company</h5>
                <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    {isOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="d-md-none"
                    onClick={closeSidebar}
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 1030,
                    }}
                />
            )}

            {/* Sidebar — single element, background + transform on same node */}
            <div
                className="sidebar-container bg-dark text-white d-flex flex-column"
                style={{
                    width: "250px",
                    minHeight: "100vh",
                    position: "fixed",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 1040,
                    transition: "transform 0.3s ease-in-out",
                    transform: isOpen ? "translateX(0)" : undefined,
                }}
            >
                {/* Logo */}
                <div className="p-4 border-bottom d-none d-md-block">
                    <h4 className="mb-0">My Company</h4>
                </div>

                {/* Menu */}
                <div className="p-3 flex-grow-1" style={{ overflowY: "auto" }}>
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `d-flex align-items-center gap-2 text-decoration-none p-3 rounded mb-2 sidebar-link ${
                                    isActive ? "bg-primary text-white" : "text-white"
                                }`
                            }
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>

                {/* Logout */}
                <div className="p-3 border-top">
                    <button
                        className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2"
                        onClick={logout}
                    >
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>

            <style>{`
                .sidebar-link:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                @media (max-width: 767.98px) {
                    .sidebar-container {
                        transform: translateX(${isOpen ? "0" : "-100%"});
                    }
                }
            `}</style>
        </>
    );
};

export default Sidebar;