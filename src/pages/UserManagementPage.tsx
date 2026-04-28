import { useEffect, useState, useCallback, useRef } from 'react';
import { getAllUsers, updateUserRole, updateUserEstatus } from '../services/api';
import SimNavbar from '../components/Navbar/Navbar';
import LeftPanel from '../components/Sidebar/LeftPanel';
import RightPanel from '../components/Sidebar/RightPanel';
import { useSimulationSocket } from '../hooks/useSimulationSocket';
import { useChatSocket } from '../hooks/useChatSocket';
import { useHistorySocket } from '../hooks/useHistorySocket';
import './UserManagementPage.css';

export type UserRole = 'USER' | 'ADMIN';
export type Estatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  estatus: Estatus;
  createdAt: string;
}

interface EditedUser {
  role: UserRole;
  estatus: Estatus;
  originalRole: UserRole;
  originalEstatus: Estatus;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [estatusFilter, setEstatusFilter] = useState<Estatus | ''>('');
  const [leftOpen, setLeftOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<EditedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  const simSocket = useSimulationSocket();
  const chatSocket = useChatSocket();
  const historySocket = useHistorySocket();
  void historySocket;

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openModal = useCallback((user: User) => {
    setSelectedUser(user);
    setEditedUser({
      role: user.role,
      estatus: user.estatus,
      originalRole: user.role,
      originalEstatus: user.estatus,
    });
    setModalError('');
  }, []);

  const closeModal = useCallback(() => {
    setSelectedUser(null);
    setEditedUser(null);
    setModalError('');
  }, []);

  const hasChanges = editedUser && (
    editedUser.role !== editedUser.originalRole ||
    editedUser.estatus !== editedUser.originalEstatus
  );

  const handleRoleChange = (newRole: UserRole) => {
    setEditedUser(prev => prev ? { ...prev, role: newRole } : null);
    setModalError('');
  };

  const handleEstatusChange = (newEstatus: Estatus) => {
    setEditedUser(prev => prev ? { ...prev, estatus: newEstatus } : null);
    setModalError('');
  };

  const handleSave = async () => {
    if (!selectedUser || !editedUser) return;
    if (!hasChanges) {
      closeModal();
      return;
    }

    setSaving(true);
    setModalError('');

    try {
      if (editedUser.role !== editedUser.originalRole) {
        await updateUserRole(selectedUser.id, editedUser.role);
      }
      if (editedUser.estatus !== editedUser.originalEstatus) {
        await updateUserEstatus(selectedUser.id, editedUser.estatus);
      }
      
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: editedUser.role, estatus: editedUser.estatus }
          : u
      ));
      
      closeModal();
    } catch {
      setModalError('No se pudieron guardar los cambios. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm('¿Descartar los cambios realizados?')) {
        return;
      }
    }
    closeModal();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedUser) {
        e.preventDefault();
        if (saving) return;
        if (hasChanges) {
          if (window.confirm('¿Descartar los cambios realizados?')) {
            closeModal();
          }
        } else {
          closeModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, hasChanges, saving, closeModal]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedUser && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if (saving) return;
        if (hasChanges) {
          if (window.confirm('¿Descartar los cambios realizados?')) {
            closeModal();
          }
        } else {
          closeModal();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedUser, hasChanges, saving, closeModal]);

  useEffect(() => {
    if (selectedUser && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  }, [selectedUser]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchQuery ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesEstatus = !estatusFilter || user.estatus === estatusFilter;
    return matchesSearch && matchesRole && matchesEstatus;
  });

  const getEstatusLabel = (estatus: Estatus) => {
    switch (estatus) {
      case 'ACTIVE': return 'Activo';
      case 'INACTIVE': return 'Inactivo';
      case 'BLOCKED': return 'Bloqueado';
      default: return estatus;
    }
  };

  return (
    <div className="um-root">
      <SimNavbar simSocket={simSocket} onToggleLeft={() => setLeftOpen((prev) => !prev)} />
      <div className="um-body">
        <LeftPanel simSocket={simSocket} openMobile={leftOpen} onCloseMobile={() => setLeftOpen(false)} />
        <div className="um-users-container">
          <div className="um-header">
            <h1 className="um-title">Gestión de Usuarios</h1>
            <button onClick={loadUsers} className="um-refresh-btn" disabled={loading}>
              {loading ? 'Cargando...' : 'Refresh'}
            </button>
          </div>

          <div className="um-filters">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="um-search-input"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
              className="um-filter-select"
            >
              <option value="">Todos los roles</option>
              <option value="USER">Usuario</option>
              <option value="ADMIN">Administrador</option>
            </select>
            <select
              value={estatusFilter}
              onChange={(e) => setEstatusFilter(e.target.value as Estatus | '')}
              className="um-filter-select"
            >
              <option value="">Todos los estatus</option>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>
          </div>

          {error && (
            <div className="um-alert um-alert--error">
              <span>{error}</span>
              <button onClick={() => setError('')} className="um-alert-close">×</button>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="um-empty">
              <p>No se encontraron usuarios.</p>
              {(searchQuery || roleFilter || estatusFilter) && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('');
                    setEstatusFilter('');
                  }}
                  className="um-empty-btn"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {!loading && filteredUsers.length > 0 && (
            <div className="um-table-container">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estatus</th>
                    <th>Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => openModal(user)}
                      className="um-user-row"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && openModal(user)}
                    >
                      <td>{user.name || '-'}</td>
                      <td>{user.email || '-'}</td>
                      <td>
                        <span className={`um-badge um-badge--role um-badge--${user.role.toLowerCase()}`}>
                          {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td>
                        <span className={`um-badge um-badge--estatus um-badge--${user.estatus.toLowerCase()}`}>
                          {getEstatusLabel(user.estatus)}
                        </span>
                      </td>
                      <td className="um-date">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && users.length > 0 && (
            <div className="um-footer">
              <span className="um-count">
                {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} de {users.length}
              </span>
            </div>
          )}
        </div>
        <RightPanel chatSocket={chatSocket} />
      </div>

      {selectedUser && editedUser && (
        <div className="um-modal-overlay">
          <div className="um-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="um-modal-header">
              <h2 id="modal-title">Editar Usuario</h2>
              <button 
                onClick={handleCancel} 
                className="um-modal-close" 
                aria-label="Cerrar"
                disabled={saving}
              >
                ×
              </button>
            </div>
            
            <div className="um-modal-content">
              <div className="um-modal-section um-modal-section--info">
                <h3>Información</h3>
                <div className="um-detail">
                  <span className="um-detail-label">ID</span>
                  <span className="um-detail-value um-detail-value--mono">{selectedUser.id}</span>
                </div>
                <div className="um-detail">
                  <span className="um-detail-label">Nombre</span>
                  <span className="um-detail-value">{selectedUser.name || '-'}</span>
                </div>
                <div className="um-detail">
                  <span className="um-detail-label">Email</span>
                  <span className="um-detail-value">{selectedUser.email || '-'}</span>
                </div>
                <div className="um-detail">
                  <span className="um-detail-label">Fecha de creación</span>
                  <span className="um-detail-value">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '-'}
                  </span>
                </div>
              </div>

              <div className="um-modal-section um-modal-section--edit">
                <h3>Configuración</h3>
                <div className="um-detail">
                  <label className="um-detail-label" htmlFor="role-select">Rol</label>
                  <select
                    id="role-select"
                    value={editedUser.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="um-modal-select"
                    disabled={saving}
                  >
                    <option value="USER">Usuario</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div className="um-detail">
                  <label className="um-detail-label" htmlFor="estatus-select">Estatus</label>
                  <select
                    id="estatus-select"
                    value={editedUser.estatus}
                    onChange={(e) => handleEstatusChange(e.target.value as Estatus)}
                    className="um-modal-select"
                    disabled={saving}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="BLOCKED">Bloqueado</option>
                  </select>
                </div>
              </div>

              {modalError && (
                <div className="um-modal-error">
                  <span>{modalError}</span>
                </div>
              )}

              {hasChanges && (
                <div className="um-modal-changes">
                  <span>Hay cambios sin guardar</span>
                </div>
              )}
            </div>

            <div className="um-modal-footer">
              <button 
                onClick={handleCancel} 
                className="um-modal-btn um-modal-btn--cancel"
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="um-modal-btn um-modal-btn--save"
                disabled={saving || !hasChanges}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}