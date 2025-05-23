// src/pages/admin/AdminDashboardPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext'; // Ajusta o caminho se necessário

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: #1A1A1A;
  color: #E0E0E0;
  min-height: 100vh;
  padding: 20px 40px; // Padding base
  font-family: 'Inter', sans-serif;

  @media (max-width: 768px) {
    padding: 20px 20px; // Reduz padding lateral em tablets/mobile
  }
  @media (max-width: 480px) {
    padding: 15px 15px; // Reduz mais em ecrãs muito pequenos
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #D4AF37;
  margin-bottom: 10px;
  text-align: center; // Centralizar título para um look mais consistente

  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
  @media (max-width: 480px) {
    font-size: 1.8rem; // Reduzir tamanho do título em mobile
    margin-bottom: 15px;
  }
`;

const WelcomeMessage = styled.p`
  font-size: 1.1rem;
  color: #b0b0b0;
  margin-bottom: 30px;
  text-align: center; // Centralizar mensagem de boas-vindas

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-bottom: 20px;
  }
`;

const AdminNavGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); // Já é responsivo!
  gap: 20px;
  margin-top: 20px;
`;

const AdminNavLinkCard = styled(Link)`
  background-color: #252525;
  padding: 25px;
  border-radius: 10px;
  text-decoration: none;
  color: #E0E0E0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center; // Mantém centrado
  justify-content: center; // Mantém centrado
  text-align: center;
  min-height: 150px; // Garante uma altura mínima para consistência visual

  h2 {
    color: #D4AF37;
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 1.5rem; // Tamanho base
    @media (max-width: 480px) {
        font-size: 1.3rem; // Ligeiramente menor no mobile
    }
  }

  p {
    font-size: 0.9rem;
    color: #a0a0a0;
    line-height: 1.4;
    @media (max-width: 480px) {
        font-size: 0.85rem; // Ligeiramente menor no mobile
    }
  }

  &:hover {
    transform: translateY(-5px);
    background-color: #303030;
  }
`;

const AdminDashboardPage = () => {
  const { authState } = useAuth();

  return (
    <PageContainer>
      <Title>Painel de Administração CORE</Title>
      <WelcomeMessage>
        Bem-vindo(a), {authState.user?.firstName || 'Admin'} ({authState.user?.email})!
      </WelcomeMessage>
      
      <AdminNavGrid>
        <AdminNavLinkCard to="/admin/calendario-geral">
          <h2>Calendário Geral</h2>
          <p>Visualizar todos os treinos e consultas.</p>
        </AdminNavLinkCard>

        <AdminNavLinkCard to="/admin/manage-users">
          <h2>Gerir Clientes</h2>
          <p>Ver, criar, editar e eliminar contas de clientes.</p>
        </AdminNavLinkCard>
        
        <AdminNavLinkCard to="/admin/manage-staff">
          <h2>Gerir Equipa</h2>
          <p>Adicionar e gerir contas de instrutores e staff.</p>
        </AdminNavLinkCard>

        <AdminNavLinkCard to="/admin/manage-trainings">
          <h2>Gerir Treinos</h2>
          <p>Criar, visualizar, editar e eliminar sessões de treino.</p>
        </AdminNavLinkCard>

        <AdminNavLinkCard to="/admin/manage-appointments">
          <h2>Gerir Consultas</h2>
          <p>Criar, visualizar, editar e eliminar horários de consulta.</p>
        </AdminNavLinkCard>

        <AdminNavLinkCard to="/admin/manage-payments">
          <h2>Gerir Pagamentos</h2>
          <p>Registar e acompanhar pagamentos dos clientes.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/manage-exercises">
          <h2>Gerir Exercícios Base</h2>
          <p>Criar e editar os exercícios disponíveis para os planos.</p>
        </AdminNavLinkCard>
        <AdminNavLinkCard to="/admin/appointment-requests">
          <h2>Pedidos de Consulta</h2>
          <p>Ver e responder a pedidos de consulta pendentes.</p>
        </AdminNavLinkCard>
      </AdminNavGrid>
    </PageContainer>
  );
};

export default AdminDashboardPage;