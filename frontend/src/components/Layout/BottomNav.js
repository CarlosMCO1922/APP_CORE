// src/components/Layout/BottomNav.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { 
  FaHome, 
  FaCalendarAlt, 
  FaUserCircle, 
  FaDumbbell, 
  FaListOl,
  FaRegCalendarCheck,
  FaBell,
  FaCog as FaSettings
} from 'react-icons/fa';
import MyAreaModal from './MyAreaModal';
import ManagementModal from './ManagementModal';

const Nav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  padding: 8px 0 max(env(safe-area-inset-bottom), 8px) 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  
  /* Só mostrar em mobile */
  @media (min-width: 769px) {
    display: none;
  }
`;

const NavItem = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  text-decoration: none;
  color: ${({ theme, $isActive }) => 
    $isActive ? theme.colors.primary : theme.colors.textMuted};
  transition: all 0.2s ease;
  min-width: 60px;
  flex: 1;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  
  svg {
    font-size: 1.4rem;
    transition: transform 0.2s ease;
  }
  
  span {
    font-size: 0.7rem;
    font-weight: ${({ $isActive }) => $isActive ? '600' : '400'};
    transition: font-weight 0.2s ease;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NavButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  text-decoration: none;
  background: none;
  border: none;
  color: ${({ theme, $isActive }) => 
    $isActive ? theme.colors.primary : theme.colors.textMuted};
  transition: all 0.2s ease;
  min-width: 60px;
  flex: 1;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  font-family: inherit;
  
  svg {
    font-size: 1.4rem;
    transition: transform 0.2s ease;
  }
  
  span {
    font-size: 0.7rem;
    font-weight: ${({ $isActive }) => $isActive ? '600' : '400'};
    transition: font-weight 0.2s ease;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 4px;
  right: 8px;
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.65rem;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid ${({ theme }) => theme.colors.cardBackground};
`;

function BottomNav() {
  const location = useLocation();
  const { authState } = useAuth();
  const { unreadCount } = useNotifications();
  const { role } = authState;
  const [isMyAreaOpen, setIsMyAreaOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  // Verificar se a rota atual corresponde a uma rota da bottom nav
  const isActiveRoute = (path) => {
    if (path === '/dashboard' || path === '/admin/dashboard') {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Verificar se alguma rota do popup está ativa
  const isMyAreaActive = () => {
    const myAreaRoutes = ['/meu-progresso-detalhado', '/meus-pagamentos', '/definicoes'];
    return myAreaRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
  };

  // Verificar se alguma rota de gestão está ativa
  const isManagementActive = () => {
    const managementRoutes = [
      '/admin/manage-users',
      '/admin/progresso-clientes',
      '/admin/manage-staff',
      '/admin/manage-trainings',
      '/admin/training-series',
      '/admin/manage-appointments',
      '/admin/manage-payments',
      '/admin/manage-exercises',
      '/admin/manage-global-plans'
    ];
    return managementRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
  };

  // Rotas para clientes
  if (role === 'user') {
    const clientNavItems = [
      { 
        path: '/dashboard', 
        icon: FaHome, 
        label: 'Início',
        exact: true,
        isLink: true
      },
      { 
        path: '/calendario', 
        icon: FaCalendarAlt, 
        label: 'Agendar',
        isLink: true
      },
      { 
        path: '/meus-treinos', 
        icon: FaDumbbell, 
        label: 'Treinos',
        isLink: true
      },
      { 
        path: '/explorar-planos', 
        icon: FaListOl, 
        label: 'Planos',
        isLink: true
      },
      { 
        path: 'my-area', 
        icon: FaUserCircle, 
        label: 'Minha área',
        isLink: false
      },
    ];

    return (
      <>
        <Nav>
          {clientNavItems.map(item => {
            const isActive = item.isLink 
              ? (item.exact 
                  ? location.pathname === item.path
                  : isActiveRoute(item.path))
              : isMyAreaActive();
            const Icon = item.icon;
            
            if (item.isLink) {
              return (
                <NavItem 
                  key={item.path} 
                  to={item.path}
                  $isActive={isActive}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavItem>
              );
            } else {
              return (
                <NavButton
                  key={item.path}
                  onClick={() => setIsMyAreaOpen(true)}
                  $isActive={isActive}
                >
                  <Icon />
                  <span>{item.label}</span>
                </NavButton>
              );
            }
          })}
        </Nav>
        <MyAreaModal isOpen={isMyAreaOpen} onClose={() => setIsMyAreaOpen(false)} />
      </>
    );
  }

  // Rotas para staff/admin
  let staffNavItems = [
    { 
      path: '/admin/dashboard', 
      icon: FaHome, 
      label: 'Início',
      exact: true
    },
    { 
      path: '/admin/calendario-geral', 
      icon: FaCalendarAlt, 
      label: 'Calendário'
    },
    { 
      path: '/admin/appointment-requests', 
      icon: FaRegCalendarCheck, 
      label: 'Pedidos'
    },
    { 
      path: '/notificacoes', 
      icon: FaBell, 
      label: 'Notificações',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { 
      path: '/definicoes', 
      icon: FaSettings, 
      label: 'Definições'
    },
  ];

  // Se for admin, substituir Notificações por Gestão (popup)
  if (role === 'admin') {
    // Remover Notificações e Definições
    staffNavItems = staffNavItems.filter(item => 
      item.path !== '/notificacoes' && item.path !== '/definicoes'
    );
    // Adicionar Gestão como popup
    staffNavItems.splice(3, 0, {
      path: 'management',
      icon: FaUserCircle,
      label: 'Gestão',
      isLink: false
    });
  }

  return (
    <>
      <Nav>
        {staffNavItems.map(item => {
          const isActive = item.isLink === false
            ? isManagementActive()
            : (item.exact 
                ? location.pathname === item.path
                : isActiveRoute(item.path));
          const Icon = item.icon;
          
          if (item.isLink === false) {
            return (
              <NavButton
                key={item.path}
                onClick={() => setIsManagementOpen(true)}
                $isActive={isActive}
              >
                <Icon />
                <span>{item.label}</span>
              </NavButton>
            );
          }
          
          return (
            <NavItem 
              key={item.path} 
              to={item.path}
              $isActive={isActive}
            >
              <Icon />
              {item.badge && <Badge>{item.badge > 9 ? '9+' : item.badge}</Badge>}
              <span>{item.label}</span>
            </NavItem>
          );
        })}
      </Nav>
      {role === 'admin' && (
        <ManagementModal isOpen={isManagementOpen} onClose={() => setIsManagementOpen(false)} />
      )}
    </>
  );
}

export default BottomNav;

