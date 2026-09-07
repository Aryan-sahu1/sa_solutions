import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    date: "",
    party_id: "",
    iid: "",
    qty: "",
    vehicle_no: "",
    vamt: "",
    amt: "",
    remarks: "",
    dqty: "",
    damt: "",
    lamt: "",
    creturn: false,
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

const formatAmount = (value) => {
    const amount = Number(value || 0);

    if (Number.isNaN(amount)) return "0.00";

    return amount.toFixed(2);
};

const BrickDelivery = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [parties, setParties] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [vehicles, setVehicles] = useState([]);
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
    const chargesTotal = [formData.vamt, formData.damt, formData.lamt]
        .reduce((total, value) => total + (Number(value) || 0), 0);

    const getDefaultFormData = useCallback(() => ({
        ...initialFormData,
        date: getCurrentDateValue(),
        party_id: toInputValue(parties[0]?.id),
        iid: toInputValue(stockItems[0]?.id),
        vehicle_no: toInputValue(vehicles[0]?.id),
    }), [parties, stockItems, vehicles]);

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

                const response = await axios.get(`${API_BASE_URL}/brick-delivery`, {
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
                setError(response.data.message || "No delivery entries found");
            } catch (err) {
                console.error("Delivery entry list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(err.response?.data?.message || "Failed to fetch delivery entries");
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
                party_id: current.party_id || toInputValue(nextParties[0]?.id),
                iid: current.iid || toInputValue(nextStockItems[0]?.id),
            }));
        } catch (err) {
            console.error("Delivery option error:", err);
            setError(err.response?.data?.message || "Failed to fetch delivery options");
        }
    }, [authHeaders]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    const getVehicles = useCallback(async (partyId) => {
        if (!authHeaders.Authorization || !partyId) {
            setVehicles([]);
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/vehicle-master`, {
                params: { page: 1, limit: 1000, sid: partyId },
                headers: authHeaders,
            });

            const nextVehicles = response.data.status ? response.data.data || [] : [];

            setVehicles(nextVehicles);
            setFormData((current) => {
                const hasSelectedVehicle = nextVehicles.some(
                    (vehicle) => String(vehicle.id) === String(current.vehicle_no)
                );

                return {
                    ...current,
                    vehicle_no: hasSelectedVehicle ? current.vehicle_no : toInputValue(nextVehicles[0]?.id),
                };
            });
        } catch (err) {
            console.error("Delivery vehicle option error:", err);
            setVehicles([]);
            setError(err.response?.data?.message || "Failed to fetch vehicle options");
        }
    }, [authHeaders]);

    useEffect(() => {
        getVehicles(formData.party_id);
    }, [formData.party_id, getVehicles]);

    useEffect(() => {
        getEntries(page, limit, debouncedSearch, dateFilter);
    }, [page, limit, debouncedSearch, dateFilter, getEntries]);

    const resetForm = () => {
        setFormData(getDefaultFormData());
        setEditId(null);
    };

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;

        setFormData((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
            ...(name === "party_id" ? { vehicle_no: "" } : {}),
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
        if (!formData.party_id) return "Party is required";
        if (!formData.iid) return "Item is required";
        if (!formData.vehicle_no) return "Vehicle is required";
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
            date: toInputValue(formData.date).trim(),
            party_id: formData.party_id,
            iid: formData.iid,
            qty: toInputValue(formData.qty).trim(),
            vehicle_no: formData.vehicle_no,
            vamt: toInputValue(formData.vamt).trim(),
            amt: toInputValue(formData.amt).trim(),
            remarks: toInputValue(formData.remarks).trim(),
            dqty: toInputValue(formData.dqty).trim(),
            damt: toInputValue(formData.damt).trim(),
            lamt: toInputValue(formData.lamt).trim(),
            creturn: Boolean(formData.creturn),
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
                ? await axios.put(`${API_BASE_URL}/brick-delivery/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/brick-delivery`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId ? "Delivery entry updated successfully" : "Delivery entry saved successfully")
                );
                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to save delivery entry");
        } catch (err) {
            console.error("Save delivery entry error:", err);
            setError(err.response?.data?.message || "Failed to save delivery entry");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entry) => {
        setEditId(entry.id);
        setFormData({
            date: toDateInputValue(entry.date),
            party_id: toInputValue(entry.pid),
            iid: toInputValue(entry.iid),
            qty: toInputValue(entry.qty),
            vehicle_no: toInputValue(entry.vehicle_no),
            vamt: toInputValue(entry.vamt),
            amt: toInputValue(entry.amt),
            remarks: toInputValue(entry.remarks),
            dqty: toInputValue(entry.dqty),
            damt: toInputValue(entry.damt),
            lamt: toInputValue(entry.lamt),
            creturn: Boolean(Number(entry.creturn)),
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
            "Are you sure you want to delete this delivery entry?"
        );

        if (!confirmDelete) return;

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/brick-delivery/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Delivery entry deleted successfully");

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to delete delivery entry");
        } catch (err) {
            console.error("Delete delivery entry error:", err);
            setError(err.response?.data?.message || "Failed to delete delivery entry");
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

    const signedChallanTemplate = (row) => (
        Number(row.creturn) ? "Yes" : "No"
    );

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
                    <h2 className="fw-bold mb-1">Brick Delivery</h2>
                    <p className="text-muted mb-0">
                        Create and manage brick delivery entries
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
                    {showForm ? "Close" : "+ Add Delivery"}
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
                <div className="card shadow-sm border-0 mb-4 overflow-hidden">
                    <div className="card-header bg-white py-3">
                        <div className="d-flex flex-column flex-lg-row justify-content-between gap-2">
                            <div>
                                <h5 className="mb-1 fw-bold">
                                    {editId ? "Edit Delivery" : "Add Delivery"}
                                </h5>
                                <div className="text-muted small">
                                    Delivery details, vehicle charges and challan status
                                </div>
                            </div>

                            <div className="text-lg-end">
                                <div className="small text-muted">Extra Charges</div>
                                <div className="h5 mb-0 fw-bold">
                                    {formatAmount(chargesTotal)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-body bg-light">
                        <form onSubmit={handleSubmit}>
                            <div className="bg-white border rounded-3 p-3 mb-3">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="fw-bold mb-0">Delivery Details</h6>
                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                                        {editId ? "Editing" : "New Entry"}
                                    </span>
                                </div>

                                <div className="row g-3">
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Party</label>
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

                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Item</label>
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

                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Vehicle</label>
                                        <select
                                            className="form-select"
                                            name="vehicle_no"
                                            value={formData.vehicle_no}
                                            onChange={handleChange}
                                        >
                                            {vehicles.length === 0 && (
                                                <option value="">No vehicle found</option>
                                            )}
                                            {vehicles.map((vehicle) => (
                                                <option key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.name || `Vehicle #${vehicle.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-3 p-3 mb-3">
                                <h6 className="fw-bold mb-3">Quantity And Amount</h6>

                                <div className="row g-3">
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Quantity</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="qty"
                                            placeholder="Qty"
                                            value={formData.qty}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Amount</label>
                                        <div className="input-group">
                                            <span className="input-group-text">Rs</span>
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
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-3 p-3 mb-3">
                                <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
                                    <h6 className="fw-bold mb-0">Charges</h6>
                                    <span className="small text-muted">
                                        Vehicle + diesel + labour: {formatAmount(chargesTotal)}
                                    </span>
                                </div>

                                <div className="row g-3">
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Vehicle Amount</label>
                                        <div className="input-group">
                                            <span className="input-group-text">Rs</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name="vamt"
                                                placeholder="Vehicle amount"
                                                value={formData.vamt}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Diesel Qty</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="dqty"
                                            placeholder="Diesel qty"
                                            value={formData.dqty}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Diesel Amount</label>
                                        <div className="input-group">
                                            <span className="input-group-text">Rs</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name="damt"
                                                placeholder="Diesel amount"
                                                value={formData.damt}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Labour Amount</label>
                                        <div className="input-group">
                                            <span className="input-group-text">Rs</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name="lamt"
                                                placeholder="Labour amount"
                                                value={formData.lamt}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-3 p-3">
                                <h6 className="fw-bold mb-3">Challan And Remarks</h6>

                                <div className="row g-3 align-items-end">
                                    <div className="col-lg-3 col-md-5">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Challan Status</label>
                                        <div className="border rounded-3 px-3 py-2 bg-light">
                                            <div className="form-check form-switch mb-0">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input"
                                                    id="creturn"
                                                    name="creturn"
                                                    checked={formData.creturn}
                                                    onChange={handleChange}
                                                />
                                                <label className="form-check-label fw-semibold" htmlFor="creturn">
                                                    Signed Challan
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-9 col-md-7">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Remarks</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="remarks"
                                            placeholder="Enter remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="col-12 d-flex flex-wrap gap-2 pt-2">
                                        <button
                                            type="submit"
                                            className="btn btn-success px-4"
                                            disabled={loading}
                                        >
                                            {loading
                                                ? "Saving..."
                                                : editId
                                                    ? "Update Delivery"
                                                    : "Save Delivery"}
                                        </button>

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary px-4"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </button>
                                    </div>
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
                            <h5 className="mb-0">Brick Delivery List</h5>
                        </div>

                        <div className="col-md-7 mt-3 mt-md-0">
                            <div className="row g-2">
                                <div className="col-md-7">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search delivery..."
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
                        tableStyle={{ minWidth: "86rem" }}
                        emptyMessage={debouncedSearch ? "No delivery found for this search" : "No delivery found"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} delivery"
                        showCurrentPageReport
                    >
                        <Column header="#" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column header="Date" body={dateBodyTemplate} />
                        <Column field="party_name" header="Party" />
                        <Column field="stock_item_name" header="Item" />
                        <Column field="qty" header="Qty" />
                        <Column field="vehicle_name" header="Vehicle" />
                        <Column field="vamt" header="Vehicle Amount" />
                        <Column field="amt" header="Amount" />
                        <Column field="dqty" header="Diesel Qty" />
                        <Column field="damt" header="Diesel Amount" />
                        <Column field="lamt" header="Labour Amount" />
                        <Column header="Signed Challan" body={signedChallanTemplate} />
                        <Column field="remarks" header="Remarks" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "180px" }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default BrickDelivery;
