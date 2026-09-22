import { fetchUsers, updateUserStatus } from "../services/adminService";

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);

  const load = () => fetchUsers().then(setUsers).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (user) => {
    await updateUserStatus(user._id, !user.isActive);
    await load();
  };

  return (
    <div>
      <h2>Manage Users</h2>
      <div className="card">
        <table className="simple-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.isActive ? "active" : "blocked"}</td>
                <td>
                  <button onClick={() => toggleStatus(user)}>{user.isActive ? "Block" : "Unblock"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsersPage;
