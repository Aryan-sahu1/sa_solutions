import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    date: "",
    slip_no: "",
    pid: "",
    vehicle_no: "",
};

const initialItemData = {
    product_id: "",
    iid: "",
    qty: "",
    rate: "",
    amt: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) return "";
    return String(value);
};

const getCurrentDateTimeValue = () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const toDateTimeInputValue = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const timezoneOffset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const calculateAmount = (qty, rate) => {
    const qtyValue = Number(qty);
    const rateValue = Number(rate);

    if (Number.isNaN(qtyValue) || Number.isNaN(rateValue)) return "";

    return String(qtyValue * rateValue);
};

const Purchase = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [parties, setParties] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [products, setProducts] = useState([]);
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [itemData, setItemData] = useState(initialItemData);
    const [saleItems, setSaleItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showAddMoreModal, setShowAddMoreModal] = useState(false);
    const [addMoreAction, setAddMoreAction] = useState("yes");
    const [selectedEntry, setSelectedEntry] = useState(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [totalRecords, setTotalRecords] = useState(0);
    const fieldRefs = {
        date: useRef(null),
        slip_no: useRef(null),
        pid: useRef(null),
        vehicle_no: useRef(null),
        product_id: useRef(null),
        iid: useRef(null),
        qty: useRef(null),
        rate: useRef(null),
        amt: useRef(null),
        save: useRef(null),
    };
    const fieldOrder = [
        "date",
        "slip_no",
        "pid",
        "vehicle_no",
        "product_id",
        "iid",
        "qty",
        "rate",
        "amt",
        "save",
    ];
    const addMoreNoRef = useRef(null);
    const addMoreYesRef = useRef(null);

    const saleTotal = useMemo(
        () => saleItems.reduce((total, item) => total + Number(item.amt || 0), 0),
        [saleItems]
    );

    const getDefaultFormData = useCallback(() => ({
        ...initialFormData,
        date: getCurrentDateTimeValue(),
        pid: toInputValue(parties[0]?.id),
        vehicle_no: toInputValue(vehicles[0]?.id),
    }), [parties, vehicles]);

    const getDefaultItemData = useCallback(() => ({
        ...initialItemData,
        product_id: toInputValue(products[0]?.id),
        iid: toInputValue(items[0]?.id),
    }), [items, products]);

    const openSelectPicker = (element) => {
        if (!element || element.tagName !== "SELECT") return;

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

    const focusField = (name) => {
        const element = fieldRefs[name]?.current;

        if (!element) return;

        element.focus();
        openSelectPicker(element);
    };

    const focusNextField = (currentName) => {
        const currentIndex = fieldOrder.indexOf(currentName);
        const nextName = fieldOrder[currentIndex + 1];

        if (nextName) {
            focusField(nextName);
        }
    };

    const handleFieldKeyDown = (fieldName, e) => {
        if (e.key !== "Enter") return;

        if (e.currentTarget.tagName === "SELECT") {
            window.setTimeout(() => focusNextField(fieldName), 0);
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

    const getEntries = useCallback(
        async (currentPage, currentLimit, currentSearch, currentDateFilter) => {
            try {
                setListLoading(true);
                setError("");

                const params = { page: currentPage, limit: currentLimit };
                if (currentSearch) params.search = currentSearch;
                if (currentDateFilter) params.date = currentDateFilter;

                const response = await axios.get(`${API_BASE_URL}/purchase`, {
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
                setError(response.data.message || "No purchase entries found");
            } catch (err) {
                console.error("Purchase list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(err.response?.data?.message || "Failed to fetch purchase entries");
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getItems = useCallback(
        async (productId, selectedItemId = "") => {
            if (!authHeaders.Authorization || !productId) {
                setItems([]);
                setItemData((current) => ({ ...current, iid: "" }));
                return;
            }

            try {
                const response = await axios.get(`${API_BASE_URL}/stock-item`, {
                    params: { page: 1, limit: 1000, pid: productId },
                    headers: authHeaders,
                });

                const nextItems = response.data.status ? response.data.data || [] : [];
                const nextSelectedItem = nextItems.some(
                    (item) => String(item.id) === String(selectedItemId)
                )
                    ? selectedItemId
                    : toInputValue(nextItems[0]?.id);

                setItems(nextItems);
                setItemData((current) => ({
                    ...current,
                    iid: nextSelectedItem,
                }));
            } catch (err) {
                console.error("Purchase item option error:", err);
                setItems([]);
                setItemData((current) => ({ ...current, iid: "" }));
                setError(err.response?.data?.message || "Failed to fetch stock items");
            }
        },
        [authHeaders]
    );

    const getVehicles = useCallback(
        async (partyId, selectedVehicleId = "") => {
            if (!authHeaders.Authorization || !partyId) {
                setVehicles([]);
                setFormData((current) => ({ ...current, vehicle_no: "" }));
                return;
            }

            try {
                const response = await axios.get(`${API_BASE_URL}/vehicle-master`, {
                    params: { page: 1, limit: 1000, sid: partyId },
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
                    vehicle_no: nextSelectedVehicle,
                }));
            } catch (err) {
                console.error("Purchase vehicle option error:", err);
                setVehicles([]);
                setFormData((current) => ({ ...current, vehicle_no: "" }));
                setError(err.response?.data?.message || "Failed to fetch party vehicles");
            }
        },
        [authHeaders]
    );

    const getOptions = useCallback(async () => {
        if (!authHeaders.Authorization) return;

        try {
            const [partyResult, productResult] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/party`, {
                    params: { page: 1, limit: 1000 },
                    headers: authHeaders,
                }),
                axios.get(`${API_BASE_URL}/product-category`, {
                    params: { page: 1, limit: 1000 },
                    headers: authHeaders,
                }),
            ]);

            const nextParties =
                partyResult.status === "fulfilled" && partyResult.value.data.status
                    ? partyResult.value.data.data || []
                    : [];
            const nextProducts =
                productResult.status === "fulfilled" && productResult.value.data.status
                    ? productResult.value.data.data || []
                    : [];

            setParties(nextParties);
            setProducts(nextProducts);

            const firstPartyId = toInputValue(nextParties[0]?.id);
            const firstProductId = toInputValue(nextProducts[0]?.id);

            setFormData((current) => ({
                ...current,
                date: current.date || getCurrentDateTimeValue(),
                pid: current.pid || firstPartyId,
            }));
            setItemData((current) => ({
                ...current,
                product_id: current.product_id || firstProductId,
            }));

            if (firstPartyId) await getVehicles(firstPartyId);
            if (firstProductId) await getItems(firstProductId);
        } catch (err) {
            console.error("Purchase option error:", err);
            setError(err.response?.data?.message || "Failed to fetch purchase options");
        }
    }, [authHeaders, getItems, getVehicles]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    useEffect(() => {
        getEntries(page, limit, debouncedSearch, dateFilter);
    }, [page, limit, debouncedSearch, dateFilter, getEntries]);

    useEffect(() => {
        if (!showAddMoreModal) return;

        setAddMoreAction("yes");
        window.setTimeout(() => addMoreYesRef.current?.focus(), 0);
    }, [showAddMoreModal]);

    const resetItemForm = (productId = itemData.product_id) => {
        setItemData({
            ...initialItemData,
            product_id: productId,
            iid: toInputValue(items[0]?.id),
        });
    };

    const resetForm = () => {
        setFormData(getDefaultFormData());
        setItemData(getDefaultItemData());
        setSaleItems([]);
        setEditId(null);
        setShowAddMoreModal(false);
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

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;

        if (name === "pid") {
            setFormData((current) => ({ ...current, pid: value, vehicle_no: "" }));
            getVehicles(value);
            return;
        }

        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleItemChange = (e) => {
        const { name, value } = e.target;

        if (name === "product_id") {
            setItemData((current) => ({ ...current, product_id: value, iid: "" }));
            getItems(value);
            return;
        }

        setItemData((current) => {
            const nextData = { ...current, [name]: value };

            if (name === "qty" || name === "rate") {
                nextData.amt = calculateAmount(
                    name === "qty" ? value : nextData.qty,
                    name === "rate" ? value : nextData.rate
                );
            }

            return nextData;
        });
    };

    const validateHeader = () => {
        if (!formData.date) return "Date is required";
        if (!formData.slip_no) return "Slip no is required";
        if (!formData.pid) return "Party is required";
        if (!formData.vehicle_no) return "Vehicle no is required";
        return "";
    };

    const validateItem = () => {
        if (!itemData.product_id) return "Product is required";
        if (!itemData.iid) return "Item is required";
        if (!itemData.qty) return "Quantity is required";
        if (!itemData.rate) return "Rate is required";
        if (!itemData.amt) return "Amount is required";
        return "";
    };

    const buildCurrentItem = () => {
        const product = products.find((row) => String(row.id) === String(itemData.product_id));
        const item = items.find((row) => String(row.id) === String(itemData.iid));

        return {
            product_id: itemData.product_id,
            iid: itemData.iid,
            qty: toInputValue(itemData.qty).trim(),
            rate: toInputValue(itemData.rate).trim(),
            amt: toInputValue(itemData.amt).trim(),
            product_category_name: product?.name || `Product #${itemData.product_id}`,
            item_name: item?.name || `Item #${itemData.iid}`,
        };
    };

    const handleSaveClick = () => {
        setMessage("");
        setError("");

        const headerError = validateHeader();
        if (headerError) return setError(headerError);

        const itemError = validateItem();
        if (itemError) return setError(itemError);

        const nextItems = [...saleItems, buildCurrentItem()];

        setSaleItems(nextItems);
        setAddMoreAction("yes");
        setShowAddMoreModal(true);
        return undefined;
    };

    const removeSaleItem = (indexToRemove) => {
        setSaleItems((current) => current.filter((_, index) => index !== indexToRemove));
    };

    const saveSale = async (itemsToSave = saleItems) => {
        setMessage("");
        setError("");

        const headerError = validateHeader();
        if (headerError) return setError(headerError);

        if (itemsToSave.length === 0) return setError("At least one item is required");

        const totalAmount = itemsToSave.reduce(
            (total, item) => total + Number(item.amt || 0),
            0
        );

        const payload = {
            date: toInputValue(formData.date).trim(),
            slip_no: toInputValue(formData.slip_no).trim(),
            pid: formData.pid,
            vehicle_no: formData.vehicle_no,
            amt: String(totalAmount),
            items: itemsToSave.map((item) => ({
                product_id: item.product_id,
                iid: item.iid,
                qty: item.qty,
                rate: item.rate,
                amt: item.amt,
            })),
        };

        try {
            setLoading(true);

            const config = {
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json",
                },
            };

            const response = editId
                ? await axios.put(`${API_BASE_URL}/purchase/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/purchase`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId ? "Purchase entry updated successfully" : "Purchase entry saved successfully")
                );
                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch, dateFilter);
                return undefined;
            }

            return setError(response.data.message || "Failed to save purchase entry");
        } catch (err) {
            console.error("Save purchase error:", err);
            return setError(err.response?.data?.message || "Failed to save purchase entry");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMoreYes = () => {
        setShowAddMoreModal(false);
        resetItemForm();
        window.setTimeout(() => focusField("product_id"), 0);
    };

    const handleAddMoreNo = async () => {
        setShowAddMoreModal(false);
        await saveSale(saleItems);
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

    const handleEdit = async (entry) => {
        const firstItem = entry.items?.[0] || {};

        await getVehicles(entry.pid, toInputValue(entry.vehicle_no));
        await getItems(firstItem.product_id || entry.product_id, toInputValue(firstItem.iid));

        setEditId(entry.id);
        setFormData({
            date: toDateTimeInputValue(entry.date),
            slip_no: toInputValue(entry.slip_no || entry.remarks),
            pid: toInputValue(entry.pid),
            vehicle_no: toInputValue(entry.vehicle_no),
        });
        setItemData({
            ...initialItemData,
            product_id: toInputValue(firstItem.product_id || entry.product_id),
            iid: toInputValue(firstItem.iid),
        });
        setSaleItems(
            (entry.items || []).map((item) => ({
                product_id: toInputValue(item.product_id || entry.product_id),
                iid: toInputValue(item.iid),
                qty: toInputValue(item.qty),
                rate: toInputValue(item.rate || entry.rate),
                amt: toInputValue(item.amt),
                product_category_name: item.product_category_name || entry.product_category_name,
                item_name: item.item_name || `Item #${item.iid}`,
            }))
        );
        setShowForm(true);
        setMessage("");
        setError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this purchase entry?");
        if (!confirmDelete) return;

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/purchase/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Purchase entry deleted successfully");
                if (editId === id) handleCancel();
                await getEntries(page, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to delete purchase entry");
        } catch (err) {
            console.error("Delete purchase error:", err);
            setError(err.response?.data?.message || "Failed to delete purchase entry");
        }
    };

    const handlePageChange = (event) => {
        setPage(Math.floor(event.first / event.rows) + 1);
        setLimit(event.rows);
    };

    const serialNumberTemplate = (row, options) => (
        (page - 1) * limit + options.rowIndex + 1
    );

    const dateBodyTemplate = (row) => {
        if (!row.date) return "-";
        const date = new Date(row.date);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("en-GB");
    };

    const itemCountTemplate = (row) => `${row.items?.length || 0} items`;

    const actionBodyTemplate = (row) => (
        <div onClick={(event) => event.stopPropagation()}>
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

    return (
        <div className="container-fluid p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Purchase</h2>
                    
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => (showForm ? handleCancel() : handleAdd())}
                >
                    {showForm ? "Close" : "+ Add Purchase"}
                </button>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white">
                        <h5 className="mb-0">{editId ? "Edit Purchase" : "New Purchase"}</h5>
                    </div>

                    <div className="card-body">
                        <div className="row g-3 align-items-end mb-3">
                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Date</label>
                                <input
                                    ref={fieldRefs.date}
                                    type="date"
                                    className="form-control"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleHeaderChange}
                                    onKeyDown={(e) => handleFieldKeyDown("date", e)}
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Slip No</label>
                                <input
                                    ref={fieldRefs.slip_no}
                                    type="text"
                                    className="form-control"
                                    name="slip_no"
                                    placeholder="Enter slip no"
                                    value={formData.slip_no}
                                    onChange={handleHeaderChange}
                                    onKeyDown={(e) => handleFieldKeyDown("slip_no", e)}
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Party</label>
                                <select
                                    ref={fieldRefs.pid}
                                    className="form-select"
                                    name="pid"
                                    value={formData.pid}
                                    onChange={handleHeaderChange}
                                    onFocus={(e) => openSelectPicker(e.currentTarget)}
                                    onKeyDown={(e) => handleFieldKeyDown("pid", e)}
                                >
                                    {parties.map((party) => (
                                        <option key={party.id} value={party.id}>
                                            {party.name || `Party #${party.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Vehicle No</label>
                                <select
                                    ref={fieldRefs.vehicle_no}
                                    className="form-select"
                                    name="vehicle_no"
                                    value={formData.vehicle_no}
                                    onChange={handleHeaderChange}
                                    onFocus={(e) => openSelectPicker(e.currentTarget)}
                                    onKeyDown={(e) => handleFieldKeyDown("vehicle_no", e)}
                                >
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.name || `Vehicle #${vehicle.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="row g-3 align-items-end border-top pt-3">
                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Product</label>
                                <select
                                    ref={fieldRefs.product_id}
                                    className="form-select"
                                    name="product_id"
                                    value={itemData.product_id}
                                    onChange={handleItemChange}
                                    onFocus={(e) => openSelectPicker(e.currentTarget)}
                                    onKeyDown={(e) => handleFieldKeyDown("product_id", e)}
                                >
                                    {products.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Item</label>
                                <select
                                    ref={fieldRefs.iid}
                                    className="form-select"
                                    name="iid"
                                    value={itemData.iid}
                                    onChange={handleItemChange}
                                    onFocus={(e) => openSelectPicker(e.currentTarget)}
                                    onKeyDown={(e) => handleFieldKeyDown("iid", e)}
                                >
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Quantity</label>
                                <input
                                    ref={fieldRefs.qty}
                                    type="number"
                                    className="form-control"
                                    name="qty"
                                    placeholder="Qty"
                                    value={itemData.qty}
                                    onChange={handleItemChange}
                                    onKeyDown={(e) => handleFieldKeyDown("qty", e)}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Rate</label>
                                <input
                                    ref={fieldRefs.rate}
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    name="rate"
                                    placeholder="Rate"
                                    value={itemData.rate}
                                    onChange={handleItemChange}
                                    onKeyDown={(e) => handleFieldKeyDown("rate", e)}
                                />
                            </div>

                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Amount</label>
                                <input
                                    ref={fieldRefs.amt}
                                    type="number"
                                    step="0.01"
                                    className="form-control"
                                    name="amt"
                                    placeholder="Amount"
                                    value={itemData.amt}
                                    onChange={handleItemChange}
                                    onKeyDown={(e) => handleFieldKeyDown("amt", e)}
                                />
                            </div>

                            <div className="col-12">
                                <button
                                    ref={fieldRefs.save}
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleSaveClick}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSaveClick();
                                        }
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </div>

                        {saleItems.length > 0 && (
                            <div className="table-responsive mt-4">
                                <table className="table table-bordered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Item</th>
                                            <th>Qty</th>
                                            <th>Rate</th>
                                            <th>Amount</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saleItems.map((item, index) => (
                                            <tr key={`${item.iid}-${index}`}>
                                                <td>{index + 1}</td>
                                                <td>{item.product_category_name}</td>
                                                <td>{item.item_name}</td>
                                                <td>{item.qty}</td>
                                                <td>{item.rate}</td>
                                                <td>{item.amt}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeSaleItem(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colSpan="5" className="text-end">Total</th>
                                            <th>{saleTotal}</th>
                                            <th />
                                        </tr>
                                    </tfoot>
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
                            <h5 className="mb-0">Purchase List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <div className="row g-2">
                                <div className="col-md-7">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search purchase..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-5">
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={dateFilter}
                                        onChange={(e) => {
                                            setDateFilter(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                            </div>
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
                        onRowClick={(event) => setSelectedEntry(event.data)}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: "40rem", cursor: "pointer" }}
                        emptyMessage={debouncedSearch ? "No purchase found for this search" : "No purchase found"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} purchase"
                        showCurrentPageReport
                    >
                        <Column header="Sn" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column header="Date" body={dateBodyTemplate} />
                        <Column field="slip_no" header="Slip No" />
                        <Column field="party_name" header="Party" />
                        <Column field="vehicle_name" header="Vehicle No" />
                        <Column header="Items" body={itemCountTemplate} />
                        <Column field="amt" header="Total Amount" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "180px" }} />
                    </DataTable>
                </div>
            </div>

            {showAddMoreModal && (
                <div className="sales-modal-backdrop">
                    <div className="sales-modal" onKeyDown={handleAddMoreKeyDown}>
                        <h5 className="mb-2">Add more item?</h5>
                        <p className="text-muted mb-4">
                            Do you want to add another product/item in this same purchase?
                        </p>
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                ref={addMoreNoRef}
                                type="button"
                                className={`btn ${addMoreAction === "no" ? "btn-secondary" : "btn-outline-secondary"}`}
                                onFocus={() => setAddMoreAction("no")}
                                onClick={handleAddMoreNo}
                            >
                                No, Save Purchase
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

            {selectedEntry && (
                <div className="sales-modal-backdrop">
                    <div className="sales-modal sales-detail-modal">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Purchase Detail</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setSelectedEntry(null)}
                            />
                        </div>
                        <div className="row g-2 mb-3">
                            <div className="col-md-6"><strong>Slip No:</strong> {selectedEntry.slip_no}</div>
                            <div className="col-md-6"><strong>Party:</strong> {selectedEntry.party_name}</div>
                            <div className="col-md-6"><strong>Vehicle:</strong> {selectedEntry.vehicle_name}</div>
                            <div className="col-md-6"><strong>Total:</strong> {selectedEntry.amt}</div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-bordered align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Item</th>
                                        <th>Qty</th>
                                        <th>Rate</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedEntry.items || []).map((item, index) => (
                                        <tr key={`${item.id}-${index}`}>
                                            <td>{index + 1}</td>
                                            <td>{item.product_category_name || "-"}</td>
                                            <td>{item.item_name || `Item #${item.iid}`}</td>
                                            <td>{item.qty}</td>
                                            <td>{item.rate}</td>
                                            <td>{item.amt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .sales-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(15, 23, 42, 0.45);
                }

                .sales-modal {
                    width: min(460px, 100%);
                    padding: 24px;
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 22px 50px rgba(15, 23, 42, 0.24);
                }

                .sales-detail-modal {
                    width: min(850px, 100%);
                    max-height: 86vh;
                    overflow: auto;
                }
            `}</style>
        </div>
    );
};

export default Purchase;
