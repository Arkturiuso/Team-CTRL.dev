import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes';

const LoginPage = lazy(() => import('./pages/Authorization/index'));
const RegisterPage = lazy(() => import('./pages/Registration/index'));
const LevelsPage = lazy(() => import('./pages/LevelsPage'));
const LeaderboardPage = lazy(() => import('./pages/Leaderboard'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const LevelPage = lazy(() => import('./pages/LevelPage'));
const KnowledgePage = lazy(() => import('./pages/KnowledgePage'));

const App = () => (
  <BrowserRouter>
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Загрузка...</div>}>
      <Routes>
        <Route path="/auth" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.AUTH.REGISTER} element={<RegisterPage />} />

        <Route path={ROUTES.USER.LEVELS} element={<LevelsPage />} />
        <Route path="/user/levels/:id" element={<LevelPage />} />

        <Route path={ROUTES.USER.RATING} element={<LeaderboardPage />} />
        <Route path={ROUTES.USER.PROFILE} element={<ProfilePage />} />

        <Route path={ROUTES.USER.KNOWLEDGE} element={<KnowledgePage />} />

        <Route path="*" element={<Navigate to={ROUTES.AUTH.LOGIN} replace />} />
        <Route path="/user/knowledge" element={<div style={{padding: 40}}>База знаний (в разработке)</div>} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
