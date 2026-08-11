import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
    FaBoxOpen,
    FaExclamationTriangle,
    FaRedo,
    FaUserPlus,
    FaUsers,
    FaUserTie,
} from "react-icons/fa";

const defaultStats = {
    products: 0,
    customers: 0,
    staff: 0,
};

const Dashboard = () => {
    const [stats, setStats] = useState(defaultStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");

    const authHeaders = useMemo(() => {
        if (!token) {
            return {};
        }

        return {
            Authorization: `Bearer ${token}`,
        };
    }, [token]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:4000/api/dashboard/stats",
                {
                    headers: authHeaders,
                }
            );

            const data = response.data.data || defaultStats;

            setStats({
                products: Number(data.products || 0),
                customers: Number(data.customers || 0),
                staff: Number(data.staff || 0),
            });
        } catch (err) {
            console.error("Dashboard data error:", err);
            setStats(defaultStats);
            setError(
                err.response?.data?.message ||
                "Failed to load dashboard data"
            );
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const statCards = [
        {
            title: "Total Products",
            value: stats.products,
            icon: <FaBoxOpen />,
            color: "#0d6efd",
            path: "/product",
            label: "Manage products",
        },
        {
            title: "Total Customers",
            value: stats.customers,
            icon: <FaUsers />,
            color: "#198754",
            path: "/customers",
            label: "Manage customers",
        },
        {
            title: "Total Staff",
            value: stats.staff,
            icon: <FaUserTie />,
            color: "#6f42c1",
            path: "/staff",
            label: "Manage staff",
        },
    ];

    const quickActions = [
        {
            title: "Add Product",
            text: "Create a new product record.",
            icon: <FaBoxOpen />,
            path: "/product",
        },
        {
            title: "Add Customer",
            text: "Register a customer with product details.",
            icon: <FaUserPlus />,
            path: "/customers",
        },
        {
            title: "Add Staff",
            text: "Assign staff to a product.",
            icon: <FaUserTie />,
            path: "/staff",
        },
    ];

    const totalRecords = stats.products + stats.customers + stats.staff;

    return (
        <div className="dashboard-page container-fluid p-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Dashboard</h2>
                    <p className="text-muted mb-0">
                        Company overview and quick management
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-outline-primary d-inline-flex align-items-center gap-2 dashboard-refresh"
                    onClick={fetchDashboardData}
                    disabled={loading}
                >
                    <FaRedo />
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2">
                    <FaExclamationTriangle />
                    <span>{error}</span>
                </div>
            )}

            <div className="row g-3 mb-4">
                {statCards.map((card) => (
                    <div className="col-12 col-md-6 col-xl-4" key={card.title}>
                        <Link
                            to={card.path}
                            className="dashboard-stat-card text-decoration-none"
                        >
                            <div
                                className="dashboard-stat-icon"
                                style={{ backgroundColor: card.color }}
                            >
                                {card.icon}
                            </div>

                            <div className="flex-grow-1">
                                <div className="text-muted small fw-semibold">
                                    {card.title}
                                </div>
                                <div className="dashboard-stat-value">
                                    {loading ? "..." : card.value}
                                </div>
                                <div className="dashboard-stat-link">
                                    {card.label}
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-8">
                    <div className="card shadow-sm border-0 dashboard-panel">
                        <div className="card-header bg-white p-3">
                            <h5 className="mb-0">Business Summary</h5>
                        </div>

                        <div className="card-body">
                            <div className="dashboard-summary">
                                <div>
                                    <span>Total Records</span>
                                    <strong>{loading ? "..." : totalRecords}</strong>
                                </div>
                                <div>
                                    <span>Products Available</span>
                                    <strong>{loading ? "..." : stats.products}</strong>
                                </div>
                                <div>
                                    <span>Customers Managed</span>
                                    <strong>{loading ? "..." : stats.customers}</strong>
                                </div>
                                <div>
                                    <span>Staff Members</span>
                                    <strong>{loading ? "..." : stats.staff}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-4">
                    <div className="card shadow-sm border-0 dashboard-panel">
                        <div className="card-header bg-white p-3">
                            <h5 className="mb-0">Quick Actions</h5>
                        </div>

                        <div className="card-body d-grid gap-3">
                            {quickActions.map((action) => (
                                <Link
                                    to={action.path}
                                    className="dashboard-action text-decoration-none"
                                    key={action.title}
                                >
                                    <span className="dashboard-action-icon">
                                        {action.icon}
                                    </span>
                                    <span>
                                        <strong>{action.title}</strong>
                                        <small>{action.text}</small>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-page {
                    color: #1f2937;
                }

                .dashboard-refresh {
                    min-height: 40px;
                    align-self: flex-start;
                }

                .dashboard-stat-card {
                    min-height: 150px;
                    display: flex;
                    align-items: center;
                    gap: 18px;
                    padding: 22px;
                    background: #ffffff;
                    border: 1px solid rgba(15, 23, 42, 0.08);
                    border-radius: 8px;
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
                    color: inherit;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .dashboard-stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
                }

                .dashboard-stat-icon {
                    width: 58px;
                    height: 58px;
                    flex: 0 0 58px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 24px;
                }

                .dashboard-stat-value {
                    margin-top: 4px;
                    font-size: 34px;
                    line-height: 1.1;
                    font-weight: 800;
                    color: #111827;
                }

                .dashboard-stat-link {
                    margin-top: 6px;
                    color: #0d6efd;
                    font-size: 14px;
                    font-weight: 600;
                }

                .dashboard-panel {
                    border-radius: 8px;
                    overflow: hidden;
                }

                .dashboard-summary {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                }

                .dashboard-summary div {
                    min-height: 96px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 18px;
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                }

                .dashboard-summary span {
                    color: #6b7280;
                    font-size: 14px;
                    font-weight: 600;
                }

                .dashboard-summary strong {
                    margin-top: 8px;
                    color: #111827;
                    font-size: 28px;
                    line-height: 1.1;
                }

                .dashboard-action {
                    min-height: 78px;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px;
                    color: #1f2937;
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    transition: border-color 0.2s ease, background-color 0.2s ease;
                }

                .dashboard-action:hover {
                    background: #ffffff;
                    border-color: #0d6efd;
                }

                .dashboard-action-icon {
                    width: 42px;
                    height: 42px;
                    flex: 0 0 42px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: #0d6efd;
                    color: #ffffff;
                }

                .dashboard-action strong,
                .dashboard-action small {
                    display: block;
                }

                .dashboard-action small {
                    margin-top: 2px;
                    color: #6b7280;
                }

                @media (max-width: 575.98px) {
                    .dashboard-page {
                        padding: 20px 12px !important;
                    }

                    .dashboard-stat-card {
                        min-height: 128px;
                        padding: 18px;
                    }

                    .dashboard-summary {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
