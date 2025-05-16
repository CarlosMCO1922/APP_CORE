// src/components/Layout/Navbar.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
  FaTachometerAlt, FaCalendarAlt, FaClipboardList, FaUsers,
  FaUserTie, FaDumbbell, FaCalendarCheck, FaMoneyBillWave,
  FaCog, FaSignOutAlt
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
  min-height: 60px;
`;

const NavLogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  margin-right: auto;
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
  @media (max-width: 600px) {
    display: none;
  }
`;

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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
  @media (max-width: 992px) {
    display: none;
  }
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

function Navbar() {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const [managementDropdownOpen, setManagementDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setManagementDropdownOpen(false);
    navigate('/login');
  };

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

  if (!authState.isAuthenticated) {
    return null;
  }

  const isUserClient = authState.role === 'user';
  const isStaffGeneral = authState.role && authState.role !== 'user';
  const isAdminStrict = authState.role === 'admin';

  return (
    <Nav>
      <NavLogoLink to={isUserClient ? "/dashboard" : "/admin/dashboard"}>
        <LogoImage src="/logo_core.png" alt="CORE Logo" />
        <LogoText className="logo-text-nav">CORE</LogoText>
      </NavLogoLink>

      <NavLinks>
        {authState.user && (
          <UserInfo>
            Olá, {authState.user.firstName}!
          </UserInfo>
        )}

        {isUserClient && (
          <>
            <NavLinkStyled to="/dashboard"><FaTachometerAlt /> Painel</NavLinkStyled>
            <NavLinkStyled to="/calendario"><FaCalendarAlt /> Calendário</NavLinkStyled>
            <NavLinkStyled to="/meus-pagamentos"><FaMoneyBillWave /> Pagamentos</NavLinkStyled>
            <NavLinkStyled to="/definicoes"><FaCog /> Definições</NavLinkStyled>
          </>
        )}

        {isStaffGeneral && (
          <>
            <NavLinkStyled to="/admin/dashboard"><FaTachometerAlt /> Painel Staff</NavLinkStyled>
            <NavLinkStyled to="/admin/calendario-geral"><FaCalendarAlt /> Calendário</NavLinkStyled>
            <NavLinkStyled to="/admin/appointment-requests"><FaClipboardList /> Pedidos</NavLinkStyled>
          </>
        )}
        
        {isAdminStrict && (
          <DropdownContainer ref={dropdownRef}>
            <DropdownButton 
              onClick={() => setManagementDropdownOpen(prev => !prev)}
              className={managementDropdownOpen ? 'active' : ''}
            >
              <FaCog /> Gestão
            </DropdownButton>
            <DropdownContent $isOpen={managementDropdownOpen}>
              <DropdownLink to="/admin/manage-users" onClick={() => setManagementDropdownOpen(false)}><FaUsers /> Clientes</DropdownLink>
              <DropdownLink to="/admin/manage-staff" onClick={() => setManagementDropdownOpen(false)}><FaUserTie /> Equipa</DropdownLink>
              <DropdownLink to="/admin/manage-trainings" onClick={() => setManagementDropdownOpen(false)}><FaDumbbell /> Treinos</DropdownLink>
              <DropdownLink to="/admin/manage-appointments" onClick={() => setManagementDropdownOpen(false)}><FaCalendarCheck /> Consultas</DropdownLink>
              <DropdownLink to="/admin/manage-payments" onClick={() => setManagementDropdownOpen(false)}><FaMoneyBillWave /> Pagamentos</DropdownLink>
            </DropdownContent>
          </DropdownContainer>
        )}

        <LogoutButton onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </LogoutButton>
      </NavLinks>
    </Nav>
  );
}

export default Navbar;