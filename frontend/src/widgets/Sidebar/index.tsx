import { Flex, Box, Text } from '@radix-ui/themes';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes';

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

interface SidebarProps {
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const role = userRole || localStorage.getItem('userRole') || 'player';

  const userMenuItems = [
    { key: 'levels', label: 'Уровни', icon: levelIcon, activeIcon: levelActiveIcon, path: ROUTES.USER.LEVELS },
    { key: 'rating', label: 'Рейтинг', icon: starIcon, activeIcon: starActiveIcon, path: ROUTES.USER.RATING },
    { key: 'profile', label: 'Профиль', icon: profileIcon, activeIcon: profileActiveIcon, path: ROUTES.USER.PROFILE },
  ];

  const adminMenuItems = [
    { key: 'admin-levels', label: 'Уровни', icon: levelIcon, activeIcon: levelActiveIcon, path: ROUTES.ADMIN.LEVELS },
    { key: 'admin-knowledge', label: 'База знаний', icon: bookIcon, activeIcon: bookActiveIcon, path: ROUTES.ADMIN.KNOWLEDGE },
    { key: 'admin-users', label: 'Пользователи', icon: usersIcon, activeIcon: usersActiveIcon, path: ROUTES.ADMIN.USERS },
  ];

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <Box
      style={{
        width: '280px',
        height: '100vh',
        background: '#F3F4F6',
        padding: '40px 24px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '2px solid #E5E7EB',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
      }}
    >
      <Flex align="center" style={{ marginBottom: '32px', paddingLeft: '16px' }}>
        <Text size="6" weight="bold" style={{ color: '#111827', fontSize: '24px' }}>
          RoboCode
        </Text>
      </Flex>

      <Flex direction="column" style={{ flex: 1, gap: '12px' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Flex
              key={item.key}
              align="center"
              onClick={() => navigate(item.path)}
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isActive ? '#BFDBFE' : 'transparent',
                color: isActive ? '#1E40AF' : '#4B5563',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s ease',
                gap: '16px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = '#E5E7EB';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <img
                src={isActive ? item.activeIcon : item.icon}
                alt={item.label}
                style={{ width: '24px', height: '24px', flexShrink: 0 }}
              />
              <Text size="3">{item.label}</Text>
            </Flex>
          );
        })}
      </Flex>

      <Box style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
        <Text size="2" color="gray" style={{ display: 'block', textAlign: 'center' }}>
          {role === 'admin' ? 'Администратор' : 'Игрок'}
        </Text>
      </Box>
    </Box>
  );
};
