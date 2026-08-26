import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { useAuth } from "../context/AuthContext";
import DailyReportPaper, {
    formatDailyAmount,
    formatDailyDate,
} from "./DailyReportPaper";

const API_BASE_URL = "http://localhost:4000/api";

pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs;

const initialFormData = {
    fromDate: "",
    toDate: "",
    masterId: "",
    partyId: "",
    includeZero: false,
};

const DAILY_REPORT_ID = "__daily_report__";
const DAILY_REPORT_OPTION = {
    id: DAILY_REPORT_ID,
    name: "Daily Report",
};

const getCurrentDateValue = () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - timezoneOffset)
        .toISOString()
        .slice(0, 10);
};

const normalizeReportName = (value = "") => (
    String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, "")
);

const isTrialBalanceReport = (report) => {
    const name = normalizeReportName(report?.name);
    return name.includes("trialbalance") || name.includes("trailbalance");
};

const isAccountStatementReport = (report) => (
    normalizeReportName(report?.name).includes("accountstatement")
);

const isDailyReport = (report) => (
    String(report?.id) === DAILY_REPORT_ID ||
    normalizeReportName(report?.name).includes("dailyreport")
);

const Reports = () => {
    const { authHeaders, customer } = useAuth();
    const [formData, setFormData] = useState({
        ...initialFormData,
        fromDate: getCurrentDateValue(),
        toDate: getCurrentDateValue(),
    });
    const [reports, setReports] = useState([]);
    const [parties, setParties] = useState([]);
    const [rows, setRows] = useState([]);
    const [totals, setTotals] = useState(null);
    const [statementParty, setStatementParty] = useState(null);
    const [dailyReport, setDailyReport] = useState(null);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);
    const [optionLoading, setOptionLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const selectedReport = reports.find(
        (report) => String(report.id) === String(formData.masterId)
    );
    const isTrialBalanceActive = isTrialBalanceReport(selectedReport);
    const isAccountStatementActive = isAccountStatementReport(selectedReport);
    const isDailyReportActive = isDailyReport(selectedReport);

    const getOptions = useCallback(async () => {
        if (!authHeaders.Authorization) {
            return;
        }

        try {
            setOptionLoading(true);
            setError("");

            const [reportResult, partyResult] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/master/customer-options`, {
                    params: { page: 1, limit: 1000 },
                    headers: authHeaders,
                }),
                axios.get(`${API_BASE_URL}/party`, {
                    params: { page: 1, limit: 1000 },
                    headers: authHeaders,
                }),
            ]);

            const nextReports =
                reportResult.status === "fulfilled" && reportResult.value.data.status
                    ? reportResult.value.data.data || []
                    : [];
            const nextParties =
                partyResult.status === "fulfilled" && partyResult.value.data.status
                    ? partyResult.value.data.data || []
                    : [];

            setReports([DAILY_REPORT_OPTION, ...nextReports]);
            setParties(nextParties);
            setFormData((current) => ({
                ...current,
                masterId: current.masterId || DAILY_REPORT_ID,
            }));
        } catch (err) {
            console.error("Report option error:", err);
            setError(err.response?.data?.message || "Failed to fetch report options");
        } finally {
            setOptionLoading(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        getOptions();
    }, [getOptions]);

    const clearReportData = () => {
        setRows([]);
        setTotals(null);
        setStatementParty(null);
        setOpeningBalance(0);
        setClosingBalance(0);
        setDailyReport(null);
    };

    const handleChange = (e) => {
        const { checked, name, type, value } = e.target;

        setFormData((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (["masterId", "partyId", "fromDate", "toDate"].includes(name)) {
            clearReportData();
            setMessage("");
            setError("");
        }
    };

    const handleReset = () => {
        setFormData({
            ...initialFormData,
            fromDate: getCurrentDateValue(),
            toDate: getCurrentDateValue(),
            masterId: String(reports[0]?.id || ""),
        });
        clearReportData();
        setMessage("");
        setError("");
    };

    const formatAmount = (value) => (
        Number(value || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false,
        })
    );

    const formatDisplayDate = (value) => {
        if (!value) return "";

        const [year, month, day] = String(value).split("-");
        if (!year || !month || !day) return value;

        return `${day}/${month}/${year.slice(-2)}`;
    };

    const formatBalance = (value) => {
        const balance = Number(value || 0);
        if (balance === 0) return "0.00";

        return `${formatAmount(Math.abs(balance))} ${balance >= 0 ? "Dr" : "Cr"}`;
    };

    const reportTitle = (
        customer?.firm_name ||
        customer?.company_name ||
        customer?.name ||
        "HAMARA PUMP JASPURA"
    );
    const dateRangeLabel =
        `${formatDisplayDate(formData.fromDate)}-${formatDisplayDate(formData.toDate)}`;
    const reportHeading = isDailyReportActive
        ? "DAILY REPORT"
        : isAccountStatementActive
        ? "ACCOUNT STATEMENT"
        : "CLOSING BALANCE";

    const drAmount = (row) => (
        Number(row.closing_balance || 0) > 0 ? formatAmount(row.closing_balance) : "-"
    );

    const crAmount = (row) => (
        Number(row.closing_balance || 0) < 0
            ? formatAmount(Math.abs(Number(row.closing_balance || 0)))
            : "-"
    );

    const statementDebit = (row) => (
        Number(row.debit || 0) > 0 ? formatAmount(row.debit) : "-"
    );

    const statementCredit = (row) => (
        Number(row.credit || 0) > 0 ? formatAmount(row.credit) : "-"
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!formData.fromDate) {
            setError("From date is required");
            return;
        }

        if (!formData.toDate) {
            setError("To date is required");
            return;
        }

        if (!formData.masterId) {
            setError("Dropdown is required");
            return;
        }

        if (!isTrialBalanceActive && !isAccountStatementActive && !isDailyReportActive) {
            clearReportData();
            return;
        }

        if (isAccountStatementActive && !formData.partyId) {
            clearReportData();
            setError("Transaction Party is required for Account Statement");
            return;
        }

        try {
            setReportLoading(true);

            const params = {
                fromDate: formData.fromDate,
                toDate: formData.toDate,
            };

            if (formData.partyId && !isDailyReportActive) {
                params.partyId = formData.partyId;
            }

            if (isTrialBalanceActive) {
                params.includeZero = formData.includeZero;
            }

            if (isDailyReportActive) {
                params.date = formData.fromDate;
            }

            const endpoint = isDailyReportActive
                ? "daily-report"
                : isAccountStatementActive
                ? "account-statement"
                : "trial-balance";
            const response = await axios.get(`${API_BASE_URL}/reports/${endpoint}`, {
                params,
                headers: {
                    ...authHeaders,
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
            });

            if (response.data.status) {
                if (isDailyReportActive) {
                    setDailyReport(response.data.data || null);
                    setRows([]);
                    setTotals(null);
                    setStatementParty(null);
                    setOpeningBalance(0);
                    setClosingBalance(0);
                    setMessage(response.data.message || "Report fetched successfully");
                    return;
                }

                setRows(response.data.data || []);
                setTotals(response.data.totals || null);
                setStatementParty(response.data.party || null);
                setOpeningBalance(Number(response.data.opening_balance || 0));
                setClosingBalance(Number(response.data.closing_balance || 0));
                setMessage(response.data.message || "Report fetched successfully");
                return;
            }

            clearReportData();
            setError(response.data.message || "Failed to fetch report");
        } catch (err) {
            console.error("Report fetch error:", err);
            clearReportData();
            setError(err.response?.data?.message || "Failed to fetch report");
        } finally {
            setReportLoading(false);
        }
    };

    const buildTrialBalancePdfTableBody = () => {
        const tableRows = rows.map((row, index) => [
            String(index + 1),
            row.party_name || "",
            row.phone_no || "",
            { text: drAmount(row), alignment: "right" },
            { text: crAmount(row), alignment: "right" },
        ]);

        return [
            [
                { text: "Sno", bold: true },
                { text: "party name", bold: true },
                { text: "Phone No", bold: true },
                { text: "Dr Amount", bold: true, alignment: "right" },
                { text: "Cr Amount", bold: true, alignment: "right" },
            ],
            ...tableRows,
            [
                "",
                { text: "Total", colSpan: 2, alignment: "right", bold: true },
                "",
                { text: formatAmount(totals?.trial_debit), alignment: "right", bold: true },
                { text: formatAmount(totals?.trial_credit), alignment: "right", bold: true },
            ],
        ];
    };

    const buildAccountStatementPdfTableBody = () => {
        const tableRows = rows.map((row, index) => [
            String(index + 1),
            formatDisplayDate(String(row.date || "").slice(0, 10)),
            row.particular || "",
            row.remarks || row.slip_no || "",
            { text: statementDebit(row), alignment: "right" },
            { text: statementCredit(row), alignment: "right" },
            { text: formatBalance(row.balance), alignment: "right" },
        ]);

        return [
            [
                { text: "Sno", bold: true },
                { text: "Date", bold: true },
                { text: "Particular", bold: true },
                { text: "Remarks", bold: true },
                { text: "Debit", bold: true, alignment: "right" },
                { text: "Credit", bold: true, alignment: "right" },
                { text: "Balance", bold: true, alignment: "right" },
            ],
            [
                "",
                "",
                { text: "Opening Balance", colSpan: 2, bold: true },
                "",
                "",
                "",
                { text: formatBalance(openingBalance), alignment: "right", bold: true },
            ],
            ...tableRows,
            [
                "",
                "",
                { text: "Total", colSpan: 2, alignment: "right", bold: true },
                "",
                { text: formatAmount(totals?.debit), alignment: "right", bold: true },
                { text: formatAmount(totals?.credit), alignment: "right", bold: true },
                { text: formatBalance(closingBalance), alignment: "right", bold: true },
            ],
        ];
    };

    const getPdfTable = () => (
        isAccountStatementActive
            ? {
                widths: [25, 55, "*", 110, 65, 65, 75],
                body: buildAccountStatementPdfTableBody(),
            }
            : {
                widths: [30, "*", 120, 80, 80],
                body: buildTrialBalancePdfTableBody(),
            }
    );

    const getPdfDefinition = () => ({
        pageSize: "A4",
        pageOrientation: "portrait",
        pageMargins: [45, 38, 45, 38],
        defaultStyle: {
            fontSize: 8,
            color: "#000000",
        },
        content: [
            {
                columns: [
                    {
                        stack: [
                            {
                                text: String(reportTitle).toUpperCase(),
                                bold: true,
                                fontSize: 13,
                                margin: [0, 0, 0, 3],
                            },
                            {
                                text: dateRangeLabel,
                                fontSize: 10,
                            },
                        ],
                    },
                    {
                        stack: [
                            {
                                text: "Page No. 1",
                                alignment: "right",
                                margin: [0, 0, 0, 8],
                            },
                            {
                                text: reportHeading,
                                alignment: "right",
                            },
                        ],
                    },
                ],
                margin: [0, 0, 0, 8],
            },
            ...(isAccountStatementActive
                ? [{
                    text: `Account: ${statementParty?.name || ""}`,
                    bold: true,
                    margin: [0, 0, 0, 6],
                }]
                : []),
            {
                table: {
                    headerRows: 1,
                    ...getPdfTable(),
                },
                layout: {
                    hLineWidth: () => 0.8,
                    vLineWidth: () => 0,
                    hLineColor: () => "#000000",
                    paddingLeft: () => 3,
                    paddingRight: () => 3,
                    paddingTop: () => 2,
                    paddingBottom: () => 2,
                },
            },
        ],
    });

    const buildDailyReportPdfDefinition = () => {
        const pumpRows = dailyReport?.pumpwise?.rows || [];
        const salesProducts = dailyReport?.sales?.products || [];
        const salesParties = dailyReport?.sales?.parties || [];
        const cashRows = dailyReport?.cash?.rows || [];
        const stockRows = dailyReport?.stock || [];
        const closingCashValue = Number(dailyReport?.totals?.closingCash || 0);
        const salesTotal = Number(dailyReport?.sales?.totalAmount || 0);
        const maxSalesRows = Math.max(salesProducts.length + 1, salesParties.length + 1, 5);
        const groupedPumpRows = pumpRows.reduce((acc, row) => {
            const key = row.product_id || row.product_name || "Other";
            const group = acc.find((item) => item.key === key);

            if (group) {
                group.rows.push(row);
                group.total += Number(row.sale || 0);
                return acc;
            }

            acc.push({ key, rows: [row], total: Number(row.sale || 0) });
            return acc;
        }, []);
        const pumpBody = [
            ["Pump Name", "Op. Reading", "Cl. Reading", "Testing", "Sale"],
            ...groupedPumpRows.flatMap((group) => [
                ...group.rows.map((row) => [
                    row.pump_name || row.pump_serial_no || row.product_name || "",
                    formatDailyAmount(row.opening, 3),
                    formatDailyAmount(row.closing, 3),
                    Number(row.testing || 0) === 0 ? "-" : formatDailyAmount(row.testing),
                    Number(row.sale || 0) === 0 ? "-" : formatDailyAmount(row.sale),
                ]),
                ["", "", "", "", { text: formatDailyAmount(group.total), bold: true }],
                ["", "", "", "", ""],
            ]),
        ];
        const salesBody = [
            ["Item", "Rate", "Qty", "Amount", "Party", "Item", "Qty/Vehicle No", "Amount"],
            ...Array.from({ length: maxSalesRows }).map((_, index) => {
                const product = index === 0
                    ? { product_name: "Opening Balance", amount: closingCashValue }
                    : salesProducts[index - 1];
                const party = salesParties[index];

                return [
                    product?.product_name || "",
                    product?.rate ? formatDailyAmount(product.rate) : "-",
                    product?.qty ? formatDailyAmount(product.qty) : "-",
                    product ? formatDailyAmount(product.amount) : "-",
                    party?.party_name || "",
                    party?.item_name || "",
                    party?.vehicle_name || party?.slip_no || "",
                    party ? formatDailyAmount(party.amount) : "",
                ];
            }),
            ["", "", "", "", "", "", { text: "Closing Balance", color: "red", bold: true }, { text: formatDailyAmount(closingCashValue), color: "red", bold: true }],
            ["", "", "", { text: formatDailyAmount(salesTotal + closingCashValue), bold: true }, "", "", "", { text: formatDailyAmount(salesTotal + closingCashValue), bold: true }],
        ];
        const stockBody = [
            ["Name of Product", "Opening Stock", "Purchase", "Sales", "Stock", "Dip (Ltr)", "Difference"],
            ...stockRows.map((row) => [
                `${row.product_name || ""}\nCash : Q ${formatDailyAmount(row.sales)} Amt ${formatDailyAmount(row.sales_amount)}`,
                formatDailyAmount(row.opening_stock),
                formatDailyAmount(row.purchase),
                formatDailyAmount(row.sales),
                formatDailyAmount(row.stock),
                formatDailyAmount(row.stock),
                {
                    text: formatDailyAmount(row.difference),
                    color: Number(row.difference || 0) >= 0 ? "green" : "red",
                },
            ]),
        ];

        return {
            pageSize: "A4",
            pageMargins: [42, 28, 42, 28],
            defaultStyle: { fontSize: 8, color: "#000000" },
            content: [
                {
                    columns: [
                        { text: String(reportTitle).toUpperCase(), bold: true, fontSize: 15 },
                        {
                            text: `Daily Report for : ${formatDailyDate(dailyReport?.date)}`,
                            bold: true,
                            alignment: "right",
                            fontSize: 10,
                        },
                    ],
                    margin: [0, 0, 0, 8],
                },
                { text: "Pumpwise Breakup", bold: true, decoration: "underline", margin: [0, 0, 0, 2] },
                {
                    table: { headerRows: 1, widths: ["*", 75, 75, 65, 65], body: pumpBody },
                    layout: "lightHorizontalLines",
                    margin: [0, 0, 0, 8],
                },
                { text: "Sales", bold: true, decoration: "underline", margin: [0, 0, 0, 2] },
                {
                    table: { headerRows: 1, widths: ["*", 45, 45, 65, "*", 48, 72, 65], body: salesBody },
                    layout: "lightHorizontalLines",
                    margin: [0, 0, 0, 6],
                },
                ...(cashRows.length > 0 ? [
                    {
                        text: `BANK AAMAD ${formatDailyAmount(dailyReport?.cash?.receiptTotal, 0)} - UDHAARI ${formatDailyAmount(dailyReport?.cash?.paymentTotal, 0)}`,
                        bold: true,
                        margin: [0, 0, 0, 2],
                    },
                    {
                        table: {
                            headerRows: 1,
                            widths: ["*", "*", 65, "*"],
                            body: [
                                ["Debit Party", "Credit Party", "Amount", "Remarks"],
                                ...cashRows.map((row) => [
                                    row.debit_party || "",
                                    row.credit_party || "",
                                    formatDailyAmount(row.amount),
                                    row.remarks || row.type1 || "",
                                ]),
                            ],
                        },
                        layout: "noBorders",
                        margin: [0, 0, 0, 8],
                    },
                ] : []),
                { text: "Stock Report", bold: true, decoration: "underline", margin: [0, 0, 0, 2] },
                { text: "<------SOLD------>", bold: true, alignment: "center", margin: [0, 0, 0, 2] },
                {
                    table: { headerRows: 1, widths: ["*", 65, 55, 55, 55, 55, 60], body: stockBody },
                    layout: "lightHorizontalLines",
                },
            ],
        };
    };

    const canExportPdf =
        Boolean(isDailyReportActive && dailyReport) ||
        rows.length > 0 ||
        (isAccountStatementActive && statementParty);

    const handlePrintPdf = () => {
        if (!canExportPdf) return;
        pdfMake.createPdf(
            isDailyReportActive ? buildDailyReportPdfDefinition() : getPdfDefinition()
        ).print();
    };

    const handleDownloadPdf = () => {
        if (!canExportPdf) return;
        const fileName = isDailyReportActive
            ? "daily-report.pdf"
            : isAccountStatementActive
            ? "account-statement.pdf"
            : "trial-balance.pdf";

        pdfMake.createPdf(
            isDailyReportActive ? buildDailyReportPdfDefinition() : getPdfDefinition()
        ).download(fileName);
    };

    return (
        <div className="container-fluid p-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Reports</h2>
                    <p className="text-muted mb-0">
                        Select report filters by date, party, shift, and product category
                    </p>
                </div>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="card shadow-sm border-0">
                <div className="card-header bg-white">
                    <h5 className="mb-0">Report Form</h5>
                </div>

                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3 align-items-end">
                            <div className="col-md-4 col-lg-2">
                                <label className="form-label fw-semibold">From Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="fromDate"
                                    value={formData.fromDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4 col-lg-2">
                                <label className="form-label fw-semibold">To Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="toDate"
                                    value={formData.toDate}
                                    onChange={handleChange}
                                    disabled={isDailyReportActive}
                                />
                            </div>

                            <div className="col-md-4 col-lg-3">
                                <label className="form-label fw-semibold">Dropdown</label>
                                <select
                                    className="form-select"
                                    name="masterId"
                                    value={formData.masterId}
                                    onChange={handleChange}
                                    disabled={optionLoading || reportLoading}
                                >
                                    <option value="">Select option</option>
                                    {reports.map((report) => (
                                        <option key={report.id} value={report.id}>
                                            {report.name || `Report #${report.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4 col-lg-3">
                                <label className="form-label fw-semibold">
                                    Transaction Party
                                </label>
                                <select
                                    className="form-select"
                                    name="partyId"
                                    value={formData.partyId}
                                    onChange={handleChange}
                                    disabled={optionLoading || reportLoading || isDailyReportActive}
                                >
                                    <option value="">All parties</option>
                                    {parties.map((party) => (
                                        <option key={party.id} value={party.id}>
                                            {party.name || `Party #${party.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-4 col-lg-2">
                                <div className="form-check report-zero-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="includeZero"
                                        name="includeZero"
                                    checked={formData.includeZero}
                                    onChange={handleChange}
                                    disabled={reportLoading || isAccountStatementActive || isDailyReportActive}
                                    />
                                    <label
                                        className="form-check-label fw-semibold"
                                        htmlFor="includeZero"
                                    >
                                        Include Zero
                                    </label>
                                </div>
                            </div>

                            <div className="col-12">
                                <button
                                    type="submit"
                                    className="btn btn-primary me-2"
                                    disabled={optionLoading || reportLoading}
                                >
                                    {reportLoading ? "Loading..." : "View Report"}
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleReset}
                                    disabled={reportLoading}
                                >
                                    Reset
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-dark ms-2"
                                    onClick={handlePrintPdf}
                                    disabled={reportLoading || !canExportPdf}
                                >
                                    Print PDF
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-primary ms-2"
                                    onClick={handleDownloadPdf}
                                    disabled={reportLoading || !canExportPdf}
                                >
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {isDailyReportActive && dailyReport && (
                <DailyReportPaper
                    report={dailyReport}
                    reportTitle={reportTitle}
                />
            )}

            {!isDailyReportActive && (
            <div className="report-paper mt-4">
                <div className="report-heading">
                    <div>
                        <h4>{String(reportTitle).toUpperCase()}</h4>
                        <div>{dateRangeLabel}</div>
                    </div>
                    <div className="report-heading-right">
                        <div>Page No. 1</div>
                        <div>{reportHeading}</div>
                    </div>
                </div>

                {isAccountStatementActive && statementParty && (
                    <div className="statement-party">
                        Account: {statementParty.name}
                        {statementParty.phone_no ? ` | Phone: ${statementParty.phone_no}` : ""}
                    </div>
                )}

                <div className="table-responsive">
                    {!isAccountStatementActive && (
                        <table className="closing-report-table">
                            <thead>
                                <tr>
                                    <th className="sno-col">Sno</th>
                                    <th>party name</th>
                                    <th className="phone-col">Phone No</th>
                                    <th className="amount-col">Dr Amount</th>
                                    <th className="amount-col">Cr Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportLoading && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-3">
                                            Loading...
                                        </td>
                                    </tr>
                                )}

                                {!reportLoading && rows.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-3">
                                            No trial balance data found
                                        </td>
                                    </tr>
                                )}

                                {!reportLoading && rows.map((row, index) => (
                                    <tr key={row.party_id}>
                                        <td>{index + 1}</td>
                                        <td>{row.party_name}</td>
                                        <td>{row.phone_no || ""}</td>
                                        <td className="amount-cell">{drAmount(row)}</td>
                                        <td className="amount-cell">{crAmount(row)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {rows.length > 0 && (
                                <tfoot>
                                    <tr>
                                        <td />
                                        <td colSpan="2" className="text-end">Total</td>
                                        <td className="amount-cell">
                                            {formatAmount(totals?.trial_debit)}
                                        </td>
                                        <td className="amount-cell">
                                            {formatAmount(totals?.trial_credit)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    )}

                    {isAccountStatementActive && (
                        <table className="closing-report-table statement-report-table">
                            <thead>
                                <tr>
                                    <th className="sno-col">Sno</th>
                                    <th className="date-col">Date</th>
                                    <th>Particular</th>
                                    <th>Remarks</th>
                                    <th className="amount-col">Debit</th>
                                    <th className="amount-col">Credit</th>
                                    <th className="balance-col">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportLoading && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-3">
                                            Loading...
                                        </td>
                                    </tr>
                                )}

                                {!reportLoading && !statementParty && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-3">
                                            Select party and view account statement
                                        </td>
                                    </tr>
                                )}

                                {!reportLoading && statementParty && (
                                    <tr>
                                        <td />
                                        <td />
                                        <td colSpan="2" className="fw-bold">
                                            Opening Balance
                                        </td>
                                        <td />
                                        <td />
                                        <td className="amount-cell fw-bold">
                                            {formatBalance(openingBalance)}
                                        </td>
                                    </tr>
                                )}

                                {!reportLoading && rows.map((row, index) => (
                                    <tr key={row.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {formatDisplayDate(
                                                String(row.date || "").slice(0, 10)
                                            )}
                                        </td>
                                        <td>{row.particular || ""}</td>
                                        <td>{row.remarks || row.slip_no || ""}</td>
                                        <td className="amount-cell">
                                            {statementDebit(row)}
                                        </td>
                                        <td className="amount-cell">
                                            {statementCredit(row)}
                                        </td>
                                        <td className="amount-cell">
                                            {formatBalance(row.balance)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {statementParty && (
                                <tfoot>
                                    <tr>
                                        <td />
                                        <td />
                                        <td colSpan="2" className="text-end">Total</td>
                                        <td className="amount-cell">
                                            {formatAmount(totals?.debit)}
                                        </td>
                                        <td className="amount-cell">
                                            {formatAmount(totals?.credit)}
                                        </td>
                                        <td className="amount-cell">
                                            {formatBalance(closingBalance)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    )}
                </div>
            </div>
            )}

            <style>{`
                .report-zero-check {
                    min-height: 38px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .report-zero-check .form-check-input {
                    margin-top: 0;
                }

                .report-paper {
                    width: min(1080px, 100%);
                    margin: 0 auto;
                    padding: 42px 56px;
                    background: #ffffff;
                    color: #000000;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
                }

                .report-heading {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 24px;
                    margin-bottom: 8px;
                    font-size: 16px;
                    line-height: 1.35;
                }

                .report-heading h4 {
                    margin: 0 0 2px;
                    font-size: 23px;
                    line-height: 1.2;
                    font-weight: 800;
                    letter-spacing: 0;
                }

                .report-heading-right {
                    min-width: 180px;
                    text-align: right;
                }

                .statement-party {
                    margin-bottom: 8px;
                    font-size: 15px;
                    font-weight: 700;
                }

                .closing-report-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 16px;
                    line-height: 1.2;
                }

                .closing-report-table th,
                .closing-report-table td {
                    padding: 2px 6px;
                    border-top: 2px solid #111111;
                    border-bottom: 2px solid #111111;
                    font-weight: 400;
                    white-space: nowrap;
                }

                .closing-report-table th {
                    font-weight: 700;
                    text-align: left;
                }

                .closing-report-table tfoot td {
                    font-weight: 700;
                }

                .sno-col {
                    width: 48px;
                }

                .date-col {
                    width: 88px;
                }

                .phone-col {
                    width: 230px;
                }

                .amount-col {
                    width: 150px;
                    text-align: right !important;
                }

                .balance-col {
                    width: 140px;
                    text-align: right !important;
                }

                .amount-cell {
                    text-align: right;
                }

                .statement-report-table {
                    min-width: 920px;
                }

                .daily-report-paper {
                    width: min(864px, 100%);
                    margin: 24px auto 0;
                    padding: 34px 52px 50px;
                    background: #ffffff;
                    color: #000000;
                    border: 1px solid #cfcfcf;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 12px;
                    line-height: 1.2;
                }

                .daily-title-row {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    align-items: start;
                    gap: 24px;
                    border-bottom: 3px solid #111111;
                    padding-bottom: 6px;
                }

                .daily-title-row h3 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: 0;
                }

                .daily-title-row h4 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 800;
                }

                .daily-section {
                    margin-top: 4px;
                    border-bottom: 3px solid #111111;
                    padding-bottom: 4px;
                }

                .daily-section h5 {
                    margin: 0 0 4px;
                    font-size: 14px;
                    font-weight: 800;
                    text-decoration: underline;
                }

                .daily-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                .daily-table th,
                .daily-table td {
                    padding: 2px 2px;
                    font-size: 12px;
                    font-weight: 400;
                    vertical-align: top;
                    white-space: nowrap;
                }

                .daily-table thead th {
                    border-bottom: 3px solid #111111;
                    text-align: left;
                }

                .daily-table td:not(:first-child),
                .daily-table th:not(:first-child) {
                    text-align: right;
                }

                .pump-table .group-total-row td:last-child {
                    border-top: 3px solid #111111;
                    font-weight: 800;
                }

                .pump-table .group-gap-row td {
                    height: 10px;
                }

                .sales-table th:nth-child(5),
                .sales-table td:nth-child(5),
                .sales-table th:nth-child(6),
                .sales-table td:nth-child(6) {
                    text-align: left;
                }

                .sales-table tfoot td {
                    border-top: 3px solid #111111;
                    font-weight: 800;
                }

                .closing-row td:nth-last-child(2),
                .closing-row td:last-child {
                    color: red;
                    font-weight: 800;
                    font-size: 15px;
                }

                .cash-section {
                    border-bottom-width: 2px;
                }

                .cash-section .daily-table thead th {
                    border-bottom: 0;
                    font-weight: 800;
                }

                .sold-label {
                    text-align: center;
                    font-size: 12px;
                    font-weight: 800;
                    margin-bottom: 2px;
                }

                .stock-table td:first-child strong {
                    display: block;
                    font-size: 11px;
                    font-style: italic;
                    white-space: normal;
                }

                .positive {
                    color: green;
                }

                .negative {
                    color: red;
                }

                @media (max-width: 767.98px) {
                    .report-paper {
                        padding: 24px 18px;
                    }

                    .closing-report-table {
                        font-size: 14px;
                    }

                    .daily-report-paper {
                        padding: 24px 16px;
                        overflow-x: auto;
                    }
                }

                @media print {
                    body * {
                        visibility: hidden;
                    }

                    .daily-report-paper,
                    .daily-report-paper * {
                        visibility: visible;
                    }

                    .daily-report-paper {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        border: 0;
                        box-shadow: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default Reports;
