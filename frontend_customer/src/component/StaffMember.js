import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const initialFormData = {
    name: "",
    pid: "",
    password: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
};

const StaffMember = () => {
    const { authHeaders } = useAuth();
    const [staffMembers, setStaffMembers] = useState([]);
    const [staffCategories, setStaffCategories] = useState([]);
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

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const getStaffMembers = useCallback(
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
                    "http://localhost:4000/api/staff-member",
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
                    setStaffMembers(response.data.data || []);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                    return;
                }

                setStaffMembers([]);
                setTotalRecords(0);
                setError(response.data.message || "No staff members found");
            } catch (err) {
                console.error("Staff member list error:", err);
                setStaffMembers([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch staff members"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getStaffCategories = useCallback(async () => {
        try {
            const response = await axios.get(
                "http://localhost:4000/api/staff/customer-options",
                {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                setStaffCategories(response.data.data || []);
            }
        } catch (err) {
            console.error("Staff category option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch staff category options"
            );
        }
    }, [authHeaders]);

    useEffect(() => {
        getStaffCategories();
    }, [getStaffCategories]);

    useEffect(() => {
        getStaffMembers(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getStaffMembers]);

    const resetForm = () => {
        setFormData(initialFormData);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const payload = {
            name: toInputValue(formData.name).trim(),
            pid: formData.pid,
            password: toInputValue(formData.password).trim(),
        };

        if (!payload.name) {
            setError("Name is required");
            return;
        }

        if (!payload.pid) {
            setError("Staff category is required");
            return;
        }

        if (!payload.password) {
            setError("Password is required");
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
                    `http://localhost:4000/api/staff-member/${editId}`,
                    payload,
                    config
                )
                : await axios.post(
                    "http://localhost:4000/api/staff-member",
                    payload,
                    config
                );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Staff member updated successfully"
                        : "Staff member created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getStaffMembers(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save staff member");
        } catch (err) {
            console.error("Save staff member error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save staff member"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (staffMember) => {
        setEditId(staffMember.id);
        setFormData({
            name: toInputValue(staffMember.name),
            pid: toInputValue(staffMember.pid),
            password: "",
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
            "Are you sure you want to delete this staff member?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `http://localhost:4000/api/staff-member/${id}`,
                {
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Staff member deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getStaffMembers(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete staff member");
        } catch (err) {
            console.error("Delete staff member error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete staff member"
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
        if (!row.created_at) {
            return "-";
        }

        const date = new Date(row.created_at);

        if (Number.isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleString();
    };

    const productBodyTemplate = (row) => {
        return row.staff_category_name || row.product_name || "-";
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
                    <h2 className="fw-bold mb-1">Staff</h2>
                    <p className="text-muted mb-0">
                        Create and manage staff members
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
                    {showForm ? "Close" : "+ Add Staff"}
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
                            {editId ? "Edit Staff" : "Add Staff"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Mobile No.
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="name"
                                        placeholder="Enter Mobile no."
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4 mt-3 mt-md-0">
                                    <label className="form-label fw-semibold">
                                        Staff Category
                                    </label>
                                    <select
                                        className="form-select"
                                        name="pid"
                                        value={formData.pid}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select staff category</option>
                                        {staffCategories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4 mt-3 mt-md-0">
                                    <label className="form-label fw-semibold">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-12 mt-3">
                                    <button
                                        type="submit"
                                        className="btn btn-success me-2"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Saving..."
                                            : editId
                                                ? "Update Staff"
                                                : "Save Staff"}
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
                            <h5 className="mb-0">Staff List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by staff or category..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={staffMembers}
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
                                ? "No staff members found for this search"
                                : "No staff members found"
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
                            "Showing {first} to {last} of {totalRecords} staff members"
                        }
                        showCurrentPageReport
                    >
                        <Column
                            header="#"
                            body={serialNumberTemplate}
                            style={{ width: "80px" }}
                        />
                        <Column field="name" header="Mobile No." />
                        <Column header="Staff Category" body={productBodyTemplate} />
                        <Column
                            field="created_at"
                            header="Created At"
                            body={dateBodyTemplate}
                        />
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

export default StaffMember;
