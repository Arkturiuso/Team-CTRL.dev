import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes';
import { getUserRole } from '../../utils/auth';

import levelIcon from '../../../assets/levelIcon.svg';
import levelActiveIcon from '../../../assets/levelActiveIcon.svg';
import bookIcon from '../../../assets/bookIcon.svg';
import bookActiveIcon from '../../../assets/bookActiveIcon.svg';
import starIcon from '../../../assets/starIcon.svg';
import starActiveIcon from '../../../assets/starActiveIcon.svg';
import profileIcon from '../../../assets/profileIcon.svg';
import profileActiveIcon from '../../../assets/profileActiveIcon.svg';
import usersIcon from '../../../assets/profileIcon.svg';
import usersActiveIcon from '../../../assets/profileActiveIcon.svg';

import './Sidebar.less';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Единственный источник роли - JSON пользователя в localStorage (см. utils/auth).
  const role = getUserRole();

  const userMenuItems = [
    { key: 'levels', label: 'Уровни', icon: levelIcon, activeIcon: levelActiveIcon, path: ROUTES.USER.LEVELS },
    { key: 'rating', label: 'Рейтинг', icon: starIcon, activeIcon: starActiveIcon, path: ROUTES.USER.RATING },
    { key: 'profile', label: 'Профиль', icon: profileIcon, activeIcon: profileActiveIcon, path: ROUTES.USER.PROFILE },
    { key: 'knowledge', label: 'База знаний', icon: bookIcon, activeIcon: bookActiveIcon, path: ROUTES.USER.KNOWLEDGE },
    { key: 'attempts', label: 'История попыток', icon: starIcon, activeIcon: starActiveIcon, path: ROUTES.USER.ATTEMPTS },
  ];

  const adminMenuItems = [
    { key: 'admin-levels', label: 'Уровни', icon: levelIcon, activeIcon: levelActiveIcon, path: ROUTES.ADMIN.LEVELS },
    { key: 'admin-knowledge', label: 'База знаний', icon: bookIcon, activeIcon: bookActiveIcon, path: ROUTES.ADMIN.KNOWLEDGE },
    { key: 'admin-users', label: 'Пользователи', icon: usersIcon, activeIcon: usersActiveIcon, path: ROUTES.ADMIN.USERS },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-text">RoboCode</span>
        <span className="sidebar-logo-short">RC</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-item${isActive ? ' sidebar-item--active' : ''}`}
              title={item.label}
              onClick={() => navigate(item.path)}
            >
              <img className="sidebar-icon" src={isActive ? item.activeIcon : item.icon} alt="" />
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-text">{role === 'admin' ? 'Администратор' : 'Игрок'}</span>
        <span className="sidebar-footer-short">{role === 'admin' ? 'Админ' : 'Игрок'}</span>
      </div>
    </aside>
  );
};
