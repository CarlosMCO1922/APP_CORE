import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggler from '../components/Theme/ThemeToggler';

const coreGold = '#D4AF37'
const coreBlack = '#1A1A1A';
const lightTextColor = '#E0E0E0';
const inputBackground = '#2C2C2C';
const inputBorderColor = '#4A4A4A';
const errorColor = '#FF6B6B';
const errorBackground = 'rgba(94, 46, 46, 0.8)';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.primary};
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  font-family: 'Inter', sans-serif;
`;

const TogglerContainer = styled.div`
  position: absolute;
  top: 25px;
  right: 25px;
  z-index: 10;
`;

const LoginBox = styled.div`
  background-color: #${({ theme }) => theme.colors.background};
  padding: 35px 45px;
  border-radius: 12px;
  box-shadow: 0 10px 30px ${({ theme }) => theme.colors.background};
  width: 100%;
  max-width: 450px;
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`;

const LogoImage = styled.img`
  height: 150px;
  width: auto;

  @media (max-width: 480px) {
    height: 150px; // Altura reduzida para mobile
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
  gap: 1.5rem;
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
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  color: white;
  font-size: 1rem; 
  &::placeholder {
    color: #78716c;
  }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.25);
  }
`;

const ErrorMessage = styled.p`
  font-size: 0.9rem;
  color: white;
  background-color: ${({ theme }) => theme.colors.error};
  padding: 0.85rem 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.error};
  margin-top: 0;
  margin-bottom: 1rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.9rem 1rem; 
  border: none;
  border-radius: 8px;
  font-size: 1rem; 
  font-weight: 600; 
  color: ${({ theme }) => theme.colors.background};
  background-color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
    cursor: not-allowed;
  }
`;

const ClientLoginLinkText = styled.p`
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #a1a1aa;
`;

const StyledLink = styled(Link)`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: underline;
  }
`;

const FooterText = styled.footer`
  text-align: center;
  color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  margin-top: 3rem;
  padding-bottom: 1rem;
`;

function StaffLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');

    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try{
            await login(email, password, true);
        }catch (err){
            setError(err.message || 'Falha no login. Verifique as suas credencias.')
        }finally{
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <TogglerContainer>
                <ThemeToggler />
            </TogglerContainer>
            <LoginBox>
                <LogoContainer>
                    <LogoImage src="/logo_core_without_back.png" alt='CORE Logo'/>
                </LogoContainer>
                <Title>Funcionários</Title>

                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label htmlFor='email'>Email</Label>
                        <Input type='email' id='email' value={email} onChange={(e) => setEmail(e.target.value)} require placeholder="o.seu@email.com"/>
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor='password'>Password</Label>
                        <Input type='password' id='password' value={password} onChange={(e) => setPassword(e.target.value)} required placeholder='Password'/>
                    </FormGroup>

                    {error && <ErrorMessage>{error}</ErrorMessage>}

                    <FormGroup>
                        <SubmitButton type='submit' disabled={loading}> {loading ? 'A entrar...' : 'Entrar'} </SubmitButton>
                    </FormGroup>
                </Form>
                <ClientLoginLinkText>
                    Não é funcionário? {' '}
                    <StyledLink to="/login"> Login de Cliente </StyledLink>
                </ClientLoginLinkText>
            </LoginBox>
            <FooterText>
                &copy; {new Date().getFullYear()} CORE Studio. Todos os direitos reservados.
            </FooterText>
        </PageContainer>
    );
}
export default StaffLoginPage;