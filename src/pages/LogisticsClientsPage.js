import React, { useEffect, useState, useMemo } from "react";
import { API_BASE } from "../config";
import "./LogisticsClientsPage.css";

function LogisticsClientsPage() {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "status",
    direction: "asc",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchStatuses();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const creds = localStorage.getItem("basicCreds") || "";
      const resp = await fetch(`${API_BASE}/api/orders/filtered`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${creds}`,
        },
        body: JSON.stringify({ page: 0, size: 100 }),
      });

      if (!resp.ok) throw new Error(`Ошибка загрузки: ${resp.status}`);

      const result = await resp.json();
      if (Array.isArray(result)) {
        setOrders(result);
      } else if (result && Array.isArray(result.content)) {
        setOrders(result.content);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatuses() {
    try {
      const creds = localStorage.getItem("basicCreds") || "";
      const resp = await fetch(`${API_BASE}/api/dictionary/statuses`, {
        headers: { Authorization: `Basic ${creds}` },
      });
      if (!resp.ok) throw new Error("Ошибка загрузки статусов");
      const data = await resp.json();
      setStatuses(data);
    } catch (err) {
      setError(err.message);
    }
  }

  const sortedOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return [...orders].sort((a, b) => {
      const statusA = a.status?.name || "";
      const statusB = b.status?.name || "";
      return sortConfig.direction === "asc"
        ? statusA.localeCompare(statusB)
        : statusB.localeCompare(statusA);
    });
  }, [orders, sortConfig]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(sortedOrders)) return [];
    if (!search) return sortedOrders;
    return sortedOrders.filter(order =>
      Object.values(order).some(value =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [sortedOrders, search]);

  const handleSort = () => {
    setSortConfig(prev => ({
      key: "status",
      direction: prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusChange = order => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const updateOrderStatus = async statusId => {
    try {
      setError("");
      const creds = localStorage.getItem("basicCreds") || "";
      const resp = await fetch(
        `${API_BASE}/api/orders/${selectedOrder.id}/status/${statusId}`,
        {
          method: "PUT",
          headers: { Authorization: `Basic ${creds}` },
        }
      );
      if (!resp.ok) throw new Error(`Ошибка обновления: ${resp.status}`);
      await fetchOrders();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="logistics-clients-page">
      <h1>Управление заказами</h1>

      {showModal && selectedOrder && (
  <div className="modal-overlay">
    <div className="status-modal">
      <div className="modal-header">
        <h3>Код заказа #{selectedOrder.orderCode}</h3>
      </div>
      <div className="modal-body">
        <p>
          <strong>Имя:</strong>{" "}
          {`${selectedOrder.customer?.surname || ""} ${selectedOrder.customer?.name || ""} ${selectedOrder.customer?.patronomic || ""}`.trim() || "Не указан"}
        </p>
        <p>
          <strong>Контакты:</strong>{" "}
          {selectedOrder.customer?.phoneNumber
            ? selectedOrder.customer.phoneNumber
            : "Не указаны"}
        </p>
      </div>
      {/* === КОРРЕКТНЫЙ БЛОК === */}
      <div className="status-list-section">
        <p className="status-list-title">Изменить статус:</p>
        <div className="status-list">
          {statuses.map(status => (
            <button
              key={status.id}
              className="status-item"
              onClick={() => updateOrderStatus(status.id)}
            >
              {status.name}
            </button>
          ))}
        </div>
      </div>
      {/* === КОНЕЦ БЛОКА === */}
      <button className="modal-close" onClick={() => setShowModal(false)}>
        Закрыть
      </button>
    </div>
  </div>
)}


      <div className="controls">
        <input
          type="text"
          placeholder="Поиск по заказам..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loader">Загрузка данных...</div>}

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Код заказа</th>
              <th>Имя</th>
              <th>Контакты</th>
              <th className="sortable-header" onClick={handleSort}>
                Статус {sortConfig.direction === "asc" ? "↑" : "↓"}
              </th>
              <th>Изменить статус</th>
              <th>Машины</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr key={order.id}>
                <td className="num_count">{index + 1}</td>
                <td className="code_order">{order.orderCode || "Без кода"}</td>
                <td className="eraera">
                  {`${order.customer?.surname || ""} ${order.customer?.name || ""} ${order.customer?.patronomic || ""}`.trim() || "Не указан"}
                </td>
                <td className="contactcontact">
                  {order.customer?.phoneNumber
                    ? ` ${order.customer.phoneNumber}`
                    : "Не указаны"}
                </td>
                <td>
                  <span
                    className={`status-badge ${
                      order.status?.name?.toLowerCase() || "default"
                    }`}
                  >
                    {order.status?.name || "Не указан"}
                  </span>
                </td>
                <td className="ertertert">
                  <button
                    className="change-status-btn"
                    onClick={() => handleStatusChange(order)}
                  >
                    Изменить
                  </button>
                </td>
                <td>
                  <div className="autos-list">
                    {order.orderItems && order.orderItems.length > 0 ? (
                      order.orderItems.map((item, i) => (
                        <div key={i} className="auto-item">
                          ID машины: {item.auto?.id || "Не указан"}
                        </div>
                      ))
                    ) : (
                      "Нет машин"
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogisticsClientsPage;
