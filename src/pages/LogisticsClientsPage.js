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
      setOrders(result.content);
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
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const statusA = a.status?.name || "";
      const statusB = b.status?.name || "";
      return sortConfig.direction === "asc"
        ? statusA.localeCompare(statusB)
        : statusB.localeCompare(statusA);
    });
  }, [orders, sortConfig]);

  const filteredOrders = useMemo(() => {
    return sortedOrders.filter((order) =>
      Object.values(order).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [sortedOrders, search]);

  const handleSort = () => {
    setSortConfig((prev) => ({
      key: "status",
      direction: prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusChange = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const updateOrderStatus = async (statusId) => {
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

  const formatAutoInfo = (auto) => {
    return `${auto.brand?.name || "Не указан"} ${auto.model?.name || ""}`;
  };

  return (
    <div className="logistics-clients-page">
      <h1>Управление заказами</h1>

      {showModal && (
        <div className="modal-overlay">
          <div className="status-modal">
            <h3>Изменить статус заказа #{selectedOrder?.orderCode}</h3>
            <div className="status-list">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  className="status-item"
                  onClick={() => updateOrderStatus(status.id)}
                >
                  {status.name}
                </button>
              ))}
            </div>
            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
            >
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
          onChange={(e) => setSearch(e.target.value)}
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
              <th>ID заказа</th>
              <th>Автомобиль</th>
              <th className="sortable-header" onClick={handleSort}>
                Статус {sortConfig.direction === "asc" ? "↑" : "↓"}
              </th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr key={order.id}>
                <td>{index + 1}</td>
                <td>{order.orderCode || "Без кода"}</td>
                <td className="order-id">{order.id}</td>
                <td>
                  <div className="autos-list">
                    {order.autos?.map((auto, i) => (
                      <div key={i} className="auto-item">
                        {formatAutoInfo(auto)} (VIN: {auto.vin})
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${order.status?.name?.toLowerCase() || "default"}`}>
                    {order.status?.name || "Не указан"}
                  </span>
                </td>
                <td>
                  <button
                    className="change-status-btn"
                    onClick={() => handleStatusChange(order)}
                  >
                    Изменить
                  </button>
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