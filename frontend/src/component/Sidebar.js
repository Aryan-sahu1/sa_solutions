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
    FaLayerGroup,
    FaFileImport,
} from "react-icons/fa";

const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { to: "/product", label: "Create Product", icon: <FaBoxOpen /> },
    { to: "/t-head-master", label: "T Head Master", icon: <FaLayerGroup /> },
    { to: "/masters", label: "Master", icon: <FaUserTie /> },
    { to: "/customers", label: "Create Customer", icon: <FaUsers /> },
    { to: "/master-list", label: "Master List", icon: <FaUsers /> },
    { to: "/import-data", label: "Import Data", icon: <FaFileImport /> },
    { to: "/change-password", label: "Change Password", icon: <FaKey /> },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const logout = () => {
        localStorage.removeItem("token");
        sessionStorage.removeItem("verifiedToken");
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
                className={`sidebar-container bg-dark text-white d-flex flex-column ${
                    isOpen ? "sidebar-open" : ""
                }`}
            >
                {/* Logo */}
                <div className="p-4 border-bottom d-none d-md-block">
                    <h4 className="mb-0">My Company</h4>
                </div>

                {/* Menu */}
                <div className="sidebar-menu p-3 flex-grow-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end
                            onClick={closeSidebar}
                            className={({ isActive }) =>
                                `d-flex align-items-center gap-2 text-decoration-none p-3 rounded mb-2 sidebar-link text-white ${
                                    isActive ? "sidebar-link-active" : ""
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
                :root {
                    --sidebar-width: 250px;
                }

                .sidebar-container {
                    width: var(--sidebar-width);
                    min-height: 100vh;
                    position: fixed;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    z-index: 1040;
                    transform: translateX(0);
                    transition: transform 0.3s ease-in-out;
                }

                .sidebar-link {
                    min-height: 52px;
                    transition: background-color 0.2s ease, color 0.2s ease;
                }

                .sidebar-menu {
                    margin-top: 0;
                    overflow-y: auto;
                }

                .sidebar-link:hover {
                    background-color: rgba(255,255,255,0.1);
                }

                .sidebar-link-active,
                .sidebar-link-active:hover {
                    background-color: #0d6efd;
                    color: #fff;
                }

                @media (max-width: 767.98px) {
                    .sidebar-container {
                        transform: translateX(-100%);
                    }

                    .sidebar-container.sidebar-open {
                        transform: translateX(0);
                    }

                    .sidebar-menu {
                        margin-top: 54px;
                    }
                }
            `}</style>
        </>
    );
};

export default Sidebar;
