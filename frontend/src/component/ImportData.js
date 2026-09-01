import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

const requiredSheets = [
    "head_master",
    "t_head_master",
    "product_category",
    "party",
    "stock_item",
    "vehicle_master",
    "nozel",
    "tran",
    "trande",
    "bill",
    "customer_petrol",
    "leak1",
    "meter",
    "meterde",
];

const ImportData = () => {
    const [customers, setCustomers] = useState([]);
    const [customerId, setCustomerId] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [summary, setSummary] = useState(null);

    const token = useMemo(() => localStorage.getItem("token"), []);

    const getCustomers = useCallback(async () => {
        try {
            setListLoading(true);
            const response = await axios.get(`${API_BASE_URL}/customers`, {
                params: {
                    page: 1,
                    limit: 1000,
                },
            });

            if (response.data.status) {
                setCustomers(response.data.data || []);
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to fetch customers"
            );
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        getCustomers();
    }, [getCustomers]);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0] || null;
        setFile(selectedFile);
        setMessage("");
        setError("");
        setSummary(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setSummary(null);

        if (!customerId) {
            setError("Please select customer");
            return;
        }

        if (!file) {
            setError("Please select Excel file");
            return;
        }

        const extension = file.name.split(".").pop()?.toLowerCase();
        if (extension !== "xlsx") {
            setError("Only .xlsx file is supported");
            return;
        }

        try {
            setLoading(true);
            const fileBuffer = await file.arrayBuffer();

            const response = await axios.post(
                `${API_BASE_URL}/import/excel`,
                fileBuffer,
                {
                    params: {
                        customer_id: customerId,
                    },
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type":
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    },
                }
            );

            if (response.data.status) {
                setMessage(response.data.message || "Data imported successfully");
                setSummary(response.data.data?.summary || {});
                setFile(null);
                event.target.reset();
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Import failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid p-4">
            <div className="mb-4">
                <h2 className="fw-bold mb-1">Import Data</h2>
                <p className="text-muted mb-0">
                    Upload customer-wise Excel data
                </p>
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

            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white">
                    <h5 className="mb-0">Excel Import</h5>
                </div>

                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">
                                    Customer
                                </label>
                                <select
                                    className="form-select"
                                    value={customerId}
                                    onChange={(event) =>
                                        setCustomerId(event.target.value)
                                    }
                                    disabled={listLoading || loading}
                                >
                                    <option value="">
                                        {listLoading
                                            ? "Loading customers..."
                                            : "Select customer"}
                                    </option>
                                    {customers.map((customer) => (
                                        <option
                                            key={customer.id}
                                            value={customer.id}
                                        >
                                            {customer.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-semibold">
                                    Excel File
                                </label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Importing..." : "Import Excel"}
                        </button>
                    </form>
                </div>
            </div>

            {summary && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white">
                        <h5 className="mb-0">Imported Rows</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {Object.entries(summary).map(([table, count]) => (
                                <div className="col-md-3 mb-3" key={table}>
                                    <div className="border rounded p-3 h-100">
                                        <div className="text-muted small">
                                            {table}
                                        </div>
                                        <div className="fs-4 fw-bold">
                                            {count}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white">
                    <h5 className="mb-0">Sheet Format</h5>
                </div>
                <div className="card-body">
                    <p className="text-muted">
                        Workbook me sheet names table names ke same rakho.
                        Har sheet me first column `id` ya `old_id` rakho, taki
                        importer old id se new id mapping bana sake.
                    </p>

                    <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Import Order</th>
                                    <th>Sheet Name</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requiredSheets.map((sheet, index) => (
                                    <tr key={sheet}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <code>{sheet}</code>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportData;
