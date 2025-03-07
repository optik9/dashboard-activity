import React, { useState, useEffect } from 'react';
import './App.css';

function ClickUp() {
  const [apiKey, setApiKey] = useState('');
  const [teamId, setTeamId] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsersWithTasks = async () => {
    setLoading(true);
    setError('');
    try {
      // Obtener usuarios del equipo
      const usersResponse = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/user`, {
        headers: {
          'Authorization': apiKey
        }
      });
      
      if (!usersResponse.ok) throw new Error('Error obteniendo usuarios');
      const usersData = await usersResponse.json();
      
      // Obtener tareas para cada usuario
      const usersWithTasks = await Promise.all(
        usersData.users.map(async (user) => {
          const tasksResponse = await fetch(
            `https://api.clickup.com/api/v2/team/${teamId}/task?assignees[]=${user.id}`, 
            {
              headers: {
                'Authorization': apiKey
              }
            }
          );
          
          const tasksData = await tasksResponse.json();
          return {
            ...user,
            tasks: tasksData.tasks || []
          };
        })
      );
      
      setUsers(usersWithTasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Usuarios y Tareas ClickUp</h1>
      
      <div className="input-section">
        <input
          type="password"
          placeholder="API Key de ClickUp"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <input
          placeholder="Team ID"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        />
        <button 
          onClick={fetchUsersWithTasks} 
          disabled={!apiKey || !teamId || loading}
        >
          {loading ? 'Cargando...' : 'Mostrar Usuarios'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="users-container">
        {users.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-header">
              <img 
                src={user.profilePicture || 'https://via.placeholder.com/50'} 
                alt="Avatar" 
                className="avatar"
              />
              <div>
                <h2>{user.username}</h2>
                <p>{user.email}</p>
              </div>
            </div>
            
            <div className="tasks-list">
              <h3>Tareas asignadas ({user.tasks.length})</h3>
              {user.tasks.map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-info">
                    <h4>{task.name}</h4>
                    <p>Estado: {task.status?.status || 'Sin estado'}</p>
                    <p>Fecha límite: {task.due_date || 'Sin fecha'}</p>
                  </div>
                  <a 
                    href={task.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="task-link"
                  >
                    Ver en ClickUp
                  </a>
                </div>
              ))}
              {user.tasks.length === 0 && <p>No hay tareas asignadas</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClickUp;