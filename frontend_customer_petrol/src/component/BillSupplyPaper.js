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

const getVehicleLabel = (bill, rows) => (
    bill?.vehicle_name ||
    (bill?.vehicleno ? `Vehicle #${bill.vehicleno}` : "All Vehicles") ||
    rows[0]?.vehicle_name ||
    ""
);

const BillSupplyPaper = ({ annexure }) => {
    const bill = annexure?.bill || {};
    const customer = annexure?.customer || {};
    const rows = annexure?.rows || [];
    const reportTitle = (
        customer?.firm_name ||
        customer?.company_name ||
        customer?.name ||
        "DUTT BROTHERS"
    );
    const address = customer?.address || customer?.address1 || "";
    const currentBill = toNumber(bill.amt || annexure?.total);
    const tcs = toNumber(bill.tcs);
    const totalDue = currentBill + tcs;
    const totalQty = rows.reduce((sum, row) => sum + toNumber(row.qty), 0);
    const vehicleLabel = getVehicleLabel(bill, rows);

    return (
        <div className="bill-supply-paper">
            <div className="bill-border">
                <div className="bill-topline">
                    <strong>GSTIN No. : {customer?.gstno || ""}</strong>
                    <strong>Phone&nbsp; : {customer?.mobile || ""}</strong>
                </div>

                <div className="bill-company">
                    <h1>{String(reportTitle).toUpperCase()}</h1>
                    <h2>{address}</h2>
                </div>

                <div className="bill-dealer">
                    Dealer : Hindustan Petroleum Corporation Ltd.
                </div>

                <div className="bill-title">BILL OF SUPPLY</div>

                <div className="bill-info-grid">
                    <div>
                        <strong>Bill To</strong>
                        <div className="bill-party-name">M/s&nbsp;&nbsp;{bill.party_name || ""}</div>
                        <div className="bill-party-address">{bill.party_address || ""}</div>
                        <div className="bill-party-gstin">GSTIN :</div>
                    </div>
                    <div className="bill-item-label">ITEM</div>
                    <div className="bill-meta">
                        <div><span>Bill No.</span><b>:</b><span>{bill.billno || ""}</span></div>
                        <div><span>Date</span><b>:</b><span>{formatDate(bill.date)}</span></div>
                        <div><span>Place of Supply</span><b>:</b><span>{customer?.address1 || ""}</span></div>
                        <div><span>Period</span><b>:</b><span>{formatDate(bill.sdate)} To Dt. : {formatDate(bill.edate)}</span></div>
                        <div><span>Page No.</span><b>:</b><span>1</span></div>
                    </div>
                </div>

                <div className="bill-vehicle"><strong>Vehicle No :</strong> {vehicleLabel}</div>

                <table className="bill-supply-table">
                    <thead>
                        <tr>
                            <th>Sn</th>
                            <th>Date</th>
                            <th>Cr. Memo<br />No.</th>
                            <th>Vehicle<br />No.</th>
                            <th />
                            <th>QuantityUnit</th>
                            <th>Rate</th>
                            <th>Amount<br />(Rs)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan="8" className="text-center">No bill details found</td>
                            </tr>
                        )}

                        {rows.map((row, index) => (
                            <tr key={`${row.tran_id}-${row.detail_id}`}>
                                <td>{index + 1}</td>
                                <td>{formatDate(row.date)}</td>
                                <td>{row.slip_no || ""}</td>
                                <td>{row.vehicle_name || row.vehicle_no || ""}</td>
                                <td>{row.product_name || ""}</td>
                                <td>{formatAmount(row.qty, 3)} {row.product_unit || "Ltr"}</td>
                                <td>{formatAmount(row.rate)}</td>
                                <td>{formatAmount(row.amt)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="5" />
                            <td>{formatAmount(totalQty, 2)}Ltr</td>
                            <td />
                            <td>{formatAmount(currentBill)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="bill-tcs-row">
                    <span>TCS @.0075</span>
                    <span>{formatAmount(tcs)}</span>
                </div>

                <div className="bill-summary">
                    <div>
                        <span>Prev. Bal :</span>
                        <b>0.00</b>
                    </div>
                    <div>
                        <span>Pmt. Recd</span>
                        <b>0.00</b>
                    </div>
                    <div>
                        <span>Oth. Debit (+)</span>
                        <b>0.00</b>
                    </div>
                    <div>
                        <span>Curr. Bill (+)</span>
                        <b>{formatAmount(currentBill)}</b>
                    </div>
                    <div>
                        <span>Total Amt. Due</span>
                        <b>{formatAmount(totalDue)}</b>
                    </div>
                </div>

                <div className="bill-footer">
                    <div>
                        <h3>E. &amp; O. E.</h3>
                        <p>1. All transactions are subject to Kanpur Dehat jurisdiction.</p>
                        <p>2. Bill should be paid on presentation otherwise interest<br />&nbsp;&nbsp;&nbsp;&nbsp;will be charged @ 18% per annum.</p>
                        <p>3. Please make this payment through RTGS/NEFT.</p>
                    </div>
                    <div className="bill-signature">
                        <p>For M/s {String(reportTitle).toUpperCase()}</p>
                        <p>Authorised Signatory</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillSupplyPaper;
