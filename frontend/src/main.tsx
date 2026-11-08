import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@radix-ui/themes/styles.css';
import './styles/global.less';
import './styles/adaptive.less';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
