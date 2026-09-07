import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:4000/api";

const initialFormData = {
    name: "",
    address: "",
    father_name: "",
    mother_name: "",
    opening_balance: "",
    mobile: "",
    gender: "",
    discount: "",
    class_name: "",
    second_mobile_no: "",
    admission_no: "",
    fee_type: "",
    category: "",
    left_date: "",
    dob: "",
    admission_date: "",
    convenience_start_date: "",
    aadhar_no: "",
    house: "",
    sr_no: "",
    pan_no: "",
};

const toInputValue = (value) => {
    if (value === undefined || value === null) return "";
    return String(value);
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

const Students = () => {
    const { authHeaders } = useAuth();
    const [students, setStudents] = useState([]);
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

    const getStudents = useCallback(
        async (currentPage, currentLimit, currentSearch) => {
            try {
                setListLoading(true);
                setError("");

                const params = {
                    page: currentPage,
                    limit: currentLimit,
                };

                if (currentSearch) params.search = currentSearch;

                const response = await axios.get(`${API_BASE_URL}/school/students`, {
                    params,
                    headers: {
                        ...authHeaders,
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache",
                    },
                });

                if (response.data.status) {
                    setStudents(response.data.data || []);
                    setTotalRecords(Number(response.data.pagination?.total || 0));
                    return;
                }

                setStudents([]);
                setTotalRecords(0);
                setError(response.data.message || "No students found");
            } catch (err) {
                console.error("Student list error:", err);
                setStudents([]);
                setTotalRecords(0);
                setError(err.response?.data?.message || "Failed to fetch students");
            } finally {
                setListLoading(false);
            }
        },
        [authHeaders]
    );

    useEffect(() => {
        getStudents(page, limit, debouncedSearch);
    }, [page, limit, debouncedSearch, getStudents]);

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

    const validateForm = () => {
        if (!formData.name.trim()) return "Student name is required";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [key, toInputValue(value).trim()])
        );

        try {
            setLoading(true);

            const config = {
                headers: {
                    ...authHeaders,
                    "Content-Type": "application/json",
                },
            };

            const response = editId
                ? await axios.put(`${API_BASE_URL}/school/students/${editId}`, payload, config)
                : await axios.post(`${API_BASE_URL}/school/students`, payload, config);

            if (response.data.status) {
                setMessage(
                    response.data.message ||
                    (editId ? "Student updated successfully" : "Student saved successfully")
                );
                resetForm();
                setShowForm(false);
                setPage(1);
                await getStudents(1, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to save student");
        } catch (err) {
            console.error("Save student error:", err);
            setError(err.response?.data?.message || "Failed to save student");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (student) => {
        setEditId(student.id);
        setFormData({
            name: toInputValue(student.name),
            address: toInputValue(student.address),
            father_name: toInputValue(student.father_name),
            mother_name: toInputValue(student.mother_name),
            opening_balance: toInputValue(student.opening_balance),
            mobile: toInputValue(student.mobile),
            gender: toInputValue(student.gender),
            discount: toInputValue(student.discount),
            class_name: toInputValue(student.class_name),
            second_mobile_no: toInputValue(student.second_mobile_no),
            admission_no: toInputValue(student.admission_no),
            fee_type: toInputValue(student.fee_type),
            category: toInputValue(student.category),
            left_date: toDateInputValue(student.left_date),
            dob: toDateInputValue(student.dob),
            admission_date: toDateInputValue(student.admission_date),
            convenience_start_date: toDateInputValue(student.convenience_start_date),
            aadhar_no: toInputValue(student.aadhar_no),
            house: toInputValue(student.house),
            sr_no: toInputValue(student.sr_no),
            pan_no: toInputValue(student.pan_no),
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
        const confirmDelete = window.confirm("Are you sure you want to delete this student?");
        if (!confirmDelete) return;

        try {
            setMessage("");
            setError("");

            const response = await axios.delete(`${API_BASE_URL}/school/students/${id}`, {
                headers: authHeaders,
            });

            if (response.data.status) {
                setMessage(response.data.message || "Student deleted successfully");

                if (editId === id) {
                    resetForm();
                    setShowForm(false);
                }

                await getStudents(page, limit, debouncedSearch);
                return;
            }

            setError(response.data.message || "Failed to delete student");
        } catch (err) {
            console.error("Delete student error:", err);
            setError(err.response?.data?.message || "Failed to delete student");
        }
    };

    const handlePageChange = (event) => {
        setPage(Math.floor(event.first / event.rows) + 1);
        setLimit(event.rows);
    };

    const serialNumberTemplate = (row, options) => {
        return (page - 1) * limit + options.rowIndex + 1;
    };

    const dateBodyTemplate = (field) => (row) => toDateInputValue(row[field]) || "-";

    const actionBodyTemplate = (row) => (
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

    return (
        <div className="container-fluid p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Students</h2>
                    <p className="text-muted mb-0">Create and manage school student records</p>
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
                    {showForm ? "Close" : "+ Add Student"}
                </button>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {showForm && (
                <div className="card shadow-sm border-0 mb-4 overflow-hidden">
                    <div className="card-header bg-white py-3">
                        <h5 className="mb-1 fw-bold">
                            {editId ? "Edit Student" : "Add Student"}
                        </h5>
                        <div className="text-muted small">Basic details, admission details and documents</div>
                    </div>

                    <div className="card-body bg-light">
                        <form onSubmit={handleSubmit}>
                            <div className="bg-white border rounded-3 p-3 mb-3">
                                <h6 className="fw-bold mb-3">Student Details</h6>
                                <div className="row g-3">
                                    <div className="col-lg-4 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Name</label>
                                        <input className="form-control" name="name" value={formData.name} onChange={handleChange} placeholder="Student name" />
                                    </div>
                                    <div className="col-lg-4 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Father Name</label>
                                        <input className="form-control" name="father_name" value={formData.father_name} onChange={handleChange} placeholder="Father name" />
                                    </div>
                                    <div className="col-lg-4 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Mother Name</label>
                                        <input className="form-control" name="mother_name" value={formData.mother_name} onChange={handleChange} placeholder="Mother name" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Mobile</label>
                                        <input className="form-control" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile no" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Second Mobile</label>
                                        <input className="form-control" name="second_mobile_no" value={formData.second_mobile_no} onChange={handleChange} placeholder="Second mobile no" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Gender</label>
                                        <select className="form-select" name="gender" value={formData.gender} onChange={handleChange}>
                                            <option value="">Select gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">DOB</label>
                                        <input type="date" className="form-control" name="dob" value={formData.dob} onChange={handleChange} />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Address</label>
                                        <input className="form-control" name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-3 p-3 mb-3">
                                <h6 className="fw-bold mb-3">Admission Details</h6>
                                <div className="row g-3">
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Class</label>
                                        <input className="form-control" name="class_name" value={formData.class_name} onChange={handleChange} placeholder="Class" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Admission No</label>
                                        <input className="form-control" name="admission_no" value={formData.admission_no} onChange={handleChange} placeholder="Admission no" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">SR No</label>
                                        <input className="form-control" name="sr_no" value={formData.sr_no} onChange={handleChange} placeholder="SR no" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Admission Date</label>
                                        <input type="date" className="form-control" name="admission_date" value={formData.admission_date} onChange={handleChange} />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Fee Type</label>
                                        <select className="form-select" name="fee_type" value={formData.fee_type} onChange={handleChange}>
                                            <option value="">Select fee type</option>
                                            <option value="Monthly">Monthly</option>
                                            <option value="Quarterly">Quarterly</option>
                                            <option value="Yearly">Yearly</option>
                                        </select>
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Category</label>
                                        <input className="form-control" name="category" value={formData.category} onChange={handleChange} placeholder="Category" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">House</label>
                                        <input className="form-control" name="house" value={formData.house} onChange={handleChange} placeholder="House" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Left Date</label>
                                        <input type="date" className="form-control" name="left_date" value={formData.left_date} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-3 p-3">
                                <h6 className="fw-bold mb-3">Fees And Documents</h6>
                                <div className="row g-3">
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Opening Balance</label>
                                        <input type="number" step="0.01" className="form-control" name="opening_balance" value={formData.opening_balance} onChange={handleChange} placeholder="Opening balance" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Discount</label>
                                        <input type="number" step="0.01" className="form-control" name="discount" value={formData.discount} onChange={handleChange} placeholder="Discount" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Convenience Start Date</label>
                                        <input type="date" className="form-control" name="convenience_start_date" value={formData.convenience_start_date} onChange={handleChange} />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">Aadhar No</label>
                                        <input className="form-control" name="aadhar_no" value={formData.aadhar_no} onChange={handleChange} placeholder="Aadhar no" />
                                    </div>
                                    <div className="col-lg-3 col-md-6">
                                        <label className="form-label small fw-semibold text-muted text-uppercase">PAN No</label>
                                        <input className="form-control" name="pan_no" value={formData.pan_no} onChange={handleChange} placeholder="PAN no" />
                                    </div>
                                    <div className="col-12 d-flex flex-wrap gap-2 pt-2">
                                        <button type="submit" className="btn btn-success px-4" disabled={loading}>
                                            {loading ? "Saving..." : editId ? "Update Student" : "Save Student"}
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary px-4" onClick={handleCancel}>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white p-3">
                    <div className="row align-items-center">
                        <div className="col-md-5">
                            <h5 className="mb-0">Student List</h5>
                        </div>
                        <div className="col-md-7 mt-3 mt-md-0">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search student..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <DataTable
                        value={students}
                        loading={listLoading}
                        lazy
                        paginator
                        first={(page - 1) * limit}
                        rows={limit}
                        totalRecords={totalRecords}
                        rowsPerPageOptions={[5, 10, 20, 50]}
                        onPage={handlePageChange}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: "96rem" }}
                        emptyMessage={debouncedSearch ? "No students found for this search" : "No students found"}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} students"
                        showCurrentPageReport
                    >
                        <Column header="#" body={serialNumberTemplate} style={{ width: "80px" }} />
                        <Column field="name" header="Name" />
                        <Column field="father_name" header="Father Name" />
                        <Column field="mobile" header="Mobile" />
                        <Column field="class_name" header="Class" />
                        <Column field="admission_no" header="Admission No" />
                        <Column field="fee_type" header="Fee Type" />
                        <Column field="opening_balance" header="Opening Balance" />
                        <Column field="discount" header="Discount" />
                        <Column header="DOB" body={dateBodyTemplate("dob")} />
                        <Column header="Admission Date" body={dateBodyTemplate("admission_date")} />
                        <Column field="category" header="Category" />
                        <Column field="house" header="House" />
                        <Column field="sr_no" header="SR No" />
                        <Column header="Action" body={actionBodyTemplate} style={{ width: "180px" }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Students;
