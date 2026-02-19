// frontend/src/pages/EntryPage.js
// Página de entrada: destaque para Marcar e opções de acesso (cliente, staff, criar conta).
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { FaCalendarAlt, FaUser, FaUserShield, FaUserPlus } from 'react-icons/fa';
import ThemeToggler from '../components/Theme/ThemeToggler';

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 24px 20px 40px;
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const TogglerContainer = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
`;

const CoreCard = styled.div`
  max-width: 520px;
  margin: 0 auto 24px;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 12px;
  padding: 24px 20px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  box-shadow: ${({ theme }) => theme.boxShadow || '0 2px 8px rgba(0,0,0,0.2)'};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
`;

const LogoCircle = styled.div`
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const LogoImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
`;

const CardTitleBlock = styled.div`
  flex: 1;
`;

const CardTitle = styled.h1`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0 0 8px 0;
  line-height: 1.3;
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

const CardMeta = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const MarcarButton = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 16px 20px;
  margin-top: 16px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.05s;
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover || theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
    text-decoration: none;
  }
  &:active {
    transform: scale(0.98);
  }
`;

const MarcarIcon = styled(FaCalendarAlt)`
  font-size: 1.25rem;
`;

const OptionsSection = styled.section`
  max-width: 520px;
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 12px;
  padding: 20px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const OptionsTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const OptionLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMain};
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  cursor: pointer;
  transition: background-color 0.2s;
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
    color: ${({ theme }) => theme.colors.textMain};
    text-decoration: none;
  }
`;

const OptionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1rem;
`;

const OptionChevron = styled.span`
  margin-left: auto;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.85rem;
`;

const FooterText = styled.footer`
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 28px;
  padding-bottom: 16px;
  font-size: 0.85rem;
`;

const CORE_NAME = 'CORE - Centro da Otimização da Reabilitação e do Exercício';
const CORE_ADDRESS = 'R. da Marcha Gualteriana 596, 4810-264 Guimarães';

function EntryPage() {
  const theme = useTheme();

  return (
    <PageContainer>
      <TogglerContainer>
        <ThemeToggler />
      </TogglerContainer>

      <CoreCard>
        <CardHeader>
          <LogoCircle>
            <LogoImage src={theme.logoUrl} alt="CORE" />
          </LogoCircle>
          <CardTitleBlock>
            <CardTitle>{CORE_NAME}</CardTitle>
            <CardMeta>
              <span>{CORE_ADDRESS}</span>
              <span>·</span>
              <span>Aberto até 20:00</span>
            </CardMeta>
          </CardTitleBlock>
        </CardHeader>
        <MarcarButton to="/marcar">
          <MarcarIcon />
          Marcar
        </MarcarButton>
      </CoreCard>

      <OptionsSection>
        <OptionsTitle>Ou aceder à sua conta</OptionsTitle>
        <OptionList>
          <OptionLink to="/login">
            <OptionIcon><FaUser /></OptionIcon>
            Entrar como cliente
            <OptionChevron>›</OptionChevron>
          </OptionLink>
          <OptionLink to="/login-staff">
            <OptionIcon><FaUserShield /></OptionIcon>
            Área de funcionários
            <OptionChevron>›</OptionChevron>
          </OptionLink>
          <OptionLink to="/register">
            <OptionIcon><FaUserPlus /></OptionIcon>
            Criar conta
            <OptionChevron>›</OptionChevron>
          </OptionLink>
        </OptionList>
      </OptionsSection>

      <FooterText>
        &copy; {new Date().getFullYear()} CORE Studio. Todos os direitos reservados.
      </FooterText>
    </PageContainer>
  );
}

export default EntryPage;
