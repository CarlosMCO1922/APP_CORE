// src/pages/ResetPasswordPage.js - PÁGINA NOVA
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { FaEnvelope, FaKey, FaLock, FaArrowLeft } from 'react-icons/fa';
// Assumindo que o seu authService será atualizado com as novas funções
import { requestPasswordReset, verifyResetCode, resetPassword } from '../services/authService';

// --- Styled Components (com as cores da sua app) ---
const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 20px;
`;

const FormContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 30px 40px;
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.5);
  width: 100%;
  max-width: 450px;
  border-top: 4px solid ${({ theme }) => theme.colors.primary};
  text-align: center;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 15px;
  font-size: 1.8rem;
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 30px;
  line-height: 1.5;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 20px;
  .icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 12px 12px 45px;
  background-color: ${({ theme }) => theme.colors.inputBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: filter 0.2s;
  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
`;

const Message = styled.p`
  padding: 10px;
  margin-top: 15px;
  border-radius: 5px;
  font-weight: 500;
  &.error {
    background-color: ${({ theme }) => theme.colors.errorBg};
    color: ${({ theme }) => theme.colors.error};
  }
  &.success {
    background-color: ${({ theme }) => theme.colors.successBg};
    color: ${({ theme }) => theme.colors.success};
  }
`;

const BackToLoginLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 25px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;


const ResetPasswordPage = () => {
    const [stage, setStage] = useState('request'); // request, verify, reset
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const handleRequestCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await requestPasswordReset({ email });
            setMessage({ type: 'success', text: res.message });
            setStage('verify');
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Falha ao pedir o código.' });
        }
        setLoading(false);
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await verifyResetCode({ email, code });
            setMessage({ type: 'success', text: 'Código verificado!' });
            setStage('reset');
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Código inválido ou expirado.' });
        }
        setLoading(false);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'As palavras-passe não coincidem.' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await resetPassword({ email, code, password });
            setMessage({ type: 'success', text: res.message + ' Será redirecionado para o login.' });
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Não foi possível redefinir a palavra-passe.' });
        }
        setLoading(false);
    };

    return (
        <PageContainer>
            <FormContainer>
                {stage === 'request' && (
                    <form onSubmit={handleRequestCode}>
                        <Title>Recuperar Palavra-passe</Title>
                        <Subtitle>Insira o seu email para receber um código de 6 dígitos para redefinir a sua palavra-passe.</Subtitle>
                        <InputGroup>
                            <FaEnvelope className="icon" />
                            <Input type="email" placeholder="O seu email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </InputGroup>
                        <Button type="submit" disabled={loading}>{loading ? 'A Enviar...' : 'Enviar Código'}</Button>
                    </form>
                )}

                {stage === 'verify' && (
                    <form onSubmit={handleVerifyCode}>
                        <Title>Verificar Código</Title>
                        <Subtitle>Enviámos um código para <strong>{email}</strong>. Por favor, insira-o abaixo.</Subtitle>
                         <InputGroup>
                            <FaKey className="icon" />
                            <Input type="text" placeholder="Código de 6 dígitos" value={code} onChange={(e) => setCode(e.target.value)} required maxLength="6" />
                        </InputGroup>
                        <Button type="submit" disabled={loading}>{loading ? 'A Verificar...' : 'Verificar'}</Button>
                    </form>
                )}

                {stage === 'reset' && (
                    <form onSubmit={handleResetPassword}>
                        <Title>Nova Palavra-passe</Title>
                        <Subtitle>Crie uma nova palavra-passe para a sua conta.</Subtitle>
                        <InputGroup>
                            <FaLock className="icon" />
                            <Input type="password" placeholder="Nova palavra-passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </InputGroup>
                        <InputGroup>
                            <FaLock className="icon" />
                            <Input type="password" placeholder="Confirme a nova palavra-passe" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </InputGroup>
                        <Button type="submit" disabled={loading}>{loading ? 'A Redefinir...' : 'Redefinir Palavra-passe'}</Button>
                    </form>
                )}

                {message.text && <Message className={message.type}>{message.text}</Message>}
                
                <BackToLoginLink to="/login"><FaArrowLeft /> Voltar ao Login</BackToLoginLink>
            </FormContainer>
        </PageContainer>
    );
};

export default ResetPasswordPage;

