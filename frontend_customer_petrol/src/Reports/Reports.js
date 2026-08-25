import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    fromDate: "",
    toDate: "",
    reportId: "",
    partyId: "",
    shift: "",
    productCategoryId: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
};

const getCurrentDateValue = () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const Reports = () => {
    const { authHeaders } = useAuth();
    const [formData, setFormData] = useState({
        ...initialFormData,
        fromDate: getCurrentDateValue(),
        toDate: getCurrentDateValue(),
    });
    const [reports, setReports] = useState([]);
    const [parties, setParties] = useState([]);
    const [productCategories, setProductCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const getOptions = useCallback(async () => {
        if (!authHeaders.Authorization) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            const [reportResult, partyResult, categoryResult] =
                await Promise.allSettled([
                    axios.get(`${API_BASE_URL}/master/customer-options`, {
                        params: { page: 1, limit: 1000 },
                        headers: authHeaders,
                    }),
                    axios.get(`${API_BASE_URL}/party`, {
                        params: { page: 1, limit: 1000 },
                        headers: authHeaders,
                    }),
                    axios.get(`${API_BASE_URL}/product-category`, {
                        params: { page: 1, limit: 1000 },
                        headers: authHeaders,
                    }),
                ]);

            const nextReports =
                reportResult.status === "fulfilled" && reportResult.value.data.status
                    ? reportResult.value.data.data || []
                    : [];
            const nextParties =
                partyResult.status === "fulfilled" && partyResult.value.data.status
                    ? partyResult.value.data.data || []
                    : [];
            const nextCategories =
                categoryResult.status === "fulfilled" && categoryResult.value.data.status
                    ? categoryResult.value.data.data || []
                    : [];

            setReports(nextReports);
            setParties(nextParties);
            setProductCategories(nextCategories);

            setFormData((current) => ({
                ...current,
                reportId: current.reportId || toInputValue(nextReports[0]?.id),
                partyId: current.partyId || toInputValue(nextParties[0]?.id),
                productCategoryId:
                    current.productCategoryId || toInputValue(nextCategories[0]?.id),
            }));
        } catch (err) {
            console.error("Report option error:", err);
            setError(err.response?.data?.message || "Failed to fetch report options");
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleReset = () => {
        setFormData({
            ...initialFormData,
            fromDate: getCurrentDateValue(),
            toDate: getCurrentDateValue(),
            reportId: toInputValue(reports[0]?.id),
            partyId: toInputValue(parties[0]?.id),
            productCategoryId: toInputValue(productCategories[0]?.id),
        });
        setMessage("");
        setError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!formData.fromDate) {
            setError("From date is required");
            return;
        }

        if (!formData.toDate) {
            setError("To date is required");
            return;
        }

        if (!formData.reportId) {
            setError("Report dropdown is required");
            return;
        }

        setMessage("Report filters are ready");
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Reports</h2>
                    <p className="text-muted mb-0">
                        Select report filters by date, party, shift, and product category
                    </p>
                </div>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white">
                    <h5 className="mb-0">Report Form</h5>
                </div>

                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4 col-lg-2">
                                <label className="form-label fw-semibold">From Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="fromDate"
                                    value={formData.fromDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4 col-lg-2">
                                <label className="form-label fw-semibold">To Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="toDate"
                                    value={formData.toDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4 col-lg-3">
                                <label className="form-label fw-semibold">Dropdown</label>
                                <select
                                    className="form-select"
                                    name="reportId"
                                    value={formData.reportId}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="">Select report</option>
                                    {reports.map((report) => (
                                        <option key={report.id} value={report.id}>
                                            {report.name || `Report #${report.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4 col-lg-3">
                                <label className="form-label fw-semibold">
                                    Transaction Party
                                </label>
                                <select
                                    className="form-select"
                                    name="partyId"
                                    value={formData.partyId}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="">Select party</option>
                                    {parties.map((party) => (
                                        <option key={party.id} value={party.id}>
                                            {party.name || `Party #${party.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4 col-lg-2">
                                <label className="form-label fw-semibold">Shift</label>
                                <select
                                    className="form-select"
                                    name="shift"
                                    value={formData.shift}
                                    onChange={handleChange}
                                >
                                    <option value="">All</option>
                                    <option value="day">Day</option>
                                    <option value="night">Night</option>
                                </select>
                            </div>

                            <div className="col-md-4 col-lg-3">
                                <label className="form-label fw-semibold">
                                    Product Category
                                </label>
                                <select
                                    className="form-select"
                                    name="productCategoryId"
                                    value={formData.productCategoryId}
                                    onChange={handleChange}
                                    disabled={loading}
                                >
                                    <option value="">Select product category</option>
                                    {productCategories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name || `Category #${category.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-12">
                                <button
                                    type="submit"
                                    className="btn btn-primary me-2"
                                    disabled={loading}
                                >
                                    View Report
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleReset}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Reports;
