import React from "react";

const toNumber = (value) => Number(value || 0);

const formatAmount = (value, decimals = 2) => (
    toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: false,
    })
);

const formatDate = (value) => {
    if (!value) return "";

    const [year, month, day] = String(value).slice(0, 10).split("-");
    if (!year || !month || !day) return "";

    return `${day}/${month}/${year.slice(-2)}`;
};

const OilLubBillPaper = ({ annexure }) => {
    const bill = annexure?.bill || {};
    const customer = annexure?.customer || {};
    const rows = annexure?.rows || [];
    const reportTitle = (
        customer?.firm_name ||
        customer?.company_name ||
        customer?.name ||
        "DUTT BROTHERS"
    );
    const taxableTotal = rows.reduce((sum, row) => sum + toNumber(row.amt), 0);
    const cgst = taxableTotal * 0.09;
    const sgst = taxableTotal * 0.09;
    const grandTotal = taxableTotal + cgst + sgst;
    const dealer = customer?.dealer || "Hindustan Petroleum Corporation Ltd.";

    return (
        <div className="oil-lub-bill-paper">
            <div className="oil-bill-border">
                <div className="oil-invoice-top">
                    <div className="oil-left-spacer" />
                    <strong>TAX INVOICE</strong>
                    <strong>Original</strong>
                </div>

                <div className="oil-company-meta">
                    <strong>GSTIN No. : {customer?.gstno || ""}</strong>
                    <strong>Phone&nbsp; : {customer?.mobile || ""}</strong>
                </div>

                <div className="oil-company">
                    <h1>{String(reportTitle).toUpperCase()}</h1>
                    <h2>{customer?.address || customer?.address1 || ""}</h2>
                </div>

                <div className="oil-dealer">Dealer : {dealer}</div>

                <div className="oil-info-row">
                    <div>
                        <strong>To,</strong>
                        <div className="oil-party-name">{bill.party_name || ""}</div>
                        <div>{bill.party_address || ""}</div>
                        <strong>GSTIN No :</strong>
                    </div>
                    <div>
                        <div><strong>BILL NO.</strong><span>{bill.billno || ""}</span></div>
                        <div><strong>DATE</strong><span>{formatDate(bill.date)}</span></div>
                        <div><strong>Place of Supply :</strong><span>{customer?.address1 || ""}</span></div>
                    </div>
                </div>

                <table className="oil-lub-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Item</th>
                            <th>Vehicle No</th>
                            <th>Slip No</th>
                            <th>GST Rate</th>
                            <th>HSN Code</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan="9" className="text-center">No oil lub details found</td>
                            </tr>
                        )}

                        {rows.map((row) => (
                            <tr key={`${row.tran_id}-${row.detail_id}`}>
                                <td>{formatDate(row.date)}</td>
                                <td>{row.product_name || ""}</td>
                                <td>{row.vehicle_name || row.vehicle_no || ""}</td>
                                <td>{row.slip_no || ""}</td>
                                <td>18.00</td>
                                <td />
                                <td>{formatAmount(row.qty)}</td>
                                <td>{formatAmount(row.rate)}</td>
                                <td>{formatAmount(row.amt)}</td>
                            </tr>
                        ))}
                        <tr className="oil-filler-row">
                            <td />
                            <td />
                            <td />
                            <td />
                            <td />
                            <td />
                            <td />
                            <td />
                            <td />
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="6" rowSpan="6" />
                            <td colSpan="2">TOTAL</td>
                            <td>{formatAmount(taxableTotal)}</td>
                        </tr>
                        <tr>
                            <td colSpan="2">Add :CGST @9%</td>
                            <td>{formatAmount(cgst)}</td>
                        </tr>
                        <tr>
                            <td colSpan="2">Add :SGST @9%</td>
                            <td>{formatAmount(sgst)}</td>
                        </tr>
                        <tr>
                            <td colSpan="2">Add :CGST @14%</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td colSpan="2">Add :SGST @14%</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td colSpan="2">GRAND TOTAL</td>
                            <td>{formatAmount(grandTotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="oil-signature">For M/s {String(reportTitle).toUpperCase()}</div>
        </div>
    );
};

export default OilLubBillPaper;
