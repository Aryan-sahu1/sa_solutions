import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
    FaTachometerAlt,
    FaBoxOpen,
    FaUserTie,
    FaUsers,
    FaSignOutAlt,
    FaBars,
    FaTimes,
    FaChevronDown,
    FaChevronRight,
    FaLayerGroup,
    FaKey, 
    FaClipboardList,
    FaMoneyBillWave,
    FaCashRegister,
    FaFileInvoiceDollar,
    FaUserCheck,
    FaUserGraduate,
    FaGasPump,
    FaCertificate,
    FaIdCard,
    FaPhoneAlt,  
    FaBook, 
    FaDatabase,
    FaBookOpen,
    FaList,
    FaCalendarAlt,
    FaClipboardCheck,
    FaTable,
    FaCalendarCheck,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

const menuItems = [
    { to: "/dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
   {
    label: "Entry",
    icon: <FaLayerGroup />,
    children: [
        { to: "/enquiry", label: "Enquiry", icon: <FaClipboardList /> },
        { to: "/fees-receipt", label: "Fees Receipt", icon: <FaMoneyBillWave /> },
        { to: "/cash-receipt-payment", label: "Cash Receipt/Payment", icon: <FaCashRegister /> },
        { to: "/journal-voucher", label: "Journal Voucher", icon: <FaFileInvoiceDollar /> },
        { to: "/staff-salary", label: "Staff Salary", icon: <FaUserTie /> },
        { to: "/staff-attendance", label: "Staff Attendance", icon: <FaUserCheck /> },
        { to: "/student-attendance", label: "Student Attendance", icon: <FaUserGraduate /> },
        { to: "/petrolpump-slip", label: "Petrolpump Slip", icon: <FaGasPump /> },
        { to: "/transfer-certificate", label: "Transfer Certificate", icon: <FaCertificate /> },
        { to: "/character-certificate", label: "Character Certificate", icon: <FaIdCard /> },
        { to: "/follow-up-fees", label: "Follow Up for Fees", icon: <FaPhoneAlt /> },
    ],
},
   {
    label: "Master",
    icon: <FaLayerGroup />,
    children: [
        { to: "/students", label: "Students", icon: <FaUserGraduate /> },
        { to: "/ledgers", label: "Ledgers", icon: <FaBook /> },
        { to: "/head-master", label: "Head Master", icon: <FaUsers /> },
        { to: "/fees-structure", label: "Fees Structure", icon: <FaMoneyBillWave /> },
        { to: "/master", label: "Master", icon: <FaDatabase /> },
        { to: "/class-subject-master", label: "Class Subject Master", icon: <FaBookOpen /> },
        { to: "/master-list", label: "MasterList", icon: <FaList /> },
        { to: "/exams-schedule", label: "Exams Schedule", icon: <FaCalendarAlt /> },
        { to: "/result-entry", label: "Result Entry", icon: <FaClipboardCheck /> },
        { to: "/time-table", label: "Time Table", icon: <FaTable /> },
        { to: "/time-table-allotment", label: "Time Table Allotment", icon: <FaCalendarCheck /> },
    ],
},
    { to: "/change-password", label: "Change Password", icon: <FaKey /> },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout: logoutCustomer } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [openSubmenus, setOpenSubmenus] = useState(() =>
        menuItems.reduce((acc, item) => {
            if (item.children?.some((child) => child.to === location.pathname)) {
                acc[item.label] = true;
            }

            return acc;
        }, {})
    );

    useEffect(() => {
        const activeParent = menuItems.find((item) =>
            item.children?.some((child) => child.to === location.pathname)
        );

        if (activeParent) {
            setOpenSubmenus((current) => ({
                ...current,
                [activeParent.label]: true,
            }));
        }
    }, [location.pathname]);

    const logout = () => {
        logoutCustomer();
        navigate("/login");
    };

    const closeSidebar = () => setIsOpen(false);

    const toggleSubmenu = (label) => {
        setOpenSubmenus((current) => ({
            ...current,
            [label]: !current[label],
        }));
    };

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
                    {menuItems.map((item) => {
                        const isSubmenuOpen = openSubmenus[item.label];
                        const hasActiveChild = item.children?.some(
                            (child) => child.to === location.pathname
                        );

                        if (item.children) {
                            return (
                                <div key={item.label} className="mb-2">
                                    <button
                                        type="button"
                                        onClick={() => toggleSubmenu(item.label)}
                                        className={`sidebar-link sidebar-submenu-button text-white w-100 d-flex align-items-center justify-content-between gap-2 p-3 rounded border-0 ${
                                            hasActiveChild ? "sidebar-link-active" : ""
                                        }`}
                                        aria-expanded={isSubmenuOpen}
                                    >
                                        <span className="d-flex align-items-center gap-2">
                                            <span>{item.icon}</span>
                                            <span>{item.label}</span>
                                        </span>
                                        <span className="sidebar-chevron">
                                            {isSubmenuOpen ? (
                                                <FaChevronDown />
                                            ) : (
                                                <FaChevronRight />
                                            )}
                                        </span>
                                    </button>

                                    {isSubmenuOpen && (
                                        <div className="sidebar-submenu mt-2">
                                            {item.children.map((child) => (
                                                <NavLink
                                                    key={`${child.to}-${child.label}`}
                                                    to={child.to}
                                                    end
                                                    onClick={closeSidebar}
                                                    className={({ isActive }) =>
                                                        `d-flex align-items-center gap-2 text-decoration-none px-3 py-2 rounded mb-1 sidebar-link sidebar-submenu-link text-white ${
                                                            isActive
                                                                ? "sidebar-link-active"
                                                                : ""
                                                        }`
                                                    }
                                                >
                                                    <span>{child.icon}</span>
                                                    <span>{child.label}</span>
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
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
                        );
                    })}
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

                .sidebar-submenu-button {
                    background: transparent;
                }

                .sidebar-submenu-button:focus-visible,
                .sidebar-link:focus-visible {
                    outline: 2px solid rgba(255,255,255,0.55);
                    outline-offset: 2px;
                }

                .sidebar-chevron {
                    display: inline-flex;
                    font-size: 12px;
                }

                .sidebar-submenu {
                    padding-left: 18px;
                }

                .sidebar-submenu-link {
                    min-height: 42px;
                    font-size: 14px;
                    background-color: rgba(255,255,255,0.04);
                }

                .sidebar-menu {
                    margin-top: 0;
                    overflow-y: auto;
                }

                .sidebar-link:hover,
                .sidebar-submenu-button:hover {
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
