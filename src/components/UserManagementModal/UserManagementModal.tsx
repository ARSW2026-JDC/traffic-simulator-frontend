import { useEffect, useState, useCallback, useRef } from 'react';
import { getAllUsers, updateUserRole, updateUserEstatus } from '../../services/api';
import './UserManagementModal.css';

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

interface Props {
  onClose: () => void;
}

export default function UserManagementModal({ onClose }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [estatusFilter, setEstatusFilter] = useState<Estatus | ''>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedUser, setEditedUser] = useState<EditedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

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

  const openEditModal = useCallback((user: User) => {
    setSelectedUser(user);
    setEditedUser({
      role: user.role,
      estatus: user.estatus,
      originalRole: user.role,
      originalEstatus: user.estatus,
    });
    setModalError('');
  }, []);

  const closeEditModal = useCallback(() => {
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
      closeEditModal();
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
      
      closeEditModal();
    } catch {
      setModalError('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (!window.confirm('¿Descartar los cambios?')) {
        return;
      }
    }
    closeEditModal();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (saving) return;
        if (selectedUser) {
          if (hasChanges) {
            if (window.confirm('¿Descartar los cambios?')) {
              closeEditModal();
            }
          } else {
            closeEditModal();
          }
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, hasChanges, saving, closeEditModal, onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedUser && modalRef.current && !modalRef.current.contains(e.target as Node)) {
        if (saving) return;
        if (hasChanges) {
          if (window.confirm('¿Descartar los cambios?')) {
            closeEditModal();
          }
        } else {
          closeEditModal();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedUser, hasChanges, saving, closeEditModal]);

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
    <div className="umm-overlay">
      <div className="umm-popup" ref={modalRef}>
        <div className="umm-header">
          <h2>Gestión de Usuarios</h2>
          <button onClick={onClose} className="umm-close" aria-label="Cerrar">×</button>
        </div>

        <div className="umm-filters">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="umm-search"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            className="umm-filter"
          >
            <option value="">Rol</option>
            <option value="USER">Usuario</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={estatusFilter}
            onChange={(e) => setEstatusFilter(e.target.value as Estatus | '')}
            className="umm-filter"
          >
            <option value="">Estado</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
            <option value="BLOCKED">Bloqueado</option>
          </select>
        </div>

        {error && <div className="umm-error">{error}</div>}

        {loading ? (
          <div className="umm-loading">Cargando...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="umm-empty">Sin usuarios</div>
        ) : (
          <div className="umm-list">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => openEditModal(user)}
                className="umm-user-row"
              >
                <div className="umm-user-info">
                  <span className="umm-user-name">{user.name || '-'}</span>
                  <span className="umm-user-email">{user.email || '-'}</span>
                </div>
                <div className="umm-user-badges">
                  <span className={`umm-badge umm-badge--${user.role.toLowerCase()}`}>
                    {user.role === 'ADMIN' ? 'Admin' : 'User'}
                  </span>
                  <span className={`umm-badge umm-badge--estatus umm-badge--${user.estatus.toLowerCase()}`}>
                    {getEstatusLabel(user.estatus)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <div className="umm-footer">
            {filteredUsers.length} / {users.length}
          </div>
        )}
      </div>

      {selectedUser && editedUser && (
        <div className="umm-edit-overlay">
          <div className="umm-edit-modal">
            <div className="umm-edit-header">
              <h3>Editar</h3>
              <button onClick={handleCancel} className="umm-edit-close" disabled={saving}>×</button>
            </div>
            
            <div className="umm-edit-content">
              <div className="umm-edit-info">
                <div className="umm-edit-field">
                  <span className="umm-label">Nombre</span>
                  <span className="umm-value">{selectedUser.name || '-'}</span>
                </div>
                <div className="umm-edit-field">
                  <span className="umm-label">Email</span>
                  <span className="umm-value">{selectedUser.email || '-'}</span>
                </div>
              </div>

              <div className="umm-edit-fields">
                <div className="umm-edit-field">
                  <label>Rol</label>
                  <select
                    value={editedUser.role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    disabled={saving}
                  >
                    <option value="USER">Usuario</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div className="umm-edit-field">
                  <label>Estado</label>
                  <select
                    value={editedUser.estatus}
                    onChange={(e) => handleEstatusChange(e.target.value as Estatus)}
                    disabled={saving}
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                    <option value="BLOCKED">Bloqueado</option>
                  </select>
                </div>
              </div>

              {modalError && <div className="umm-edit-error">{modalError}</div>}

              {hasChanges && <div className="umm-edit-changes">Sin guardar</div>}
            </div>

            <div className="umm-edit-footer">
              <button 
                onClick={handleCancel} 
                className="umm-btn umm-btn--cancel"
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave} 
                className="umm-btn umm-btn--save"
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