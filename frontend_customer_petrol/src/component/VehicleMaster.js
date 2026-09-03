import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const initialFormData = {
    vehicle_no: "",
    balance: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
};

const VehicleMaster = () => {
    const { authHeaders } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [parties, setParties] = useState([]);
    const [selectedPartyId, setSelectedPartyId] = useState("");
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

    const getVehicles = useCallback(
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

                if (selectedPartyId) {
                    params.sid = selectedPartyId;
                }

                const response = await axios.get(
                    "http://localhost:4000/api/vehicle-master",
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
                    setVehicles(response.data.data || []);
                    setTotalRecords(
                        Number(response.data.pagination?.total || 0)
                    );
                    return;
                }

                setVehicles([]);
                setTotalRecords(0);
                setError(response.data.message || "No vehicles found");
            } catch (err) {
                console.error("Vehicle list error:", err);
                setVehicles([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch vehicles"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders, selectedPartyId]
    );

    const getParties = useCallback(async () => {
        if (!authHeaders.Authorization) {
            return;
        }

        try {
            const response = await axios.get(
                "http://localhost:4000/api/party",
                {
                    params: {
                        page: 1,
                        limit: 1000,
                    },
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                const nextParties = response.data.data || [];
                setParties(nextParties);
                setSelectedPartyId((current) =>
                    current || toInputValue(nextParties[0]?.id)
                );
            }
        } catch (err) {
            console.error("Party option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch party options"
            );
        }
    }, [authHeaders]);

    useEffect(() => {
        getParties();
    }, [getParties]);

    useEffect(() => {
        getVehicles(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, selectedPartyId, getVehicles]);

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

    const handlePartyChange = (e) => {
        setSelectedPartyId(e.target.value);
        setPage(1);
        setMessage("");
        setError("");
    };

    const handleAdd = async () => {
        if (!selectedPartyId) {
            setError("Please select party first");
            return;
        }

        resetForm();
        await getParties();
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
            name: toInputValue(formData.vehicle_no).trim(),
            balance: toInputValue(formData.balance).trim(),
            sid: selectedPartyId,
        };

        if (!payload.name) {
            setError("Vehicle no is required");
            return;
        }

        if (!payload.balance) {
            setError("Balance is required");
            return;
        }

        if (!payload.sid) {
            setError("Party is required");
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
                    `http://localhost:4000/api/vehicle-master/${editId}`,
                    payload,
                    config
                )
                : await axios.post(
                    "http://localhost:4000/api/vehicle-master",
                    payload,
                    config
                );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Vehicle updated successfully"
                        : "Vehicle created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getVehicles(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save vehicle");
        } catch (err) {
            console.error("Save vehicle error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save vehicle"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (vehicle) => {
        setEditId(vehicle.id);
        setFormData({
            vehicle_no: toInputValue(vehicle.name || vehicle.vehicle_no || vehicle.vehicleNo),
            balance: toInputValue(vehicle.balance),
        });
        setSelectedPartyId(toInputValue(vehicle.sid));
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
            "Are you sure you want to delete this vehicle?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(
                `http://localhost:4000/api/vehicle-master/${id}`,
                {
                    headers: authHeaders,
                }
            );

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    "Vehicle deleted successfully"
                );

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getVehicles(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete vehicle");
        } catch (err) {
            console.error("Delete vehicle error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete vehicle"
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
                    <h2 className="fw-bold mb-1">Vehicle Master</h2>
                    <p className="text-muted mb-0">
                        Create and manage vehicles
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
                    {showForm ? "Close" : "+ Add Vehicle"}
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
                            {editId ? "Edit Vehicle" : "Add Vehicle"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3 align-items-end">
                                

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Vehicle No
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="vehicle_no"
                                        placeholder="Enter vehicle number"
                                        value={formData.vehicle_no}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">
                                        Balance
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="balance"
                                        placeholder="Enter balance"
                                        value={formData.balance}
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
                                                ? "Update Vehicle"
                                                : "Save Vehicle"}
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
                        <div className="col-md-4">
                            <h5 className="mb-0">Vehicle List</h5>
                        </div>

                        <div className="col-md-4 mt-3 mt-md-0">
                            <select
                                className="form-select"
                                value={selectedPartyId}
                                onChange={handlePartyChange}
                            > 
                                {parties.map((party) => (
                                    <option key={party.id} value={party.id}>
                                        {party.name || `Party #${party.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-4 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search vehicle..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={vehicles}
                        loading={listLoading}
                        lazy
                        paginator
                        first={(page - 1) * limit}
                        rows={limit}
                        totalRecords={totalRecords}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPage={handlePageChange}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: "500px", maxWidth: "500px" }}
                        emptyMessage={
                            debouncedSearch
                                ? "No vehicles found for this search"
                                : "No vehicles found"
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
                            "Showing {first} to {last} of {totalRecords} vehicles"
                        }
                        showCurrentPageReport
                    >
                        <Column
                            header="#"
                            body={serialNumberTemplate}
                            style={{ width: "5%" }}
                        />
                        <Column field="name" header="Vehicle No"
                          style={{ width: "15%" }} /> 
                        <Column field="balance" header="Balance"
                        style={{ width: "10%" }} /> 
                       
                        <Column
                            header="Action"
                            body={actionBodyTemplate}
                           style={{ width: "15%" }}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default VehicleMaster;
