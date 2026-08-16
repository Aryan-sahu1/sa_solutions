import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    date: "",
    ship_no: "",
    pid: "",
    sid: "",
    qty: "",
    rate: "",
    amount: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
};

const calculateAmount = (qty, rate) => {
    const qtyValue = Number(qty);
    const rateValue = Number(rate);

    if (Number.isNaN(qtyValue) || Number.isNaN(rateValue)) {
        return "";
    }

    return String(qtyValue * rateValue);
};

const getCurrentDateTimeValue = () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 16);
};

const toDateTimeInputValue = (value) => {
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
        .slice(0, 16);
};

const AddItem = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [parties, setParties] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);

    const getDefaultFormData = useCallback(() => ({
        ...initialFormData,
        date: getCurrentDateTimeValue(),
        pid: toInputValue(parties[0]?.id),
        sid: toInputValue(stockItems[0]?.id),
    }), [parties, stockItems]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const getEntries = useCallback(
        async (currentPage, currentLimit, currentSearch) => {
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

                const response = await axios.get(
                    `${API_BASE_URL}/customer-petrol`,
                    {
                        params,
                        headers: {
                            ...authHeaders,
                            "Cache-Control": "no-cache",
                            Pragma: "no-cache",
                        },
                    }
                );

                if (response.data.status) {
                    setEntries(response.data.data || []);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                    return;
                }

                setEntries([]);
                setTotalRecords(0);
                setError(response.data.message || "No entries found");
            } catch (err) {
                console.error("Customer petrol entry list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch entries"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getOptions = useCallback(async () => {
        if (!authHeaders.Authorization) {
            return;
        }

        try {
            const [partyResult, stockResult] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/party`, {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }),
                axios.get(`${API_BASE_URL}/stock-item`, {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }),
            ]);

            let nextParties = [];
            let nextStockItems = [];

            if (
                partyResult.status === "fulfilled" &&
                partyResult.value.data.status
            ) {
                nextParties = partyResult.value.data.data || [];
            }

            if (
                stockResult.status === "fulfilled" &&
                stockResult.value.data.status
            ) {
                nextStockItems = stockResult.value.data.data || [];
            }

            setParties(nextParties);
            setStockItems(nextStockItems);
            setFormData((current) => ({
                ...current,
                pid: current.pid || toInputValue(nextParties[0]?.id),
                sid: current.sid || toInputValue(nextStockItems[0]?.id),
            }));
        } catch (err) {
            console.error("Customer petrol option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch party or stock item options"
            );
        }
    }, [authHeaders]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    useEffect(() => {
        getEntries(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getEntries]);

    const resetForm = () => {
        setFormData(getDefaultFormData());
        setEditId(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((current) => {
            const nextData = {
                ...current,
                [name]: value,
            };

            if (name === "qty" || name === "rate") {
                nextData.amount = calculateAmount(
                    name === "qty" ? value : nextData.qty,
                    name === "rate" ? value : nextData.rate
                );
            }

            return nextData;
        });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const payload = {
            date: toInputValue(formData.date).trim(),
            ship_no: toInputValue(formData.ship_no).trim(),
            pid: formData.pid,
            sid: formData.sid,
            qty: toInputValue(formData.qty).trim(),
            rate: toInputValue(formData.rate).trim(),
            amount: toInputValue(formData.amount).trim(),
        };

        if (!payload.date) {
            setError("Date is required");
            return;
        }

        if (!payload.ship_no) {
            setError("Ship no is required");
            return;
        }

        if (!payload.pid) {
            setError("Party is required");
            return;
        }

        if (!payload.sid) {
            setError("Stock item is required");
            return;
        }

        if (!payload.qty) {
            setError("Qty is required");
            return;
        }

        if (!payload.rate) {
            setError("Rate is required");
            return;
        }

        if (!payload.amount) {
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
                ? await axios.put(
                    `${API_BASE_URL}/customer-petrol/${editId}`,
                    payload,
                    config
                )
                : await axios.post(
                    `${API_BASE_URL}/customer-petrol`,
                    payload,
                    config
                );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Entry updated successfully"
                        : "Entry created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save entry");
        } catch (err) {
            console.error("Save customer petrol entry error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save entry"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entry) => {
        setEditId(entry.id);
        setFormData({
            date: toDateTimeInputValue(entry.date),
            ship_no: toInputValue(entry.ship_no),
            pid: toInputValue(entry.pid),
            sid: toInputValue(entry.sid),
            qty: toInputValue(entry.qty),
            rate: toInputValue(entry.rate),
            amount: toInputValue(entry.amount),
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
            "Are you sure you want to delete this entry?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `${API_BASE_URL}/customer-petrol/${id}`,
                {
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Entry deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete entry");
        } catch (err) {
            console.error("Delete customer petrol entry error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete entry"
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

    const dateBodyTemplate = (row) => {
        if (!row.date) {
            return "-";
        }

        return new Date(row.date).toLocaleString();
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
                    <h2 className="fw-bold mb-1">Add Item</h2>
                    <p className="text-muted mb-0">
                        Create and manage petrol data entries
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
                            {editId ? "Edit Entry" : "Add Entry"}
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
                                        type="datetime-local"
                                        className="form-control"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Ship No
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="ship_no"
                                        placeholder="Enter ship no"
                                        value={formData.ship_no}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Party
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
                                        Stock Item
                                    </label>
                                    <select
                                        className="form-select"
                                        name="sid"
                                        value={formData.sid}
                                        onChange={handleChange}
                                    >
                                        {stockItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Qty
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="qty"
                                        placeholder="Enter qty"
                                        value={formData.qty}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Rate
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="rate"
                                        placeholder="Enter rate"
                                        value={formData.rate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="amount"
                                        placeholder="Enter amount"
                                        value={formData.amount}
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
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search entry..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
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
                        tableStyle={{ minWidth: "72rem" }}
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
                            header="#"
                            body={serialNumberTemplate}
                            style={{ width: "80px" }}
                        />
                        <Column
                            header="Date"
                            body={dateBodyTemplate}
                        />
                        <Column field="ship_no" header="Ship No" />
                        <Column field="party_name" header="Party" />
                        <Column field="stock_item_name" header="Stock Item" />
                        <Column field="qty" header="Qty" />
                        <Column field="rate" header="Rate" />
                        <Column field="amount" header="Amount" />
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

export default AddItem;
