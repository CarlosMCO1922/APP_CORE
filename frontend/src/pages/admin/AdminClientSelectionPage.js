// src/pages/admin/AdminClientSelectionPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { adminGetAllUsers } from '../../services/userService';
import { FaUserGraduate, FaSearch, FaArrowLeft } from 'react-icons/fa';
import BackArrow from '../../components/BackArrow';

// --- Styled Components (podes adaptar de outras páginas de admin) ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 25px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s, color 0.2s;
  font-size: 0.9rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: #fff;
  }
`;

const SearchInput = styled.input`
  flex-grow: 1;
  padding: 10px 14px;
  background-color: ${({ theme }) => theme.colors.inputBg || '#333'};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.95rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ClientList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const ClientCard = styled(Link)`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0,0,0,0.2);
  }

  h4 {
    margin: 0 0 5px 0;
    color: ${({ theme }) => theme.colors.textMain};
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const AdminClientSelectionPage = () => {
    const { authState } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (authState.token) {
            setLoading(true);
            adminGetAllUsers(authState.token)
                .then(data => setClients(data.filter(u => !u.isStaff && !u.isAdmin)))
                .catch(err => setError("Erro ao carregar clientes."))
                .finally(() => setLoading(false));
        }
    }, [authState.token]);

    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        return clients.filter(client =>
            `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    if (loading) return <PageContainer><p>A carregar clientes...</p></PageContainer>;
    if (error) return <PageContainer><p style={{color: 'red'}}>{error}</p></PageContainer>;

    return (
        <PageContainer>
            <HeaderContainer>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <BackArrow to="/admin/dashboard" />
                    <Title><FaUserGraduate /> Progresso dos Clientes</Title>
                </div>
            </HeaderContainer>
            <SearchInput 
                type="text"
                placeholder="Pesquisar cliente por nome ou email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <ClientList>
                {filteredClients.map(client => (
                    <ClientCard key={client.id} to={`/admin/progresso-clientes/${client.id}`}>
                        <h4>{client.firstName} {client.lastName}</h4>
                        <p>{client.email}</p>
                    </ClientCard>
                ))}
            </ClientList>
            {filteredClients.length === 0 && <p>Nenhum cliente encontrado.</p>}
        </PageContainer>
    );
};
export default AdminClientSelectionPage;