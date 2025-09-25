// src/pages/SettingsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate} from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, updateMyProfile } from '../services/userService';
import { FaSearch, FaArrowLeft, FaClipboardList, FaInfoCircle, FaChevronDown } from 'react-icons/fa';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background}; 
  color: #E0E0E0; 
  min-height: 100vh;
  padding: 30px 40px;
  font-family: 'Inter', sans-serif;
`;

const HeaderSpacer = styled.div``;

const Title = styled.h1`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 30px;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 1.6rem; /* Aumentado */
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 30px; 
  margin-bottom: 20px; 
  padding-bottom: 10px;
  border-bottom: 1px solid #3a3a3a; 
  font-weight: 600;

  &:first-of-type {
    margin-top: 0;
  }
`;

const SettingsForm = styled.form`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 35px 40px; /* Aumentado padding */
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.5);
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
  color: #b0b0b0;
  margin-bottom: 8px;
`;

const Input = styled.input`
  display: block;
  width: 100%;
  padding: 12px 15px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid #4A4A4A;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.25);
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

const BackButton = styled.button` // MUDOU de Link para button
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
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
    background-color: #555;
    color: #888;
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
    color: #66BB6A; // Verde para sucesso
    background-color: rgba(102, 187, 106, 0.15);
    border-color: #66BB6A;
  }
  &.error {
    color: #FF6B6B; // Vermelho para erro
    background-color: rgba(255, 107, 107, 0.15);
    border-color: #FF6B6B;
  }
`;

const LoadingText = styled.p` font-size: 1.1rem; text-align: center; padding: 20px; color: #D4AF37;`;

const StyledInternalLink = styled(Link)`
  color: #D4AF37;
  font-size: 1rem; 
  text-decoration: none;
  display: inline-block; 
  margin-bottom: 30px; /* Aumentado espaço abaixo */
  transition: color 0.2s ease;
  &:hover {
    color: #e6c358;
    text-decoration: underline;
  }
`;


const SettingsPage = () => {
  const { authState, login: refreshAuthData } = useAuth(); 
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

  const handleBack = () => {
    setViewDirection('left');
    navigate('/dashboard');
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
        <BackButton onClick={handleBack}><FaArrowLeft /></BackButton>
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

        <SubmitButton type="submit" disabled={updating}>
          {updating ? 'A atualizar...' : 'Guardar Alterações'}
        </SubmitButton>
      </SettingsForm>
    </PageContainer>
  );
};

export default SettingsPage;