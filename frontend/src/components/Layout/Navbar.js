// src/components/Layout/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  FaTachometerAlt, FaCalendarAlt, FaClipboardList, FaUsers,
  FaUserTie, FaDumbbell, FaCalendarCheck, FaMoneyBillWave,
  FaCog, FaSignOutAlt, FaBars, FaTimes,
  FaBell, FaEnvelopeOpen, FaCheckDouble,
  FaListOl, 
  FaCalendarPlus 
} from 'react-icons/fa';
import { theme } from '../../theme';

// --- Styled Components ---
const Nav = styled.nav`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
  min-height: 60px;
  width: 100%;
  box-sizing: border-box;
`;

const NavLogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
`;

const LogoImage = styled.img`
  height: 35px;
  width: auto;
  margin-right: 0.5rem;
`;

const LogoText = styled.span`
  font-size: 1.4rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
  @media (max-width: 768px) {
    display: none;
  }
`;

const DesktopNavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem; 
  flex-grow: 1; 
  justify-content: flex-end; 
  min-width: 0; 

  @media (max-width: 992px) {
    display: none;
  }
`;

const NavItem = styled.div`
  flex-shrink: 0;
`;

const NavLinkStyled = styled(Link)`
  color: ${({ theme }) => theme.colors.textMain};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  position: relative;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 6px;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background-color: #333333;
  }
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textMain};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary || theme.colors.background};
  }
`;

const UserInfo = styled.span`
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px; 
  flex-shrink: 1; 
  padding: 0.5rem 0; 
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
  flex-shrink: 0;
`;

const DropdownButton = styled.button`
  color: ${({ theme }) => theme.colors.textMain};
  background-color: transparent;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 6px;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:hover, &.active {
    color: ${({ theme }) => theme.colors.primary};
    background-color: #333333;
  }
`;

const DropdownContent = styled.div`
  display: ${props => (props.$isOpen ? 'block' : 'none')};
  position: absolute;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  min-width: 240px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.3);
  z-index: 1001;
  border-radius: 8px;
  right: 0;
  top: calc(100% + 5px);
  border: 1px solid ${({ theme }) => theme.colors.cardBorder || '#4A4A4A'};
  padding: 0.5rem 0;
`;

const DropdownLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMain};
  padding: 10px 20px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  white-space: nowrap;

  &:hover {
    background-color: #333333;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const HamburgerIcon = styled.div`
  display: none;
  font-size: 1.8rem;
  color: ${({ theme }) => theme.colors.textMain};
  cursor: pointer;
  margin-left: auto;
  padding: 0.5rem;

  @media (max-width: 992px) {
    display: block;
  }
`;

const MobileMenuOverlay = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  position: fixed;
  top: 60px; 
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1rem 0;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  z-index: 999;
  overflow-y: auto;
  transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease-in-out;

  ${NavLinkStyled}, ${DropdownButton}, ${LogoutButton} {
    width: calc(100% - 2rem);
    margin: 0.5rem 1rem;
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder || '#4A4A4A'};
    border-radius: 0;
    
    &:last-child {
      border-bottom: none;
    }
  }
  ${DropdownContainer} {
    width: calc(100% - 2rem);
    margin: 0.5rem 1rem;
  }
  ${DropdownButton} {
    width: 100%;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder || '#4A4A4A'};
  }
  ${DropdownContent} {
    position: static;
    width: 100%;
    box-shadow: none;
    border: none;
    border-top: 1px dashed #555;
    padding-left: 1rem;
    background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || '#2a2a2a'};
  }

  @media (min-width: 993px) {
    display: none;
  }
`;

const NotificationBellContainer = styled.div`
  position: relative;
  margin-left: 1rem;
  margin-right: 1rem;
  @media (max-width: 992px) {
    margin-left: 0; 
  }
`;

const BellIcon = styled(FaBell)`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.textMain};
  cursor: pointer;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const UnreadBadge = styled.span`
  position: absolute;
  top: -5px;
  right: -8px;
  background-color: ${({ theme }) => theme.colors.error || 'red'};
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.7rem;
  font-weight: bold;
  pointer-events: none;
  border: 1px solid ${({ theme }) => theme.colors.cardBackground};
`;

const NotificationsDropdownContent = styled.div`
  display: ${props => (props.$isOpen ? 'block' : 'none')};
  position: absolute;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  min-width: 300px;
  max-width: 350px;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.3);
  z-index: 1001;
  border-radius: 8px;
  right: 0;
  top: calc(100% + 10px);
  border: 1px solid ${({ theme }) => theme.colors.cardBorder || '#4A4A4A'};
  color: ${({ theme }) => theme.colors.textMain};

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #333; border-radius: 3px; }
  &::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: #666; }
`;

const NotificationHeader = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder || '#4A4A4A'};
  display: flex;
  justify-content: space-between;
  align-items: center;

  h4 {
    margin: 0;
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const MarkAllReadButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.8rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  &:disabled {
    color: #666;
    cursor: not-allowed;
  }
`;

const NotificationItemStyled = styled.div`
  padding: 12px 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder || '#4A4A4A'};
  cursor: pointer;
  background-color: ${props => props.$isRead ? 'transparent' : (props.theme.colors.cardBackgroundDarker || '#3a3a3a')};
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #333333;
  }

  p {
    margin: 0 0 5px 0;
    font-size: 0.85rem;
    line-height: 1.4;
    white-space: normal;
  }

  small {
    font-size: 0.7rem;
    color: #888;
  }
`;

const ViewAllNotificationsLink = styled(Link)`
  display: block;
  text-align: center;
  padding: 10px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder || '#4A4A4A'};
  &:hover {
    background-color: #333333;
  }
`;

// --- Lógica do Componente ---
function Navbar() {
  const { authState, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    isLoading: notificationsLoading,
    totalNotifications 
  } = useNotifications();

  const navigate = useNavigate();
  const [managementDropdownOpen, setManagementDropdownOpen] = useState(false);
  const [notificationsDropdownOpen, setNotificationsDropdownOpen] = useState(false);

  const managementDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    closeAllMenus();
    navigate('/login');
  };

  const closeAllMenus = () => {
    setManagementDropdownOpen(false);
    setNotificationsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (managementDropdownRef.current && !managementDropdownRef.current.contains(event.target)) {
        setManagementDropdownOpen(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
        setNotificationsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) { 
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    closeAllMenus();
  };

  const handleMarkAllReadClick = async () => {
    await markAllNotificationsAsRead();
  };

  const handleNavigateAndCloseMenus = () => { 
      closeAllMenus();
  }

  if (!authState.isAuthenticated) {
    return null;
  }

  const isUserClient = authState.role === 'user';
  const isStaffGeneral = authState.role && authState.role !== 'user';
  const isAdminStrict = authState.role === 'admin'; 

  const commonClientLinksJsx = (
    <>
      <NavItem><NavLinkStyled to="/dashboard" onClick={handleNavigateAndCloseMenus}><FaTachometerAlt /> Painel</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/calendario" onClick={handleNavigateAndCloseMenus}><FaCalendarAlt /> Calendário</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/meu-progresso" onClick={handleNavigateAndCloseMenus}><FaClipboardList /> Meu Progresso</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/meus-pagamentos" onClick={handleNavigateAndCloseMenus}><FaMoneyBillWave /> Pagamentos</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/definicoes" onClick={handleNavigateAndCloseMenus}><FaCog /> Definições</NavLinkStyled></NavItem>
    </>
  );

  const commonStaffLinksJsx = (
    <>
      <NavItem><NavLinkStyled to="/admin/dashboard" onClick={handleNavigateAndCloseMenus}><FaTachometerAlt /> Painel Staff</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/admin/calendario-geral" onClick={handleNavigateAndCloseMenus}><FaCalendarAlt /> Calendário</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/admin/appointment-requests" onClick={handleNavigateAndCloseMenus}><FaClipboardList /> Pedidos</NavLinkStyled></NavItem>
    </>
  );

  const adminManagementDropdownJsx = (
    <DropdownContainer ref={managementDropdownRef}>
      <DropdownButton
        onClick={() => setManagementDropdownOpen(prev => !prev)}
        className={managementDropdownOpen ? 'active' : ''}
      >
        <FaCog /> Gestão {managementDropdownOpen ? '▴' : '▾'}
      </DropdownButton>
      <DropdownContent $isOpen={managementDropdownOpen}>
        <DropdownLink to="/admin/manage-users" onClick={handleNavigateAndCloseMenus}><FaUsers /> Clientes</DropdownLink>
        <DropdownLink to="/admin/manage-staff" onClick={handleNavigateAndCloseMenus}><FaUserTie /> Equipa</DropdownLink>
        <DropdownLink to="/admin/manage-trainings" onClick={handleNavigateAndCloseMenus}><FaDumbbell /> Treinos Individuais</DropdownLink>
        <DropdownLink to="/admin/training-series" onClick={handleNavigateAndCloseMenus}><FaCalendarPlus /> Séries de Treinos</DropdownLink> 
        <DropdownLink to="/admin/manage-appointments" onClick={handleNavigateAndCloseMenus}><FaCalendarCheck /> Consultas</DropdownLink>
        <DropdownLink to="/admin/manage-payments" onClick={handleNavigateAndCloseMenus}><FaMoneyBillWave /> Pagamentos</DropdownLink>
        <DropdownLink to="/admin/manage-exercises" onClick={handleNavigateAndCloseMenus}><FaListOl /> Exercícios Base</DropdownLink>
        <DropdownLink to="/admin/manage-global-plans" onClick={handleNavigateAndCloseMenus}><FaClipboardList /> Planos de Treino Modelo</DropdownLink>
      </DropdownContent>
    </DropdownContainer>
  );

  const notificationBellJsx = (
    <NotificationBellContainer ref={notificationsDropdownRef}>
      <BellIcon onClick={() => setNotificationsDropdownOpen(prev => !prev)} />
      {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
      <NotificationsDropdownContent $isOpen={notificationsDropdownOpen}>
        <NotificationHeader>
          <h4>Notificações</h4>
          <MarkAllReadButton onClick={handleMarkAllReadClick} disabled={unreadCount === 0 || notificationsLoading}>
            <FaCheckDouble /> Marcar todas como lidas
          </MarkAllReadButton>
        </NotificationHeader>
        {notificationsLoading && notifications.length === 0 && <p style={{padding: '10px', textAlign: 'center', fontSize: '0.8rem'}}>A carregar...</p>}
        {!notificationsLoading && notifications.length === 0 && <p style={{padding: '10px', textAlign: 'center', fontSize: '0.8rem'}}>Não há notificações.</p>}
        {notifications.slice(0, 7).map(notif => (
          <NotificationItemStyled
            key={notif.id}
            $isRead={notif.isRead}
            onClick={() => handleNotificationClick(notif)}
            title={notif.isRead ? "Lida" : "Não lida"}
          >
            <p>{notif.message}</p>
            <small>{new Date(notif.createdAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</small>
          </NotificationItemStyled>
        ))}
        {notifications.length > 0 && (
            <ViewAllNotificationsLink
                to="/notificacoes"
                onClick={() => {
                    setNotificationsDropdownOpen(false); 
                    setIsMobileMenuOpen(false); 
                }}
            >
              Ver todas as notificações ({totalNotifications}) 
            </ViewAllNotificationsLink>
        )}
      </NotificationsDropdownContent>
    </NotificationBellContainer>
  );

  return (
    <>
      <Nav>
        <NavLogoLink to={isUserClient ? "/dashboard" : "/admin/dashboard"} onClick={handleNavigateAndCloseMenus}>
          <LogoImage src="/logo_core.png" alt="CORE Logo" />
          <LogoText>CORE</LogoText>
        </NavLogoLink>

        <DesktopNavLinks>
          {authState.user && (
            <NavItem><UserInfo>Olá, {authState.user.firstName}!</UserInfo></NavItem>
          )}
          {isUserClient && commonClientLinksJsx}
          {isStaffGeneral && !isAdminStrict && commonStaffLinksJsx}
          {isAdminStrict && (
            <>
              {commonStaffLinksJsx}
              <NavItem>{adminManagementDropdownJsx}</NavItem>
            </>
          )}
          <NavItem>{notificationBellJsx}</NavItem>
          <NavItem><LogoutButton onClick={handleLogout}><FaSignOutAlt /> Logout</LogoutButton></NavItem>
        </DesktopNavLinks>

        <HamburgerIcon onClick={() => setIsMobileMenuOpen(prev => !prev)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </HamburgerIcon>
      </Nav>

      <MobileMenuOverlay $isOpen={isMobileMenuOpen}>
        <div style={{padding: '1rem', borderBottom: '1px solid #4A4A4A', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            {authState.user && (
                <UserInfo style={{marginRight: 'auto', maxWidth: 'none' }}> 
                    Olá, {authState.user.firstName}!
                </UserInfo>
            )}
            {React.cloneElement(notificationBellJsx, { key: "notification-mobile-bell"})} 
        </div>

        {isUserClient && commonClientLinksJsx}
        {isStaffGeneral && !isAdminStrict && commonStaffLinksJsx}
        {isAdminStrict && (
          <>
            {commonStaffLinksJsx}
            {React.cloneElement(adminManagementDropdownJsx, { key: "admin-mobile-dropdown"})} 
          </>
        )}
        <LogoutButton onClick={handleLogout} style={{ justifyContent: 'center'}}>
          <FaSignOutAlt /> Logout
        </LogoutButton>
      </MobileMenuOverlay>
    </>
  );
}

export default Navbar;