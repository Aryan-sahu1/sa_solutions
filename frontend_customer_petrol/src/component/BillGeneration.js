import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";
import AnnexureBillPaper from "./AnnexureBillPaper";
import BillSupplyPaper from "./BillSupplyPaper";
import OilLubBillPaper from "./OilLubBillPaper";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    sdate: "",
    edate: "",
    date: "",
    billno: "",
    party: "",
    vehicleno: "",
    remarks: "",
    amt: "",
    type: "Others",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value);
};

const getCurrentDateValue = () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const toDateInputValue = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const timezoneOffset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const formatDate = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("en-GB");
};

const BillGeneration = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [parties, setParties] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [amountLoading, setAmountLoading] = useState(false);
    const [annexure, setAnnexure] = useState(null);
    const [billPreview, setBillPreview] = useState(null);
    const [annexureLoadingId, setAnnexureLoadingId] = useState(null);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);

    const getDefaultFormData = useCallback(() => ({
        ...initialFormData,
        sdate: getCurrentDateValue(),
        edate: getCurrentDateValue(),
        date: getCurrentDateValue(),
        party: toInputValue(parties[0]?.id),
        vehicleno: toInputValue(vehicles[0]?.id),
    }), [parties, vehicles]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const getEntries = useCallback(
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

                const response = await axios.get(`${API_BASE_URL}/bill`, {
                    params,
                    headers: {
                        ...authHeaders,
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                    },
                });

                if (response.data.status) {
                    setEntries(response.data.data || []);
                    setTotalRecords(Number(response.data.pagination?.total || 0));
                    return;
                }

                setEntries([]);
                setTotalRecords(0);
                setError(response.data.message || "No bill entries found");
            } catch (err) {
                console.error("Bill list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch bill entries"
                );
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getVehicles = useCallback(async (partyId, selectedVehicleId = "") => {
        if (!authHeaders.Authorization || !partyId) {
            setVehicles([]);
            setFormData((current) => ({
                ...current,
                vehicleno: "",
            }));
            return;
        }

        try {
            const response = await axios.get(`${API_BASE_URL}/vehicle-master`, {
                params: {
                    page: 1,
                    limit: 1000,
                    sid: partyId,
                },
                headers: authHeaders,
            });

            const nextVehicles = response.data.status ? response.data.data || [] : [];
            const nextSelectedVehicle = nextVehicles.some(
                (vehicle) => String(vehicle.id) === String(selectedVehicleId)
            )
                ? selectedVehicleId
                : toInputValue(nextVehicles[0]?.id);

            setVehicles(nextVehicles);
            setFormData((current) => ({
                ...current,
                vehicleno: current.vehicleno === "all"
                    ? "all"
                    : nextSelectedVehicle,
            }));
        } catch (err) {
            console.error("Bill vehicle option error:", err);
            setVehicles([]);
            setFormData((current) => ({
                ...current,
                vehicleno: "",
            }));
            setError(
                err.response?.data?.message ||
                "Failed to fetch vehicles"
            );
        }
    }, [authHeaders]);

    const getOptions = useCallback(async () => {
        if (!authHeaders.Authorization) {
            return;
        }

        try {
            const partyResult = await axios.get(`${API_BASE_URL}/party`, {
                params: {
                    page: 1,
                    limit: 1000,
                },
                headers: authHeaders,
            });

            const nextParties = partyResult.data.status
                ? partyResult.data.data || []
                : [];
            const firstPartyId = toInputValue(nextParties[0]?.id);

            setParties(nextParties);
            setFormData((current) => ({
                ...current,
                sdate: current.sdate || getCurrentDateValue(),
                edate: current.edate || getCurrentDateValue(),
                date: current.date || getCurrentDateValue(),
                party: current.party || firstPartyId,
            }));

            if (firstPartyId) {
                await getVehicles(firstPartyId);
            }
        } catch (err) {
            console.error("Bill option error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch party options"
            );
        }
    }, [authHeaders, getVehicles]);

    const getNextBillNo = useCallback(async () => {
        const response = await axios.get(`${API_BASE_URL}/bill/next-bill-no`, {
            headers: authHeaders,
        });

        return response.data?.data?.billno || "";
    }, [authHeaders]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    useEffect(() => {
        getEntries(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getEntries]);

    useEffect(() => {
        if (
            !showForm ||
            !authHeaders.Authorization ||
            !formData.sdate ||
            !formData.edate ||
            !formData.party ||
            !formData.vehicleno
        ) {
            return;
        }

        if (formData.sdate > formData.edate) {
            setFormData((current) => ({
                ...current,
                amt: "",
            }));
            return;
        }

        let isCancelled = false;

        const fetchSalesTotal = async () => {
            try {
                setAmountLoading(true);

                const response = await axios.get(`${API_BASE_URL}/bill/sales-total`, {
                    params: {
                        sdate: formData.sdate,
                        edate: formData.edate,
                        party: formData.party,
                        vehicleno: formData.vehicleno,
                    },
                    headers: authHeaders,
                });

                if (isCancelled) {
                    return;
                }

                if (response.data.status) {
                    setFormData((current) => ({
                        ...current,
                        amt: toInputValue(response.data.data?.amt || "0.00"),
                    }));
                    return;
                }

                setError(response.data.message || "Failed to fetch sales total");
            } catch (err) {
                if (isCancelled) {
                    return;
                }

                console.error("Sales total error:", err);
                setError(
                    err.response?.data?.message ||
                    "Failed to fetch sales total"
                );
            } finally {
                if (!isCancelled) {
                    setAmountLoading(false);
                }
            }
        };

        fetchSalesTotal();

        return () => {
            isCancelled = true;
        };
    }, [
        showForm,
        authHeaders,
        formData.sdate,
        formData.edate,
        formData.party,
        formData.vehicleno,
    ]);

    const resetForm = () => {
        setFormData(getDefaultFormData());
        setEditId(null);
    };

    const handleAdd = async () => {
        try {
            const nextBillNo = await getNextBillNo();

            setFormData({
                ...getDefaultFormData(),
                billno: nextBillNo,
            });
            setEditId(null);
            setShowForm(true);
            setMessage("");
            setError("");
        } catch (err) {
            console.error("Next bill no error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to fetch next bill no"
            );
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "party") {
            setFormData((current) => ({
                ...current,
                party: value,
                vehicleno: "",
                amt: "",
            }));
            getVehicles(value);
            return;
        }

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const payload = {
            sdate: toInputValue(formData.sdate).trim(),
            edate: toInputValue(formData.edate).trim(),
            date: toInputValue(formData.date).trim(),
            billno: toInputValue(formData.billno).trim(),
            party: formData.party,
            vehicleno: formData.vehicleno,
            remarks: toInputValue(formData.remarks).trim(),
            amt: toInputValue(formData.amt).trim(),
            type: formData.type,
        };

        if (!payload.sdate) return setError("Start date is required");
        if (!payload.edate) return setError("End date is required");
        if (!payload.date) return setError("Date is required");
        if (!payload.billno) return setError("Bill no is required");
        if (!payload.party) return setError("Party is required");
        if (!payload.vehicleno) return setError("Vehicle is required");
        if (!payload.amt) return setError("Amount is required");
        if (!payload.type) return setError("Type is required");

        try {
            setLoading(true);

            const config = {
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json",
                },
            };

            const response = editId
                ? await axios.put(`${API_BASE_URL}/bill/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/bill`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Bill entry updated successfully"
                        : response.data.data?.count > 1
                            ? `${response.data.data.count} bill entries created successfully`
                            : "Bill entry created successfully")
                );

                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save bill entry");
        } catch (err) {
            console.error("Save bill error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to save bill entry"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        setShowForm(false);
        setError("");
    };

    const handleEdit = async (entry) => {
        await getVehicles(entry.party, toInputValue(entry.vehicleno));

        setEditId(entry.id);
        setFormData({
            sdate: toDateInputValue(entry.sdate),
            edate: toDateInputValue(entry.edate),
            date: toDateInputValue(entry.date),
            billno: toInputValue(entry.billno),
            party: toInputValue(entry.party),
            vehicleno: toInputValue(entry.vehicleno),
            remarks: toInputValue(entry.remarks),
            amt: toInputValue(entry.amt),
            type: entry.type || "Others",
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
            "Are you sure you want to delete this bill entry?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/bill/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Bill entry deleted successfully");

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getEntries(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete bill entry");
        } catch (err) {
            console.error("Delete bill error:", err);
            setError(
                err.response?.data?.message ||
                "Failed to delete bill entry"
            );
        }
    };

    const downloadPaper = async (selector, fileName) => {
        const paper = document.querySelector(selector);
        if (!paper) return;

        const canvas = await html2canvas(paper, {
            backgroundColor: "#ffffff",
            scale: 2,
            useCORS: true,
        });
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageHeightInCanvas = Math.floor(canvas.width * (pageHeight / pageWidth));
        let renderedHeight = 0;
        let pageNumber = 0;

        while (renderedHeight < canvas.height) {
            const sliceHeight = Math.min(pageHeightInCanvas, canvas.height - renderedHeight);
            const pageCanvas = document.createElement("canvas");
            const pageContext = pageCanvas.getContext("2d");

            pageCanvas.width = canvas.width;
            pageCanvas.height = sliceHeight;
            pageContext.fillStyle = "#ffffff";
            pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageContext.drawImage(
                canvas,
                0,
                renderedHeight,
                canvas.width,
                sliceHeight,
                0,
                0,
                canvas.width,
                sliceHeight
            );

            if (pageNumber > 0) {
                pdf.addPage();
            }

            pdf.addImage(
                pageCanvas.toDataURL("image/jpeg", 0.98),
                "JPEG",
                0,
                0,
                pageWidth,
                (sliceHeight * pageWidth) / canvas.width
            );

            renderedHeight += sliceHeight;
            pageNumber += 1;
        }

        pdf.save(fileName);
    };

    const printPaper = (selector, title, printSelector = selector, printPadding = "12mm 26mm 12mm") => {
        const paper = document.querySelector(selector);
        if (!paper) return;

        const printWindow = window.open("", "_blank", "width=900,height=1100");
        if (!printWindow) {
            window.print();
            return;
        }

        const pageStyles = Array.from(
            document.querySelectorAll("style, link[rel='stylesheet']")
        ).map((node) => node.outerHTML).join("");

        printWindow.document.write(`
            <!doctype html>
            <html>
                <head>
                    <title>${title}</title>
                    ${pageStyles}
                    <style>
                        @page { size: A4 portrait; margin: 0; }
                        html, body {
                            margin: 0;
                            padding: 0;
                            background: #ffffff;
                        }
                        ${printSelector} {
                            width: 210mm !important;
                            min-height: 297mm !important;
                            margin: 0 auto !important;
                            padding: ${printPadding} !important;
                            border: 0 !important;
                            box-shadow: none !important;
                            box-sizing: border-box !important;
                        }
                    </style>
                </head>
                <body>${paper.outerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
    };

    const handleAnnexure = async (entry, mode = "view") => {
        try {
            setAnnexureLoadingId(entry.id);
            setError("");

            const response = await axios.get(`${API_BASE_URL}/bill/${entry.id}/annexure`, {
                headers: authHeaders,
            });

            if (!response.data.status) {
                setError(response.data.message || "Failed to fetch bill annexure");
                return;
            }

            setAnnexure(response.data.data);
            setBillPreview(null);

            if (mode === "print") {
                setTimeout(() => printPaper(".annexure-bill-paper", "annexure-bill.pdf"), 100);
            }

            if (mode === "download") {
                setTimeout(() => downloadPaper(".annexure-bill-paper", "annexure-bill.pdf"), 100);
            }
        } catch (err) {
            console.error("Bill annexure error:", err);
            setError(err.response?.data?.message || "Failed to fetch bill annexure");
        } finally {
            setAnnexureLoadingId(null);
        }
    };

    const handleBill = async (entry, mode = "view") => {
        try {
            setAnnexureLoadingId(entry.id);
            setError("");

            const response = await axios.get(`${API_BASE_URL}/bill/${entry.id}/annexure`, {
                headers: authHeaders,
            });

            if (!response.data.status) {
                setError(response.data.message || "Failed to fetch bill");
                return;
            }

            setBillPreview(response.data.data);
            setAnnexure(null);

            const isLubBill = response.data.data?.bill?.type === "Lub";
            const billSelector = isLubBill ? ".oil-lub-bill-paper" : ".bill-supply-paper";
            const billFileName = isLubBill ? "oil-lub-bill.pdf" : "vehicle-wise-bill.pdf";

            if (mode === "print") {
                setTimeout(() => printPaper(
                    billSelector,
                    billFileName,
                    billSelector,
                    "6mm 10mm"
                ), 100);
            }

            if (mode === "download") {
                setTimeout(() => downloadPaper(billSelector, billFileName), 100);
            }
        } catch (err) {
            console.error("Bill preview error:", err);
            setError(err.response?.data?.message || "Failed to fetch bill");
        } finally {
            setAnnexureLoadingId(null);
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
        const isAnnexureLoading = annexureLoadingId === row.id;

        return (
            <div className="d-flex flex-wrap gap-1">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
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
                <button
                    type="button"
                    className="btn btn-sm btn-dark"
                    onClick={() => handleBill(row, "view")}
                    disabled={isAnnexureLoading}
                >
                    Bill
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => handleBill(row, "print")}
                    disabled={isAnnexureLoading}
                >
                    Bill Print
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={() => handleBill(row, "download")}
                    disabled={isAnnexureLoading}
                >
                    Bill PDF
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => handleAnnexure(row, "view")}
                    disabled={isAnnexureLoading}
                >
                    Annexure
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => handleAnnexure(row, "print")}
                    disabled={isAnnexureLoading}
                >
                    Print
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={() => handleAnnexure(row, "download")}
                    disabled={isAnnexureLoading}
                >
                    PDF
                </button>
            </div>
        );
    };

    const vehicleBodyTemplate = (row) => (
        row.vehicle_name || (row.vehicleno ? `Vehicle #${row.vehicleno}` : "All Vehicles")
    );

    return (
        <div className="container-fluid p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Bill Generation</h2>
                    <p className="text-muted mb-0">
                        Create and manage bill entries
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
                    {showForm ? "Close" : "+ Add Entry"}
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
                            {editId ? "Edit Entry" : "New Entry"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Start Date</label>
                                    <input type="date" className="form-control" name="sdate" value={formData.sdate} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">End Date</label>
                                    <input type="date" className="form-control" name="edate" value={formData.edate} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Date</label>
                                    <input type="date" className="form-control" name="date" value={formData.date} onChange={handleChange} />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Bill No</label>
                                    <input type="text" className="form-control" name="billno" placeholder="Auto bill no" value={formData.billno} onChange={handleChange} readOnly />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Party</label>
                                    <select className="form-select" name="party" value={formData.party} onChange={handleChange}>
                                        {parties.map((party) => (
                                            <option key={party.id} value={party.id}>
                                                {party.name || `Party #${party.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Vehicle No</label>
                                    <select className="form-select" name="vehicleno" value={formData.vehicleno} onChange={handleChange}>
                                        {!editId && vehicles.length > 0 && (
                                            <option value="all">All Vehicles</option>
                                        )}
                                        {vehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.name || `Vehicle #${vehicle.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Amount</label>
                                    <input type="number" step="0.01" className="form-control" name="amt" placeholder={amountLoading ? "Fetching..." : "Enter amount"} value={formData.amt} onChange={handleChange} />
                                    {amountLoading && (
                                        <small className="text-muted">Calculating sales total...</small>
                                    )}
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Type</label>
                                    <select className="form-select" name="type" value={formData.type} onChange={handleChange}>
                                        <option value="Others">Others</option>
                                        <option value="Lub">Lub</option>
                                    </select>
                                </div>
                                <div className="col-12">
                                    <label className="form-label fw-semibold">Remarks</label>
                                    <textarea className="form-control" name="remarks" rows="2" placeholder="Enter remarks" value={formData.remarks} onChange={handleChange} />
                                </div>
                                <div className="col-12">
                                    <button type="submit" className="btn btn-success me-2" disabled={loading}>
                                        {loading ? "Saving..." : editId ? "Update" : "Save"}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {billPreview && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <h5 className="mb-0">Bill Preview</h5>
                        <div>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => printPaper(
                                    billPreview?.bill?.type === "Lub" ? ".oil-lub-bill-paper" : ".bill-supply-paper",
                                    billPreview?.bill?.type === "Lub" ? "oil-lub-bill.pdf" : "vehicle-wise-bill.pdf",
                                    billPreview?.bill?.type === "Lub" ? ".oil-lub-bill-paper" : ".bill-supply-paper",
                                    "6mm 10mm"
                                )}
                            >
                                Print
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-success me-2"
                                onClick={() => downloadPaper(
                                    billPreview?.bill?.type === "Lub" ? ".oil-lub-bill-paper" : ".bill-supply-paper",
                                    billPreview?.bill?.type === "Lub" ? "oil-lub-bill.pdf" : "vehicle-wise-bill.pdf"
                                )}
                            >
                                Download PDF
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setBillPreview(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="card-body annexure-preview-wrap">
                        {billPreview?.bill?.type === "Lub" ? (
                            <OilLubBillPaper annexure={billPreview} />
                        ) : (
                            <BillSupplyPaper annexure={billPreview} />
                        )}
                    </div>
                </div>
            )}

            {annexure && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
                        <h5 className="mb-0">Annexure Preview</h5>
                        <div>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-dark me-2"
                                onClick={() => printPaper(".annexure-bill-paper", "annexure-bill.pdf")}
                            >
                                Print
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-success me-2"
                                onClick={() => downloadPaper(".annexure-bill-paper", "annexure-bill.pdf")}
                            >
                                Download PDF
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setAnnexure(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    <div className="card-body annexure-preview-wrap">
                        <AnnexureBillPaper annexure={annexure} />
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white p-3">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <h5 className="mb-0">Entry List</h5>
                        </div>
                        <div className="col-md-6 mt-3 mt-md-0">
                            <input type="text" className="form-control" placeholder="Search entry..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={entries}
                        loading={listLoading}
                        lazy
                        paginator
                        first={(page - 1) * limit}
                        rows={limit}
                        totalRecords={totalRecords}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPage={handlePageChange}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: "25rem" }}
                        emptyMessage={debouncedSearch ? "No entries found for this search" : "No entries found"}
                        paginatorTemplate={"FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"}
                        currentPageReportTemplate={"Showing {first} to {last} of {totalRecords} entries"}
                        showCurrentPageReport
                    >
                        <Column header="Sn" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column field="billno" header="Bill No" />
                        <Column header="Bill Date" body={(row) => formatDate(row.date)} />
                        <Column header="Sdate" body={(row) => formatDate(row.sdate)} />
                        <Column header="Edate" body={(row) => formatDate(row.edate)} />
                        <Column header="Vehicle No" body={vehicleBodyTemplate} />
                        <Column field="party_name" header="Party Name" />
                        <Column field="amt" header="Amt" />
                        <Column field="type" header="Type" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "320px" }} />
                    </DataTable>
                </div>
            </div>

            <style>{`
                .annexure-preview-wrap {
                    overflow-x: auto;
                    background: #f3f4f6;
                }

                .bill-supply-paper {
                    width: min(794px, 100%);
                    min-height: 1123px;
                    margin: 0 auto;
                    padding: 24px 38px;
                    background: #ffffff;
                    color: #000000;
                    border: 1px solid #cfcfcf;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
                    font-family: Tahoma, Arial, Helvetica, sans-serif;
                    font-size: 8px;
                    line-height: 1.15;
                }

                .bill-border {
                    min-height: 1048px;
                    border: 2px solid #111111;
                    padding: 8px 10px;
                }

                .bill-topline {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    font-size: 8px;
                    line-height: 1.1;
                }

                .bill-company {
                    text-align: center;
                    margin-top: 3px;
                }

                .bill-company h1 {
                    margin: 0;
                    font-size: 25px;
                    line-height: 1;
                    font-weight: 800;
                    letter-spacing: 0;
                }

                .bill-company h2 {
                    margin: 4px 0 8px;
                    font-size: 10px;
                    line-height: 1;
                    font-weight: 800;
                }

                .bill-dealer,
                .bill-title {
                    margin: 0 -10px;
                    padding: 8px 10px;
                    border-top: 1px solid #777777;
                    text-align: center;
                    font-size: 10px;
                    font-weight: 800;
                    line-height: 1;
                }

                .bill-title {
                    border-bottom: 1px solid #777777;
                }

                .bill-info-grid {
                    display: grid;
                    grid-template-columns: 1.1fr 0.55fr 0.9fr;
                    gap: 12px;
                    min-height: 116px;
                    padding: 8px 0;
                    font-size: 10px;
                    line-height: 1.25;
                }

                .bill-party-name,
                .bill-party-address,
                .bill-party-gstin {
                    margin-top: 10px;
                    font-weight: 800;
                }

                .bill-party-address,
                .bill-party-gstin {
                    margin-left: 30px;
                }

                .bill-item-label {
                    padding-top: 18px;
                    text-align: center;
                }

                .bill-meta div {
                    display: grid;
                    grid-template-columns: 74px 12px 1fr;
                    gap: 3px;
                    margin-bottom: 5px;
                }

                .bill-vehicle {
                    margin-bottom: 5px;
                    font-size: 10px;
                }

                .bill-supply-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    font-size: 8px;
                }

                .bill-supply-table th,
                .bill-supply-table td {
                    padding: 4px 4px;
                    border-left: 2px solid #222222;
                    border-right: 2px solid #222222;
                    border-bottom: 1px solid #999999;
                    vertical-align: top;
                }

                .bill-supply-table th {
                    font-weight: 400;
                    text-align: center;
                    border-top: 1px solid #999999;
                }

                .bill-supply-table th:nth-child(1),
                .bill-supply-table td:nth-child(1) {
                    width: 34px;
                    text-align: center;
                }

                .bill-supply-table th:nth-child(2),
                .bill-supply-table td:nth-child(2) {
                    width: 54px;
                }

                .bill-supply-table th:nth-child(3),
                .bill-supply-table td:nth-child(3) {
                    width: 72px;
                    text-align: center;
                }

                .bill-supply-table th:nth-child(4),
                .bill-supply-table td:nth-child(4) {
                    width: 88px;
                    text-align: center;
                }

                .bill-supply-table th:nth-child(6),
                .bill-supply-table td:nth-child(6) {
                    width: 92px;
                    text-align: right;
                }

                .bill-supply-table th:nth-child(7),
                .bill-supply-table td:nth-child(7) {
                    width: 58px;
                    text-align: right;
                }

                .bill-supply-table th:nth-child(8),
                .bill-supply-table td:nth-child(8) {
                    width: 84px;
                    text-align: right;
                }

                .bill-supply-table tfoot td {
                    border-bottom: 1px solid #999999;
                    font-size: 10px;
                }

                .bill-tcs-row {
                    display: grid;
                    grid-template-columns: 1fr 72px 86px;
                    gap: 16px;
                    margin: 22px 24px 38px 0;
                    text-align: right;
                    font-size: 9px;
                }

                .bill-tcs-row span:first-child {
                    grid-column: 2;
                }

                .bill-summary {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 18px;
                    margin-left: 260px;
                    margin-bottom: 28px;
                    text-align: right;
                    font-size: 9px;
                }

                .bill-summary div {
                    display: grid;
                    gap: 18px;
                }

                .bill-footer {
                    display: grid;
                    grid-template-columns: 1fr 220px;
                    gap: 24px;
                    margin-top: 26px;
                    font-size: 9px;
                    line-height: 1.2;
                }

                .bill-footer h3 {
                    margin: 0 0 12px;
                    font-size: 11px;
                    line-height: 1;
                }

                .bill-footer p {
                    margin: 0;
                }

                .bill-signature {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 72px;
                    text-align: right;
                }

                .oil-lub-bill-paper {
                    width: min(794px, 100%);
                    min-height: 1123px;
                    margin: 0 auto;
                    padding: 22px 40px;
                    background: #ffffff;
                    color: #000000;
                    border: 1px solid #cfcfcf;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
                    font-family: Tahoma, Arial, Helvetica, sans-serif;
                    font-size: 8px;
                    line-height: 1.1;
                }

                .oil-bill-border {
                    min-height: 704px;
                    border: 2px solid #111111;
                    padding: 8px 6px 0;
                }

                .oil-invoice-top {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    align-items: center;
                    font-size: 8px;
                    font-weight: 800;
                    line-height: 1;
                }

                .oil-invoice-top strong:last-child {
                    text-align: right;
                }

                .oil-company-meta {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 9px;
                    font-size: 8px;
                    font-weight: 800;
                }

                .oil-company {
                    text-align: center;
                    margin-top: 0;
                }

                .oil-company h1 {
                    margin: 0;
                    font-size: 28px;
                    line-height: 1;
                    font-weight: 800;
                    letter-spacing: 0;
                }

                .oil-company h2 {
                    margin: 15px 0 54px;
                    font-size: 8px;
                    line-height: 1;
                    font-weight: 800;
                }

                .oil-dealer {
                    margin: 0 -6px;
                    padding: 3px 8px;
                    border-top: 1px solid #111111;
                    border-bottom: 1px solid #111111;
                    text-align: center;
                    font-size: 8px;
                    font-weight: 800;
                }

                .oil-info-row {
                    display: grid;
                    grid-template-columns: 1.45fr 1fr;
                    margin: 0 -6px;
                    border-bottom: 1px solid #111111;
                    font-size: 8px;
                    line-height: 1.35;
                }

                .oil-info-row > div {
                    min-height: 74px;
                    padding: 4px 6px;
                }

                .oil-party-name {
                    font-weight: 800;
                }

                .oil-info-row > div:first-child {
                    border-right: 1px solid #111111;
                }

                .oil-info-row > div:last-child div {
                    display: grid;
                    grid-template-columns: 72px 1fr;
                    gap: 6px;
                    margin-bottom: 2px;
                }

                .oil-lub-table {
                    width: calc(100% + 12px);
                    margin: 0 -6px;
                    border-collapse: collapse;
                    table-layout: fixed;
                    font-size: 8px;
                    line-height: 1.1;
                }

                .oil-lub-table th,
                .oil-lub-table td {
                    padding: 3px 4px;
                    border-left: 1px solid #111111;
                    border-right: 1px solid #111111;
                    vertical-align: top;
                }

                .oil-lub-table th {
                    border-bottom: 1px solid #111111;
                    text-align: center;
                    font-weight: 800;
                }

                .oil-lub-table th:nth-child(1),
                .oil-lub-table td:nth-child(1) {
                    width: 48px;
                    text-align: left;
                }

                .oil-lub-table th:nth-child(2),
                .oil-lub-table td:nth-child(2) {
                    width: 126px;
                    text-align: left;
                }

                .oil-lub-table th:nth-child(3),
                .oil-lub-table td:nth-child(3) {
                    width: 70px;
                    text-align: center;
                }

                .oil-lub-table th:nth-child(4),
                .oil-lub-table td:nth-child(4) {
                    width: 54px;
                    text-align: center;
                }

                .oil-lub-table th:nth-child(5),
                .oil-lub-table td:nth-child(5) {
                    width: 58px;
                    text-align: center;
                }

                .oil-lub-table th:nth-child(6),
                .oil-lub-table td:nth-child(6) {
                    width: 68px;
                    text-align: center;
                }

                .oil-lub-table th:nth-child(7),
                .oil-lub-table td:nth-child(7),
                .oil-lub-table th:nth-child(8),
                .oil-lub-table td:nth-child(8),
                .oil-lub-table th:nth-child(9),
                .oil-lub-table td:nth-child(9) {
                    width: 70px;
                    text-align: right;
                }

                .oil-lub-table .oil-filler-row td {
                    height: 384px;
                    border-bottom: 1px solid #111111;
                }

                .oil-lub-table tfoot td {
                    padding: 3px 4px;
                    font-weight: 800;
                }

                .oil-lub-table tfoot tr:first-child td {
                    border-top: 1px solid #111111;
                }

                .oil-lub-table tfoot tr:last-child td {
                    border-bottom: 1px solid #111111;
                }

                .oil-signature {
                    margin-top: 8px;
                    padding-right: 28px;
                    text-align: right;
                    font-size: 8px;
                    font-weight: 800;
                }

                .annexure-bill-paper {
                    width: min(794px, 100%);
                    min-height: 1123px;
                    margin: 0 auto;
                    padding: 46px 98px;
                    background: #ffffff;
                    color: #000000;
                    border: 1px solid #cfcfcf;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
                    font-family: Tahoma, Arial, Helvetica, sans-serif;
                    font-size: 8px;
                    line-height: 1.1;
                }

                .annexure-bill-paper h1 {
                    margin: 0;
                    text-align: center;
                    font-family: Tahoma, Arial, Helvetica, sans-serif;
                    font-size: 32px;
                    line-height: 1;
                    font-weight: 800;
                    letter-spacing: 0;
                }

                .annexure-bill-paper h2 {
                    margin: 0 0 10px;
                    text-align: center;
                    font-family: Tahoma, Arial, Helvetica, sans-serif;
                    font-size: 16px;
                    line-height: 1;
                    font-weight: 800;
                }

                .annexure-rule {
                    border-top: 2px solid #111111;
                }

                .annexure-bill-meta {
                    display: flex;
                    gap: 52px;
                    padding: 10px 0 12px;
                    font-family: Tahoma, Arial, Helvetica, sans-serif;
                    font-size: 8px;
                    line-height: 1;
                }

                .annexure-slip-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    font-family: Tahoma, Arial, Helvetica, sans-serif;
                    font-size: 8px;
                    line-height: 1.05;
                }

                .annexure-slip-table th,
                .annexure-slip-table td {
                    padding: 4px 2px;
                    white-space: nowrap;
                }

                .annexure-slip-table thead th {
                    border-bottom: 2px solid #111111;
                    font-size: 8px;
                    text-align: left;
                    font-weight: 800;
                }

                .annexure-slip-table th:nth-child(1),
                .annexure-slip-table td:nth-child(1) {
                    width: 70px;
                }

                .annexure-slip-table th:nth-child(2),
                .annexure-slip-table td:nth-child(2) {
                    width: 90px;
                }

                .annexure-slip-table th:nth-child(3),
                .annexure-slip-table td:nth-child(3) {
                    width: 80px;
                }

                .annexure-slip-table th:nth-child(5),
                .annexure-slip-table td:nth-child(5) {
                    width: 52px;
                    text-align: center;
                }

                .annexure-slip-table th:nth-child(6),
                .annexure-slip-table td:nth-child(6),
                .annexure-slip-table th:nth-child(7),
                .annexure-slip-table td:nth-child(7),
                .annexure-slip-table th:nth-child(8),
                .annexure-slip-table td:nth-child(8) {
                    width: 78px;
                    text-align: right;
                }

                .annexure-slip-table tbody tr:last-child td {
                    border-bottom: 2px solid #111111;
                }

                .annexure-slip-table tfoot td {
                    padding-top: 10px;
                    font-size: 8px;
                    font-weight: 800;
                    text-align: right;
                }

                .annexure-bottom-rule {
                    margin-top: 12px;
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }

                    body * {
                        visibility: hidden;
                    }

                    .annexure-bill-paper,
                    .annexure-bill-paper *,
                    .bill-supply-paper,
                    .bill-supply-paper *,
                    .oil-lub-bill-paper,
                    .oil-lub-bill-paper * {
                        visibility: visible;
                    }

                    .annexure-bill-paper,
                    .annexure-bill-paper * {
                        visibility: visible;
                    }

                    .annexure-bill-paper {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        min-height: 297mm;
                        margin: 0;
                        padding: 12mm 26mm;
                        border: 0;
                        box-shadow: none;
                        box-sizing: border-box;
                    }

                    .bill-supply-paper {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        min-height: 297mm;
                        margin: 0;
                        padding: 6mm 10mm;
                        border: 0;
                        box-shadow: none;
                        box-sizing: border-box;
                    }

                    .oil-lub-bill-paper {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                        min-height: 297mm;
                        margin: 0;
                        padding: 6mm 10mm;
                        border: 0;
                        box-shadow: none;
                        box-sizing: border-box;
                    }
                }
            `}</style>
        </div>
    );
};

export default BillGeneration;
