// src/components/Layout/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { FaHome,
  FaTachometerAlt, FaCalendarAlt, FaClipboardList, FaUsers,
  FaUserTie, FaDumbbell, FaCalendarCheck, FaMoneyBillWave,
  FaCog, FaSignOutAlt, FaBars, FaTimes, FaBell, FaCheckDouble,
  FaListOl, FaCalendarPlus, FaUserCircle, FaRegCalendarCheck, FaTrophy, FaChartLine,
  FaExclamationTriangle, FaShieldAlt
} from 'react-icons/fa';
import ThemeToggler from '../Theme/ThemeToggler';
import moment from 'moment';

const Nav = styled.nav`
  background-color: ${({ theme }) => theme.colors.background};
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 1000;
  
  /* Esconder Navbar completa em mobile (será substituída por BottomNav) */
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
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
  @media (max-width: 768px) { display: none; }
`;

const DesktopNavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-grow: 1;
  @media (max-width: 1024px) { display: none; }
`;

const NavItem = styled.div`
  position: relative;
`;

const NavLinkStyled = styled(Link)`
  color: ${({ theme }) => theme.colors.textMain};
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  min-height: 44px; /* Touch target mínimo para mobile */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 6px;
  white-space: nowrap;
  transition: all 0.2s ease-in-out;
  -webkit-tap-highlight-color: transparent;
  &:hover {
    color: ${({ theme }) => theme.colors.textButton};
    background-color: ${({ theme }) => theme.colors.primary};
  }
  @media (max-width: 768px) {
    min-height: 48px;
    padding: 0.75rem 1rem;
  }
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: ${({ theme }) => theme.colors.textMain};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  padding: 0.5rem 1rem;
  min-height: 44px; /* Touch target mínimo para mobile */
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease-in-out;
  -webkit-tap-highlight-color: transparent;
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
  }
  @media (max-width: 768px) {
    min-height: 48px; /* Ligeiramente maior em mobile */
    padding: 0.75rem 1.25rem;
  }
`;

const DropdownButton = styled.button`
  color: ${({ theme }) => theme.colors.textMain};
  background-color: transparent;
  border: none;
  font-size: 0.9rem;
  font-family: inherit;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  min-height: 44px; /* Touch target mínimo para mobile */
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease-in-out;
  -webkit-tap-highlight-color: transparent;
  &:hover, &.active {
    color: ${({ theme }) => theme.colors.textButton};
    background-color: ${({ theme }) => theme.colors.primary};
  }
  @media (max-width: 768px) {
    min-height: 48px;
    padding: 0.75rem 1rem;
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
  top: calc(100% + 10px);
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  padding: 0.5rem 0;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const DropdownLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textMain};
  padding: 10px 20px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const HamburgerIcon = styled.div`
  display: none;
  @media (max-width: 1024px) { display: block; font-size: 1.8rem; cursor: pointer; }
`;

const MobileMenuOverlay = styled.div`
  display: flex; 
  flex-direction: column; 
  background-color: ${({ theme }) => theme.colors.background};
  position: fixed; 
  top: 60px;
  left: 0; 
  right: 0; 
  bottom: 0;
  padding: 1rem 0; 
  z-index: 999;
  transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease-in-out;
  
  ${NavLinkStyled}, ${DropdownButton}, ${LogoutButton} { width: calc(100% - 2rem); margin: 0.5rem 1rem; padding: 1rem; text-align: left; border-radius: 0; }
  ${LogoutButton} { border-bottom: none; }
`;

const UserInfo = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-right: 1rem;
  white-space: nowrap;
`;

const NotificationBellContainer = styled.div`
  position: relative;
`;
const BellIcon = styled(FaBell)`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.textMain};
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: ${({ theme }) => theme.colors.backgroundSelect}; }
`;
const UnreadBadge = styled.span`
  position: absolute; top: -5px; right: -8px;
  background-color: ${({ theme }) => theme.colors.error};
  color: white; border-radius: 50%;
  width: 18px; height: 18px; font-size: 0.7rem;
  font-weight: bold; display: flex;
  justify-content: center; align-items: center;
`;
const NotificationsDropdownContent = styled(DropdownContent)`
  width: 320px;
`;

const DropdownFooter = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;
`;

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background-color: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index: 1100;
`;
const ModalContentBox = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground}; color: ${({ theme }) => theme.colors.textMain};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: 8px; padding: 18px; width: 90%; max-width: 480px;
`;
const ModalTitle = styled.h3`
  margin: 0 0 10px 0; color: ${({ theme }) => theme.colors.primary};
`;
const ModalActions = styled.div`
  display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;
`;
const NotificationHeader = styled.div`
  padding: 10px 15px; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex; justify-content: space-between; align-items: center;
  h4 { margin: 0; font-size: 0.95rem; }
`;
const MarkAllReadButton = styled.button`
  background: none; border: none; font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.primary}; cursor: pointer;
  &:hover { text-decoration: underline; }
  &:disabled { color: ${({ theme }) => theme.colors.textMuted}; cursor: not-allowed; }
`;
const NotificationList = styled.ul`
  list-style: none; padding: 0; margin: 0; overflow-y: auto; max-height: 300px;
`;
const NotificationItemStyled = styled.div`
  padding: 12px 15px; border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  cursor: pointer; background-color: ${props => props.$isRead ? 'transparent' : props.theme.colors.buttonSecondaryBg};
  p { margin: 0 0 5px 0; font-size: 0.85rem; line-height: 1.4; white-space: normal; display: flex; align-items: center; gap: 6px; }
  small { font-size: 0.75rem; color: ${({ theme }) => theme.colors.textMuted}; display: flex; align-items: center; gap: 6px; }
  &:last-child { border-bottom: none; }
  &:hover { background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg}; }
`;

const ChipSmall = styled.span`
  display: inline-flex; align-items: center; gap: 4px; border-radius: 999px; padding: 1px 6px; font-size: 0.65rem; font-weight: 600;
  background: ${({ theme, $variant }) => $variant === 'new' ? (theme.colors.successBg) : $variant === 'payment' ? 'rgba(212, 175, 55, 0.15)' : theme.colors.buttonSecondaryBg};
  color: ${({ theme, $variant }) => $variant === 'new' ? theme.colors.success : $variant === 'payment' ? '#D4AF37' : theme.colors.primary};
  border: 1px solid ${({ theme, $variant }) => $variant === 'new' ? theme.colors.success : $variant === 'payment' ? '#D4AF37' : theme.colors.primary};
`;
const ViewAllNotificationsLink = styled(Link)`
  display: block; text-align: center; padding: 10px; font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.primary}; text-decoration: none;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  &:hover { background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg}; }
`;

function Navbar() {
  const theme = useTheme();
  const { authState, logout } = useAuth();
  const { notifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead, totalNotifications, currentPage, totalPages, loadMore } = useNotifications();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); 
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);


  const handleDropdownToggle = (dropdownName) => {
    setOpenDropdown(prevOpenDropdown => (prevOpenDropdown === dropdownName ? null : dropdownName));
  };

    const closeAllMenus = () => {
      setOpenDropdown(null);
      setIsMobileMenuOpen(false);
    };

  const handleLogout = () => {
    closeAllMenus();
    logout();
    navigate('/login');
  };

  
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markNotificationAsRead(notification.id);
    setSelectedNotif(notification);
    setShowNotifModal(true);
  };

  if (!authState.isAuthenticated) return null;

  const { role, user } = authState;

  const clientLinks = (
    <>
      <NavItem><NavLinkStyled to="/dashboard" onClick={closeAllMenus}><FaHome /> Início</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/calendario" onClick={closeAllMenus}><FaCalendarAlt /> Agendar</NavLinkStyled></NavItem>
      <NavItem>
        <DropdownButton onClick={() => handleDropdownToggle('client')} className={openDropdown === 'client' ? 'active' : ''}>
          <FaUserCircle /> Minha área {openDropdown === 'client' ? '▴' : '▾'}
        </DropdownButton>
        <DropdownContent $isOpen={openDropdown === 'client'}>
           <DropdownLink to="/meus-treinos" onClick={() => setTimeout(closeAllMenus, 150)}><FaDumbbell />Treinos</DropdownLink>
          <DropdownLink to="/meu-progresso-detalhado" onClick={() => setTimeout(closeAllMenus, 150)}><FaChartLine /> Progresso</DropdownLink>
          <DropdownLink to="/meus-pagamentos" onClick={() => setTimeout(closeAllMenus, 150)}><FaMoneyBillWave />Pagamentos</DropdownLink>
          <DropdownLink to="/explorar-planos" onClick={() => setTimeout(closeAllMenus, 150)}><FaListOl />Planos de treino</DropdownLink>
          <DropdownLink to="/definicoes" onClick={() => setTimeout(closeAllMenus, 150)}><FaCog /> Definições</DropdownLink>
        </DropdownContent>
      </NavItem>
    </>
  );

  const staffLinks = (
    <>
      <NavItem><NavLinkStyled to="/admin/dashboard" onClick={closeAllMenus}><FaHome /> Início</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/admin/calendario-geral" onClick={closeAllMenus}><FaCalendarAlt /> Calendário</NavLinkStyled></NavItem>
      <NavItem><NavLinkStyled to="/admin/appointment-requests" onClick={closeAllMenus}><FaRegCalendarCheck /> Pedidos</NavLinkStyled></NavItem>
    </>
  );
  
  const adminManagementDropdown = (
    <NavItem>
      <DropdownButton onClick={() => handleDropdownToggle('admin')} className={openDropdown === 'admin' ? 'active' : ''}>
        <FaCog /> Gestão {openDropdown === 'admin' ? '▴' : '▾'}
      </DropdownButton>
      <DropdownContent $isOpen={openDropdown === 'admin'}>
       <DropdownLink to="/admin/manage-users" onClick={() => setTimeout(closeAllMenus, 150)}><FaUsers /> Clientes</DropdownLink>
        <DropdownLink to="/admin/progresso-clientes" onClick={() => setTimeout(closeAllMenus, 150)}><FaChartLine /> Progresso Clientes</DropdownLink>
        <DropdownLink to="/admin/manage-staff" onClick={() => setTimeout(closeAllMenus, 150)}><FaUserTie /> Equipa</DropdownLink>
        <DropdownLink to="/admin/manage-trainings" onClick={() => setTimeout(closeAllMenus, 150)}><FaDumbbell /> Treinos</DropdownLink>
        <DropdownLink to="/admin/training-series" onClick={() => setTimeout(closeAllMenus, 150)}><FaCalendarPlus /> Séries</DropdownLink>
        <DropdownLink to="/admin/manage-appointments" onClick={() => setTimeout(closeAllMenus, 150)}><FaCalendarCheck /> Consultas</DropdownLink>
        <DropdownLink to="/admin/manage-payments" onClick={() => setTimeout(closeAllMenus, 150)}><FaMoneyBillWave /> Pagamentos</DropdownLink>
        <DropdownLink to="/admin/manage-exercises" onClick={() => setTimeout(closeAllMenus, 150)}><FaListOl /> Exercícios</DropdownLink>
        <DropdownLink to="/admin/manage-global-plans" onClick={() => setTimeout(closeAllMenus, 150)}><FaClipboardList /> Planos Modelo</DropdownLink>
        <DropdownLink to="/admin/logs" onClick={() => setTimeout(closeAllMenus, 150)}><FaExclamationTriangle /> Central do Programador</DropdownLink>
      </DropdownContent>
    </NavItem>
  );

  return (
    <>
      <Nav>
        <NavLogoLink to={role === 'user' ? "/dashboard" : "/admin/dashboard"} onClick={closeAllMenus}>
          <LogoImage src={theme.logoUrl1} alt="CORE Logo" />
        </NavLogoLink>
        <DesktopNavLinks>
          {role === 'user' && clientLinks}
          {role !== 'user' && role !== 'admin' && staffLinks}
          {role === 'admin' && <>{staffLinks}{adminManagementDropdown}</>}

          <ThemeToggler />

          <NavItem>
            <DropdownButton onClick={() => handleDropdownToggle('notifications')}>
              <BellIcon />
              {unreadCount > 0 && <UnreadBadge>{unreadCount}</UnreadBadge>}
            </DropdownButton>
            <NotificationsDropdownContent $isOpen={openDropdown === 'notifications'}>
                <NotificationHeader>
                    <h4>Notificações</h4>
                    {unreadCount > 0 && <MarkAllReadButton onClick={markAllNotificationsAsRead}>Marcar todas como lidas</MarkAllReadButton>}
                </NotificationHeader>
                <NotificationList>
                    {notifications.length > 0 ? notifications.map(notif => (
                        <NotificationItemStyled key={notif.id} $isRead={notif.isRead} onClick={() => handleNotificationClick(notif)}>
                            <p>
                              {!notif.isRead && <ChipSmall $variant="new">nova</ChipSmall>}
                              {notif.message}
                            </p>
                            <small>
                              {moment(notif.createdAt).fromNow()}
                              {notif.type && (
                                <ChipSmall $variant={(notif.type || '').includes('PAY') ? 'payment' : 'calendar'}>
                                  {notif.type.replace(/_/g, ' ').toLowerCase()}
                                </ChipSmall>
                              )}
                            </small>
                        </NotificationItemStyled>
                    )) : <p style={{padding: '15px', textAlign: 'center', fontSize: '0.85rem'}}>Sem notificações.</p>}
                </NotificationList>
                <DropdownFooter>
                  <ViewAllNotificationsLink to="/notificacoes" onClick={closeAllMenus}>Ver todas ({totalNotifications})</ViewAllNotificationsLink>
                  {currentPage < totalPages && (
                    <MarkAllReadButton onClick={() => loadMore()}>Carregar mais</MarkAllReadButton>
                  )}
                </DropdownFooter>
            </NotificationsDropdownContent>
          </NavItem>
          <NavItem><LogoutButton onClick={handleLogout}><FaSignOutAlt /> Sair</LogoutButton></NavItem>
        </DesktopNavLinks>
        <HamburgerIcon onClick={() => setIsMobileMenuOpen(p => !p)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </HamburgerIcon>
      </Nav>
      <MobileMenuOverlay $isOpen={isMobileMenuOpen}>
          {role === 'user' && clientLinks}
          {role !== 'user' && role !== 'admin' && staffLinks}
          {role === 'admin' && <>{staffLinks}{adminManagementDropdown}</>}
          <NavItem style={{width: 'calc(100% - 2rem)', margin: '0.5rem 1rem'}}>
          <DropdownLink to="/notificacoes" onClick={closeAllMenus}>
            <FaBell /> Notificações {unreadCount > 0 && `(${unreadCount})`}
          </DropdownLink>
          </NavItem>
          <NavItem style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100% - 2rem)', margin: '0.5rem 1rem', padding: '1rem', color: theme.colors.textMain}}>
            <span>Mudar Tema</span>
            <ThemeToggler />
          </NavItem>
          <LogoutButton onClick={handleLogout} style={{ justifyContent: 'center', margin: '1rem' }}>Sair</LogoutButton>
      </MobileMenuOverlay>

      {showNotifModal && selectedNotif && (
        <ModalOverlay onClick={() => setShowNotifModal(false)}>
          <ModalContentBox onClick={e => e.stopPropagation()}>
            <ModalTitle>Notificação</ModalTitle>
            <p style={{marginTop:0}}>{selectedNotif.message}</p>
            <small style={{color: theme.colors.textMuted}}>{moment(selectedNotif.createdAt).fromNow()}</small>
            {selectedNotif.relatedResourceType && (
              <p style={{marginTop:8, fontSize: '0.9rem', color: theme.colors.textMuted}}>
                Recurso: {selectedNotif.relatedResourceType} {selectedNotif.relatedResourceId ? `#${selectedNotif.relatedResourceId}` : ''}
              </p>
            )}
            <ModalActions>
              <LogoutButton onClick={() => setShowNotifModal(false)}>Fechar</LogoutButton>
              {selectedNotif.link && (
                <LogoutButton onClick={() => { navigate(selectedNotif.link); setShowNotifModal(false); closeAllMenus(); }}>
                  Abrir
                </LogoutButton>
              )}
            </ModalActions>
          </ModalContentBox>
        </ModalOverlay>
      )}
    </>
  );
}
export default Navbar;
