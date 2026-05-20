import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagementModal from './UserManagementModal';
import { useAuthStore } from '../../stores/authStore';

vi.mock('../../services/api', () => ({
  getAllUsers: vi.fn().mockResolvedValue([
    { id: 'user-1', email: 'user1@test.com', name: 'User One', role: 'USER', estatus: 'ACTIVO' },
  ]),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  updateUserEstatus: vi.fn().mockResolvedValue(undefined),
  deleteUser: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  useAuthStore.getState().setUser({ id: 'admin-1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN', createdAt: new Date().toISOString() });
});

describe('UserManagementModal', () => {
  it('renders the modal with title', async () => {
    render(<UserManagementModal onClose={vi.fn()} />);
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
  });

  it('shows loading spinner while fetching users', () => {
    render(<UserManagementModal onClose={vi.fn()} />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<UserManagementModal onClose={vi.fn()} />);
    expect(screen.getByLabelText('Cerrar')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<UserManagementModal onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(onClose).toHaveBeenCalled();
  });
});
