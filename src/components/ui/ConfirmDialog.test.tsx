import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const props = {
    open: true,
    title: 'Eliminar usuario',
    message: '¿Estás seguro?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    confirmLabel: 'Eliminar',
    cancelLabel: 'Cancelar',
    ...overrides,
  };
  return { ...render(<ConfirmDialog {...props} />), props };
}

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmDialog open={false} title="" message="" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when open', () => {
    renderDialog();
    expect(screen.getByText('Eliminar usuario')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
  });

  it('renders default labels when not provided', () => {
    render(<ConfirmDialog open title="Test" message="Msg" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('renders custom button labels', () => {
    renderDialog({ confirmLabel: 'Borrar', cancelLabel: 'Volver' });
    expect(screen.getByText('Borrar')).toBeInTheDocument();
    expect(screen.getByText('Volver')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const { props } = renderDialog();
    fireEvent.click(screen.getByText('Eliminar'));
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const { props } = renderDialog();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(props.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when backdrop is clicked', () => {
    const { props } = renderDialog();
    const backdrop = screen.getByRole('presentation');
    fireEvent.click(backdrop);
    expect(props.onCancel).toHaveBeenCalledOnce();
  });

  it('does not call onCancel when clicking inside modal content', () => {
    const { props } = renderDialog();
    const confirmBtn = screen.getByText('Eliminar');
    fireEvent.click(confirmBtn);
    expect(props.onConfirm).toHaveBeenCalledOnce();
    expect(props.onCancel).not.toHaveBeenCalled();
  });

  it('does not listen to Escape (handled by parent)', () => {
    const { props } = renderDialog();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(props.onCancel).not.toHaveBeenCalled();
  });
});
