import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    sdate: "",
    edate: "",
    date: "",
    billno: "",
    party: "",
    vehicleno: "",
    remarks: "",
    amt: "",
    type: "Others",
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

const formatDate = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-GB");
};

const BillGeneration = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [parties, setParties] = useState([]);
    const [vehicles, setVehicles] = useState([]);
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
        sdate: getCurrentDateValue(),
        edate: getCurrentDateValue(),
        date: getCurrentDateValue(),
        party: toInputValue(parties[0]?.id),
        vehicleno: toInputValue(vehicles[0]?.id),
    }), [parties, vehicles]);

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

                const response = await axios.get(`${API_BASE_URL}/bill`, {
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
                setError(response.data.message || "No bill entries found");
            } catch (err) {
                console.error("Bill list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch bill entries"
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
            const [partyResult, vehicleResult] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/party`, {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }),
                axios.get(`${API_BASE_URL}/vehicle-master`, {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }),
            ]);

            const nextParties =
                partyResult.status === "fulfilled" && partyResult.value.data.status
                    ? partyResult.value.data.data || []
                    : [];
            const nextVehicles =
                vehicleResult.status === "fulfilled" && vehicleResult.value.data.status
                    ? vehicleResult.value.data.data || []
                    : [];

            setParties(nextParties);
            setVehicles(nextVehicles);
            setFormData((current) => ({
                ...current,
                sdate: current.sdate || getCurrentDateValue(),
                edate: current.edate || getCurrentDateValue(),
                date: current.date || getCurrentDateValue(),
                party: current.party || toInputValue(nextParties[0]?.id),
                vehicleno: current.vehicleno || toInputValue(nextVehicles[0]?.id),
            }));
        } catch (err) {
            console.error("Bill option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch party or vehicle options"
            );
        }
    }, [authHeaders]);

    const getNextBillNo = useCallback(async () => {
        const response = await axios.get(`${API_BASE_URL}/bill/next-bill-no`, {
            headers: authHeaders,
        });

        return response.data?.data?.billno || "";
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

    const handleAdd = async () => {
        try {
            const nextBillNo = await getNextBillNo();

            setFormData({
                ...getDefaultFormData(),
                billno: nextBillNo,
            });
            setEditId(null);
            setShowForm(true);
            setMessage("");
            setError("");
        } catch (err) {
            console.error("Next bill no error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch next bill no"
            );
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const payload = {
            sdate: toInputValue(formData.sdate).trim(),
            edate: toInputValue(formData.edate).trim(),
            date: toInputValue(formData.date).trim(),
            billno: toInputValue(formData.billno).trim(),
            party: formData.party,
            vehicleno: formData.vehicleno,
            remarks: toInputValue(formData.remarks).trim(),
            amt: toInputValue(formData.amt).trim(),
            type: formData.type,
        };

        if (!payload.sdate) return setError("Start date is required");
        if (!payload.edate) return setError("End date is required");
        if (!payload.date) return setError("Date is required");
        if (!payload.billno) return setError("Bill no is required");
        if (!payload.party) return setError("Party is required");
        if (!payload.vehicleno) return setError("Vehicle is required");
        if (!payload.amt) return setError("Amount is required");
        if (!payload.type) return setError("Type is required");

        try {
            setLoading(true);

            const config = {
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json",
                },
            };

            const response = editId
                ? await axios.put(`${API_BASE_URL}/bill/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/bill`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Bill entry updated successfully"
                        : "Bill entry created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save bill entry");
        } catch (err) {
            console.error("Save bill error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save bill entry"
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
            sdate: toDateInputValue(entry.sdate),
            edate: toDateInputValue(entry.edate),
            date: toDateInputValue(entry.date),
            billno: toInputValue(entry.billno),
            party: toInputValue(entry.party),
            vehicleno: toInputValue(entry.vehicleno),
            remarks: toInputValue(entry.remarks),
            amt: toInputValue(entry.amt),
            type: entry.type || "Others",
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
            "Are you sure you want to delete this bill entry?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/bill/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Bill entry deleted successfully");

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete bill entry");
        } catch (err) {
            console.error("Delete bill error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete bill entry"
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
                    <h2 className="fw-bold mb-1">Bill Generation</h2>
                    <p className="text-muted mb-0">
                        Create and manage bill entries
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
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Start Date</label>
                                    <input type="date" className="form-control" name="sdate" value={formData.sdate} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">End Date</label>
                                    <input type="date" className="form-control" name="edate" value={formData.edate} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Date</label>
                                    <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Bill No</label>
                                    <input type="text" className="form-control" name="billno" placeholder="Auto bill no" value={formData.billno} onChange={handleChange} readOnly />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Party</label>
                                    <select className="form-select" name="party" value={formData.party} onChange={handleChange}>
                                        {parties.map((party) => (
                                            <option key={party.id} value={party.id}>
                                                {party.name || `Party #${party.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Vehicle No</label>
                                    <select className="form-select" name="vehicleno" value={formData.vehicleno} onChange={handleChange}>
                                        {vehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.name || `Vehicle #${vehicle.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Amount</label>
                                    <input type="number" step="0.01" className="form-control" name="amt" placeholder="Enter amount" value={formData.amt} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Type</label>
                                    <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                                        <option value="Others">Others</option>
                                        <option value="Lub">Lub</option>
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-semibold">Remarks</label>
                                    <textarea className="form-control" name="remarks" rows="2" placeholder="Enter remarks" value={formData.remarks} onChange={handleChange} />
                                </div>
                                <div className="col-12">
                                    <button type="submit" className="btn btn-success me-2" disabled={loading}>
                                        {loading ? "Saving..." : editId ? "Update" : "Save"}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
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
                            <input type="text" className="form-control" placeholder="Search entry..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                        tableStyle={{ minWidth: "25rem" }}
                        emptyMessage={debouncedSearch ? "No entries found for this search" : "No entries found"}
                        paginatorTemplate={"FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"}
                        currentPageReportTemplate={"Showing {first} to {last} of {totalRecords} entries"}
                        showCurrentPageReport
                    >
                        <Column header="Sn" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column field="billno" header="Bill No" />
                        <Column header="Bill Date" body={(row) => formatDate(row.date)} />
                        <Column header="Sdate" body={(row) => formatDate(row.sdate)} />
                        <Column header="Edate" body={(row) => formatDate(row.edate)} />
                        <Column field="vehicle_name" header="Vehicle No" />
                        <Column field="party_name" header="Party Name" />
                        <Column field="amt" header="Amt" />
                        <Column field="type" header="Type" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "180px" }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default BillGeneration;
