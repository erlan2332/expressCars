import React, { useState, useEffect } from "react";
import { API_BASE } from "../config";
import { useNavigate } from "react-router-dom";
import "./AddAdminPage.css";

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/dictionary/filter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${localStorage.getItem("basicCreds")}`,
        },
        body: JSON.stringify({
          page: currentPage,
          size: 10,
        }),
      });

      if (!response.ok) throw new Error("Ошибка загрузки пользователей");
      
      const data = await response.json();
      setUsers(data.content);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/confirm/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${localStorage.getItem("basicCreds")}`,
        },
      });

      if (!response.ok) throw new Error("Ошибка подтверждения пользователя");
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, accepted: true } : user
      ));
      setSuccess(`Пользователь ${userId} успешно подтвержден`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(""), 3000);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  return (
    <div className="add-admin-page">
      <h1>Список пользователей</h1>

      {loading && <p>Загрузка...</p>}

      <div className="user-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Логин</th>
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Подтвержден</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.login}</td>
                <td>{user.name || '-'}</td>
                <td>{user.surname || '-'}</td>
                <td>{user.accepted ? "Да" : "Нет"}</td>
                <td>
                  {!user.accepted && (
                    <button
                      className="primary-btn"
                      onClick={() => handleConfirm(user.id)}
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                    >
                      Подтвердить
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button
          className="outline-btn"
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          Назад
        </button>
        <span>Страница {currentPage + 1} из {totalPages}</span>
        <button
          className="outline-btn"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Вперед
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <button 
        className="outline-btn" 
        onClick={() => navigate(-1)}
        style={{ marginTop: 20 }}
      >
        Назад
      </button>
    </div>
  );
}