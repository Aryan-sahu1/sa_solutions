import React, { useMemo, useState } from "react";
import {
    FaBoxOpen,
    FaCalendarAlt,
    FaCheckCircle,
    FaIdBadge,
    FaMobileAlt,
    FaRedo,
    FaRegBuilding,
    FaRupeeSign,
    FaUser,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatAmount = (value) => {
    const amount = Number(value || 0);

    if (!amount) {
        return "Not set";
    }

    return amount.toLocaleString("en-IN");
};

const Dashboard = () => {
    const { customer, verifyCustomer } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState("");

    const productName =
        customer?.product?.name ||
        customer?.product_name ||
        "Product not assigned";

    const subscription = useMemo(() => {
        const today = new Date();
        const endDate = customer?.end_date ? new Date(customer.end_date) : null;

        if (!endDate || Number.isNaN(endDate.getTime())) {
            return {
                label: "No expiry date",
                className: "text-bg-secondary",
                daysLeft: null,
            };
        }

        const diff = endDate.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            return {
                label: "Expired",
                className: "text-bg-danger",
                daysLeft,
            };
        }

        if (daysLeft <= 30) {
            return {
                label: "Renew soon",
                className: "text-bg-warning",
                daysLeft,
            };
        }

        return {
            label: "Active",
            className: "text-bg-success",
            daysLeft,
        };
    }, [customer?.end_date]);

    const isPlanExpired = subscription.daysLeft !== null && subscription.daysLeft <= 0;

    const customerCards = [
        {
            title: "Assigned Product",
            value: productName,
            icon: <FaBoxOpen />,
            tone: "primary",
        },
        {
            title: "Company Code",
            value: customer?.company_code || "Not set",
            icon: <FaIdBadge />,
            tone: "success",
        },
        {
            title: "Contact Person",
            value: customer?.contact_person || customer?.name || "Not set",
            icon: <FaUser />,
            tone: "info",
        },
        {
            title: "Mobile",
            value: customer?.mobile || "Not set",
            icon: <FaMobileAlt />,
            tone: "dark",
        },
    ];

    const handleRefresh = async () => {
        setRefreshing(true);
        setMessage("");

        const verified = await verifyCustomer();

        setMessage(
            verified
                ? "Customer details refreshed successfully"
                : "Unable to refresh customer details"
        );
        setRefreshing(false);
    };

    return (
        <div className="customer-dashboard container-fluid p-4">
            {isPlanExpired && (
                <marquee className="plan-expired-marquee mb-3">
                   Your plan has expired. Please renew your plan to continue using the service.
                </marquee>
            )}

            <section className="dashboard-hero mb-4">
                <div>
                    <span className="badge rounded-pill text-bg-light mb-3">
                        <FaCheckCircle /> Verified Customer
                    </span>
                    <h2 className="fw-bold mb-2">
                        Welcome, {customer?.name || customer?.username || "Customer"}
                    </h2>
                    <p className="mb-0">
                        Your active product is <strong>{productName}</strong>.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-light d-inline-flex align-items-center gap-2"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <FaRedo />
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </section>

            {message && (
                <div className="alert alert-info py-2">
                    {message}
                </div>
            )}

            <div className="row g-3 mb-4">
                {customerCards.map((card) => (
                    <div className="col-12 col-md-6 col-xl-3" key={card.title}>
                        <div className="customer-card">
                            <span className={`customer-card-icon bg-${card.tone}`}>
                                {card.icon}
                            </span>
                            <span className="customer-card-title">
                                {card.title}
                            </span>
                            <strong>{card.value}</strong>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-7">
                    <div className="dashboard-panel">
                        <div className="dashboard-panel-header">
                            <h5 className="mb-0">Product Details</h5>
                            <span className={`badge ${subscription.className}`}>
                                {subscription.label}
                            </span>
                        </div>

                        <div className="dashboard-details">
                            <div>
                                <span><FaBoxOpen /> Product Name</span>
                                <strong>{productName}</strong>
                            </div>
                            <div>
                                <span><FaCalendarAlt /> Start Date</span>
                                <strong>{formatDate(customer?.start_date)}</strong>
                            </div>
                            <div>
                                <span><FaCalendarAlt /> End Date</span>
                                <strong>{formatDate(customer?.end_date)}</strong>
                            </div>
                            <div>
                                <span><FaRupeeSign /> Product Price</span>
                                <strong>{formatAmount(customer?.product_price)}</strong>
                            </div>
                            <div>
                                <span><FaRupeeSign /> AMC Price</span>
                                <strong>{formatAmount(customer?.amc_price)}</strong>
                            </div>
                            <div>
                                <span><FaCheckCircle /> Days Left</span>
                                <strong>
                                    {subscription.daysLeft === null
                                        ? "Not set"
                                        : `${Math.max(subscription.daysLeft, 0)} days`}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-5">
                    <div className="dashboard-panel">
                        <div className="dashboard-panel-header">
                            <h5 className="mb-0">Customer Profile</h5>
                        </div>

                        <div className="profile-list">
                            <div>
                                <span><FaRegBuilding /> Address</span>
                                <strong>
                                    {[customer?.address, customer?.address1]
                                        .filter(Boolean)
                                        .join(", ") || "Not set"}
                                </strong>
                            </div>
                            <div>
                                <span>GST No.</span>
                                <strong>{customer?.gstno || "Not set"}</strong>
                            </div>
                            <div>
                                <span>Username</span>
                                <strong>{customer?.username || "Not set"}</strong>
                            </div>
                            <div>
                                <span>Remarks</span>
                                <strong>{customer?.remarks || "No remarks"}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .customer-dashboard {
                    color: #172033;
                }

                .dashboard-hero {
                    min-height: 190px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 28px;
                    color: #ffffff;
                    background: linear-gradient(135deg, #0d6efd, #20c997);
                    border-radius: 8px;
                    box-shadow: 0 14px 34px rgba(13, 110, 253, 0.18);
                }

                .plan-expired-marquee {
                    display: block;
                    padding: 11px 16px;
                    color: #ffffff;
                    background: #dc3545;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 700;
                    box-shadow: 0 8px 20px rgba(220, 53, 69, 0.2);
                }

                .dashboard-hero .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    color: #0f5132;
                }

                .dashboard-hero p {
                    font-size: 17px;
                    opacity: 0.95;
                }

                .customer-card,
                .dashboard-panel {
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
                }

                .customer-card {
                    min-height: 148px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 8px;
                    padding: 20px;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .customer-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.1);
                }

                .customer-card-icon {
                    width: 42px;
                    height: 42px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    color: #ffffff;
                }

                .customer-card-title,
                .dashboard-details span,
                .profile-list span {
                    color: #6b7280;
                    font-size: 14px;
                    font-weight: 600;
                }

                .customer-card strong {
                    color: #111827;
                    font-size: 18px;
                    overflow-wrap: anywhere;
                }

                .dashboard-panel {
                    overflow: hidden;
                }

                .dashboard-panel-header {
                    min-height: 62px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 18px 20px;
                    border-bottom: 1px solid #e5e7eb;
                }

                .dashboard-details {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                    padding: 20px;
                }

                .dashboard-details div,
                .profile-list div {
                    min-height: 86px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    gap: 8px;
                    padding: 16px;
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                }

                .dashboard-details span,
                .profile-list span {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                }

                .dashboard-details strong,
                .profile-list strong {
                    color: #111827;
                    overflow-wrap: anywhere;
                }

                .profile-list {
                    display: grid;
                    gap: 14px;
                    padding: 20px;
                }

                @media (max-width: 767.98px) {
                    .customer-dashboard {
                        padding: 20px 12px !important;
                    }

                    .dashboard-hero {
                        align-items: flex-start;
                        flex-direction: column;
                        padding: 22px;
                    }

                    .dashboard-details {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
