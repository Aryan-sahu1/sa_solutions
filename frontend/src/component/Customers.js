import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showForm, setShowForm] = useState(false);

    const [editId, setEditId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);

    const [formData, setFormData] = useState({
        name: "",
        address: "",
        address1: "",
        contact_person: "",
        gstno: "",
        mobile: "",
        product_id: "",
        start_date: "",
        end_date: "",
        product_price: "",
        amc_price: "",
        username: "",
        password: "",
        company_code: "",
        remarks: "",
    });

    // ==========================================
    // SEARCH DEBOUNCE
    // ==========================================

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [search]);

    // ==========================================
    // GET CUSTOMERS
    // ==========================================

    const getCustomers = useCallback(
        async (currentPage, currentLimit, currentSearch) => {
            try {
                setListLoading(true);
                setError("");

                const params = {
                    page: currentPage,
                    limit: currentLimit,
                };

                if (currentSearch !== "") {
                    params.search = currentSearch;
                }

                const response = await axios.get(
                    "http://localhost:4000/api/customers",
                    {
                        params,
                        headers: {
                            "Cache-Control": "no-cache",
                            Pragma: "no-cache",
                        },
                    }
                );

                console.log("Customers:", response.data);

                if (response.data.status) {
                    const customerRows = (response.data.data || []).map(
                        (customer) => ({
                            ...customer,
                            product_id:
                                customer.product_id ||
                                customer.product?.id ||
                                "",
                        })
                    );

                    setCustomers(customerRows);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                } else {
                    setCustomers([]);
                    setTotalRecords(0);
                }

            } catch (error) {
                console.error("Customer list error:", error);

                setCustomers([]);
                setTotalRecords(0);
                setError(
                    error.response?.data?.message ||
                    "Failed to fetch customers"
                );
            } finally {
                setListLoading(false);
            }
        },
        []
    );

    // ==========================================
    // GET PRODUCTS
    // ==========================================

    const getProducts = async () => {
        try {
            const response = await axios.get(
                "http://localhost:4000/api/product/list",
                {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                }
            );

            if (response.data.status) {
                setProducts(response.data.data || []);
            }

        } catch (error) {
            console.error("Product list error:", error);
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        getProducts();
    }, []);

    useEffect(() => {
        getCustomers(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getCustomers]);

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
    // RESET FORM
    // ==========================================

    const resetForm = () => {
        setFormData({
            name: "",
            address: "",
            address1: "",
            contact_person: "",
            gstno: "",
            mobile: "",
            product_id: "",
            start_date: "",
            end_date: "",
            product_price: "",
            amc_price: "",
            username: "",
            password: "",
            company_code: "",
            remarks: "",
        });

        setEditId(null);
    };

    // ==========================================
    // OPEN ADD FORM
    // ==========================================

    const handleAdd = () => {
        resetForm();

        setError("");
        setMessage("");

        setShowForm(true);
    };

    // ==========================================
    // CREATE / UPDATE
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        // Validation
        if (!formData.name.trim()) {
            setError("Customer name is required");
            return;
        }

        if (!formData.address.trim()) {
            setError("Address is required");
            return;
        }

        if (!formData.mobile.trim()) {
            setError("Mobile number is required");
            return;
        }

        if (!formData.product_id) {
            setError("Please select product");
            return;
        }

        if (!formData.start_date) {
            setError("Start date is required");
            return;
        }

        if (!formData.end_date) {
            setError("End date is required");
            return;
        }

        if (!formData.username.trim()) {
            setError("Username is required");
            return;
        }

        // Password only required while creating
        if (!editId && !formData.password.trim()) {
            setError("Password is required");
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
                    `http://localhost:4000/api/customers/${editId}`,
                    {
                        name: formData.name.trim(),
                        address: formData.address.trim(),
                        address1: formData.address1.trim(),
                        contact_person:
                            formData.contact_person.trim(),
                        gstno: formData.gstno.trim(),
                        mobile: formData.mobile.trim(),
                        product_id: Number(formData.product_id),
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        product_price:
                            Number(formData.product_price) || 0,
                        amc_price:
                            Number(formData.amc_price) || 0,
                        username: formData.username.trim(),
                        company_code:
                            formData.company_code.trim(),
                        remarks: formData.remarks.trim(),
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
                    "http://localhost:4000/api/customers",
                    {
                        name: formData.name.trim(),
                        address: formData.address.trim(),
                        address1: formData.address1.trim(),
                        contact_person:
                            formData.contact_person.trim(),
                        gstno: formData.gstno.trim(),
                        mobile: formData.mobile.trim(),
                        product_id: Number(formData.product_id),
                        start_date: formData.start_date,
                        end_date: formData.end_date,
                        product_price:
                            Number(formData.product_price) || 0,
                        amc_price:
                            Number(formData.amc_price) || 0,
                        username: formData.username.trim(),
                        password: formData.password,
                        company_code:
                            formData.company_code.trim(),
                        remarks: formData.remarks.trim(),
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
            }

            console.log("Customer response:", response.data);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (
                        editId
                            ? "Customer updated successfully"
                            : "Customer created successfully"
                    )
                );

                resetForm();
                setShowForm(false);

                setPage(1);
                getCustomers(1, limit, debouncedSearch);
            }

        } catch (error) {
            console.error("Customer save error:", error);

            setError(
                error.response?.data?.message ||
                "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // EDIT CUSTOMER
    // ==========================================

    const handleEdit = (customer) => {
        setEditId(customer.id);

        setFormData({
            name: customer.name || "",
            address: customer.address || "",
            address1: customer.address1 || "",
            contact_person: customer.contact_person || "",
            gstno: customer.gstno || "",
            mobile: customer.mobile || "",
            product_id:
                customer.product_id ||
                customer.product?.id ||
                "",
            start_date: customer.start_date
                ? customer.start_date.substring(0, 10)
                : "",
            end_date: customer.end_date
                ? customer.end_date.substring(0, 10)
                : "",
            product_price: customer.product_price || "",
            amc_price: customer.amc_price || "",
            username: customer.username || "",
            password: "",
            company_code: customer.company_code || "",
            remarks: customer.remarks || "",
        });

        setError("");
        setMessage("");
        setShowForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ==========================================
    // DELETE CUSTOMER
    // ==========================================

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this customer?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setError("");
            setMessage("");

            const response = await axios.delete(
                `http://localhost:4000/api/customers/${id}`
            );

            console.log("Delete response:", response.data);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Customer deleted successfully"
                );

                getCustomers(page, limit, debouncedSearch);
            }

        } catch (error) {
            console.error("Delete customer error:", error);

            setError(
                error.response?.data?.message ||
                "Failed to delete customer"
            );
        }
    };

    // ==========================================
    // CANCEL
    // ==========================================

    const handleCancel = () => {
        resetForm();

        setShowForm(false);
        setError("");
        setMessage("");
    };

    // ==========================================
    // PAGINATION
    // ==========================================

    const handlePageChange = (event) => {
        const newPage = Math.floor(event.first / event.rows) + 1;

        setPage(newPage);
        setLimit(event.rows);
    };

    // ==========================================
    // PRODUCT NAME
    // ==========================================

    const getProductName = (productId) => {
        const product = products.find(
            (item) => Number(item.id) === Number(productId)
        );

        return product?.name || "-";
    };

    // ==========================================
    // FORMAT DATE
    // ==========================================

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString("en-IN");
    };

    const serialNumberTemplate = (customer, options) => {
        return (page - 1) * limit + options.rowIndex + 1;
    };

    const customerBodyTemplate = (customer) => {
        return (
            <div>
                <strong>{customer.name || "-"}</strong>

                <div className="small text-muted">
                    {customer.address || "-"}
                </div>
            </div>
        );
    };

    const productBodyTemplate = (customer) => {
        debugger
        const productName =
            customer.product?.name || getProductName(customer.product_id);

        return (
            <span className="badge bg-primary">
                {productName}
            </span>
        );
    };

    const startDateBodyTemplate = (customer) => {
        return formatDate(customer.start_date);
    };

    const endDateBodyTemplate = (customer) => {
        return formatDate(customer.end_date);
    };

    const priceBodyTemplate = (field) => {
        return (customer) => {
            return (
                <>
                    Rs.{" "}
                    {Number(customer[field] || 0).toLocaleString(
                        "en-IN"
                    )}
                </>
            );
        };
    };

    const actionBodyTemplate = (customer) => {
        return (
            <div className="d-flex gap-2">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleEdit(customer)}
                >
                    Edit
                </button>

                <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDelete(customer.id)}
                >
                    Delete
                </button>
            </div>
        );
    };

    return (
        <div className="container-fluid p-4">

            {/* ======================================
                HEADER
            ====================================== */}

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2 className="fw-bold mb-1">
                        Customers
                    </h2>

                    <p className="text-muted mb-0">
                        Customer management
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (showForm) {
                            handleCancel();
                        } else {
                            handleAdd();
                        }
                    }}
                >
                    {showForm ? "Close" : "+ Add Customer"}
                </button>

            </div>

            {/* ======================================
                SUCCESS MESSAGE
            ====================================== */}

            {message && (
                <div className="alert alert-success">
                    {message}
                </div>
            )}

            {/* ======================================
                ERROR MESSAGE
            ====================================== */}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {/* ======================================
                CUSTOMER FORM
            ====================================== */}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4">

                    <div className="card-header bg-white">

                        <h5 className="mb-0">
                            {editId
                                ? "Edit Customer"
                                : "Add Customer"}
                        </h5>

                    </div>

                    <div className="card-body">

                        <form onSubmit={handleSubmit}>

                            <div className="row">

                                {/* NAME */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Customer Name
                                    </label>

                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        placeholder="Enter customer name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* PRODUCT */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Product
                                    </label>

                                    <select
                                        name="product_id"
                                        className="form-select"
                                        value={formData.product_id}
                                        onChange={handleChange}
                                    >

                                        <option value="">
                                            Select Product
                                        </option>

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

                                {/* ADDRESS */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Address
                                    </label>

                                    <input
                                        type="text"
                                        name="address"
                                        className="form-control"
                                        placeholder="Enter address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* ADDRESS 1 */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Address 1
                                    </label>

                                    <input
                                        type="text"
                                        name="address1"
                                        className="form-control"
                                        placeholder="Enter address 1"
                                        value={formData.address1}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* CONTACT PERSON */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Contact Person
                                    </label>

                                    <input
                                        type="text"
                                        name="contact_person"
                                        className="form-control"
                                        placeholder="Enter contact person"
                                        value={formData.contact_person}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* GST */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        GST No
                                    </label>

                                    <input
                                        type="text"
                                        name="gstno"
                                        className="form-control"
                                        placeholder="Enter GST number"
                                        value={formData.gstno}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* MOBILE */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Mobile
                                    </label>

                                    <input
                                        type="tel"
                                        name="mobile"
                                        className="form-control"
                                        placeholder="Enter mobile number"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* START DATE */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Start Date
                                    </label>

                                    <input
                                        type="date"
                                        name="start_date"
                                        className="form-control"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* END DATE */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        End Date
                                    </label>

                                    <input
                                        type="date"
                                        name="end_date"
                                        className="form-control"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* PRODUCT PRICE */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Product Price
                                    </label>

                                    <input
                                        type="number"
                                        name="product_price"
                                        className="form-control"
                                        placeholder="Enter product price"
                                        value={formData.product_price}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* AMC PRICE */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        AMC Price
                                    </label>

                                    <input
                                        type="number"
                                        name="amc_price"
                                        className="form-control"
                                        placeholder="Enter AMC price"
                                        value={formData.amc_price}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* USERNAME */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Username
                                    </label>

                                    <input
                                        type="text"
                                        name="username"
                                        className="form-control"
                                        placeholder="Enter username"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* PASSWORD */}

                                {!editId && (
                                    <div className="col-md-6 mb-3">

                                        <label className="form-label fw-semibold">
                                            Password
                                        </label>

                                        <input
                                            type="password"
                                            name="password"
                                            className="form-control"
                                            placeholder="Enter password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />

                                    </div>
                                )}

                                {/* COMPANY CODE */}

                                <div className="col-md-6 mb-3">

                                    <label className="form-label fw-semibold">
                                        Company Code
                                    </label>

                                    <input
                                        type="text"
                                        name="company_code"
                                        className="form-control"
                                        placeholder="Enter company code"
                                        value={formData.company_code}
                                        onChange={handleChange}
                                    />

                                </div>

                                {/* REMARKS */}

                                <div className="col-md-12 mb-3">

                                    <label className="form-label fw-semibold">
                                        Remarks
                                    </label>

                                    <textarea
                                        name="remarks"
                                        className="form-control"
                                        rows="3"
                                        placeholder="Enter remarks"
                                        value={formData.remarks}
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
                                        ? "Update Customer"
                                        : "Save Customer"}
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

            {/* ======================================
                CUSTOMER LIST
            ====================================== */}

            <div className="card shadow-sm border-0">

                <div className="card-header bg-white p-3">

                    <div className="row align-items-center">

                        <div className="col-md-6">

                            <h5 className="mb-0">
                                Customer List
                            </h5>

                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">

                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search customer..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                            />

                        </div>

                    </div>

                </div>

                <div className="card-body">

                    <DataTable
                        value={customers}
                        loading={listLoading}
                        lazy
                        paginator
                        first={(page - 1) * limit}
                        rows={limit}
                        totalRecords={totalRecords}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPage={handlePageChange}
                        responsiveLayout="scroll"
                        tableStyle={{
                            minWidth: "90rem",
                        }}
                        emptyMessage={
                            debouncedSearch
                                ? "No customers found for this search"
                                : "No customers found"
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
                            "Showing {first} to {last} of {totalRecords} customers"
                        }
                        showCurrentPageReport
                    >

                        <Column
                            header="#"
                            body={serialNumberTemplate}
                            style={{
                                width: "80px",
                            }}
                        />

                        <Column
                            header="Customer"
                            body={customerBodyTemplate}
                            style={{
                                minWidth: "220px",
                            }}
                        />

                        <Column
                            field="contact_person"
                            header="Contact Person"
                            style={{
                                minWidth: "160px",
                            }}
                        />

                        <Column
                            field="mobile"
                            header="Mobile"
                            style={{
                                minWidth: "130px",
                            }}
                        />

                        <Column
                            field="gstno"
                            header="GST No"
                            style={{
                                minWidth: "160px",
                            }}
                        />

                        <Column
                            header="Product"
                            body={productBodyTemplate}
                            style={{
                                minWidth: "140px",
                            }}
                        />

                        <Column
                            header="Start Date"
                            body={startDateBodyTemplate}
                            style={{
                                minWidth: "120px",
                            }}
                        />

                        <Column
                            header="End Date"
                            body={endDateBodyTemplate}
                            style={{
                                minWidth: "120px",
                            }}
                        />

                        <Column
                            header="Product Price"
                            body={priceBodyTemplate("product_price")}
                            style={{
                                minWidth: "140px",
                            }}
                        />

                        <Column
                            header="AMC Price"
                            body={priceBodyTemplate("amc_price")}
                            style={{
                                minWidth: "120px",
                            }}
                        />

                        <Column
                            field="username"
                            header="Username"
                            style={{
                                minWidth: "140px",
                            }}
                        />

                        <Column
                            field="company_code"
                            header="Company Code"
                            style={{
                                minWidth: "150px",
                            }}
                        />

                        <Column
                            header="Action"
                            body={actionBodyTemplate}
                            frozen
                            alignFrozen="right"
                            style={{
                                minWidth: "160px",
                            }}
                        />

                    </DataTable>

                </div>

            </div>

        </div>
    );
};

export default Customers;
