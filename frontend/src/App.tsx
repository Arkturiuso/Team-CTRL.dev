import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ROUTES } from './routes';

const LoginPage = lazy(() => import('./pages/Authorization/index'));

const App = () => (
  <BrowserRouter>
    <Suspense>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={ROUTES.AUTH.LOGIN} replace />}
        />
        <Route path={ROUTES.AUTH.LOGIN} element={<LoginPage />} />
        <Route
          path="*"
          element={<Navigate to={ROUTES.AUTH.LOGIN} replace />}
        />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
