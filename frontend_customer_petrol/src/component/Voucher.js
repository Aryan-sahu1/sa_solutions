import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    date: "",
    pid: "",
    crid: "",
    amt: "",
    remarks: "",
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

const toDateInputValue = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const timezoneOffset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const Voucher = () => {
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
        pid: toInputValue(parties[0]?.id),
        crid: toInputValue(parties[1]?.id || parties[0]?.id),
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

                if (currentSearch) {
                    params.search = currentSearch;
                }

                if (currentDateFilter) {
                    params.date = currentDateFilter;
                }

                const response = await axios.get(`${API_BASE_URL}/voucher`, {
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
                setError(response.data.message || "No voucher entries found");
            } catch (err) {
                console.error("Voucher list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch voucher entries"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getParties = useCallback(async () => {
        if (!authHeaders.Authorization) {
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/party`, {
                params: {
                    page: 1,
                    limit: 1000,
                },
                headers: authHeaders,
            });

            const nextParties = response.data.status ? response.data.data || [] : [];

            setParties(nextParties);
            setFormData((current) => ({
                ...current,
                date: current.date || getCurrentDateValue(),
                pid: current.pid || toInputValue(nextParties[0]?.id),
                crid: current.crid || toInputValue(nextParties[1]?.id || nextParties[0]?.id),
            }));
        } catch (err) {
            console.error("Voucher party option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch party options"
            );
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

    const handleAdd = () => {
        resetForm();
        setShowForm(true);
        setMessage("");
        setError("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleFormKeyDown = (e) => {
        if (e.key !== "Enter" || e.target.tagName === "TEXTAREA") {
            return;
        }

        const focusableFields = Array.from(
            e.currentTarget.querySelectorAll(
                "input:not([type='hidden']), select, textarea, button"
            )
        ).filter(
            (field) =>
                !field.disabled &&
                !field.readOnly &&
                field.offsetParent !== null
        );
        const currentIndex = focusableFields.indexOf(e.target);
        const nextField = focusableFields[currentIndex + 1];

        if (nextField) {
            e.preventDefault();
            nextField.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const payload = {
            date: toInputValue(formData.date).trim(),
            pid: formData.pid,
            crid: formData.crid,
            amt: toInputValue(formData.amt).trim(),
            remarks: toInputValue(formData.remarks).trim(),
        };

        if (!payload.date) {
            setError("Date is required");
            return;
        }

        if (!payload.pid) {
            setError("Debit party is required");
            return;
        }

        if (!payload.crid) {
            setError("Credit party is required");
            return;
        }

        if (!payload.amt) {
            setError("Amount is required");
            return;
        }

        try {
            setLoading(true);

            const config = {
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json",
                },
            };

            const response = editId
                ? await axios.put(`${API_BASE_URL}/voucher/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/voucher`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Voucher entry updated successfully"
                        : "Voucher entry created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to save voucher entry");
        } catch (err) {
            console.error("Save voucher error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save voucher entry"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        setShowForm(false);
        setError("");
    };

    const handleEdit = (entry) => {
        setEditId(entry.id);
        setFormData({
            date: toDateInputValue(entry.date),
            pid: toInputValue(entry.pid),
            crid: toInputValue(entry.crid),
            amt: toInputValue(entry.amt),
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
            "Are you sure you want to delete this voucher entry?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/voucher/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Voucher entry deleted successfully");

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to delete voucher entry");
        } catch (err) {
            console.error("Delete voucher error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete voucher entry"
            );
        }
    };

    const handlePageChange = (event) => {
        setPage(Math.floor(event.first / event.rows) + 1);
        setLimit(event.rows);
    };

    const serialNumberTemplate = (row, options) => {
        return (page - 1) * limit + options.rowIndex + 1;
    };

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
                    <h2 className="fw-bold mb-1">Voucher Entry</h2>
                    <p className="text-muted mb-0">
                        Create and manage voucher entries
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
                    {showForm ? "Close" : "+ Add Entry"}
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
                            {editId ? "Edit Entry" : "New Entry"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Debit Party
                                    </label>
                                    <select
                                        className="form-select"
                                        name="pid"
                                        value={formData.pid}
                                        onChange={handleChange}
                                    >
                                        {parties.map((party) => (
                                            <option key={party.id} value={party.id}>
                                                {party.name || `Party #${party.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Credit Party
                                    </label>
                                    <select
                                        className="form-select"
                                        name="crid"
                                        value={formData.crid}
                                        onChange={handleChange}
                                    >
                                        {parties.map((party) => (
                                            <option key={party.id} value={party.id}>
                                                {party.name || `Party #${party.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="amt"
                                        placeholder="Enter amount"
                                        value={formData.amt}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-semibold">
                                        Remarks
                                    </label>
                                    <textarea
                                        className="form-control"
                                        name="remarks"
                                        rows="2"
                                        placeholder="Enter remarks"
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
                                                ? "Update"
                                                : "Save"}
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
                        <div className="col-md-6">
                            <h5 className="mb-0">Entry List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <div className="row g-2">
                                <div className="col-md-7">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search entry..."
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
                        tableStyle={{ minWidth: "64rem" }}
                        emptyMessage={
                            debouncedSearch
                                ? "No entries found for this search"
                                : "No entries found"
                        }
                        paginatorTemplate={
                            "FirstPageLink " +
                            "PrevPageLink " +
                            "PageLinks " +
                            "NextPageLink " +
                            "LastPageLink " +
                            "RowsPerPageDropdown"
                        }
                        currentPageReportTemplate={
                            "Showing {first} to {last} of {totalRecords} entries"
                        }
                        showCurrentPageReport
                    >
                        <Column
                            header="Sn"
                            body={serialNumberTemplate}
                            style={{ width: "80px" }}
                        />
                        <Column field="debit_party_name" header="Debit Party" />
                        <Column field="credit_party_name" header="Credit Party" />
                        <Column field="amt" header="Amount" />
                        <Column
                            header="Action"
                            body={actionBodyTemplate}
                            style={{ width: "180px" }}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Voucher;
