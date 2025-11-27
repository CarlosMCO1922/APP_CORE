// src/pages/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate} from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyProfile, updateMyProfile } from '../services/userService';
import { FaSearch, FaClipboardList, FaInfoCircle, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';
import BackArrow from '../components/BackArrow';
import ThemeToggler from '../components/Theme/ThemeToggler';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background}; 
  color: ${({ theme }) => theme.colors.textMain}; 
  min-height: 100vh;
  padding: 30px 40px;
  font-family: 'Inter', sans-serif;
`;

const HeaderSpacer = styled.div``;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 30px;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 1.6rem; /* Aumentado */
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 30px; 
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder}; 
  font-weight: 600;

  &:first-of-type {
    margin-top: 0;
  }
`;

const SettingsForm = styled.form`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 35px 40px; /* Aumentado padding */
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  max-width: 650px; /* Aumentado max-width */
  margin: 0 auto 40px auto;
`;

const FormGroup = styled.div`
  margin-bottom: 25px; 
`;

const Label = styled.label`
  display: block;
  font-size: 0.95rem; /* Aumentado */
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMain};
  margin-bottom: 8px;
`;

const Input = styled.input`
  display: block;
  width: 100%;
  padding: 12px 15px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primaryFocusRing};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledColor};
    cursor: not-allowed;
  }
`;

const HeaderContainer = styled.div`
  display: grid; 
  grid-template-columns: auto 1fr auto; 
  align-items: center;
  margin-bottom: 20px;
  gap: 15px; 
`;


const SubmitButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textButton};
  padding: 12px 25px; 
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.05rem; 
  transition: background-color 0.2s ease-in-out, transform 0.1s ease;
  width: 100%;
  margin-top: 15px; 

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.disabledColor};
    transform: translateY(-2px);
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed;
    transform: translateY(0);
  }
`;

const MessageText = styled.p`
  font-size: 0.9rem;
  text-align: center;
  padding: 10px 15px;
  margin-top: 0; 
  margin-bottom: 20px; 
  border-radius: 8px;
  border-width: 1px;
  border-style: solid;

  &.success {
    color: ${({ theme }) => theme.colors.success};
    background-color: ${({ theme }) => theme.colors.successBg};
    border-color: ${({ theme }) => theme.colors.success};
  }
  &.error {
    color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.errorBg};
    border-color: ${({ theme }) => theme.colors.error};
  }
`;

const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: ${({ theme }) => theme.colors.primary};`;

const StyledInternalLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1rem; 
  text-decoration: none;
  display: inline-block; 
  margin-bottom: 30px; /* Aumentado espaço abaixo */
  transition: color 0.2s ease;
  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
    text-decoration: underline;
  }
`;

const LogoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  padding: 14px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background-color 0.2s ease-in-out, transform 0.1s ease;
  min-height: 44px; /* Touch target mínimo para mobile */
  -webkit-tap-highlight-color: transparent;
  margin-top: 20px;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.error};
    opacity: 0.9;
    transform: translateY(-2px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    min-height: 48px;
    padding: 16px 25px;
  }
`;


const SettingsPage = () => {
  const { authState, login: refreshAuthData, logout } = useAuth();
  const { theme: currentTheme } = useTheme(); 
  const navigate = useNavigate();
  const [viewDirection, setViewDirection] = useState('right');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '', 
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchProfile = useCallback(async () => {
    if (authState.token) {
      try {
        setLoading(true);
        setMessage({ type: '', text: '' });
        const profile = await getMyProfile(authState.token);
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
        });
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Não foi possível carregar o perfil.' });
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };


  const handleLogout = () => {
    if (window.confirm('Tens a certeza que queres sair?')) {
      logout();
      navigate('/login');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', text: '' });
    try {
      const dataToUpdate = { 
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      };
      
      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
          throw new Error('As novas passwords não coincidem.');
        }
        if (passwordData.newPassword.length < 6) {
            throw new Error('A nova password deve ter pelo menos 6 caracteres.');
        }
        dataToUpdate.password = passwordData.newPassword;
      }

      const updatedUserResponse = await updateMyProfile(authState.token, dataToUpdate);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      setFormData({
          firstName: updatedUserResponse.user.firstName,
          lastName: updatedUserResponse.user.lastName,
          email: updatedUserResponse.user.email,
      });
      setPasswordData({currentPassword: '', newPassword: '', confirmNewPassword: ''});
      const updatedAuthUser = { ...authState.user, ...updatedUserResponse.user };
      localStorage.setItem('userData', JSON.stringify(updatedAuthUser));
      if (updatedUserResponse.user.email) {
          await refreshAuthData(updatedUserResponse.user.email, dataToUpdate.password || "dummyPassIfNotChanged", authState.role !== 'user');
      }


    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Não foi possível atualizar o perfil.' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <PageContainer><LoadingText>A carregar definições...</LoadingText></PageContainer>;
  }

  return (
    <PageContainer>
      <HeaderContainer>
        <BackArrow to="/dashboard" />
        <Title>Definições</Title>
        <HeaderSpacer />
      </HeaderContainer>

      <SettingsForm onSubmit={handleProfileUpdate}>
        {message.text && <MessageText className={message.type}>{message.text}</MessageText>}
        <SectionTitle>Dados Pessoais</SectionTitle>
        <FormGroup>
          <Label htmlFor="firstName">Nome</Label>
          <Input 
            type="text" 
            name="firstName" 
            id="firstName"
            value={formData.firstName} 
            onChange={handleInputChange} 
            required 
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="lastName">Apelido</Label>
          <Input 
            type="text" 
            name="lastName" 
            id="lastName"
            value={formData.lastName} 
            onChange={handleInputChange} 
            required 
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="email">Email</Label>
          <Input 
            type="email" 
            name="email" 
            id="email"
            value={formData.email} 
            onChange={handleInputChange} 
            required 
          />
        </FormGroup>

        <SectionTitle>Alterar Password</SectionTitle>
        <FormGroup>
          <Label htmlFor="newPassword">Nova Password (deixar em branco para não alterar)</Label>
          <Input 
            type="password" 
            name="newPassword" 
            id="newPassword"
            value={passwordData.newPassword} 
            onChange={handlePasswordChange} 
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="confirmNewPassword">Confirmar Nova Password</Label>
          <Input 
            type="password" 
            name="confirmNewPassword" 
            id="confirmNewPassword"
            value={passwordData.confirmNewPassword} 
            onChange={handlePasswordChange} 
            disabled={!passwordData.newPassword}
            autoComplete="new-password"
          />
        </FormGroup>

        <SectionTitle>Aparência</SectionTitle>
        <FormGroup>
          <Label htmlFor="themeToggle">Tema</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
            <ThemeToggler />
            <span style={{ fontSize: '0.9rem', color: '#a0a0a0' }}>
              {currentTheme === 'light' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </div>
        </FormGroup>

        <SubmitButton type="submit" disabled={updating}>
          {updating ? 'A atualizar...' : 'Guardar Alterações'}
        </SubmitButton>
      </SettingsForm>

      {/* Secção de Conta com Logout */}
      <SettingsForm style={{ marginTop: '40px' }}>
        <SectionTitle>Conta</SectionTitle>
        <LogoutButton type="button" onClick={handleLogout}>
          <FaSignOutAlt />
          Sair da Conta
        </LogoutButton>
      </SettingsForm>
    </PageContainer>
  );
};

export default SettingsPage;