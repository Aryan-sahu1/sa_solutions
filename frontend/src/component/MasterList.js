import React, { useCallback, useEffect, useState, useRef } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const MasterList = () => {
    const [staffList, setStaffList] = useState([]);
    const [products, setProducts] = useState([]);

    const [search, setSearch] = useState("");
    const [productFilter, setProductFilter] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
    });

    const [editId, setEditId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const searchRef = useRef(null);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    // ==========================================
    // GET STAFF LIST
    // ==========================================
    const getStaffList = useCallback(async ({
        p = 1,
        l = 10,
        s = "",
        productId = "",
    } = {}) => {
        try {
            setListLoading(true);
            setError("");

            const params = {
                limit: l,
                page: p,
            };

            if (s) {
                params.search = s;
            }

            if (productId) {
                params.product_id = productId;
            }

            const response = await axios.get(
                "http://localhost:4000/api/master-list/",
                {
                    params
                }
            );

            if (response.data.status) {
                setStaffList(response.data.data || []);
                setTotalRecords(response.data.pagination?.total || 0);
                setPage(response.data.pagination?.page || p);
                setLimit(response.data.pagination?.limit || l);
            } else {
                setStaffList([]);
                setTotalRecords(0);
            }

        } catch (error) {
            console.error("MasterList Error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to fetch staff"
            );
        } finally {
            setListLoading(false);
        }
    }, []);

    // ==========================================
    // GET PRODUCTS
    // ==========================================
    const getProducts = useCallback(async () => {
        try {
            const response = await axios.get(
                "http://localhost:4000/api/product/list"
            );

            if (response.data.status) {
                const nextProducts = response.data.data || [];
                setProducts(nextProducts);
                setProductFilter((current) =>
                    current || String(nextProducts[0]?.id || "")
                );
            }

        } catch (error) {
            console.error("Product List Error:", error);
        }
    }, []);

    // ==========================================
    // PAGE LOAD
    // ==========================================
    useEffect(() => {
        getProducts();
    }, [getProducts, getStaffList]);

    // ==========================================
    // INPUT CHANGE
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // ==========================================
    // CREATE / UPDATE STAFF
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!formData.name.trim()) {
            setError("Mastername is required");
            return;
        }

        if (!productFilter) {
            setError("Please select product from Master List dropdown");
            return;
        }

        try {
            setLoading(true);

            let response;

            // ==================================
            // UPDATE
            // ==================================
            if (editId) {

                response = await axios.put(
                    `http://localhost:4000/api/master-list/${editId}`,
                    {
                        name: formData.name.trim(),
                        product_id: Number(productFilter),
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

            }

            // ==================================
            // CREATE
            // ==================================
            else {

                response = await axios.post(
                    "http://localhost:4000/api/master-list/",
                    {
                        name: formData.name.trim(),
                        product_id: Number(productFilter),
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

            }

            if (response.data.status || response.data.success) {

                setMessage(
                    response.data.message ||
                    (editId
                        ? "Masterupdated successfully"
                        : "Mastercreated successfully")
                );

                setFormData({
                    name: "",
                });

                setEditId(null);
                setShowForm(false);

                getStaffList({
                    p: 1,
                    l: limit,
                    s: search.trim(),
                    productId: productFilter,
                });
            }

        } catch (error) {
            console.error(
                editId
                    ? "Update Master Error:"
                    : "Create MasterError:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Something went wrong"
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // EDIT STAFF
    // ==========================================
    const handleEdit = (staff) => {

        setEditId(staff.id);

        setFormData({
            name: staff.name || "",
        });

        setProductFilter(String(staff.product?.id || ""));

        setShowForm(true);

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ==========================================
    // DELETE STAFF
    // ==========================================
    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this staff?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await axios.delete(
                `http://localhost:4000/api/master-list/${id}`
            );

            if (response.data.status || response.data.success) {

                setMessage(
                    response.data.message ||
                    "Master deleted successfully"
                );

                getStaffList({
                    p: page,
                    l: limit,
                    s: search.trim(),
                    productId: productFilter,
                });
            }

        } catch (error) {

            console.error("Delete MasterError:", error);

            setError(
                error.response?.data?.message ||
                "Failed to delete staff"
            );
        }
    };

    // ==========================================
    // CANCEL EDIT
    // ==========================================
    const handleCancel = () => {

        setShowForm(false);

        setEditId(null);

        setFormData({
            name: "",
        });

        setError("");
        setMessage("");
    };

    // ==========================================
    // SEARCH (debounced)
    // ==========================================
    useEffect(() => {
        if (searchRef.current) {
            clearTimeout(searchRef.current);
        }

        searchRef.current = setTimeout(() => {
            getStaffList({
                p: 1,
                l: limit,
                s: search.trim(),
                productId: productFilter,
            });
        }, 400);

        return () => clearTimeout(searchRef.current);
    }, [getStaffList, limit, productFilter, search]);

    useEffect(() => {
        setPage(1);
    }, [productFilter]);

    const onPage = (event) => {
        const newPage = Math.floor(event.first / event.rows) + 1;
        const newLimit = event.rows;

        setPage(newPage);
        setLimit(newLimit);

        getStaffList({
            p: newPage,
            l: newLimit,
            s: search.trim(),
            productId: productFilter,
        });
    };

    return (
        <div className="container-fluid p-4">

            {/* ==================================
                HEADER
            ================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        Master List
                    </h2>

                    <p className="text-muted mb-0">
                        Master list management
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => {

                        if (showForm) {
                            handleCancel();
                        } else {
                            setShowForm(true);
                            setMessage("");
                            setError("");
                        }

                    }}
                >
                    {showForm ? "Close" : "+ Add Staff"}
                </button>

            </div>

            {/* ==================================
                SUCCESS MESSAGE
            ================================== */}

            {message && (
                <div className="alert alert-success">
                    {message}
                </div>
            )}

            {/* ==================================
                ERROR MESSAGE
            ================================== */}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* ==================================
                FORM
            ================================== */}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4">

                    <div className="card-header bg-white">

                        <h5 className="mb-0">
                            {editId
                                ? "Edit Staff"
                                : "Add Staff"}
                        </h5>

                    </div>

                    <div className="card-body">

                        <form onSubmit={handleSubmit}>

                            <div className="row">

                                {/* Master Name */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Master Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        placeholder="Enter staff name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />

                                </div>

                            </div>

                            {/* BUTTONS */}

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

                        </form>

                    </div>

                </div>
            )}

            {/* ==================================
                STAFF LIST
            ================================== */}

            <div className="card shadow-sm border-0">

                <div className="card-header bg-white p-3">

                    <div className="row align-items-center">

                        <div className="col-md-6">

                            <h5 className="mb-0">
                                MasterList
                            </h5>

                        </div>

                        <div className="col-md-3 mt-3 mt-md-0">

                            <select
                                className="form-select"
                                value={productFilter}
                                onChange={(e) => {
                                    setProductFilter(e.target.value);
                                    setPage(1);
                                }}
                            >
                                {products.map((product) => (
                                    <option
                                        key={product.id}
                                        value={product.id}
                                    >
                                        {product.name}
                                    </option>
                                ))}
                            </select>

                        </div>

                        <div className="col-md-3 mt-3 mt-md-0">

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search staff or product..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                        </div>

                    </div>

                </div>

                <div className="p-3">
                    <DataTable
                        value={staffList}
                        lazy
                        paginator
                        first={(page - 1) * limit}
                        rows={limit}
                        totalRecords={totalRecords}

                        onPage={onPage}

                        rowsPerPageOptions={[5, 10, 20, 50]}

                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"

                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"

                        loading={listLoading}

                        responsiveLayout="scroll"

                        emptyMessage="No staff found"
                    >
                        <Column
                            header="#"
                            body={(rowData, options) =>
                                (page - 1) * limit + options.rowIndex + 1
                            }
                            style={{ width: "60px" }}
                        />

                        <Column
                            field="name"
                            header="Master Name"
                        />

                        <Column
                            header="Product"
                            body={(rowData) => (
                                <span className="badge bg-primary">
                                    {rowData.product?.name || "-"}
                                </span>
                            )}
                        />

                        <Column
                            header="Created At"
                            body={(rowData) =>
                                rowData.created_at
                                    ? new Date(rowData.created_at).toLocaleString()
                                    : "-"
                            }
                        />

                        <Column
                            header="Updated At"
                            body={(rowData) =>
                                rowData.updated_at
                                    ? new Date(rowData.updated_at).toLocaleString()
                                    : "-"
                            }
                        />

                        <Column
                            header="Action"
                            body={(rowData) => (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary me-2"
                                        onClick={() => handleEdit(rowData)}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDelete(rowData.id)}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        />
                    </DataTable>
                </div>

            </div>

        </div>
    );
};

export default MasterList;
