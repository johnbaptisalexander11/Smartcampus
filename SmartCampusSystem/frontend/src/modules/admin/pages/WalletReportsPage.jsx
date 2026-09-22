import { useEffect, useState } from "react";
import { fetchWalletReports } from "../services/adminService";

const WalletReportsPage = () => {
  const [totals, setTotals] = useState([]);

  useEffect(() => {
    fetchWalletReports().then(setTotals).catch(() => {});
  }, []);

  return (
    <div>
      <h2>Wallet Reports</h2>
      <div className="card">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Total Amount</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((row) => (
              <tr key={row._id}>
                <td>{row._id}</td>
                <td>Rs. {row.totalAmount}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WalletReportsPage;
