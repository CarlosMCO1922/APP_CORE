// src/pages/LoginPage.js
import React, { useState } from 'react';
import styled , { useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext'; 
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggler from '../components/Theme/ThemeToggler';
import HomeLink from '../components/HomeLink';

// --- Definição das Cores ---
const coreGold = '#D4AF37';
const coreBlack = '#1A1A1A';
const lightTextColor = '#E0E0E0';
const inputBackground = '#2C2C2C';
const inputBorderColor = '#4A4A4A';
const errorColor = '#FF6B6B';
const errorBackground = 'rgba(94, 46, 46, 0.8)';

// --- Styled Components ---
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px; /* Padding base */
  font-family: ${({ theme }) => theme.fonts.main};
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

const LoginBox = styled.div`
  padding: 35px 45px;
  border-radius: 12px;
  width: 100%;
  max-width: 450px;
  transition: background-color 0.3s ease;

  @media (max-width: 480px) {
    padding: 25px 20px; 
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    margin-bottom: 1.5rem;
  }
`;

const LogoImage = styled.img`
  height: 200px; 
  width: auto;

  @media (max-width: 480px) {
    height: 150px; 
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    font-size: 1.75rem; // Tamanho do título ligeiramente menor
    margin-bottom: 1.5rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem; // Bom espaçamento
  @media (max-width: 480px) {
    gap: 1.2rem; // Espaçamento ligeiramente menor
  }
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMain};
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

const ErrorMessage = styled.p`
  font-size: 0.9rem;
  color: white; // Pode manter-se se o fundo for sempre escuro
  background-color: ${({ theme }) => theme.colors.errorBg}; // <--- MUDOU
  padding: 0.85rem 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.error}; // <--- MUDOU
  margin-top: 0;
  margin-bottom: 1rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.9rem 1rem; 
  min-height: 44px; /* Touch target mínimo para mobile */
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  font-size: 1rem; 
  font-weight: 600; 
  color: ${({ theme }) => theme.colors.textDark};
  background-color: ${({ theme }) => theme.colors.primary};
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent; /* Remove highlight no mobile */

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary}; 
    transform: translateY(-1px);
  }
  &:active:not(:disabled) {
    transform: translateY(0px);
  }
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}55;
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledColor || '#5d5d5d'};
    color: ${({ theme }) => theme.colors.textMuted};
    cursor: not-allowed;
    transform: translateY(0px);
  }
`;

const ToggleContainer = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
    flex-direction: column; // Empilha em ecrãs muito pequenos
    gap: 0.5rem;
  }
`;

const RegisterLinkText = styled.p`
  margin-top: 2rem;
  text-align: center;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.textMain};
  @media (max-width: 480px) {
    margin-top: 1.5rem;
    font-size: 0.85rem;
  }
`;

const GuestBookingContainer = styled.div`
  text-align: center;
  margin-top: 1rem;
`;

const StaffLoginLinkContainer = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
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
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 3rem;
  padding-bottom: 1rem;
  @media (max-width: 480px) {
    margin-top: 2rem;
  }
`;

function LoginPage() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, false); 
    } catch (err) {
      setError(err.message || 'Falha no login. Verifica as tuas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <HomeLink />
      <TogglerContainer>
        <ThemeToggler />
      </TogglerContainer>
      <LoginBox>
        <LogoContainer>
          <LogoImage src={theme.logoUrl} alt="CORE Logo" />
        </LogoContainer>        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
            />
          </FormGroup>
          <FormGroup>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
            />
          </FormGroup>

          {error && (<ErrorMessage> {error} </ErrorMessage>)}

          <FormGroup> 
            <SubmitButton type="submit" disabled={loading}>
              {loading ? 'A entrar...' : 'Entrar'}
            </SubmitButton>
          </FormGroup>

          <Link to="/reset-password" style={{ color: theme.colors.primary, marginTop: '15px', display: 'block', textAlign: 'center' }}>
            Esqueci-me da palavra-passe
          </Link>
        </Form>

        <RegisterLinkText>
          Não tens conta de cliente?{'  '}
          <StyledLink to="/register">Regista-te aqui</StyledLink>
        </RegisterLinkText>

        <GuestBookingContainer>
          <StyledLink to="/marcar">Marcar consulta como convidado</StyledLink>
        </GuestBookingContainer>

        <StaffLoginLinkContainer>
          <StyledLink to="/login-staff">Aceder à área de funcionários</StyledLink>
        </StaffLoginLinkContainer>

      </LoginBox>
      <FooterText>
          &copy; {new Date().getFullYear()} CORE Studio. Todos os direitos reservados.
      </FooterText>
    </PageContainer>
  );
}

export default LoginPage;