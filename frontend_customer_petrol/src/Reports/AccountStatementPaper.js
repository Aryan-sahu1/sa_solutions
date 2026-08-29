import React from "react";

const toNumber = (value) => Number(value || 0);

export const formatStatementAmount = (value) => (
    toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: false,
    })
);

export const formatStatementDate = (value) => {
    if (!value) return "";

    const [year, month, day] = String(value).slice(0, 10).split("-");
    if (!year || !month || !day) return value;

    return `${day}/${month}/${year.slice(-2)}`;
};

const formatBalance = (value) => {
    const amount = toNumber(value);

    return `${formatStatementAmount(Math.abs(amount))} ${amount >= 0 ? "Dr" : "Cr"}`;
};

const getRowClassName = (row) => (
    toNumber(row.credit) > 0 ? "statement-credit-row" : ""
);

const AccountStatementPaper = ({
    closingBalance,
    customer,
    fromDate,
    openingBalance,
    party,
    reportTitle,
    rows,
    toDate,
}) => {
    return (
        <div className="account-statement-paper">
            <div className="statement-company-meta">
                <div>GSTIN : {customer?.gstno || ""}</div>
                <div>
                    <div>Mobile :{customer?.mobile || ""}</div>
                    <div>Email :</div>
                </div>
            </div>

            <div className="statement-company-header">
                <h2>{String(reportTitle || "").toUpperCase()}</h2>
                <div>Dealer : Hindustan Petroleum Corporation&nbsp; Ltd.</div>
                <div>{customer?.address || ""}</div>
                <div>{customer?.address1 || ""}</div>
            </div>

            <div className="statement-rule" />

            <div className="statement-title-row">
                <h3>Account Statement</h3>
                <h4 className="fw-900">
                    Period From {formatStatementDate(fromDate)} To {formatStatementDate(toDate)}
                </h4>
            </div>

            <div className="statement-party-info">
                <strong>{String(party?.name || "CASH IN HAND").toUpperCase()}</strong>
                <strong>GSTIN :</strong>
            </div>

            <table className="statement-ledger-table">
                <thead>
                    <tr>
                        <th>Sn</th>
                        <th>Date</th>
                        <th>Particulars</th>
                        <th>Remarks</th>
                        <th>Slip No</th>
                        <th>Vehicle No</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Dr Amount</th>
                        <th>Cr Amount</th>
                        <th>Balance</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>{formatStatementDate(fromDate)}</td>
                        <td>Opening Bala</td>
                        <td />
                        <td />
                        <td />
                        <td />
                        <td />
                        <td />
                        <td>{toNumber(openingBalance) > 0 ? formatStatementAmount(openingBalance) : ""}</td>
                        <td>{toNumber(openingBalance) < 0 ? formatStatementAmount(Math.abs(openingBalance)) : ""}</td>
                        <td>{formatBalance(openingBalance)}</td>
                    </tr>

                    {rows.map((row, index) => (
                        <tr key={`${row.id}-${index}`} className={getRowClassName(row)}>
                            <td>{index + 2}</td>
                            <td>{formatStatementDate(row.date)}</td>
                            <td>{row.particular || ""}</td>
                            <td>{row.remarks || ""}</td>
                            <td>{row.slip_no || ""}</td>
                            <td>{row.vehicle_name || row.vehicle_no || ""}</td>
                            <td>{row.item || ""}</td>
                            <td>{row.qty ? formatStatementAmount(row.qty) : ""}</td>
                            <td>{row.rate ? formatStatementAmount(row.rate) : ""}</td>
                            <td>{toNumber(row.debit) > 0 ? formatStatementAmount(row.debit) : ""}</td>
                            <td className={toNumber(row.credit) > 0 ? "credit-value" : ""}>
                                {toNumber(row.credit) > 0 ? formatStatementAmount(row.credit) : ""}
                            </td>
                            <td>{formatBalance(row.balance)}</td>
                        </tr>
                    ))}

                    {rows.length === 0 && (
                        <tr>
                            <td colSpan="12" className="statement-empty-row">
                                No account statement data found
                            </td>
                        </tr>
                    )}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="9">Closing Balance</td>
                        <td />
                        <td />
                        <td>{formatBalance(closingBalance)}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="statement-page-footer">Page 1 of 1</div>
        </div>
    );
};

export default AccountStatementPaper;
