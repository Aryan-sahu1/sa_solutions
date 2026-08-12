import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const initialFormData = {
    name: "",
};

const THeadMaster = () => {
    const [heads, setHeads] = useState([]);
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

    const getAuthHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const getHeads = useCallback(
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
                    "http://localhost:4000/api/t-head-master",
                    {
                        params,
                        headers: {
                            ...getAuthHeaders(),
                            "Cache-Control": "no-cache",
                            Pragma: "no-cache",
                        },
                    }
                );

                if (response.data.status) {
                    setHeads(response.data.data || []);
                    setTotalRecords(Number(response.data.pagination?.total || 0));
                    return;
                }

                setHeads([]);
                setTotalRecords(0);
                setError(response.data.message || "No T head masters found");
            } catch (err) {
                console.error("T head master list error:", err);
                setHeads([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch T head masters"
                );
            } finally {
                setListLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        getHeads(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getHeads]);

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
            name: formData.name.trim(),
        };

        if (!payload.name) {
            setError("Name is required");
            return;
        }

        try {
            setLoading(true);

            const config = {
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
            };

            const response = editId
                ? await axios.put(
                    `http://localhost:4000/api/t-head-master/${editId}`,
                    payload,
                    config
                )
                : await axios.post(
                    "http://localhost:4000/api/t-head-master",
                    payload,
                    config
                );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "T head master updated successfully"
                        : "T head master created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getHeads(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save T head master");
        } catch (err) {
            console.error("Save T head master error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save T head master"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (row) => {
        setEditId(row.id);
        setFormData({
            name: row.name || "",
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
            "Are you sure you want to delete this T head master?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `http://localhost:4000/api/t-head-master/${id}`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "T head master deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getHeads(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete T head master");
        } catch (err) {
            console.error("Delete T head master error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete T head master"
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
                    <h2 className="fw-bold mb-1">T Head Master</h2>
                    <p className="text-muted mb-0">
                        Create and manage transaction heads
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
                    {showForm ? "Close" : "+ Add T Head"}
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
                            {editId ? "Edit T Head" : "Add T Head"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row align-items-end">
                                <div className="col-md-8">
                                    <label className="form-label fw-semibold">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        placeholder="Enter head name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4 mt-3 mt-md-0">
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
                            <h5 className="mb-0">T Head List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={heads}
                        loading={listLoading}
                        lazy
                        paginator
                        first={(page - 1) * limit}
                        rows={limit}
                        totalRecords={totalRecords}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPage={handlePageChange}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: "48rem" }}
                        emptyMessage={
                            debouncedSearch
                                ? "No T heads found for this search"
                                : "No T heads found"
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
                            "Showing {first} to {last} of {totalRecords} T heads"
                        }
                        showCurrentPageReport
                    >
                        <Column
                            header="#"
                            body={serialNumberTemplate}
                            style={{ width: "80px" }}
                        />
                        <Column field="name" header="Name" />
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

export default THeadMaster;
