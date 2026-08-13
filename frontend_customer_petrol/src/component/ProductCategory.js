import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const initialFormData = {
    name: "",
    unit: "",
};

const ProductCategory = () => {
    const { authHeaders } = useAuth();
    const [categories, setCategories] = useState([]);
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

    const getCategories = useCallback(
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
                    "http://localhost:4000/api/product-category",
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
                    setCategories(response.data.data || []);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                    return;
                }

                setCategories([]);
                setTotalRecords(0);
                setError(
                    response.data.message || "No product categories found"
                );
            } catch (err) {
                console.error("Product category list error:", err);
                setCategories([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch product categories"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    useEffect(() => {
        getCategories(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getCategories]);

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
            unit: formData.unit.trim(),
        };

        if (!payload.name) {
            setError("Name is required");
            return;
        }

        if (!payload.unit) {
            setError("Unit is required");
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
                    `http://localhost:4000/api/product-category/${editId}`,
                    payload,
                    config
                )
                : await axios.post(
                    "http://localhost:4000/api/product-category",
                    payload,
                    config
                );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Product category updated successfully"
                        : "Product category created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getCategories(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save product category");
        } catch (err) {
            console.error("Save product category error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save product category"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category) => {
        setEditId(category.id);
        setFormData({
            name: category.name || "",
            unit: category.unit || "",
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
            "Are you sure you want to delete this product category?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `http://localhost:4000/api/product-category/${id}`,
                {
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Product category deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getCategories(page, limit, debouncedSearch);
                return;
            }

            setError(
                response.data.message || "Failed to delete product category"
            );
        } catch (err) {
            console.error("Delete product category error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete product category"
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
                    <h2 className="fw-bold mb-1">Product Category</h2>
                    <p className="text-muted mb-0">
                        Create and manage product categories
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
                    {showForm ? "Close" : "+ Add Category"}
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
                            {editId ? "Edit Category" : "Add Category"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row align-items-end">
                                <div className="col-md-5">
                                    <label className="form-label fw-semibold">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        placeholder="Enter category name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4 mt-3 mt-md-0">
                                    <label className="form-label fw-semibold">
                                        Unit
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="unit"
                                        placeholder="Enter unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3 mt-3 mt-md-0">
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
                            <h5 className="mb-0">Category List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name or unit..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={categories}
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
                                ? "No categories found for this search"
                                : "No categories found"
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
                            "Showing {first} to {last} of {totalRecords} categories"
                        }
                        showCurrentPageReport
                    >
                        <Column
                            header="#"
                            body={serialNumberTemplate}
                            style={{ width: "80px" }}
                        />
                        <Column field="name" header="Name" />
                        <Column field="unit" header="Unit" />
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

export default ProductCategory;
