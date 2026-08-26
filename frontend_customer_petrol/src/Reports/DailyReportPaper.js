import React from "react";

const toNumber = (value) => Number(value || 0);

export const formatDailyAmount = (value, decimals = 2) => (
    toNumber(value).toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: false,
    })
);

export const formatDailyDate = (value) => {
    if (!value) return "";

    const [year, month, day] = String(value).slice(0, 10).split("-");
    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
};

const dashIfZero = (value, decimals = 2) => (
    toNumber(value) === 0 ? "-" : formatDailyAmount(value, decimals)
);

const groupPumpRows = (rows = []) => rows.reduce((acc, row) => {
    const key = row.product_id || row.product_name || "Other";
    const existing = acc.find((group) => group.key === key);

    if (existing) {
        existing.rows.push(row);
        existing.total += toNumber(row.sale);
        return acc;
    }

    acc.push({
        key,
        productName: row.product_name || "Other",
        rows: [row],
        total: toNumber(row.sale),
    });
    return acc;
}, []);

const DailyReportPaper = ({ report, reportTitle }) => {
    const pumpGroups = groupPumpRows(report?.pumpwise?.rows || []);
    const salesProducts = report?.sales?.products || [];
    const salesParties = report?.sales?.parties || [];
    const cashRows = report?.cash?.rows || [];
    const stockRows = report?.stock || [];
    const maxSalesRows = Math.max(salesProducts.length + 1, salesParties.length + 1, 5);
    const salesTotal = toNumber(report?.sales?.totalAmount);
    const closingCash = toNumber(report?.totals?.closingCash);

    return (
        <div className="daily-report-paper">
            <div className="daily-title-row">
                <h3>{String(reportTitle || "HAMARA PUMP JASPURA").toUpperCase()}</h3>
                <h4>Daily Report for : {formatDailyDate(report?.date)}</h4>
            </div>

            <section className="daily-section">
                <h5>Pumpwise Breakup</h5>
                <table className="daily-table pump-table">
                    <thead>
                        <tr>
                            <th>Pump Name</th>
                            <th>Op. Reading</th>
                            <th>Cl. Reading</th>
                            <th>Testing</th>
                            <th>Sale</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pumpGroups.length === 0 && (
                            <tr>
                                <td colSpan="5">No pump reading found</td>
                            </tr>
                        )}

                        {pumpGroups.map((group) => (
                            <React.Fragment key={group.key}>
                                {group.rows.map((row) => (
                                    <tr key={`${row.id}-${row.nozel_id}`}>
                                        <td>{row.pump_name || row.pump_serial_no || group.productName}</td>
                                        <td>{formatDailyAmount(row.opening, 3)}</td>
                                        <td>{formatDailyAmount(row.closing, 3)}</td>
                                        <td>{dashIfZero(row.testing)}</td>
                                        <td>{dashIfZero(row.sale)}</td>
                                    </tr>
                                ))}
                                <tr className="group-total-row">
                                    <td colSpan="4" />
                                    <td>{formatDailyAmount(group.total)}</td>
                                </tr>
                                <tr className="group-gap-row">
                                    <td colSpan="5" />
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="daily-section">
                <h5>Sales</h5>
                <table className="daily-table sales-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Rate</th>
                            <th>Qty</th>
                            <th>Amount</th>
                            <th>Party</th>
                            <th>Item</th>
                            <th>Qty/Vehicle No</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: maxSalesRows }).map((_, index) => {
                            const product = index === 0
                                ? { product_name: "Opening Balance", amount: closingCash }
                                : salesProducts[index - 1];
                            const party = salesParties[index];

                            return (
                                <tr key={`sales-${index}`}>
                                    <td>{product?.product_name || ""}</td>
                                    <td>{product?.rate ? formatDailyAmount(product.rate) : "-"}</td>
                                    <td>{product?.qty ? formatDailyAmount(product.qty) : "-"}</td>
                                    <td>{product ? formatDailyAmount(product.amount) : "-"}</td>
                                    <td>{party?.party_name || ""}</td>
                                    <td>{party?.item_name || ""}</td>
                                    <td>{party?.vehicle_name || party?.slip_no || ""}</td>
                                    <td>{party ? formatDailyAmount(party.amount) : ""}</td>
                                </tr>
                            );
                        })}
                        <tr className="closing-row">
                            <td colSpan="6" />
                            <td>Closing Balance</td>
                            <td>{formatDailyAmount(closingCash)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="3" />
                            <td>{formatDailyAmount(salesTotal + closingCash)}</td>
                            <td colSpan="3" />
                            <td>{formatDailyAmount(salesTotal + closingCash)}</td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            {cashRows.length > 0 && (
                <section className="daily-section cash-section">
                    <h5>
                        BANK AAMAD {formatDailyAmount(report?.cash?.receiptTotal, 0)}
                        {" - "}
                        UDHAARI {formatDailyAmount(report?.cash?.paymentTotal, 0)}
                    </h5>
                    <table className="daily-table">
                        <thead>
                            <tr>
                                <th>Debit Party</th>
                                <th>Credit Party</th>
                                <th>Amount</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashRows.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.debit_party}</td>
                                    <td>{row.credit_party}</td>
                                    <td>{formatDailyAmount(row.amount)}</td>
                                    <td>{row.remarks || row.type1}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            <section className="daily-section">
                <h5>Stock Report</h5>
                <div className="sold-label">&lt;------SOLD------&gt;</div>
                <table className="daily-table stock-table">
                    <thead>
                        <tr>
                            <th>Name of Product</th>
                            <th>Opening Stock</th>
                            <th>Purchase</th>
                            <th>Sales</th>
                            <th>Stock</th>
                            <th>Dip (Ltr)</th>
                            <th>Difference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stockRows.length === 0 && (
                            <tr>
                                <td colSpan="7">No stock data found</td>
                            </tr>
                        )}
                        {stockRows.map((row) => (
                            <tr key={row.product_id}>
                                <td>
                                    <div>{row.product_name}</div>
                                    <strong>
                                        Cash : Q {formatDailyAmount(row.sales)}
                                        {" Amt "}
                                        {formatDailyAmount(row.sales_amount)}
                                    </strong>
                                </td>
                                <td>{formatDailyAmount(row.opening_stock)}</td>
                                <td>{formatDailyAmount(row.purchase)}</td>
                                <td>{formatDailyAmount(row.sales)}</td>
                                <td>{formatDailyAmount(row.stock)}</td>
                                <td>{formatDailyAmount(row.stock)}</td>
                                <td className={toNumber(row.difference) >= 0 ? "positive" : "negative"}>
                                    {formatDailyAmount(row.difference)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default DailyReportPaper;
