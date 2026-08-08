import React, { useEffect, useState } from "react";
import axios from "axios";

const Product = () => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");

    const [productName, setProductName] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // =====================================
    // GET PRODUCT LIST
    // =====================================
    const getProducts = async () => {
        try {
            setListLoading(true);
            setError("");

            const response = await axios.get(
                "http://localhost:4000/api/product/list",
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Product List:", response.data);

            if (response.data.status) {
                setProducts(response.data.data || []);
            } else {
                setProducts([]);
            }

        } catch (error) {
            console.error("Get product error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to fetch products"
            );
        } finally {
            setListLoading(false);
        }
    };

    // =====================================
    // LOAD PRODUCTS WHEN PAGE LOADS
    // =====================================
    useEffect(() => {
        getProducts();
    }, []);

    // =====================================
    // CREATE PRODUCT
    // =====================================
    const handleAddProduct = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!productName.trim()) {
            setError("Product name is required");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:4000/api/product/create",
                {
                    name: productName.trim(),
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            console.log("Create Product:", response.data);

            if (response.data.status || response.data.success) {
                setMessage(
                    response.data.message ||
                    "Product created successfully"
                );

                setProductName("");
                setShowForm(false);

                // Refresh product list
                getProducts();
            }

        } catch (error) {
            console.error("Create product error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to create product"
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================
    // SEARCH
    // =====================================
    const filteredProducts = products.filter((product) =>
        product.name
            ?.toLowerCase()
            .includes(search.toLowerCase())
    );

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
                    className="btn btn-primary"
                    onClick={() => {
                        setShowForm(!showForm);
                        setMessage("");
                        setError("");
                    }}
                >
                    {showForm ? "Close" : "+ Add Product"}
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

            {/* ================= ADD FORM ================= */}
            {showForm && (
                <div className="card shadow-sm border-0 mb-4">

                    <div className="card-header bg-white">
                        <h5 className="mb-0">
                            Add Product
                        </h5>
                    </div>

                    <div className="card-body">

                        <form onSubmit={handleAddProduct}>

                            <div className="row align-items-end">

                                <div className="col-md-8">

                                    <label className="form-label fw-semibold">
                                        Product Name
                                    </label>

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter product name"
                                        value={productName}
                                        onChange={(e) =>
                                            setProductName(e.target.value)
                                        }
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
                                            : "Save Product"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowForm(false);
                                            setProductName("");
                                            setError("");
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

            {/* ================= PRODUCT LIST ================= */}
            <div className="card shadow-sm border-0">

                {/* Table Header */}
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
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                        </div>

                    </div>

                </div>

                {/* Table */}
                <div className="table-responsive">

                    <table className="table table-hover mb-0">

                        <thead className="table-light">

                            <tr>
                                <th width="80">#</th>
                                <th>Product Name</th>
                                <th>Created At</th>
                                <th width="180">Action</th>
                            </tr>

                        </thead>

                        <tbody>

                            {listLoading ? (

                                <tr>
                                    <td
                                        colSpan="4"
                                        className="text-center py-5"
                                    >
                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        />

                                        <div className="mt-2">
                                            Loading products...
                                        </div>
                                    </td>
                                </tr>

                            ) : filteredProducts.length > 0 ? (

                                filteredProducts.map((product, index) => (

                                    <tr key={product.id}>

                                        <td>
                                            {index + 1}
                                        </td>

                                        <td>
                                            <strong>
                                                {product.name}
                                            </strong>
                                        </td>

                                        <td>
                                            {product.created_at
                                                ? new Date(
                                                    product.created_at
                                                ).toLocaleString()
                                                : "-"}
                                        </td>

                                        <td>

                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="text-center py-5"
                                    >
                                        <h6 className="text-muted">
                                            No products found
                                        </h6>

                                        <p className="text-muted mb-0">
                                            Add your first product.
                                        </p>
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
};

export default Product;