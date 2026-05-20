import { describe, it, expect, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: () => null,
  Navigate: () => <div data-testid="navigate-landing" />,
}));

vi.mock('./services/api', () => ({
  verifyToken: vi.fn().mockResolvedValue({ uid: 'test', role: 'USER' }),
}));

describe('App', () => {
  it('exports App component', async () => {
    const mod = await import('./App');
    expect(mod.default).toBeDefined();
  });
});
