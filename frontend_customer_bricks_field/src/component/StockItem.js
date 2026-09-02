import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const initialFormData = {
    name: "",
    inLtr: "",
    measure_unit: "",
    o_quantity: "",
    o_rate: "",
    gst: "",
    gst_code: "",
    measurement_data: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
};

const StockItem = () => {
    const { authHeaders } = useAuth();
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

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

    const getItems = useCallback(
        async (
            currentPage,
            currentLimit,
            currentSearch,
            currentCategoryFilter
        ) => {
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

                if (currentCategoryFilter) {
                    params.pid = currentCategoryFilter;
                }

                const response = await axios.get(
                    "http://localhost:4000/api/stock-item",
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
                    setItems(response.data.data || []);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                    return;
                }

                setItems([]);
                setTotalRecords(0);
                setError(response.data.message || "No stock items found");
            } catch (err) {
                console.error("Stock item list error:", err);
                setItems([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch stock items"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getCategories = useCallback(async () => {
        try {
            const response = await axios.get(
                "http://localhost:4000/api/product-category",
                {
                    params: {
                        page: 1,
                        limit: 10,
                    },
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                const nextCategories = response.data.data || [];
                setCategories(nextCategories);
                setCategoryFilter((current) =>
                    current || toInputValue(nextCategories[0]?.id)
                );
            }
        } catch (err) {
            console.error("Product category option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch product categories"
            );
        }
    }, [authHeaders]);

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    useEffect(() => {
        getItems(page, limit, debouncedSearch, categoryFilter);
    }, [page, limit, debouncedSearch, categoryFilter, getItems]);

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
            inLtr: toInputValue(formData.inLtr).trim(),
            pid: categoryFilter,
            measure_unit: toInputValue(formData.measure_unit).trim(),
            o_quantity: toInputValue(formData.o_quantity).trim(),
            o_rate: toInputValue(formData.o_rate).trim(),
            gst: toInputValue(formData.gst).trim(),
            gst_code: toInputValue(formData.gst_code).trim(),
            measurement_data: toInputValue(formData.measurement_data).trim(),
        };

        if (!payload.name) {
            setError("Name is required");
            return;
        }

        if (!payload.pid) {
            setError("Please select product category from Stock Item List dropdown");
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
                    `http://localhost:4000/api/stock-item/${editId}`,
                    payload,
                    config
                )
                : await axios.post(
                    "http://localhost:4000/api/stock-item",
                    payload,
                    config
                );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Stock item updated successfully"
                        : "Stock item created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getItems(1, limit, debouncedSearch, categoryFilter);
                return;
            }

            setError(response.data.message || "Failed to save stock item");
        } catch (err) {
            console.error("Save stock item error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save stock item"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditId(item.id);
        setFormData({
            name: toInputValue(item.name),
            inLtr: toInputValue(item.inLtr),
            measure_unit: toInputValue(item.measure_unit),
            o_quantity: toInputValue(item.o_quantity),
            o_rate: toInputValue(item.o_rate),
            gst: toInputValue(item.gst),
            gst_code: toInputValue(item.gst_code),
            measurement_data: toInputValue(item.measurement_data),
        });
        setCategoryFilter(toInputValue(item.pid));
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
            "Are you sure you want to delete this stock item?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `http://localhost:4000/api/stock-item/${id}`,
                {
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Stock item deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getItems(page, limit, debouncedSearch, categoryFilter);
                return;
            }

            setError(response.data.message || "Failed to delete stock item");
        } catch (err) {
            console.error("Delete stock item error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete stock item"
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
                    <h2 className="fw-bold mb-1">Stock Item</h2>
                    <p className="text-muted mb-0">
                        Create and manage stock items
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
                    {showForm ? "Close" : "+ Add Stock Item"}
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
                            {editId ? "Edit Stock Item" : "Add Stock Item"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        placeholder="Enter stock item name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        In Ltr
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="inLtr"
                                        placeholder="Enter in ltr value"
                                        value={formData.inLtr}
                                        onChange={handleChange}
                                    />
                                </div>

                                

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Measure Unit
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="measure_unit"
                                        placeholder="Enter measure unit"
                                        value={formData.measure_unit}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Opening Quantity
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="o_quantity"
                                        placeholder="Enter opening quantity"
                                        value={formData.o_quantity}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Opening Rate
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="o_rate"
                                        placeholder="Enter opening rate"
                                        value={formData.o_rate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        GST %
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="gst"
                                        placeholder="Enter GST"
                                        value={formData.gst}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        GST Code
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="gst_code"
                                        placeholder="Enter GST code"
                                        value={formData.gst_code}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Measurement Data
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="measurement_data"
                                        placeholder="Enter measurement data"
                                        value={formData.measurement_data}
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
                            <h5 className="mb-0">Stock Item List</h5>
                        </div>

                        <div className="col-md-3 mt-3 mt-md-0">
                            <select
                                className="form-select"
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                               
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name} 
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-3 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search stock item..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={items}
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
                            categoryFilter && debouncedSearch
                                ? "No stock items found for this category and search"
                                : categoryFilter
                                    ? "No stock items found for this category"
                                    : debouncedSearch
                                ? "No stock items found for this search"
                                : "No stock items found"
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
                            "Showing {first} to {last} of {totalRecords} stock items"
                        }
                        showCurrentPageReport
                    >
                        <Column
                            header="#"
                            body={serialNumberTemplate}
                            style={{ width: "80px" }}
                        />
                        <Column field="name" header="Name" />
                        <Column field="inLtr" header="In Ltr" />
                        <Column field="product_category_name" header="Category" />
                        <Column field="product_category_unit" header="Category Unit" />
                        <Column field="measure_unit" header="Measure Unit" />
                        <Column field="o_quantity" header="Opening Qty" />
                        <Column field="o_rate" header="Opening Rate" />
                        <Column field="gst" header="GST" />
                        <Column field="gst_code" header="GST Code" />
                        <Column field="measurement_data" header="Measurement Data" />
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

export default StockItem;
