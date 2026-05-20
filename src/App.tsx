import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import AuthPage from './pages/AuthPage';
import SimulationPage from './pages/SimulationPage';
import LandingPage from './pages/LandingPage';
import LoadingScreen from './components/ui/LoadingScreen';
import { verifyToken } from './services/api';
import { User } from 'firebase/auth/cordova';

export default function App() {
  const { firebaseUser, user, setFirebaseUser, setUser, setLoading, isLoading } = useAuthStore();
  const initializeTheme = useThemeStore((s) => s.initializeTheme);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser: User | null) => {
      setLoading(true);
      if (fbUser) {
        const token = await fbUser.getIdToken();
        setFirebaseUser(fbUser, token);
        try {
          const profile = await verifyToken(token);
          setUser(profile);
        } catch {
          setUser(null);
          setFirebaseUser(null, null);
          try {
            await signOut(auth);
          } catch {
            // Ignore remote sign-out failures.
          }
        }
      } else {
        setFirebaseUser(null, null);
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  let content;
  if (isLoading) {
    content = <LoadingScreen />;
  } else if (firebaseUser && user) {
    content = <SimulationPage />;
  } else {
    content = <Navigate to="/landing" replace />;
  }

  return (
    <BrowserRouter>
<Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={content} />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
