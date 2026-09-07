import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const initialFormData = {
    name: "",
    address: "",
    phone_no: "",
    openbal: "",
    sid: "",
    sid1: "",
    salary: "",
    gstno: "",
    email_id: "",
    brick_type: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
};

const BrickParty = () => {
    const { authHeaders } = useAuth();
    const [parties, setParties] = useState([]);
    const [headMasters, setHeadMasters] = useState([]);
    const [tHeadMasters, setTHeadMasters] = useState([]);
    const [stockItems, setStockItems] = useState([]);
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

    const getDefaultFormData = useCallback(() => ({
        ...initialFormData,
        sid: toInputValue(headMasters[0]?.id),
        sid1: toInputValue(tHeadMasters[0]?.id),
    }), [headMasters, tHeadMasters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const getParties = useCallback(
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
                    "http://localhost:4000/api/party",
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
                    setParties(response.data.data || []);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                    return;
                }

                setParties([]);
                setTotalRecords(0);
                setError(response.data.message || "No parties found");
            } catch (err) {
                console.error("Brick party list error:", err);
                setParties([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch parties"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getOptions = useCallback(async () => {
        if (!authHeaders.Authorization) {
            return;
        }

        try {
            const [headResult, tHeadResult, stockResult] = await Promise.allSettled([
                axios.get("http://localhost:4000/api/head-master", {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }),
                axios.get("http://localhost:4000/api/t-head-master", {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }),
                axios.get("http://localhost:4000/api/stock-item", {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }),
            ]);

            let nextHeadMasters = [];
            let nextTHeadMasters = [];

            if (
                headResult.status === "fulfilled" &&
                headResult.value.data.status
            ) {
                nextHeadMasters = headResult.value.data.data || [];
            }

            if (
                tHeadResult.status === "fulfilled" &&
                tHeadResult.value.data.status
            ) {
                nextTHeadMasters = tHeadResult.value.data.data || [];
            }

            if (
                stockResult.status === "fulfilled" &&
                stockResult.value.data.status
            ) {
                setStockItems(stockResult.value.data.data || []);
            }

            setHeadMasters(nextHeadMasters);
            setTHeadMasters(nextTHeadMasters);
            setFormData((current) => ({
                ...current,
                sid: current.sid || toInputValue(nextHeadMasters[0]?.id),
                sid1: current.sid1 || toInputValue(nextTHeadMasters[0]?.id),
            }));
        } catch (err) {
            console.error("Brick party option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch party options"
            );
        }
    }, [authHeaders]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    useEffect(() => {
        getParties(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getParties]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const payload = {
            name: toInputValue(formData.name).trim(),
            address: toInputValue(formData.address).trim(),
            phone_no: toInputValue(formData.phone_no).trim(),
            openbal: toInputValue(formData.openbal).trim(),
            sid: formData.sid,
            sid1: formData.sid1,
            salary: toInputValue(formData.salary).trim(),
            gstno: toInputValue(formData.gstno).trim(),
            email_id: toInputValue(formData.email_id).trim(),
            brick_type: formData.brick_type,
        };

        if (!payload.sid) {
            setError("Head master is required");
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
                    `http://localhost:4000/api/party/${editId}`,
                    payload,
                    config
                )
                : await axios.post(
                    "http://localhost:4000/api/party",
                    payload,
                    config
                );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Party updated successfully"
                        : "Party created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getParties(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save party");
        } catch (err) {
            console.error("Save brick party error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save party"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (party) => {
        setEditId(party.id);
        setFormData({
            name: toInputValue(party.name),
            address: toInputValue(party.address),
            phone_no: toInputValue(party.phone_no),
            openbal: toInputValue(party.openbal),
            sid: toInputValue(party.sid),
            sid1: toInputValue(party.sid1),
            salary: toInputValue(party.salary),
            gstno: toInputValue(party.gstno),
            email_id: toInputValue(party.email_id),
            brick_type: toInputValue(party.brick_type),
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
            "Are you sure you want to delete this party?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `http://localhost:4000/api/party/${id}`,
                {
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Party deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getParties(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete party");
        } catch (err) {
            console.error("Delete brick party error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete party"
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

    const headBodyTemplate = (row) => {
        return row.head_master_name || "-";
    };

    const brickTypeBodyTemplate = (row) => {
        return row.brick_type_name || "-";
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
                    <h2 className="fw-bold mb-1">Brick Party</h2>
                    <p className="text-muted mb-0">
                        Create and manage brick parties
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
                    {showForm ? "Close" : "+ Add Party"}
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
                            {editId ? "Edit Party" : "Add Party"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="name"
                                        placeholder="Enter party name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Phone No
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="phone_no"
                                        placeholder="Enter phone number"
                                        value={formData.phone_no}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Opening Balance
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="openbal"
                                        placeholder="Enter opening balance"
                                        value={formData.openbal}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        GST No
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="gstno"
                                        placeholder="Enter GST number"
                                        value={formData.gstno}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email_id"
                                        placeholder="Enter email"
                                        value={formData.email_id}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Brick Type
                                    </label>
                                    <select
                                        className="form-select"
                                        name="brick_type"
                                        value={formData.brick_type}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select brick type</option>
                                        {stockItems.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="address"
                                        placeholder="Enter address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        Head Master
                                    </label>
                                    <select
                                        className="form-select"
                                        name="sid"
                                        value={formData.sid}
                                        onChange={handleChange}
                                    >
                                        {headMasters.map((head) => (
                                            <option key={head.id} value={head.id}>
                                                {head.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">
                                        T Head Master
                                    </label>
                                    <select
                                        className="form-select"
                                        name="sid1"
                                        value={formData.sid1}
                                        onChange={handleChange}
                                    >
                                        {tHeadMasters.map((head) => (
                                            <option key={head.id} value={head.id}>
                                                {head.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Salary
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="salary"
                                        placeholder="Enter salary"
                                        value={formData.salary}
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
                                                ? "Update Party"
                                                : "Save Party"}
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
                            <h5 className="mb-0">Brick Party List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search party..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={parties}
                        loading={listLoading}
                        lazy
                        paginator
                        first={(page - 1) * limit}
                        rows={limit}
                        totalRecords={totalRecords}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPage={handlePageChange}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: "58rem" }}
                        emptyMessage={
                            debouncedSearch
                                ? "No parties found for this search"
                                : "No parties found"
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
                            "Showing {first} to {last} of {totalRecords} parties"
                        }
                        showCurrentPageReport
                    >
                        <Column
                            header="#"
                            body={serialNumberTemplate}
                            style={{ width: "80px" }}
                        />
                        <Column field="name" header="Name" />
                        <Column field="phone_no" header="Phone No" />
                        <Column field="openbal" header="Opening Balance" />
                        <Column field="gstno" header="GST No" />
                        <Column field="email_id" header="Email" />
                        <Column
                            header="Brick Type"
                            body={brickTypeBodyTemplate}
                        />
                        <Column
                            header="Head Master"
                            body={headBodyTemplate}
                        />
                        <Column field="salary" header="Salary" />
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

export default BrickParty;
