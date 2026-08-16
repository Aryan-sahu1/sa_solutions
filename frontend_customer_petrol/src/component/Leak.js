import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    date: "",
    iid: "",
    qty: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
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

const Leak = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
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
        iid: toInputValue(stockItems[0]?.id),
    }), [stockItems]);

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

                const response = await axios.get(`${API_BASE_URL}/leak`, {
                    params,
                    headers: {
                        ...authHeaders,
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                    },
                });

                if (response.data.status) {
                    setEntries(response.data.data || []);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                    return;
                }

                setEntries([]);
                setTotalRecords(0);
                setError(response.data.message || "No leak entries found");
            } catch (err) {
                console.error("Leak entry list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch leak entries"
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
            const response = await axios.get(`${API_BASE_URL}/stock-item`, {
                params: {
                    page: 1,
                    limit: 1000,
                },
                headers: authHeaders,
            });

            const nextStockItems = response.data.status
                ? response.data.data || []
                : [];

            setStockItems(nextStockItems);
            setFormData((current) => ({
                ...current,
                iid: current.iid || toInputValue(nextStockItems[0]?.id),
            }));
        } catch (err) {
            console.error("Leak option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch stock item options"
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
            iid: formData.iid,
            qty: toInputValue(formData.qty).trim(),
        };

        if (!payload.date) {
            setError("Date is required");
            return;
        }

        if (!payload.iid) {
            setError("Stock item is required");
            return;
        }

        if (!payload.qty) {
            setError("Qty is required");
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
                ? await axios.put(`${API_BASE_URL}/leak/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/leak`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Leak entry updated successfully"
                        : "Leak entry created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save leak entry");
        } catch (err) {
            console.error("Save leak entry error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save leak entry"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entry) => {
        setEditId(entry.id);
        setFormData({
            date: toDateTimeInputValue(entry.date),
            iid: toInputValue(entry.iid),
            qty: toInputValue(entry.qty),
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
            "Are you sure you want to delete this leak entry?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/leak/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Leak entry deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete leak entry");
        } catch (err) {
            console.error("Delete leak entry error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete leak entry"
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
        console.log(row.date, "row.daterow.date")
        return new Date(row.date).toLocaleDateString('en-GB');
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
                    <h2 className="fw-bold mb-1">Leak</h2>
                    <p className="text-muted mb-0">
                        Create and manage leak entries
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
                    {showForm ? "Close" : "+ Add Leak"}
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
                            {editId ? "Edit Leak" : "Add Leak"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-4">
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

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Stock Item
                                    </label>
                                    <select
                                        className="form-select"
                                        name="iid"
                                        value={formData.iid}
                                        onChange={handleChange}
                                    >
                                        {stockItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
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
                            <h5 className="mb-0">Leak List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search leak..."
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
                        tableStyle={{ minWidth: "52rem" }}
                        emptyMessage={
                            debouncedSearch
                                ? "No leak entries found for this search"
                                : "No leak entries found"
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
                        <Column field="stock_item_name" header="Stock Item" />
                        <Column field="qty" header="Qty" />
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

export default Leak;
