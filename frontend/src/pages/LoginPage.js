// src/pages/LoginPage.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext'; // Certifica-te que o caminho está correto
import { useNavigate, Link } from 'react-router-dom';

// --- Definição das Cores (mantidas como definiste) ---
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
  background-color: ${coreBlack};
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

const LoginBox = styled.div`
  background-color: #252525;
  padding: 35px 45px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  width: 100%;
  max-width: 450px;

  @media (max-width: 480px) {
    padding: 25px 20px; // Padding reduzido para ecrãs pequenos
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
  height: 80px; // Altura base para desktop
  width: auto;

  @media (max-width: 480px) {
    height: 60px; // Altura reduzida para mobile
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: ${coreGold};
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
  color: ${lightTextColor};
  margin-bottom: 0.5rem; 
`;

const Input = styled.input`
  display: block;
  width: 100%;
  padding: 0.9rem 1.1rem; 
  background-color: ${inputBackground};
  border: 1px solid ${inputBorderColor};
  border-radius: 8px;
  color: white;
  font-size: 1rem; 
  &::placeholder {
    color: #78716c;
  }
  &:focus {
    outline: none;
    border-color: ${coreGold};
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.25);
  }
`;

const ErrorMessage = styled.p`
  font-size: 0.9rem;
  color: white;
  background-color: ${errorBackground};
  padding: 0.85rem 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid ${errorColor};
  margin-top: 0;
  margin-bottom: 1rem; // Adicionado para espaçar do botão se o erro estiver acima
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.9rem 1rem; 
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  font-size: 1rem; 
  font-weight: 600; 
  color: ${coreBlack};
  background-color: ${coreGold};
  transition: background-color 0.2s ease-in-out, transform 0.1s ease-in-out;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: #e6c358; 
    transform: translateY(-1px);
  }
  &:active:not(:disabled) {
    transform: translateY(0px);
  }
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${coreGold}55;
  }
  &:disabled {
    background-color: #5d5d5d;
    color: #9e9e9e;
    cursor: not-allowed;
    transform: translateY(0px);
  }
`;

const ToggleContainer = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${lightTextColor};
  font-size: 0.9rem;

  @media (max-width: 480px) {
    margin-bottom: 1rem;
    flex-direction: column; // Empilha em ecrãs muito pequenos
    gap: 0.5rem;
  }
`;

const CheckboxLabel = styled.label`
  margin-right: 0.5rem;
  cursor: pointer;
  user-select: none;
  @media (max-width: 480px) {
    margin-right: 0; // Remove margem quando empilhado
  }
`;

const Checkbox = styled.input`
  vertical-align: middle;
  margin-left: 0.5rem; 
  accent-color: ${coreGold}; 
  cursor: pointer;
  transform: scale(1.2);
  &:focus {
    outline: 2px solid ${coreGold}80;
    outline-offset: 2px;
  }
  @media (max-width: 480px) {
    margin-left: 0.3rem; // Ajusta margem
  }
`;

const RegisterLinkText = styled.p`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #a1a1aa;
  @media (max-width: 480px) {
    margin-top: 1.5rem;
    font-size: 0.85rem;
  }
`;

const StyledLink = styled(Link)`
  font-weight: 600;
  color: ${coreGold};
  text-decoration: none;
  &:hover {
    color: #e6c358;
    text-decoration: underline;
  }
`;

const FooterText = styled.footer`
  text-align: center;
  color: #71717a;
  margin-top: 3rem;
  padding-bottom: 1rem;
  @media (max-width: 480px) {
    margin-top: 2rem;
  }
`;

// A lógica da função LoginPage (useState, handleSubmit, etc.) permanece a mesma
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, isStaffLogin); 
      // Redirecionamento é tratado pelo App.js ou ProtectedRoute
    } catch (err) {
      setError(err.message || 'Falha no login. Verifica as tuas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginBox>
        <LogoContainer>
          <LogoImage src="/logo_core.png" alt="CORE Logo" />
        </LogoContainer>
        <Title>Bem-vindo ao CORE</Title>
        
        <Form onSubmit={handleSubmit}>
          <ToggleContainer>
            <CheckboxLabel htmlFor="staffLoginToggle">
              Entrar como Funcionário:
            </CheckboxLabel>
            <Checkbox
              type="checkbox"
              id="staffLoginToggle"
              checked={isStaffLogin}
              onChange={() => setIsStaffLogin(!isStaffLogin)}
            />
          </ToggleContainer>

          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="o.seu@email.com"
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="A sua password"
            />
          </FormGroup>

          {error && (
            <ErrorMessage>
              {error}
            </ErrorMessage>
          )}

          <FormGroup> {/* Este FormGroup é redundante se SubmitButton for o único filho */}
            <SubmitButton
              type="submit"
              disabled={loading}
            >
              {loading ? 'A entrar...' : (isStaffLogin ? 'Entrar (Funcionário)' : 'Entrar (Cliente)')}
            </SubmitButton>
          </FormGroup>
        </Form>
        {!isStaffLogin && (
          <RegisterLinkText>
            Não tens conta de cliente?{' '}
            <StyledLink to="/register">
              Regista-te aqui
            </StyledLink>
          </RegisterLinkText>
        )}
      </LoginBox>
      <FooterText>
          &copy; {new Date().getFullYear()} CORE Studio. Todos os direitos reservados.
      </FooterText>
    </PageContainer>
  );
}

export default LoginPage;