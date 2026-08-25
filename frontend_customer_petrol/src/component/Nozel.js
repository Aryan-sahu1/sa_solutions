import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    pid: "",
    name: "",
    snno: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
};

const Nozel = () => {
    const { authHeaders } = useAuth();
    const [nozels, setNozels] = useState([]);
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [nozelItems, setNozelItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showAddMoreModal, setShowAddMoreModal] = useState(false);
    const [addMoreAction, setAddMoreAction] = useState("yes");

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);
    const fieldRefs = {
        pid: useRef(null),
        name: useRef(null),
        snno: useRef(null),
        save: useRef(null),
    };
    const fieldOrder = ["pid", "name", "snno", "save"];
    const addMoreNoRef = useRef(null);
    const addMoreYesRef = useRef(null);

    const getDefaultFormData = useCallback(() => ({
        ...initialFormData,
        pid: toInputValue(products[0]?.id),
    }), [products]);

    const openSelectPicker = (element) => {
        if (!element || element.tagName !== "SELECT") {
            return;
        }

        window.setTimeout(() => {
            if (typeof element.showPicker === "function") {
                try {
                    element.showPicker();
                } catch {
                    // Browser can block programmatic picker opening outside user activation.
                }
            }
        }, 0);
    };

    const focusNextField = (currentName) => {
        const currentIndex = fieldOrder.indexOf(currentName);
        const nextName = fieldOrder[currentIndex + 1];

        if (nextName) {
            const element = fieldRefs[nextName]?.current;

            element?.focus();
            openSelectPicker(element);
        }
    };

    const handleFieldKeyDown = (fieldName, e) => {
        if (e.key !== "Enter") {
            return;
        }

        if (fieldName === "save") {
            e.preventDefault();
            handleSaveClick();
            return;
        }

        e.preventDefault();
        focusNextField(fieldName);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const getNozels = useCallback(
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

                const response = await axios.get(`${API_BASE_URL}/nozel`, {
                    params,
                    headers: {
                        ...authHeaders,
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                    },
                });

                if (response.data.status) {
                    setNozels(response.data.data || []);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                    return;
                }

                setNozels([]);
                setTotalRecords(0);
                setError(response.data.message || "No nozels found");
            } catch (err) {
                console.error("Nozel list error:", err);
                setNozels([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch nozels"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getProducts = useCallback(async () => {
        if (!authHeaders.Authorization) {
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/product-category`, {
                params: {
                    page: 1,
                    limit: 1000,
                },
                headers: authHeaders,
            });

            const productList = response.data.status ? response.data.data || [] : [];

            setProducts(productList);
            setFormData((current) => ({
                ...current,
                pid: current.pid || toInputValue(productList[0]?.id),
            }));
        } catch (err) {
            console.error("Product list error:", err);
            setProducts([]);
            setError(
                err.response?.data?.message ||
                "Failed to fetch products"
            );
        }
    }, [authHeaders]);

    useEffect(() => {
        getProducts();
    }, [getProducts]);

    useEffect(() => {
        getNozels(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getNozels]);

    useEffect(() => {
        if (!showAddMoreModal) {
            return;
        }

        setAddMoreAction("yes");
        window.setTimeout(() => addMoreYesRef.current?.focus(), 0);
    }, [showAddMoreModal]);

    const resetForm = () => {
        setFormData(getDefaultFormData());
        setEditId(null);
        setNozelItems([]);
        setShowAddMoreModal(false);
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

    const validateNozel = () => {
        if (!formData.pid) {
            return "Product is required";
        }

        if (!formData.name.trim()) {
            return "Name is required";
        }

        if (!formData.snno.trim()) {
            return "Serial number is required";
        }

        return "";
    };

    const buildCurrentNozel = () => {
        const product = products.find(
            (row) => String(row.id) === String(formData.pid)
        );

        return {
            pid: formData.pid,
            product_name: product?.name || `Product #${formData.pid}`,
            name: formData.name.trim(),
            snno: formData.snno.trim(),
        };
    };

    const saveNozels = async (itemsToSave) => {
        setMessage("");
        setError("");

        if (!Array.isArray(itemsToSave) || itemsToSave.length === 0) {
            setError("At least one nozel is required");
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

            if (editId) {
                const response = await axios.put(
                    `${API_BASE_URL}/nozel/${editId}`,
                    itemsToSave[0],
                    config
                );

                if (!response.data.status) {
                    setError(response.data.message || "Failed to update nozel");
                    return;
                }
            } else {
                for (const item of itemsToSave) {
                    const response = await axios.post(
                        `${API_BASE_URL}/nozel`,
                        item,
                        config
                    );

                    if (!response.data.status) {
                        setError(response.data.message || "Failed to save nozel");
                        return;
                    }
                }
            }

            if (editId || itemsToSave.length > 0) {
                setMessage(
                    (editId
                        ? "Nozel updated successfully"
                        : "Nozel entries saved successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getNozels(1, limit, debouncedSearch);
                return;
            }
        } catch (err) {
            console.error("Save nozel error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save nozel"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClick = async () => {
        setMessage("");
        setError("");

        const formError = validateNozel();

        if (formError) {
            setError(formError);
            return;
        }

        const currentNozel = buildCurrentNozel();

        if (editId) {
            await saveNozels([currentNozel]);
            return;
        }

        setNozelItems((current) => [...current, currentNozel]);
        setShowAddMoreModal(true);
    };

    const removeNozelItem = (indexToRemove) => {
        setNozelItems((current) =>
            current.filter((_, index) => index !== indexToRemove)
        );
    };

    const handleAddMoreYes = () => {
        setShowAddMoreModal(false);
        setFormData((current) => ({
            ...initialFormData,
            pid: current.pid,
        }));
        window.setTimeout(() => fieldRefs.name.current?.focus(), 0);
    };

    const handleAddMoreNo = async () => {
        setShowAddMoreModal(false);
        await saveNozels(nozelItems);
    };

    const handleAddMoreKeyDown = (e) => {
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            setAddMoreAction("no");
            addMoreNoRef.current?.focus();
            return;
        }

        if (e.key === "ArrowRight") {
            e.preventDefault();
            setAddMoreAction("yes");
            addMoreYesRef.current?.focus();
            return;
        }

        if (e.key === "Enter") {
            e.preventDefault();

            if (addMoreAction === "no") {
                handleAddMoreNo();
                return;
            }

            handleAddMoreYes();
        }
    };

    const handleEdit = (nozel) => {
        setEditId(nozel.id);
        setFormData({
            pid: toInputValue(nozel.pid),
            name: toInputValue(nozel.name),
            snno: toInputValue(nozel.snno),
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
            "Are you sure you want to delete this nozel?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/nozel/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Nozel deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getNozels(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete nozel");
        } catch (err) {
            console.error("Delete nozel error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete nozel"
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

    const productBodyTemplate = (row) => {
        return row.product_name || `Product #${row.pid}`;
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
                    <h2 className="fw-bold mb-1">Nozel</h2>
                    <p className="text-muted mb-0">
                        Create and manage nozels
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
                    {showForm ? "Close" : "+ Add Nozel"}
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
                            {editId ? "Edit Nozel" : "Add Nozel"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Product
                                    </label>
                                    <select
                                        ref={fieldRefs.pid}
                                        className="form-select"
                                        name="pid"
                                        value={formData.pid}
                                        onChange={handleChange}
                                        onFocus={(e) => openSelectPicker(e.currentTarget)}
                                        onKeyDown={(e) => handleFieldKeyDown("pid", e)}
                                        disabled={nozelItems.length > 0 && !editId}
                                    >
                                        <option value="">Select product</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Name
                                    </label>
                                    <input
                                        ref={fieldRefs.name}
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        placeholder="Enter nozel name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleFieldKeyDown("name", e)}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Serial Number
                                    </label>
                                    <input
                                        ref={fieldRefs.snno}
                                        type="number"
                                        className="form-control"
                                        name="snno"
                                        placeholder="Enter serial number"
                                        value={formData.snno}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleFieldKeyDown("snno", e)}
                                    />
                                </div>

                                <div className="col-12">
                                    <button
                                        ref={fieldRefs.save}
                                        type="button"
                                        className="btn btn-success me-2"
                                        disabled={loading}
                                        onClick={handleSaveClick}
                                        onKeyDown={(e) => handleFieldKeyDown("save", e)}
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

                        {nozelItems.length > 0 && !editId && (
                            <div className="table-responsive mt-4">
                                <table className="table table-bordered align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Name</th>
                                            <th>Serial Number</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {nozelItems.map((item, index) => (
                                            <tr key={`${item.snno}-${index}`}>
                                                <td>{index + 1}</td>
                                                <td>{item.product_name}</td>
                                                <td>{item.name}</td>
                                                <td>{item.snno}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeNozelItem(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white p-3">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <h5 className="mb-0">Nozel List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search by name, serial number or product..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={nozels}
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
                        emptyMessage={
                            debouncedSearch
                                ? "No nozels found for this search"
                                : "No nozels found"
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
                            "Showing {first} to {last} of {totalRecords} nozels"
                        }
                        showCurrentPageReport
                    >
                        <Column
                            header="#"
                            body={serialNumberTemplate}
                            style={{ width: "80px" }}
                        />
                        <Column field="name" header="Name" />
                        <Column field="snno" header="Serial Number" />
                        <Column header="Product" body={productBodyTemplate} />
                        <Column
                            header="Action"
                            body={actionBodyTemplate}
                            style={{ width: "180px" }}
                        />
                    </DataTable>
                </div>
            </div>

            {showAddMoreModal && (
                <div className="nozel-modal-backdrop">
                    <div className="nozel-modal" onKeyDown={handleAddMoreKeyDown}>
                        <h5 className="mb-2">Add more nozel?</h5>
                        <p className="text-muted mb-4">
                            Do you want to add another nozel before saving?
                        </p>
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                ref={addMoreNoRef}
                                type="button"
                                className={`btn ${addMoreAction === "no" ? "btn-secondary" : "btn-outline-secondary"}`}
                                onFocus={() => setAddMoreAction("no")}
                                onClick={handleAddMoreNo}
                            >
                                No, Save Nozel
                            </button>
                            <button
                                ref={addMoreYesRef}
                                type="button"
                                className={`btn ${addMoreAction === "yes" ? "btn-primary" : "btn-outline-primary"}`}
                                onFocus={() => setAddMoreAction("yes")}
                                onClick={handleAddMoreYes}
                            >
                                Yes, Add More
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .nozel-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(15, 23, 42, 0.45);
                }

                .nozel-modal {
                    width: min(460px, 100%);
                    padding: 24px;
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 22px 50px rgba(15, 23, 42, 0.24);
                }
            `}</style>
        </div>
    );
};

export default Nozel;
