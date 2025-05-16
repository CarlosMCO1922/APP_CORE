// src/pages/LoginPage.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

// --- Definição das Cores ---
const coreGold = '#D4AF37';
const coreBlack = '#1A1A1A';
const lightTextColor = '#E0E0E0';
const inputBackground = '#2C2C2C';
const inputBorderColor = '#4A4A4A';
const errorColor = '#FF6B6B';
const errorBackground = 'rgba(94, 46, 46, 0.8)'; // Mais opaco para melhor contraste do texto de erro

// --- Styled Components ---
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${coreBlack};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: 'Inter', sans-serif;
`;

const LoginBox = styled.div`
  background-color: #252525;
  padding: 35px 45px; /* Aumentar padding */
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6); /* Sombra mais pronunciada */
  width: 100%;
  max-width: 450px;
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const LogoImage = styled.img`
  height: 80px;
  width: auto;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  color: ${coreGold};
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div``;

const Label = styled.label`
  display: block;
  font-size: 0.9rem; /* Ligeiramente maior */
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
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.25); /* Sombra de foco mais visível */
  }
`;

const ErrorMessage = styled.p`
  font-size: 0.9rem; /* Aumentar um pouco */
  color: white; /* Texto branco para contraste com fundo escuro */
  background-color: ${errorBackground};
  padding: 0.85rem 1rem; /* Aumentar padding */
  border-radius: 8px;
  text-align: center;
  border: 1px solid ${errorColor};
  margin-top: 0; /* Remover margem superior se for o único elemento de erro */
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center; /* Alinhar texto e possível ícone */
  padding: 0.9rem 1rem; 
  border: none; /* Remover borda padrão */
  border-radius: 8px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1); /* Sombra subtil */
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
    background-color: #5d5d5d; /* Cor de desabilitado mais escura */
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
  font-size: 0.9rem; /* Aumentar */
`;

const CheckboxLabel = styled.label`
  margin-right: 0.5rem;
  cursor: pointer;
  user-select: none; /* Impedir seleção de texto */
`;

const Checkbox = styled.input`
  vertical-align: middle;
  margin-left: 0.5rem; 
  accent-color: ${coreGold}; 
  cursor: pointer;
  transform: scale(1.2); /* Aumentar um pouco */
  &:focus {
    outline: 2px solid ${coreGold}80; /* Foco visível */
    outline-offset: 2px;
  }
`;

const RegisterLinkText = styled.p`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem; /* Aumentar */
  color: #a1a1aa;
`;

const StyledLink = styled(Link)`
  font-weight: 600; /* Mais bold */
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
`;

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
      // O redirecionamento agora é tratado pelo useEffect no App.js ou ProtectedRoute
      // por isso, não precisamos de navegar explicitamente aqui após o login com sucesso.
      // A atualização do authState irá despoletar o redirecionamento automático.
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

          <FormGroup>
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