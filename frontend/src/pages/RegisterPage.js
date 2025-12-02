// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { useTheme }from 'styled-components';
import { registerUserAPI } from '../services/authService'; 
import ThemeToggler from '../components/Theme/ThemeToggler';

// --- Definição das Cores  ---
const coreGold = '#D4AF37';
const coreBlack = '#1A1A1A';
const lightTextColor = '#E0E0E0';
const inputBackground = '#2C2C2C';
const inputBorderColor = '#4A4A4A';
const errorColor = '#FF6B6B';
const errorBackground = 'rgba(94, 46, 46, 0.8)';
const successColor = '#66BB6A';
const successBackground = 'rgba(102, 187, 106, 0.2)';


const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px; /* Padding base */
  font-family: 'Inter', sans-serif;

  @media (max-width: 480px) {
    padding: 15px; // Padding ligeiramente menor em ecrãs muito pequenos
  }
`;

const TogglerContainer = styled.div`
  position: absolute;
  top: 25px;
  right: 25px;
  z-index: 10;
`;

const FormBox = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 35px 45px;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  width: 100%;
  max-width: 500px; // Pode ser um pouco maior para o registo se houver mais campos

  @media (max-width: 480px) {
    padding: 25px 20px; // Padding reduzido para ecrãs pequenos
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem; // Ajustado para consistência

  @media (max-width: 480px) {
    margin-bottom: 1rem;
  }
`;

const LogoImage = styled.img`
  height: 200px; // Altura base para desktop
  width: auto;

  @media (max-width: 480px) {
    height: 100px; // Altura reduzida para mobile
  }
`;

const Title = styled.h2`
  font-size: 2rem; // Ligeiramente menor que o login, pode ser questão de preferência
  font-weight: bold;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 1.5rem;

  @media (max-width: 480px) {
    font-size: 1.6rem; // Tamanho do título ligeiramente menor
    margin-bottom: 1.2rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.2rem; 
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMain};;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  display: block;
  width: 100%;
  padding: 0.9rem 1.1rem; 
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
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}40; 
  }
`;

const MessageText = styled.p`
  font-size: 0.9rem;
  text-align: center;
  padding: 10px 15px;
  margin-top: 0; 
  margin-bottom: 1rem;
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

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.9rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.background};
  background-color: ${({ theme }) => theme.colors.primary};
  transition: background-color 0.15s ease-in-out, transform 0.1s ease-in-out;
  margin-top: 0.5rem;
  cursor: pointer;

  &:hover:not(:disabled) { background-color: ${({ theme }) => theme.colors.primaryHover}; transform: translateY(-1px); }
  &:disabled { 
    background-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed; 
    transform: translateY(0px); 
  }
`;

const LoginLinkText = styled.p`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMain};
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const StyledLink = styled(Link)`
  font-weight: 600;
  font-size: 1rem;
  padding: 5px 10px;
  border: 2px solid transparent;
  border-radius: 5px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  transition: all 0.2s ease-in-out;
  &:hover {
    background-color: ${({theme}) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.background};
    text-decoration: none;
  }
`;

const FooterText = styled.footer`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMain};
  margin-top: 3rem;
  padding-bottom: 1rem;
  @media (max-width: 480px) {
    margin-top: 2rem;
  }
`;


const CheckboxContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 0.5rem;
`;

const Checkbox = styled.input`
  margin-top: 3px;
  cursor: pointer;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
`;

const CheckboxLabel = styled.label`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMain};
  line-height: 1.5;
  cursor: pointer;
  flex: 1;
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
    &:hover {
      color: ${({ theme }) => theme.colors.primaryHover};
    }
  }
`;

function RegisterPage() {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gdprConsent: false,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' }); 

    // Validação das passwords
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As passwords não coincidem.' });
      return;
    }
    if (formData.password.length < 6) { 
        setMessage({ type: 'error', text: 'A password deve ter pelo menos 6 caracteres.' });
        return;
    }
    
    // Validação do GDPR - verificar diretamente o valor do estado
    // Debug temporário
    console.log('GDPR Consent value:', formData.gdprConsent, 'Type:', typeof formData.gdprConsent);
    
    if (!formData.gdprConsent) {
        setMessage({ type: 'error', text: 'É necessário aceitar o consentimento de partilha de dados (RGPD) para criar uma conta.' });
        return;
    }

    setLoading(true);
    try {
      // Construir objeto de registo explicitamente, garantindo que gdprConsent é true
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        gdprConsent: true // Sempre true porque já validámos acima
      };
      console.log('Sending registration data:', registrationData);
      console.log('Sending registration data (stringified):', JSON.stringify(registrationData));
      console.log('GDPR Consent in formData:', formData.gdprConsent);
      console.log('GDPR Consent in registrationData:', registrationData.gdprConsent);
      const responseData = await registerUserAPI(registrationData);
      
      setMessage({ type: 'success', text: `${responseData.message || 'Registo bem-sucedido!'} Serás redirecionado para o login.` });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Ocorreu um erro durante o registo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <TogglerContainer>
        <ThemeToggler />
      </TogglerContainer>
      <FormBox>
        <LogoContainer>
          <LogoImage src={theme.logoUrl} alt="CORE Logo" />
        </LogoContainer>
        <Title>Nova conta</Title>

        {message.text && <MessageText className={message.type}>{message.text}</MessageText>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required placeholder='Primeiro nome' />
          </FormGroup>
          <FormGroup>
            <Input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required placeholder='Último nome' />
          </FormGroup>
          <FormGroup>
            <Input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required placeholder='Email' />
          </FormGroup>
          <FormGroup>
            <Input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required placeholder="Password (Min. 6 caracteres)" />
          </FormGroup>
          <FormGroup>
            <Input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder='Password' />
          </FormGroup>
          <FormGroup>
            <CheckboxContainer>
              <Checkbox 
                type="checkbox" 
                name="gdprConsent" 
                id="gdprConsent" 
                checked={formData.gdprConsent || false} 
                onChange={(e) => {
                  console.log('Checkbox clicked, checked:', e.target.checked);
                  handleChange(e);
                }}
              />
              <CheckboxLabel htmlFor="gdprConsent">
                Ao criar uma conta, aceito a partilha de dados de acordo com o Regulamento Geral sobre a Proteção de Dados (RGPD). 
                Consulte a nossa política de privacidade para mais informações.
              </CheckboxLabel>
            </CheckboxContainer>
          </FormGroup>
          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'A registar...' : 'Registar'}
          </SubmitButton>
        </Form>
        <LoginLinkText>
          Já tens conta?{' '}
          <StyledLink to="/login">Entra aqui</StyledLink>
        </LoginLinkText>
      </FormBox>
      <FooterText>
        &copy; {new Date().getFullYear()} CORE Studio. Todos os direitos reservados.
      </FooterText>
    </PageContainer>
  );
}

export default RegisterPage;