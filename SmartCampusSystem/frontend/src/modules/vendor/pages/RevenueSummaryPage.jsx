import { useEffect, useState } from "react";
import { fetchVendorRevenueSummary } from "../services/vendorService";

const RevenueSummaryPage = () => {
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    fetchVendorRevenueSummary().then(setMonthly).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Revenue Summary</h2>
      <div className="card">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Revenue</th>
              <th>Orders</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((row) => (
              <tr key={`${row._id.year}-${row._id.month}`}>
                <td>
                  {row._id.month}/{row._id.year}
                </td>
                <td>Rs. {row.totalRevenue}</td>
                <td>{row.totalOrders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RevenueSummaryPage;
