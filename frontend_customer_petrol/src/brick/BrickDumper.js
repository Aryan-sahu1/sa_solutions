import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    date: "",
    party_id: "",
    round: "",
    rate: "",
    amt: "",
    remarks: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) return "";
    return String(value);
};

const getCurrentDateValue = () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const toDateInputValue = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const timezoneOffset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const calculateAmount = (round, rate) => {
    const roundValue = Number(round);
    const rateValue = Number(rate);

    if (Number.isNaN(roundValue) || Number.isNaN(rateValue)) return "";

    return String(roundValue * rateValue);
};

const BrickDumper = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [parties, setParties] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);

    const getDefaultFormData = useCallback(() => ({
        ...initialFormData,
        date: getCurrentDateValue(),
        party_id: toInputValue(parties[0]?.id),
    }), [parties]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const getEntries = useCallback(
        async (currentPage, currentLimit, currentSearch, currentDateFilter) => {
            try {
                setListLoading(true);
                setError("");

                const params = {
                    page: currentPage,
                    limit: currentLimit,
                };

                if (currentSearch) params.search = currentSearch;
                if (currentDateFilter) params.date = currentDateFilter;

                const response = await axios.get(`${API_BASE_URL}/brick-dumper`, {
                    params,
                    headers: {
                        ...authHeaders,
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                    },
                });

                if (response.data.status) {
                    setEntries(response.data.data || []);
                    setTotalRecords(Number(response.data.pagination?.total || 0));
                    return;
                }

                setEntries([]);
                setTotalRecords(0);
                setError(response.data.message || "No dumper entries found");
            } catch (err) {
                console.error("Dumper entry list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(err.response?.data?.message || "Failed to fetch dumper entries");
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getParties = useCallback(async () => {
        if (!authHeaders.Authorization) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/party`, {
                params: { page: 1, limit: 1000 },
                headers: authHeaders,
            });

            if (response.data.status) {
                const nextParties = response.data.data || [];
                setParties(nextParties);
                setFormData((current) => ({
                    ...current,
                    date: current.date || getCurrentDateValue(),
                    party_id: current.party_id || toInputValue(nextParties[0]?.id),
                }));
            }
        } catch (err) {
            console.error("Dumper party option error:", err);
            setError(err.response?.data?.message || "Failed to fetch party options");
        }
    }, [authHeaders]);

    useEffect(() => {
        getParties();
    }, [getParties]);

    useEffect(() => {
        getEntries(page, limit, debouncedSearch, dateFilter);
    }, [page, limit, debouncedSearch, dateFilter, getEntries]);

    const resetForm = () => {
        setFormData(getDefaultFormData());
        setEditId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((current) => {
            const nextData = { ...current, [name]: value };

            if (name === "round" || name === "rate") {
                nextData.amt = calculateAmount(
                    name === "round" ? value : nextData.round,
                    name === "rate" ? value : nextData.rate
                );
            }

            return nextData;
        });
    };

    const handleAdd = () => {
        resetForm();
        setShowForm(true);
        setMessage("");
        setError("");
    };

    const handleCancel = () => {
        resetForm();
        setShowForm(false);
        setError("");
    };

    const validateForm = () => {
        if (!formData.date) return "Date is required";
        if (!formData.party_id) return "Party is required";
        if (!formData.round) return "Round is required";
        if (!formData.rate) return "Rate is required";
        if (!formData.amt) return "Amount is required";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = {
            date: toInputValue(formData.date).trim(),
            party_id: formData.party_id,
            round: toInputValue(formData.round).trim(),
            rate: toInputValue(formData.rate).trim(),
            amt: toInputValue(formData.amt).trim(),
            remarks: toInputValue(formData.remarks).trim(),
        };

        try {
            setLoading(true);

            const config = {
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json",
                },
            };

            const response = editId
                ? await axios.put(`${API_BASE_URL}/brick-dumper/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/brick-dumper`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId ? "Dumper entry updated successfully" : "Dumper entry saved successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to save dumper entry");
        } catch (err) {
            console.error("Save dumper entry error:", err);
            setError(err.response?.data?.message || "Failed to save dumper entry");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entry) => {
        setEditId(entry.id);
        setFormData({
            date: toDateInputValue(entry.date),
            party_id: toInputValue(entry.crid),
            round: toInputValue(entry.round),
            rate: toInputValue(entry.rate),
            amt: toInputValue(entry.amt || entry.detail_amount),
            remarks: toInputValue(entry.remarks),
        });
        setShowForm(true);
        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this dumper entry?"
        );

        if (!confirmDelete) return;

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/brick-dumper/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Dumper entry deleted successfully");

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to delete dumper entry");
        } catch (err) {
            console.error("Delete dumper entry error:", err);
            setError(err.response?.data?.message || "Failed to delete dumper entry");
        }
    };

    const handlePageChange = (event) => {
        setPage(Math.floor(event.first / event.rows) + 1);
        setLimit(event.rows);
    };

    const serialNumberTemplate = (row, options) => {
        return (page - 1) * limit + options.rowIndex + 1;
    };

    const dateBodyTemplate = (row) => toDateInputValue(row.date);

    const actionBodyTemplate = (row) => {
        return (
            <div>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => handleEdit(row)}
                >
                    Edit
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(row.id)}
                >
                    Delete
                </button>
            </div>
        );
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Dumper Entry</h2>
                    <p className="text-muted mb-0">
                        Create and manage dumper entries
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                        if (showForm) {
                            handleCancel();
                            return;
                        }

                        handleAdd();
                    }}
                >
                    {showForm ? "Close" : "+ Add Dumper Entry"}
                </button>
            </div>

            {message && (
                <div className="alert alert-success">
                    {message}
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white">
                        <h5 className="mb-0">
                            {editId ? "Edit Dumper Entry" : "Add Dumper Entry"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Party</label>
                                    <select
                                        className="form-select"
                                        name="party_id"
                                        value={formData.party_id}
                                        onChange={handleChange}
                                    >
                                        {parties.map((party) => (
                                            <option key={party.id} value={party.id}>
                                                {party.name || `Party #${party.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Round</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="round"
                                        placeholder="Round"
                                        value={formData.round}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Rate</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="rate"
                                        placeholder="Rate"
                                        value={formData.rate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="amt"
                                        placeholder="Amount"
                                        value={formData.amt}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Remark</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="remarks"
                                        placeholder="Enter remark"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-12">
                                    <button
                                        type="submit"
                                        className="btn btn-success me-2"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Saving..."
                                            : editId
                                                ? "Update Entry"
                                                : "Save Entry"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white p-3">
                    <div className="row align-items-center">
                        <div className="col-md-5">
                            <h5 className="mb-0">Dumper Entry List</h5>
                        </div>

                        <div className="col-md-7 mt-3 mt-md-0">
                            <div className="row g-2">
                                <div className="col-md-7">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search dumper entry..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-5">
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={dateFilter}
                                        onChange={(e) => {
                                            setDateFilter(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={entries}
                        loading={listLoading}
                        lazy
                        paginator
                        first={(page - 1) * limit}
                        rows={limit}
                        totalRecords={totalRecords}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPage={handlePageChange}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: "54rem" }}
                        emptyMessage={debouncedSearch ? "No dumper entries found for this search" : "No dumper entries found"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} dumper entries"
                        showCurrentPageReport
                    >
                        <Column header="#" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column header="Date" body={dateBodyTemplate} />
                        <Column field="party_name" header="Party" />
                        <Column field="round" header="Round" />
                        <Column field="rate" header="Rate" />
                        <Column field="amt" header="Amount" />
                        <Column field="remarks" header="Remark" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "180px" }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default BrickDumper;
