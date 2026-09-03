import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    date: "",
    pid: "",
    iid: "",
    qty: "",
    amt: "",
    remarks: "",
    vehicle_text: "",
    cash: "",
    cgst: "",
    igst: "",
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

const BrickPurchase = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [parties, setParties] = useState([]);
    const [stockItems, setStockItems] = useState([]);
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
        iid: toInputValue(stockItems[0]?.id),
    }), [parties, stockItems]);

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
                    purchase_type: "bricks",
                };

                if (currentSearch) params.search = currentSearch;
                if (currentDateFilter) params.date = currentDateFilter;

                const response = await axios.get(`${API_BASE_URL}/purchase`, {
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
                setError(response.data.message || "No purchase entries found");
            } catch (err) {
                console.error("Brick purchase list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(err.response?.data?.message || "Failed to fetch purchase entries");
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getOptions = useCallback(async () => {
        if (!authHeaders.Authorization) return;

        try {
            const [partyResult, stockResult] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/party`, {
                    params: { page: 1, limit: 1000 },
                    headers: authHeaders,
                }),
                axios.get(`${API_BASE_URL}/stock-item`, {
                    params: { page: 1, limit: 1000 },
                    headers: authHeaders,
                }),
            ]);

            const nextParties =
                partyResult.status === "fulfilled" && partyResult.value.data.status
                    ? partyResult.value.data.data || []
                    : [];
            const nextStockItems =
                stockResult.status === "fulfilled" && stockResult.value.data.status
                    ? stockResult.value.data.data || []
                    : [];

            setParties(nextParties);
            setStockItems(nextStockItems);
            setFormData((current) => ({
                ...current,
                date: current.date || getCurrentDateValue(),
                pid: current.pid || toInputValue(nextParties[0]?.id),
                iid: current.iid || toInputValue(nextStockItems[0]?.id),
            }));
        } catch (err) {
            console.error("Brick purchase option error:", err);
            setError(err.response?.data?.message || "Failed to fetch purchase options");
        }
    }, [authHeaders]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    useEffect(() => {
        getEntries(page, limit, debouncedSearch, dateFilter);
    }, [page, limit, debouncedSearch, dateFilter, getEntries]);

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
        if (!formData.pid) return "Party is required";
        if (!formData.iid) return "Stock item is required";
        if (!formData.qty) return "Quantity is required";
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
            purchase_type: "bricks",
            date: toInputValue(formData.date).trim(),
            pid: formData.pid,
            iid: formData.iid,
            qty: toInputValue(formData.qty).trim(),
            amt: toInputValue(formData.amt).trim(),
            remarks: toInputValue(formData.remarks).trim(),
            vehicle_text: toInputValue(formData.vehicle_text).trim(),
            cash: toInputValue(formData.cash).trim(),
            cgst: toInputValue(formData.cgst).trim(),
            igst: toInputValue(formData.igst).trim(),
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
                ? await axios.put(`${API_BASE_URL}/purchase/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/purchase`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId ? "Purchase entry updated successfully" : "Purchase entry saved successfully")
                );
                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to save purchase entry");
        } catch (err) {
            console.error("Save brick purchase error:", err);
            setError(err.response?.data?.message || "Failed to save purchase entry");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entry) => {
        const firstItem = entry.items?.[0] || {};

        setEditId(entry.id);
        setFormData({
            date: toDateInputValue(entry.date),
            pid: toInputValue(entry.crid || entry.pid),
            iid: toInputValue(firstItem.iid),
            qty: toInputValue(firstItem.qty),
            amt: toInputValue(firstItem.amt || entry.amt),
            remarks: toInputValue(entry.remarks),
            vehicle_text: toInputValue(entry.vehicle_text || entry.vehicle_name),
            cash: toInputValue(entry.cash),
            cgst: toInputValue(entry.cgst),
            igst: toInputValue(entry.igst),
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
            "Are you sure you want to delete this purchase entry?"
        );

        if (!confirmDelete) return;

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/purchase/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Purchase entry deleted successfully");

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to delete purchase entry");
        } catch (err) {
            console.error("Delete brick purchase error:", err);
            setError(err.response?.data?.message || "Failed to delete purchase entry");
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

    const stockItemBodyTemplate = (row) => row.items?.[0]?.item_name || "-";

    const quantityBodyTemplate = (row) => row.items?.[0]?.qty || "-";

    const vehicleBodyTemplate = (row) => row.vehicle_text || "-";

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
                    <h2 className="fw-bold mb-1">Brick Purchase</h2>
                    <p className="text-muted mb-0">
                        Create and manage brick purchase entries
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
                    {showForm ? "Close" : "+ Add Purchase"}
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
                            {editId ? "Edit Purchase" : "Add Purchase"}
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
                                    <label className="form-label fw-semibold">Stock Item</label>
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

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Vehicle Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="vehicle_text"
                                        placeholder="Enter vehicle number"
                                        value={formData.vehicle_text}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Quantity</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="qty"
                                        placeholder="Enter quantity"
                                        value={formData.qty}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Amount</label>
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

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Cash</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="cash"
                                        placeholder="Cash"
                                        value={formData.cash}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">CGST</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="cgst"
                                        placeholder="CGST"
                                        value={formData.cgst}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">IGST</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="igst"
                                        placeholder="IGST"
                                        value={formData.igst}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Remarks</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="remarks"
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
                                                ? "Update Purchase"
                                                : "Save Purchase"}
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
                            <h5 className="mb-0">Brick Purchase List</h5>
                        </div>

                        <div className="col-md-7 mt-3 mt-md-0">
                            <div className="row g-2">
                                <div className="col-md-7">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search purchase..."
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
                        tableStyle={{ minWidth: "72rem" }}
                        emptyMessage={debouncedSearch ? "No purchase found for this search" : "No purchase found"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} purchase"
                        showCurrentPageReport
                    >
                        <Column header="#" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column header="Date" body={dateBodyTemplate} />
                        <Column field="party_name" header="Party" />
                        <Column header="Stock Item" body={stockItemBodyTemplate} />
                        <Column header="Quantity" body={quantityBodyTemplate} />
                        <Column field="amt" header="Amount" />
                        <Column field="remarks" header="Remarks" />
                        <Column header="Vehicle Number" body={vehicleBodyTemplate} />
                        <Column field="cash" header="Cash" />
                        <Column field="cgst" header="CGST" />
                        <Column field="igst" header="IGST" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "180px" }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default BrickPurchase;
