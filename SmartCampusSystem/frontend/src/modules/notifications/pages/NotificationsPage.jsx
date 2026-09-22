import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/api";

const NOTIFICATIONS_LAST_SEEN_KEY = "student_notifications_last_seen";

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [lastSeenAt, setLastSeenAt] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(NOTIFICATIONS_LAST_SEEN_KEY);
    setLastSeenAt(stored ? Number(stored) || 0 : 0);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const [menuRes, groupsRes, walletRes] = await Promise.all([
          api.get("/food-ordering/menu"),
          api.get("/group-study"),
          api.get("/wallet/notifications"),
        ]);

        const menuItems = (menuRes.data?.data?.items || []).map((item) => ({
          id: `food-${item._id}`,
          type: "food",
          title: `New food added: ${item.name}`,
          subtitle: item.canteen || "Canteen",
          createdAt: item.createdAt ? new Date(item.createdAt).getTime() : 0,
          link: "/student/menu",
        }));

        const groupItems = (groupsRes.data?.data?.groups || []).map((group) => ({
          id: `group-${group._id}`,
          type: "group",
          title: `New group opened: ${group.name}`,
          subtitle: group.subject || "Group Study",
          createdAt: group.createdAt ? new Date(group.createdAt).getTime() : 0,
          link: `/student/group-study/${group._id}`,
        }));

        const walletItems = (walletRes.data?.data?.notifications || []).map((notification) => ({
          id: `wallet-${notification._id}`,
          type: "wallet",
          title: notification.title || "Wallet update",
          subtitle: notification.message || "Wallet notification",
          createdAt: notification.createdAt ? new Date(notification.createdAt).getTime() : 0,
          link: "/student/wallet",
          read: Boolean(notification.read),
        }));

        const orderItems = (walletRes.data?.data?.notifications || [])
          .filter((notification) => notification.type === "order")
          .map((notification) => ({
            id: `order-${notification._id}`,
            type: "order",
            title: notification.title || "Order update",
            subtitle: notification.message || "Your order was placed",
            createdAt: notification.createdAt ? new Date(notification.createdAt).getTime() : 0,
            link: notification.meta?.orderId ? `/student/orders/${notification.meta.orderId}` : "/student/orders",
            read: Boolean(notification.read),
          }));

        const merged = [...menuItems, ...groupItems, ...walletItems.filter((item) => item.type !== "order"), ...orderItems]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 100);

        setItems(merged);
        localStorage.setItem(NOTIFICATIONS_LAST_SEEN_KEY, String(Date.now()));
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Could not load notifications");
      }
    };

    loadNotifications();
  }, []);

  const hasAny = items.length > 0;

  const grouped = useMemo(() => {
    return items.map((entry) => ({
      ...entry,
      isNew: entry.createdAt > lastSeenAt,
      timeLabel: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "Unknown time",
    }));
  }, [items, lastSeenAt]);

  return (
    <div className="nf-page">
      <div className="nf-header">
        <h2>All Notifications</h2>
        <p>Food, study groups, and wallet updates in one place.</p>
      </div>

      {error && <p className="nf-error">{error}</p>}

      {!hasAny && !error ? (
        <div className="nf-empty">
          <p>No notifications right now.</p>
        </div>
      ) : (
        <div className="nf-list">
          {grouped.map((entry) => (
            <Link key={entry.id} to={entry.link} className="nf-item">
              <div className="nf-item-top">
                <span className={`nf-type nf-type--${entry.type}`}>
                  {entry.type === "food" ? "Food" : entry.type === "group" ? "Group Study" : entry.type === "order" ? "Order" : "Wallet"}
                </span>
                {entry.isNew && <span className="nf-new">NEW</span>}
              </div>
              <h4 className="nf-title">{entry.title}</h4>
              <p className="nf-sub">{entry.subtitle}</p>
              <span className="nf-time">{entry.timeLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
