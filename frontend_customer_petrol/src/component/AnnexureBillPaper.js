import React from "react";

const toNumber = (value) => Number(value || 0);

const formatAmount = (value, decimals = 2) => (
    toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: false,
    })
);

const formatDate = (value, shortYear = false) => {
    if (!value) return "";

    const [year, month, day] = String(value).slice(0, 10).split("-");
    if (!year || !month || !day) return "";

    return `${day}/${month}/${shortYear ? year.slice(-2) : year}`;
};

const AnnexureBillPaper = ({ annexure }) => {
    const bill = annexure?.bill || {};
    const customer = annexure?.customer || {};
    const rows = annexure?.rows || [];
    const reportTitle = (
        customer?.firm_name ||
        customer?.company_name ||
        customer?.name ||
        "NEW AGRA SERVICE STATION"
    );

    return (
        <div className="annexure-bill-paper">
            <h1>{String(reportTitle).toUpperCase()}</h1>
            <h2>Details of Slips</h2>

            <div className="annexure-rule" />

            <div className="annexure-bill-meta">
                <strong>Bill No : {bill.billno || ""}</strong>
                <strong>Date : {formatDate(bill.date, true)}</strong>
            </div>

            <div className="annexure-rule" />

            <table className="annexure-slip-table">
                <thead>
                    <tr>
                        <th>Slip No.</th>
                        <th>Date</th>
                        <th>Vehicle No</th>
                        <th>Product Name</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Rate</th>
                        <th>Amount (Rs)</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan="8" className="text-center">
                                No slip details found
                            </td>
                        </tr>
                    )}

                    {rows.map((row) => (
                        <tr key={`${row.tran_id}-${row.detail_id}`}>
                            <td>{row.slip_no || ""}</td>
                            <td>{formatDate(row.date)}</td>
                            <td>{row.vehicle_name || row.vehicle_no || ""}</td>
                            <td>{row.product_name || ""}</td>
                            <td>{row.product_unit || "LTRS"}</td>
                            <td>{formatAmount(row.qty, 3)}</td>
                            <td>{formatAmount(row.rate)}</td>
                            <td>{formatAmount(row.amt)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="5" />
                        <td colSpan="2">Total</td>
                        <td>{formatAmount(annexure?.total)}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="annexure-rule annexure-bottom-rule" />
        </div>
    );
};

export default AnnexureBillPaper;
