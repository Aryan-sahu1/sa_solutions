import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const Product = () => {
    const [products, setProducts] = useState([]);

    // ============================
    // SEARCH
    // ============================

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // ============================
    // ADD PRODUCT
    // ============================

    const [productName, setProductName] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    // ============================
    // LOADING
    // ============================

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);

    // ============================
    // MESSAGE
    // ============================

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // ============================
    // PAGINATION
    // ============================

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);

    // ============================
    // SEARCH DEBOUNCE
    // ============================

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    // ============================
    // GET PRODUCTS
    // ============================

    const getProducts = useCallback(
        async (currentPage, currentLimit, currentSearch) => {
            try {
                setListLoading(true);
                setError("");
const params={
    page:currentPage,
    limit:currentLimit
}
if(currentSearch !== ""){
    params.search=currentSearch
}
                const response = await axios.get(
                    "http://localhost:4000/api/product/list",
                    {
                        params:params,
                        headers: {
                            "Cache-Control": "no-cache",
                            Pragma: "no-cache",
                        },
                    }
                );

                if (response.data.status) {
                    setProducts(response.data.data || []);

                    setTotalRecords(
                        Number(
                            response.data.pagination?.total ??
                            response.data.total ??
                            0
                        )
                    );
                } else {
                    setProducts([]);
                    setTotalRecords(0);

                    setError(
                        response.data.message ||
                        "No products found"
                    );
                }
            } catch (err) {
                console.error(
                    "Get product error:",
                    err
                );

                setProducts([]);
                setTotalRecords(0);

                setError(
                    err.response?.data?.message ||
                    "Failed to fetch products"
                );
            } finally {
                setListLoading(false);
            }
        },
        []
    );

    // ============================
    // FETCH PRODUCTS
    // ============================

    useEffect(() => {
        getProducts(
            page,
            limit,
            debouncedSearch
        );
    }, [
        page,
        limit,
        debouncedSearch,
        getProducts,
    ]);

    // ============================
    // SAVE PRODUCT
    // ============================

    const resetForm = () => {
        setProductName("");
        setEditId(null);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        const name = productName.trim();

        if (!name) {
            setError("Product name is required");
            return;
        }

        try {
            setLoading(true);

            const response = editId
                ? await axios.put(
                    `http://localhost:4000/api/product/${editId}`,
                    {
                        name: name,
                    }
                )
                : await axios.post(
                    "http://localhost:4000/api/product/create",
                    {
                        name: name,
                    }
                );

            if (
                response.data.status ||
                response.data.success
            ) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Product updated successfully"
                        : "Product created successfully")
                );

                resetForm();
                setShowForm(false);

                // Go to first page
                setPage(1);

                // Refresh product list
                await getProducts(
                    1,
                    limit,
                    debouncedSearch
                );
            } else {
                setError(
                    response.data.message ||
                    "Failed to save product"
                );
            }
        } catch (err) {
            console.error(
                "Save product error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Failed to save product"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditId(product.id);
        setProductName(product.name || "");
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
            "Are you sure you want to delete this product?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `http://localhost:4000/api/product/${id}`
            );

            if (response.data.status || response.data.success) {
                setMessage(
                    response.data.message ||
                    "Product deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getProducts(
                    page,
                    limit,
                    debouncedSearch
                );
            }
        } catch (err) {
            console.error("Delete product error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to delete product"
            );
        }
    };

    const handleCancel = () => {
        resetForm();
        setShowForm(false);
        setError("");
    };

    // ============================
    // PAGINATION
    // ============================

    const handlePageChange = (event) => {
        const newPage =
            Math.floor(
                event.first / event.rows
            ) + 1;

        setPage(newPage);
        setLimit(event.rows);
    };

    // ============================
    // DATE TEMPLATE
    // ============================

    const dateBodyTemplate = (product) => {
        if (!product.created_at) {
            return "-";
        }

        const date = new Date(
            product.created_at
        );

        if (isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleString();
    };

    // ============================
    // ACTION TEMPLATE
    // ============================

    const actionBodyTemplate = (product) => {
        return (
            <div>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => {
                        handleEdit(product);
                    }}
                >
                    Edit
                </button>

                <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => {
                        handleDelete(product.id);
                    }}
                >
                    Delete
                </button>
            </div>
        );
    };

    // ============================
    // SERIAL NUMBER
    // ============================

    const serialNumberTemplate = (
        product,
        options
    ) => {
        return (
            (page - 1) * limit +
            options.rowIndex +
            1
        );
    };

    return (
        <div className="container-fluid p-4">

            {/* ================= HEADER ================= */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        Products
                    </h2>

                    <p className="text-muted mb-0">
                        Product management
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

                        resetForm();
                        setShowForm(true);
                        setMessage("");
                        setError("");
                    }}
                >
                    {showForm
                        ? "Close"
                        : "+ Add Product"}
                </button>

            </div>

            {/* ================= SUCCESS ================= */}

            {message && (
                <div className="alert alert-success">
                    {message}
                </div>
            )}

            {/* ================= ERROR ================= */}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* ================= ADD PRODUCT FORM ================= */}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4">

                    <div className="card-header bg-white">
                        <h5 className="mb-0">
                            {editId ? "Edit Product" : "Add Product"}
                        </h5>
                    </div>

                    <div className="card-body">

                        <form
                            onSubmit={
                                handleSaveProduct
                            }
                        >

                            <div className="row align-items-end">

                                <div className="col-md-8">

                                    <label className="form-label fw-semibold">
                                        Product Name
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter product name"
                                        value={
                                            productName
                                        }
                                        onChange={(e) =>
                                            setProductName(
                                                e.target.value
                                            )
                                        }
                                    />

                                </div>

                                <div className="col-md-4 mt-3 mt-md-0">

                                    <button
                                        type="submit"
                                        className="btn btn-success me-2"
                                        disabled={
                                            loading
                                        }
                                    >
                                        {loading
                                            ? "Saving..."
                                            : editId
                                                ? "Update Product"
                                                : "Save Product"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            handleCancel();
                                        }}
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </div>

                        </form>

                    </div>

                </div>
            )}

            {/* ================= PRODUCT TABLE ================= */}

            <div className="card shadow-sm border-0">

                {/* ================= TABLE HEADER ================= */}

                <div className="card-header bg-white p-3">

                    <div className="row align-items-center">

                        <div className="col-md-6">

                            <h5 className="mb-0">
                                Product List
                            </h5>

                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search product..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(
                                        e.target.value
                                    );
                                }}
                            />

                        </div>

                    </div>

                </div>

                {/* ================= TABLE ================= */}

                <div className="card-body">

                    <DataTable
                        value={products}
                        loading={listLoading}

                        lazy
                        paginator

                        first={
                            (page - 1) * limit
                        }

                        rows={limit}

                        totalRecords={
                            totalRecords
                        }

                        rowsPerPageOptions={[
                            5,
                            10,
                            20,
                            50,
                        ]}

                        onPage={
                            handlePageChange
                        }

                        responsiveLayout="scroll"

                        tableStyle={{
                            minWidth: "50rem",
                        }}

                        emptyMessage={
                            debouncedSearch
                                ? "No products found for this search"
                                : "No products found"
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
                            "Showing {first} to {last} of {totalRecords} products"
                        }

                        showCurrentPageReport
                    >

                        {/* SERIAL NUMBER */}

                        <Column
                            header="#"
                            body={
                                serialNumberTemplate
                            }
                            style={{
                                width: "80px",
                            }}
                        />

                        {/* PRODUCT NAME */}

                        <Column
                            field="name"
                            header="Product Name"
                        />

                        {/* CREATED DATE */}

                        <Column
                            field="created_at"
                            header="Created At"
                            body={
                                dateBodyTemplate
                            }
                        />

                        {/* ACTION */}

                        <Column
                            header="Action"
                            body={
                                actionBodyTemplate
                            }
                            style={{
                                width: "180px",
                            }}
                        />

                    </DataTable>

                </div>

            </div>

        </div>
    );
};

export default Product;
