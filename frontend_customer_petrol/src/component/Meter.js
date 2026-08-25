import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialHeaderData = {
    date: "",
    shift: "",
    msp: "",
    hsdp: "",
    ureap: "",
    cngp: "",
    speedp: "",
    msst: "",
    hsdst: "",
    ureast: "",
    cngst: "",
    speedst: "",
};

const priceFields = [
    { name: "msp", label: "MS Price" },
    { name: "hsdp", label: "HSD Price" },
    { name: "ureap", label: "Urea Price" },
    { name: "cngp", label: "CNG Price" },
    { name: "speedp", label: "Speed Price" },
];

const stockFields = [
    { name: "msst", label: "MS Stock" },
    { name: "hsdst", label: "HSD Stock" },
    { name: "ureast", label: "Urea Stock" },
    { name: "cngst", label: "CNG Stock" },
    { name: "speedst", label: "Speed Stock" },
];

const initialItemData = {
    pid: "",
    iid: "",
    opening: "",
    closing: "",
    testing: "",
    sale: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) return "";
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
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const timezoneOffset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const calculateSale = (opening, closing, testing) => {
    const openingValue = Number(opening);
    const closingValue = Number(closing);
    const testingValue = testing === "" ? 0 : Number(testing);

    if (
        Number.isNaN(openingValue) ||
        Number.isNaN(closingValue) ||
        Number.isNaN(testingValue)
    ) {
        return "";
    }

    return String(closingValue - openingValue - testingValue);
};

const buildExtraPayload = (data) => (
    [...priceFields, ...stockFields].reduce((acc, field) => {
        acc[field.name] = toInputValue(data[field.name]).trim();
        return acc;
    }, {})
);

const Meter = () => {
    const { authHeaders } = useAuth();
    const [entries, setEntries] = useState([]);
    const [products, setProducts] = useState([]);
    const [nozels, setNozels] = useState([]);
    const [headerData, setHeaderData] = useState(initialHeaderData);
    const [itemData, setItemData] = useState(initialItemData);
    const [meterItems, setMeterItems] = useState([]);
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
        shift: useRef(null),
        msp: useRef(null),
        hsdp: useRef(null),
        ureap: useRef(null),
        cngp: useRef(null),
        speedp: useRef(null),
        msst: useRef(null),
        hsdst: useRef(null),
        ureast: useRef(null),
        cngst: useRef(null),
        speedst: useRef(null),
        pid: useRef(null),
        iid: useRef(null),
        opening: useRef(null),
        closing: useRef(null),
        testing: useRef(null),
        save: useRef(null),
    };
    const fieldOrder = [
        "date",
        "shift",
        "msp",
        "hsdp",
        "ureap",
        "cngp",
        "speedp",
        "msst",
        "hsdst",
        "ureast",
        "cngst",
        "speedst",
        "pid",
        "iid",
        "opening",
        "closing",
        "testing",
        "save",
    ];
    const addMoreNoRef = useRef(null);
    const addMoreYesRef = useRef(null);

    const meterTotal = useMemo(
        () => meterItems.reduce((total, item) => total + Number(item.sale || 0), 0),
        [meterItems]
    );

    const getDefaultHeaderData = useCallback(() => ({
        ...initialHeaderData,
        date: getCurrentDateValue(),
    }), []);

    const getDefaultItemData = useCallback(() => ({
        ...initialItemData,
        pid: toInputValue(products[0]?.id),
        iid: toInputValue(nozels[0]?.id),
    }), [nozels, products]);

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

        if (nextName) focusField(nextName);
    };

    const handleFieldKeyDown = (fieldName, e) => {
        if (e.key !== "Enter") return;

        if (fieldName === "save") {
            e.preventDefault();
            handleSaveClick();
            return;
        }

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

                const params = {
                    page: currentPage,
                    limit: currentLimit,
                };

                if (currentSearch) params.search = currentSearch;
                if (currentDateFilter) params.date = currentDateFilter;

                const response = await axios.get(`${API_BASE_URL}/meter`, {
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
                setError(response.data.message || "No meter entries found");
            } catch (err) {
                console.error("Meter list error:", err);
                setEntries([]);
                setTotalRecords(0);
                setError(err.response?.data?.message || "Failed to fetch meter entries");
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    const getNozels = useCallback(
        async (productId, selectedNozelId = "") => {
            if (!authHeaders.Authorization || !productId) {
                setNozels([]);
                setItemData((current) => ({ ...current, iid: "" }));
                return;
            }

            try {
                const response = await axios.get(`${API_BASE_URL}/nozel`, {
                    params: {
                        page: 1,
                        limit: 1000,
                        pid: productId,
                    },
                    headers: authHeaders,
                });

                const nextNozels = response.data.status ? response.data.data || [] : [];
                const nextSelectedNozel = nextNozels.some(
                    (nozel) => String(nozel.id) === String(selectedNozelId)
                )
                    ? selectedNozelId
                    : toInputValue(nextNozels[0]?.id);

                setNozels(nextNozels);
                setItemData((current) => ({
                    ...current,
                    iid: nextSelectedNozel,
                }));
            } catch (err) {
                console.error("Meter nozel option error:", err);
                setNozels([]);
                setItemData((current) => ({ ...current, iid: "" }));
                setError(err.response?.data?.message || "Failed to fetch nozels");
            }
        },
        [authHeaders]
    );

    const getProducts = useCallback(async () => {
        if (!authHeaders.Authorization) return;

        try {
            const response = await axios.get(`${API_BASE_URL}/product-category`, {
                params: {
                    page: 1,
                    limit: 1000,
                },
                headers: authHeaders,
            });

            const nextProducts = response.data.status ? response.data.data || [] : [];
            const firstProductId = toInputValue(nextProducts[0]?.id);

            setProducts(nextProducts);
            setItemData((current) => ({
                ...current,
                pid: current.pid || firstProductId,
            }));

            if (firstProductId) await getNozels(firstProductId);
        } catch (err) {
            console.error("Meter product option error:", err);
            setProducts([]);
            setError(err.response?.data?.message || "Failed to fetch products");
        }
    }, [authHeaders, getNozels]);

    useEffect(() => {
        getProducts();
    }, [getProducts]);

    useEffect(() => {
        getEntries(page, limit, debouncedSearch, dateFilter);
    }, [page, limit, debouncedSearch, dateFilter, getEntries]);

    useEffect(() => {
        if (!showAddMoreModal) return;

        setAddMoreAction("yes");
        window.setTimeout(() => addMoreYesRef.current?.focus(), 0);
    }, [showAddMoreModal]);

    const resetItemForm = (productId = itemData.pid) => {
        setItemData({
            ...initialItemData,
            pid: productId,
            iid: toInputValue(nozels[0]?.id),
        });
    };

    const resetForm = () => {
        setHeaderData(getDefaultHeaderData());
        setItemData(getDefaultItemData());
        setMeterItems([]);
        setEditId(null);
        setShowAddMoreModal(false);
    };

    const handleAdd = () => {
        resetForm();
        setShowForm(true);
        setMessage("");
        setError("");
        window.setTimeout(() => focusField("date"), 0);
    };

    const handleCancel = () => {
        resetForm();
        setShowForm(false);
        setError("");
    };

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;

        setHeaderData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleItemChange = (e) => {
        const { name, value } = e.target;

        if (name === "pid") {
            setItemData((current) => ({
                ...current,
                pid: value,
                iid: "",
            }));
            getNozels(value);
            return;
        }

        setItemData((current) => {
            const nextData = {
                ...current,
                [name]: value,
            };

            if (name === "opening" || name === "closing" || name === "testing") {
                nextData.sale = calculateSale(
                    name === "opening" ? value : nextData.opening,
                    name === "closing" ? value : nextData.closing,
                    name === "testing" ? value : nextData.testing
                );
            }

            return nextData;
        });
    };

    const validateHeader = () => {
        if (!headerData.date) return "Date is required";
        if (!headerData.shift.trim()) return "Shift is required";
        return "";
    };

    const validateItem = () => {
        if (!itemData.pid) return "Product is required";
        if (!itemData.iid) return "Nozel is required";
        if (!toInputValue(itemData.opening).trim()) return "Opening is required";
        if (!toInputValue(itemData.closing).trim()) return "Closing is required";
        if (!toInputValue(itemData.sale).trim()) return "Sale is required";
        return "";
    };

    const buildCurrentItem = () => {
        const product = products.find((row) => String(row.id) === String(itemData.pid));
        const nozel = nozels.find((row) => String(row.id) === String(itemData.iid));

        return {
            pid: itemData.pid,
            iid: itemData.iid,
            opening: toInputValue(itemData.opening).trim(),
            closing: toInputValue(itemData.closing).trim(),
            testing: toInputValue(itemData.testing).trim() || "0",
            sale: toInputValue(itemData.sale).trim(),
            product_name: product?.name || `Product #${itemData.pid}`,
            nozel_name: nozel?.name || `Nozel #${itemData.iid}`,
            nozel_snno: nozel?.snno || "",
        };
    };

    const handleSaveClick = () => {
        setMessage("");
        setError("");

        const headerError = validateHeader();
        if (headerError) return setError(headerError);

        const itemError = validateItem();
        if (itemError) return setError(itemError);

        const currentItem = buildCurrentItem();

        if (editId) {
            setMeterItems((current) => [...current, currentItem]);
            resetItemForm(itemData.pid);
            window.setTimeout(() => focusField("pid"), 0);
            return undefined;
        }

        setMeterItems((current) => [...current, currentItem]);
        setShowAddMoreModal(true);
        return undefined;
    };

    const removeMeterItem = (indexToRemove) => {
        setMeterItems((current) =>
            current.filter((_, index) => index !== indexToRemove)
        );
    };

    const saveMeter = async (itemsToSave = meterItems) => {
        setMessage("");
        setError("");

        const headerError = validateHeader();
        if (headerError) return setError(headerError);

        if (itemsToSave.length === 0) {
            return setError("At least one meter item is required");
        }

        const payload = {
            date: headerData.date,
            shift: headerData.shift.trim(),
            ...buildExtraPayload(headerData),
            items: itemsToSave.map((item) => ({
                pid: item.pid,
                iid: item.iid,
                opening: item.opening,
                closing: item.closing,
                testing: item.testing,
                sale: item.sale,
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
                ? await axios.put(`${API_BASE_URL}/meter/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/meter`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId
                        ? "Meter entry updated successfully"
                        : "Meter entry saved successfully")
                );
                resetForm();
                setShowForm(false);
                setPage(1);
                await getEntries(1, limit, debouncedSearch, dateFilter);
                return undefined;
            }

            return setError(response.data.message || "Failed to save meter entry");
        } catch (err) {
            console.error("Save meter error:", err);
            return setError(err.response?.data?.message || "Failed to save meter entry");
        } finally {
            setLoading(false);
        }
    };

    const handleAddMoreYes = () => {
        setShowAddMoreModal(false);
        resetItemForm(itemData.pid);
        window.setTimeout(() => focusField("pid"), 0);
    };

    const handleAddMoreNo = async () => {
        setShowAddMoreModal(false);
        await saveMeter(meterItems);
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

        if (firstItem.pid) {
            await getNozels(firstItem.pid, toInputValue(firstItem.iid));
        }

        setEditId(entry.id);
        setHeaderData({
            date: toDateInputValue(entry.date),
            shift: toInputValue(entry.shift),
            ...buildExtraPayload(entry),
        });
        setItemData({
            ...initialItemData,
            pid: toInputValue(firstItem.pid || products[0]?.id),
            iid: toInputValue(firstItem.iid),
        });
        setMeterItems(
            (entry.items || []).map((item) => ({
                pid: toInputValue(item.pid),
                iid: toInputValue(item.iid),
                opening: toInputValue(item.opening),
                closing: toInputValue(item.closing),
                testing: toInputValue(item.testing),
                sale: toInputValue(item.sale),
                product_name: item.product_name || `Product #${item.pid}`,
                nozel_name: item.nozel_name || `Nozel #${item.iid}`,
                nozel_snno: item.nozel_snno || "",
            }))
        );
        setShowForm(true);
        setMessage("");
        setError("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this meter entry?"
        );

        if (!confirmDelete) return;

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/meter/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Meter entry deleted successfully");
                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }
                await getEntries(page, limit, debouncedSearch, dateFilter);
                return;
            }

            setError(response.data.message || "Failed to delete meter entry");
        } catch (err) {
            console.error("Delete meter error:", err);
            setError(err.response?.data?.message || "Failed to delete meter entry");
        }
    };

    const handlePageChange = (event) => {
        setPage(Math.floor(event.first / event.rows) + 1);
        setLimit(event.rows);
    };

    const serialNumberTemplate = (row, options) => {
        return (page - 1) * limit + options.rowIndex + 1;
    };

    const dateBodyTemplate = (row) => {
        if (!row.date) return "-";
        return new Date(row.date).toLocaleDateString();
    };

    const itemCountTemplate = (row) => {
        return `${row.items?.length || row.item_count || 0} item(s)`;
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
                    <h2 className="fw-bold mb-1">Meter</h2>
                    <p className="text-muted mb-0">Create item-wise meter readings</p>
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
                    {showForm ? "Close" : "+ Add Meter"}
                </button>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header bg-white">
                        <h5 className="mb-0">
                            {editId ? "Edit Meter" : "Add Meter"}
                        </h5>
                    </div>

                    <div className="card-body">
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="row g-3 align-items-end mb-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Date</label>
                                    <input
                                        ref={fieldRefs.date}
                                        type="date"
                                        className="form-control"
                                        name="date"
                                        value={headerData.date}
                                        onChange={handleHeaderChange}
                                        onKeyDown={(e) => handleFieldKeyDown("date", e)}
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Shift</label>
                                    <input
                                        ref={fieldRefs.shift}
                                        type="text"
                                        className="form-control"
                                        name="shift"
                                        placeholder="Enter shift"
                                        value={headerData.shift}
                                        onChange={handleHeaderChange}
                                        onKeyDown={(e) => handleFieldKeyDown("shift", e)}
                                    />
                                </div>
                            </div>

                            <div className="border-top pt-3 mb-3">
                                <h6 className="fw-bold mb-3">Price</h6>
                                <div className="row g-3">
                                    {priceFields.map((field) => (
                                        <div className="col-md-2 col-sm-6" key={field.name}>
                                            <label className="form-label fw-semibold">
                                                {field.label}
                                            </label>
                                            <input
                                                ref={fieldRefs[field.name]}
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name={field.name}
                                                placeholder="0"
                                                value={headerData[field.name]}
                                                onChange={handleHeaderChange}
                                                onKeyDown={(e) => handleFieldKeyDown(field.name, e)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-top pt-3 mb-3">
                                <h6 className="fw-bold mb-3">Stock</h6>
                                <div className="row g-3">
                                    {stockFields.map((field) => (
                                        <div className="col-md-2 col-sm-6" key={field.name}>
                                            <label className="form-label fw-semibold">
                                                {field.label}
                                            </label>
                                            <input
                                                ref={fieldRefs[field.name]}
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name={field.name}
                                                placeholder="0"
                                                value={headerData[field.name]}
                                                onChange={handleHeaderChange}
                                                onKeyDown={(e) => handleFieldKeyDown(field.name, e)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="row g-3 align-items-end border-top pt-3">
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Product</label>
                                    <select
                                        ref={fieldRefs.pid}
                                        className="form-select"
                                        name="pid"
                                        value={itemData.pid}
                                        onChange={handleItemChange}
                                        onFocus={(e) => openSelectPicker(e.currentTarget)}
                                        onKeyDown={(e) => handleFieldKeyDown("pid", e)}
                                    >
                                        <option value="">Select product</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label fw-semibold">Nozel</label>
                                    <select
                                        ref={fieldRefs.iid}
                                        className="form-select"
                                        name="iid"
                                        value={itemData.iid}
                                        onChange={handleItemChange}
                                        onFocus={(e) => openSelectPicker(e.currentTarget)}
                                        onKeyDown={(e) => handleFieldKeyDown("iid", e)}
                                    >
                                        <option value="">Select nozel</option>
                                        {nozels.map((nozel) => (
                                            <option key={nozel.id} value={nozel.id}>
                                                {nozel.name} {nozel.snno ? `(${nozel.snno})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Opening</label>
                                    <input
                                        ref={fieldRefs.opening}
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="opening"
                                        placeholder="Opening"
                                        value={itemData.opening}
                                        onChange={handleItemChange}
                                        onKeyDown={(e) => handleFieldKeyDown("opening", e)}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Closing</label>
                                    <input
                                        ref={fieldRefs.closing}
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="closing"
                                        placeholder="Closing"
                                        value={itemData.closing}
                                        onChange={handleItemChange}
                                        onKeyDown={(e) => handleFieldKeyDown("closing", e)}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Testing</label>
                                    <input
                                        ref={fieldRefs.testing}
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="testing"
                                        placeholder="Testing"
                                        value={itemData.testing}
                                        onChange={handleItemChange}
                                        onKeyDown={(e) => handleFieldKeyDown("testing", e)}
                                    />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label fw-semibold">Sale</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="sale"
                                        value={itemData.sale}
                                        readOnly
                                    />
                                </div>

                                <div className="col-12">
                                    <button
                                        ref={fieldRefs.save}
                                        type="button"
                                        className="btn btn-success me-2"
                                        onClick={handleSaveClick}
                                        onKeyDown={(e) => handleFieldKeyDown("save", e)}
                                        disabled={loading}
                                    >
                                        {loading ? "Saving..." : "Save"}
                                    </button>

                                    {editId && (
                                        <button
                                            type="button"
                                            className="btn btn-primary me-2"
                                            onClick={() => saveMeter(meterItems)}
                                            disabled={loading}
                                        >
                                            Update Meter
                                        </button>
                                    )}

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

                        {meterItems.length > 0 && (
                            <div className="table-responsive mt-4">
                                <table className="table table-bordered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Nozel</th>
                                            <th>Opening</th>
                                            <th>Closing</th>
                                            <th>Testing</th>
                                            <th>Sale</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meterItems.map((item, index) => (
                                            <tr key={`${item.iid}-${index}`}>
                                                <td>{index + 1}</td>
                                                <td>{item.product_name}</td>
                                                <td>
                                                    {item.nozel_name}
                                                    {item.nozel_snno ? ` (${item.nozel_snno})` : ""}
                                                </td>
                                                <td>{item.opening}</td>
                                                <td>{item.closing}</td>
                                                <td>{item.testing}</td>
                                                <td>{item.sale}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeMeterItem(index)}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colSpan="6" className="text-end">Total Sale</th>
                                            <th>{meterTotal}</th>
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
                            <h5 className="mb-0">Meter List</h5>
                        </div>

                        <div className="col-md-6 mt-3 mt-md-0">
                            <div className="row g-2">
                                <div className="col-md-7">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search meter..."
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
                        tableStyle={{ minWidth: "48rem", cursor: "pointer" }}
                        emptyMessage={
                            debouncedSearch
                                ? "No meter entries found for this search"
                                : "No meter entries found"
                        }
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} meter entries"
                        showCurrentPageReport
                    >
                        <Column header="#" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column header="Date" body={dateBodyTemplate} />
                        <Column field="shift" header="Shift" />
                        <Column field="product_names" header="Products" />
                        <Column header="Items" body={itemCountTemplate} />
                        <Column field="total_sale" header="Total Sale" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "180px" }} />
                    </DataTable>
                </div>
            </div>

            {showAddMoreModal && (
                <div className="meter-modal-backdrop">
                    <div className="meter-modal" onKeyDown={handleAddMoreKeyDown}>
                        <h5 className="mb-2">Add more item?</h5>
                        <p className="text-muted mb-4">
                            Do you want to add another meter item in this same entry?
                        </p>
                        <div className="d-flex justify-content-end gap-2">
                            <button
                                ref={addMoreNoRef}
                                type="button"
                                className={`btn ${addMoreAction === "no" ? "btn-secondary" : "btn-outline-secondary"}`}
                                onFocus={() => setAddMoreAction("no")}
                                onClick={handleAddMoreNo}
                            >
                                No, Save Meter
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
                <div className="meter-modal-backdrop">
                    <div className="meter-modal meter-detail-modal">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Meter Detail</h5>
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={() => setSelectedEntry(null)}
                            />
                        </div>

                        <div className="row g-2 mb-3">
                            <div className="col-md-4"><strong>Date:</strong> {dateBodyTemplate(selectedEntry)}</div>
                            <div className="col-md-4"><strong>Shift:</strong> {selectedEntry.shift}</div>
                            <div className="col-md-4"><strong>Total Sale:</strong> {selectedEntry.total_sale}</div>
                        </div>

                        <div className="table-responsive mb-3">
                            <table className="table table-bordered align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Type</th>
                                        <th>MS</th>
                                        <th>HSD</th>
                                        <th>Urea</th>
                                        <th>CNG</th>
                                        <th>Speed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <th>Price</th>
                                        <td>{selectedEntry.msp || "-"}</td>
                                        <td>{selectedEntry.hsdp || "-"}</td>
                                        <td>{selectedEntry.ureap || "-"}</td>
                                        <td>{selectedEntry.cngp || "-"}</td>
                                        <td>{selectedEntry.speedp || "-"}</td>
                                    </tr>
                                    <tr>
                                        <th>Stock</th>
                                        <td>{selectedEntry.msst || "-"}</td>
                                        <td>{selectedEntry.hsdst || "-"}</td>
                                        <td>{selectedEntry.ureast || "-"}</td>
                                        <td>{selectedEntry.cngst || "-"}</td>
                                        <td>{selectedEntry.speedst || "-"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-bordered align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Product</th>
                                        <th>Nozel</th>
                                        <th>Opening</th>
                                        <th>Closing</th>
                                        <th>Testing</th>
                                        <th>Sale</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedEntry.items || []).map((item, index) => (
                                        <tr key={`${item.id}-${index}`}>
                                            <td>{index + 1}</td>
                                            <td>{item.product_name}</td>
                                            <td>
                                                {item.nozel_name || `Nozel #${item.iid}`}
                                                {item.nozel_snno ? ` (${item.nozel_snno})` : ""}
                                            </td>
                                            <td>{item.opening}</td>
                                            <td>{item.closing}</td>
                                            <td>{item.testing}</td>
                                            <td>{item.sale}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .meter-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    background: rgba(15, 23, 42, 0.45);
                }

                .meter-modal {
                    width: min(460px, 100%);
                    padding: 24px;
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 22px 50px rgba(15, 23, 42, 0.24);
                }

                .meter-detail-modal {
                    width: min(900px, 100%);
                    max-height: 86vh;
                    overflow: auto;
                }
            `}</style>
        </div>
    );
};

export default Meter;
