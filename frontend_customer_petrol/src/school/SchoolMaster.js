import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    mid: "",
    name: "",
    amount: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) return "";
    return String(value);
};

const SchoolMaster = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [masters, setMasters] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [masterFilter, setMasterFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);

    const getDefaultFormData = useCallback(() => ({
        ...initialFormData,
        mid: toInputValue(masters[0]?.id),
    }), [masters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const getMasters = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/school/master/options`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                const nextMasters = response.data.data || [];
                setMasters(nextMasters);
                setFormData((current) => ({
                    ...current,
                    mid: current.mid || toInputValue(nextMasters[0]?.id),
                }));
            }
        } catch (err) {
            console.error("School master option error:", err);
            setError(err.response?.data?.message || "Failed to fetch master options");
        }
    }, [authHeaders]);

    const getEntries = useCallback(
        async (currentPage, currentLimit, currentSearch, currentMasterFilter) => {
            try {
                setListLoading(true);
                setError("");

                const params = {
                    page: currentPage,
                    limit: currentLimit,
                };

                if (currentSearch) params.search = currentSearch;
                if (currentMasterFilter) params.mid = currentMasterFilter;

                const response = await axios.get(`${API_BASE_URL}/school/master`, {
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
                setError(response.data.message || "No school master entries found");
            } catch (err) {
                console.error("School master list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(err.response?.data?.message || "Failed to fetch school master entries");
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    useEffect(() => {
        getMasters();
    }, [getMasters]);

    useEffect(() => {
        getEntries(page, limit, debouncedSearch, masterFilter);
    }, [page, limit, debouncedSearch, masterFilter, getEntries]);

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
        if (!formData.mid) return "Master is required";
        if (!formData.name.trim()) return "Name is required";
        if (!formData.amount) return "Amount is required";
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
            mid: formData.mid,
            name: toInputValue(formData.name).trim(),
            amount: toInputValue(formData.amount).trim(),
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
                ? await axios.put(`${API_BASE_URL}/school/master/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/school/master`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId ? "School master entry updated successfully" : "School master entry saved successfully")
                );
                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch, masterFilter);
                return;
            }

            setError(response.data.message || "Failed to save school master entry");
        } catch (err) {
            console.error("Save school master error:", err);
            setError(err.response?.data?.message || "Failed to save school master entry");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (entry) => {
        setEditId(entry.id);
        setFormData({
            mid: toInputValue(entry.mid),
            name: toInputValue(entry.name),
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
        const confirmDelete = window.confirm("Are you sure you want to delete this school master entry?");
        if (!confirmDelete) return;

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/school/master/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "School master entry deleted successfully");

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch, masterFilter);
                return;
            }

            setError(response.data.message || "Failed to delete school master entry");
        } catch (err) {
            console.error("Delete school master error:", err);
            setError(err.response?.data?.message || "Failed to delete school master entry");
        }
    };

    const handlePageChange = (event) => {
        setPage(Math.floor(event.first / event.rows) + 1);
        setLimit(event.rows);
    };

    const serialNumberTemplate = (row, options) => {
        return (page - 1) * limit + options.rowIndex + 1;
    };

    const actionBodyTemplate = (row) => (
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

    return (
        <div className="container-fluid p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">School Master</h2>
                    <p className="text-muted mb-0">Create school master values by selected master menu</p>
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
                    {showForm ? "Close" : "+ Add Master"}
                </button>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white">
                        <h5 className="mb-0">{editId ? "Edit School Master" : "Add School Master"}</h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Master</label>
                                    <select
                                        className="form-select"
                                        name="mid"
                                        value={formData.mid}
                                        onChange={handleChange}
                                    >
                                        {masters.length === 0 && (
                                            <option value="">No master found</option>
                                        )}
                                        {masters.map((master) => (
                                            <option key={master.id} value={master.id}>
                                                {master.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        placeholder="Enter name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Amount</label>
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
                                        {loading ? "Saving..." : editId ? "Update Master" : "Save Master"}
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
                    <div className="row align-items-center g-2">
                        <div className="col-md-4">
                            <h5 className="mb-0">School Master List</h5>
                        </div>
                        <div className="col-md-4">
                            <select
                                className="form-select"
                                value={masterFilter}
                                onChange={(e) => {
                                    setMasterFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="">All Master</option>
                                {masters.map((master) => (
                                    <option key={master.id} value={master.id}>
                                        {master.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search master..."
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
                        tableStyle={{ minWidth: "56rem" }}
                        emptyMessage={debouncedSearch ? "No school master entries found for this search" : "No school master entries found"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} school master entries"
                        showCurrentPageReport
                    >
                        <Column header="#" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column field="master_name" header="Master" />
                        <Column field="name" header="Name" />
                        <Column field="amount" header="Amount" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "180px" }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default SchoolMaster;
