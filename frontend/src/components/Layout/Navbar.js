// src/components/Layout/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components'; // Adicionado css
import { useAuth } from '../../context/AuthContext';
import {
  FaTachometerAlt, FaCalendarAlt, FaClipboardList, FaUsers,
  FaUserTie, FaDumbbell, FaCalendarCheck, FaMoneyBillWave,
  FaCog, FaSignOutAlt, FaBars, FaTimes // Adicionado FaBars e FaTimes
} from 'react-icons/fa';

const coreGold = '#D4AF37';
const coreBlack = '#1A1A1A';
const navBackground = '#252525';
const lightTextColor = '#E0E0E0';
const dropdownHoverBg = '#333333';

const Nav = styled.nav`
  background-color: ${navBackground};
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
  min-height: 60px; // Garante altura mínima
`;

const NavLogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  /* margin-right: auto; // Removido para melhor controlo com flex */
  flex-shrink: 0; // Evita que o logo encolha
`;

const LogoImage = styled.img`
  height: 35px;
  width: auto;
  margin-right: 0.5rem;
`;

const LogoText = styled.span`
  font-size: 1.4rem;
  font-weight: bold;
  color: ${coreGold};
  @media (max-width: 768px) { // Ajustado breakpoint para consistência
    display: none;
  }
`;

// Container para os links do desktop e o botão de logout
const DesktopNavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto; // Empurra para a direita

  @media (max-width: 992px) { // Oculta em ecrãs menores que 992px
    display: none;
  }
`;

const NavLinkStyled = styled(Link)`
  color: ${lightTextColor};
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

  &:hover {
    color: ${coreGold};
    background-color: ${dropdownHoverBg};
  }
`;

const LogoutButton = styled.button`
  background-color: transparent;
  color: ${lightTextColor};
  border: 1px solid ${coreGold};
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: ${coreGold};
    color: ${coreBlack};
  }
`;

const UserInfo = styled.span`
  color: ${lightTextColor};
  font-size: 0.9rem;
  margin-right: 1rem;
  white-space: nowrap;
  // Já tem @media (max-width: 992px) { display: none; }
  // Mantido, mas será ocultado junto com DesktopNavLinks
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  color: ${lightTextColor};
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
    color: ${coreGold};
    background-color: ${dropdownHoverBg};
  }
`;

const DropdownContent = styled.div`
  display: ${props => (props.$isOpen ? 'block' : 'none')};
  position: absolute;
  background-color: ${navBackground};
  min-width: 240px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.3);
  z-index: 1001;
  border-radius: 8px;
  right: 0;
  top: calc(100% + 5px);
  border: 1px solid #4A4A4A;
  padding: 0.5rem 0;
`;

const DropdownLink = styled(Link)`
  color: ${lightTextColor};
  padding: 10px 20px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;
  white-space: nowrap;

  &:hover {
    background-color: ${dropdownHoverBg};
    color: ${coreGold};
  }
`;

// --- NOVOS STYLED COMPONENTS PARA MOBILE ---
const HamburgerIcon = styled.div`
  display: none; // Oculto por defeito
  font-size: 1.8rem;
  color: ${lightTextColor};
  cursor: pointer;
  margin-left: auto; // Empurra para a direita, depois do logo
  padding: 0.5rem;

  @media (max-width: 992px) { // Mostra em ecrãs <= 992px
    display: block;
  }
`;

const MobileMenuOverlay = styled.div`
  display: flex;
  flex-direction: column;
  /* align-items: center; // Links ocuparão 100% da largura */
  background-color: ${navBackground};
  position: fixed; // Fixado em relação ao viewport
  top: 60px; // Altura da Navbar
  left: 0;
  right: 0;
  bottom: 0; // Ocupa o resto da altura
  padding: 1rem 0; // Padding vertical
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  z-index: 999; // Abaixo da navbar, mas acima do conteúdo da página
  overflow-y: auto; // Permite scroll se houver muitos links

  transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(-100%)'}; // Animação de slide
  transition: transform 0.3s ease-in-out;

  // Estilo para os links dentro do menu mobile
  // Usaremos NavLinkStyled e LogoutButton, mas ajustando para display block
  ${NavLinkStyled}, ${DropdownButton}, ${LogoutButton} {
    width: calc(100% - 2rem); // Largura total menos padding lateral do overlay
    margin: 0.5rem 1rem; // Margem para espaçamento
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #4A4A4A;
    border-radius: 0; // Remove border-radius individual se desejado para um look mais de lista
    
    &:last-child {
      border-bottom: none;
    }
  }
  // Ajuste específico para o DropdownButton e DropdownContent no mobile
  ${DropdownContainer} {
    width: calc(100% - 2rem);
    margin: 0.5rem 1rem;
  }
  ${DropdownButton} { // Para o botão de gestão dentro do menu mobile
    width: 100%;
    justify-content: space-between; // Para alinhar o texto à esquerda e ícone à direita
    padding: 1rem;
    border-bottom: 1px solid #4A4A4A;
  }
  ${DropdownContent} { // Para o submenu de gestão no mobile
    position: static; // Não mais absoluto
    width: 100%;
    box-shadow: none;
    border: none;
    border-top: 1px dashed #555; // Separador visual
    padding-left: 1rem; // Indentação para sub-itens
    background-color: #2a2a2a; // Cor ligeiramente diferente para sub-menu
  }


  @media (min-width: 993px) { // Oculta em ecrãs maiores
    display: none;
  }
`;
// --- FIM DOS NOVOS STYLED COMPONENTS PARA MOBILE ---

function Navbar() {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const [managementDropdownOpen, setManagementDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // NOVO ESTADO

  const handleLogout = () => {
    logout();
    setManagementDropdownOpen(false);
    setIsMobileMenuOpen(false); // Fecha menu mobile ao fazer logout
    navigate('/login');
  };

  const closeAllMenus = () => {
    setManagementDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setManagementDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fecha o menu mobile se o ecrã for redimensionado para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  if (!authState.isAuthenticated) {
    return null;
  }

  const isUserClient = authState.role === 'user';
  const isStaffGeneral = authState.role && authState.role !== 'user';
  const isAdminStrict = authState.role === 'admin';

  const commonClientLinks = (
    <>
      <NavLinkStyled to="/dashboard" onClick={closeAllMenus}><FaTachometerAlt /> Painel</NavLinkStyled>
      <NavLinkStyled to="/calendario" onClick={closeAllMenus}><FaCalendarAlt /> Calendário</NavLinkStyled>
      <NavLinkStyled to="/meus-pagamentos" onClick={closeAllMenus}><FaMoneyBillWave /> Pagamentos</NavLinkStyled>
      <NavLinkStyled to="/definicoes" onClick={closeAllMenus}><FaCog /> Definições</NavLinkStyled>
    </>
  );

  const commonStaffLinks = (
    <>
      <NavLinkStyled to="/admin/dashboard" onClick={closeAllMenus}><FaTachometerAlt /> Painel Staff</NavLinkStyled>
      <NavLinkStyled to="/admin/calendario-geral" onClick={closeAllMenus}><FaCalendarAlt /> Calendário</NavLinkStyled>
      <NavLinkStyled to="/admin/appointment-requests" onClick={closeAllMenus}><FaClipboardList /> Pedidos</NavLinkStyled>
    </>
  );

  const adminManagementDropdown = (
    <DropdownContainer ref={dropdownRef}>
      <DropdownButton 
        onClick={() => setManagementDropdownOpen(prev => !prev)}
        className={managementDropdownOpen ? 'active' : ''}
      >
        <FaCog /> Gestão {managementDropdownOpen ? '▴' : '▾'}
      </DropdownButton>
      <DropdownContent $isOpen={managementDropdownOpen}>
        <DropdownLink to="/admin/manage-users" onClick={closeAllMenus}><FaUsers /> Clientes</DropdownLink>
        <DropdownLink to="/admin/manage-staff" onClick={closeAllMenus}><FaUserTie /> Equipa</DropdownLink>
        <DropdownLink to="/admin/manage-trainings" onClick={closeAllMenus}><FaDumbbell /> Treinos</DropdownLink>
        <DropdownLink to="/admin/manage-appointments" onClick={closeAllMenus}><FaCalendarCheck /> Consultas</DropdownLink>
        <DropdownLink to="/admin/manage-payments" onClick={closeAllMenus}><FaMoneyBillWave /> Pagamentos</DropdownLink>
        <DropdownLink to="/admin/manage-exercises" onClick={closeAllMenus}><FaDumbbell /> Exercícios Base</DropdownLink>
      </DropdownContent>
    </DropdownContainer>
  );


  return (
    <>
      <Nav>
        <NavLogoLink to={isUserClient ? "/dashboard" : "/admin/dashboard"} onClick={closeAllMenus}>
          <LogoImage src="/logo_core.png" alt="CORE Logo" />
          <LogoText>CORE</LogoText>
        </NavLogoLink>

        {/* Links para Desktop */}
        <DesktopNavLinks>
          {authState.user && (
            <UserInfo>
              Olá, {authState.user.firstName}!
            </UserInfo>
          )}
          {isUserClient && commonClientLinks}
          {isStaffGeneral && !isAdminStrict && commonStaffLinks}
          {isAdminStrict && (
            <>
              {commonStaffLinks}
              {adminManagementDropdown}
            </>
          )}
          <LogoutButton onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </LogoutButton>
        </DesktopNavLinks>

        {/* Ícone Hambúrguer para Mobile */}
        <HamburgerIcon onClick={() => setIsMobileMenuOpen(prev => !prev)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </HamburgerIcon>
      </Nav>

      {/* Menu Overlay para Mobile */}
      <MobileMenuOverlay $isOpen={isMobileMenuOpen}>
        {isUserClient && commonClientLinks}
        {isStaffGeneral && !isAdminStrict && commonStaffLinks}
        {isAdminStrict && (
          <>
            {commonStaffLinks}
            {/* Para o dropdown de gestão no mobile, podemos integrá-lo ou simplificá-lo.
                Aqui, vamos tentar incluí-lo como está, mas pode precisar de mais estilo.
                Ou, alternativamente, listar os links de gestão diretamente.
            */}
            {adminManagementDropdown} 
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