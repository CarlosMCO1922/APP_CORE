// frontend/src/pages/admin/AdminLogsPage.js
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { getErrorLogsService, getErrorLogByIdService, getSecurityLogsService, resolveErrorLogService, getLogsStatsService, exportLogsService } from '../../services/logService';
import { FaExclamationTriangle, FaShieldAlt, FaCheck, FaTimes, FaSearch, FaFilter, FaDownload, FaChartLine } from 'react-icons/fa';
import BackArrow from '../../components/BackArrow';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Styled Components ---
const PageContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textMain};
  min-height: 100vh;
  padding: 20px clamp(15px, 4vw, 40px);
  font-family: ${({ theme }) => theme.fonts.main};
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.cardBorder};
`;

const Tab = styled.button`
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 3px solid ${({ active, theme }) => active ? theme.colors.primary : 'transparent'};
  color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.textMuted};
  font-weight: ${({ active }) => active ? 600 : 400};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const FiltersContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  cursor: pointer;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme, color }) => color || theme.colors.textMain};
`;

const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  background-color: ${({ theme }) => theme.colors.cardBackground};
`;

const Table = styled.table`
  width: 100%;
  min-width: 1000px;
  border-collapse: collapse;
  
  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    padding: 12px;
    text-align: left;
    font-size: 0.85rem;
  }
  
  th {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  tbody tr:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
  
  tr:last-child td {
    border-bottom: none;
  }
`;

const SeverityBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  background-color: ${({ severity, theme }) => {
    switch (severity) {
      case 'CRITICAL': return `${theme.colors.error}30`;
      case 'HIGH': return `${theme.colors.error}20`;
      case 'MEDIUM': return `${theme.colors.warning || theme.colors.primary}20`;
      default: return `${theme.colors.textMuted}20`;
    }
  }};
  color: ${({ severity, theme }) => {
    switch (severity) {
      case 'CRITICAL': return theme.colors.error;
      case 'HIGH': return theme.colors.error;
      case 'MEDIUM': return theme.colors.warning || theme.colors.primary;
      default: return theme.colors.textMuted;
    }
  }};
`;

const ResolvedBadge = styled.span`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  background-color: ${({ resolved, theme }) => 
    resolved ? `${theme.colors.success}30` : `${theme.colors.warning}30`};
  color: ${({ resolved, theme }) => 
    resolved ? theme.colors.success : theme.colors.warning};
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  font-size: 0.8rem;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMain};
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
`;

const LoadingText = styled.p`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ErrorText = styled.p`
  text-align: center;
  padding: 20px;
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-radius: ${({ theme }) => theme.borderRadius};
  margin: 20px 0;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
`;

const PaginationButton = styled.button`
  padding: 8px 12px;
  background-color: ${({ active, theme }) => 
    active ? theme.colors.primary : theme.colors.buttonSecondaryBg};
  color: ${({ active, theme }) => 
    active ? theme.colors.textDark : theme.colors.textMain};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  cursor: pointer;
  font-size: 0.9rem;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    background-color: ${({ active, theme }) => 
      active ? theme.colors.primaryHover : theme.colors.buttonSecondaryHoverBg};
  }
`;

const ExportButton = styled.button`
  padding: 10px 18px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ChartCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 15px;
`;

const TabsWithActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
`;

const DetailModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  padding: 20px;
`;

const DetailModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || '#1e1e1e'};
  padding: 24px;
  border-radius: ${({ theme }) => theme.borderRadius || '8px'};
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
`;

const DetailModalTitle = styled.h3`
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 16px 0;
  font-size: 1.2rem;
`;

const DetailRow = styled.div`
  margin-bottom: 12px;
  font-size: 0.9rem;
  word-break: break-all;
  & strong { color: ${({ theme }) => theme.colors.textMuted}; display: inline-block; min-width: 100px; }
`;

const DetailPre = styled.pre`
  background: rgba(0,0,0,0.3);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
`;

const AdminLogsPage = () => {
  const { authState } = useAuth();
  const [activeTab, setActiveTab] = useState('errors'); // 'errors' ou 'security'
  const [errorLogs, setErrorLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [chartsData, setChartsData] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [detailLog, setDetailLog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    severity: '',
    errorType: '',
    eventType: '',
    resolved: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  
  // Paginação
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 50,
  });

  const loadErrorLogs = async () => {
    if (!authState.token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const offset = (pagination.currentPage - 1) * pagination.limit;
      const data = await getErrorLogsService(
        authState.token,
        {
          severity: filters.severity || undefined,
          errorType: filters.errorType || undefined,
          resolved: filters.resolved || undefined,
          userId: filters.userId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
        pagination.limit,
        offset
      );
      
      setErrorLogs(data.logs || []);
      setStats(data.stats || {});
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages || 1,
      }));
    } catch (err) {
      setError(err.message || 'Erro ao carregar logs de erro.');
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    if (!authState.token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const offset = (pagination.currentPage - 1) * pagination.limit;
      const data = await getSecurityLogsService(
        authState.token,
        {
          eventType: filters.eventType || undefined,
          severity: filters.severity || undefined,
          userId: filters.userId || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        },
        pagination.limit,
        offset
      );
      
      setSecurityLogs(data.logs || []);
      setStats(data.stats || {});
      setPagination(prev => ({
        ...prev,
        totalPages: data.totalPages || 1,
      }));
    } catch (err) {
      setError(err.message || 'Erro ao carregar logs de segurança.');
      console.error('Erro ao carregar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadChartsData = async () => {
    if (!authState.token) return;
    
    setChartsLoading(true);
    try {
      const data = await getLogsStatsService(authState.token, 30);
      setChartsData(data);
    } catch (err) {
      console.error('Erro ao carregar dados dos gráficos:', err);
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'errors') {
      loadErrorLogs();
    } else {
      loadSecurityLogs();
    }
  }, [activeTab, pagination.currentPage, filters, authState.token]);

  useEffect(() => {
    if (showCharts && !chartsData) {
      loadChartsData();
    }
  }, [showCharts, authState.token]);

  const handleExport = async () => {
    if (!authState.token) return;
    
    setExporting(true);
    try {
      await exportLogsService(authState.token, activeTab, filters);
    } catch (err) {
      alert('Erro ao exportar logs: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleResolveError = async (logId) => {
    if (!authState.token) return;
    
    try {
      await resolveErrorLogService(authState.token, logId);
      // Recarregar logs
      if (activeTab === 'errors') {
        loadErrorLogs();
      }
    } catch (err) {
      alert('Erro ao marcar log como resolvido: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    } catch {
      return dateString;
    }
  };

  const handleOpenErrorDetail = async (log) => {
    setDetailLog(null);
    setDetailLoading(true);
    try {
      const full = await getErrorLogByIdService(authState.token, log.id);
      setDetailLog(full);
    } catch (err) {
      console.error('Erro ao carregar detalhe:', err);
      setDetailLog(log); // fallback para dados da linha
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailLog(null);
  };

  return (
    <PageContainer>
      <BackArrow />
      <HeaderContainer>
        <div>
          <Title>Central do Programador</Title>
          <p style={{ margin: '4px 0 0', fontSize: '0.95rem', color: 'var(--text-muted, #888)' }}>
            Erros e eventos de segurança — utilizador, hora e contexto
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ExportButton onClick={handleExport} disabled={exporting || loading}>
            <FaDownload /> {exporting ? 'A exportar...' : 'Exportar CSV'}
          </ExportButton>
          <ExportButton 
            onClick={() => {
              setShowCharts(!showCharts);
              if (!showCharts && !chartsData) {
                loadChartsData();
              }
            }}
            style={{ backgroundColor: showCharts ? '#27ae60' : undefined }}
          >
            <FaChartLine /> {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
          </ExportButton>
        </div>
      </HeaderContainer>

      {showCharts && chartsData && (
        <ChartsContainer>
          {activeTab === 'errors' ? (
            <>
              <ChartCard>
                <ChartTitle>Erros por Dia (últimos 30 dias)</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartsData.errorsByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#e74c3c" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard>
                <ChartTitle>Erros por Tipo</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartsData.errorsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#e74c3c" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard>
                <ChartTitle>Erros por Severidade</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartsData.errorsBySeverity}
                      dataKey="count"
                      nameKey="severity"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {chartsData.errorsBySeverity.map((entry, index) => {
                        const colors = {
                          CRITICAL: '#e74c3c',
                          HIGH: '#e67e22',
                          MEDIUM: '#f39c12',
                          LOW: '#95a5a6',
                        };
                        return <Cell key={`cell-${index}`} fill={colors[entry.severity] || '#95a5a6'} />;
                      })}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          ) : (
            <>
              <ChartCard>
                <ChartTitle>Eventos de Segurança por Dia (últimos 30 dias)</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartsData.securityByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#3498db" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard>
                <ChartTitle>Eventos por Tipo</ChartTitle>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartsData.securityByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3498db" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </>
          )}
        </ChartsContainer>
      )}

      {showCharts && chartsLoading && (
        <LoadingText>A carregar dados dos gráficos...</LoadingText>
      )}

      <TabsContainer>
        <Tab 
          active={activeTab === 'errors'} 
          onClick={() => {
            setActiveTab('errors');
            setPagination(prev => ({ ...prev, currentPage: 1 }));
          }}
        >
          <FaExclamationTriangle style={{ marginRight: '8px' }} />
          Erros ({stats.unresolved || 0} não resolvidos)
        </Tab>
        <Tab 
          active={activeTab === 'security'} 
          onClick={() => {
            setActiveTab('security');
            setPagination(prev => ({ ...prev, currentPage: 1 }));
          }}
        >
          <FaShieldAlt style={{ marginRight: '8px' }} />
          Segurança
        </Tab>
      </TabsContainer>

      <FiltersContainer>
        <FilterSelect
          value={filters.severity}
          onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
        >
          <option value="">Todas as severidades</option>
          <option value="CRITICAL">Crítico</option>
          <option value="HIGH">Alto</option>
          <option value="MEDIUM">Médio</option>
          <option value="LOW">Baixo</option>
        </FilterSelect>

        {activeTab === 'errors' ? (
          <>
            <FilterSelect
              value={filters.errorType}
              onChange={(e) => setFilters(prev => ({ ...prev, errorType: e.target.value }))}
            >
              <option value="">Todos os tipos</option>
              <option value="USER_ACTION_ERROR">Ação do utilizador (inscrever, cancelar, encerrar, apagar)</option>
              <option value="JS_ERROR">Erro JavaScript</option>
              <option value="API_ERROR">Erro API</option>
              <option value="VALIDATION_ERROR">Erro de Validação</option>
              <option value="NETWORK_ERROR">Erro de Rede</option>
              <option value="REACT_ERROR_BOUNDARY">Erro React</option>
              <option value="UNHANDLED_PROMISE_REJECTION">Promise Rejeitada</option>
            </FilterSelect>
            <FilterSelect
              value={filters.resolved}
              onChange={(e) => setFilters(prev => ({ ...prev, resolved: e.target.value }))}
            >
              <option value="">Todos</option>
              <option value="false">Não resolvidos</option>
              <option value="true">Resolvidos</option>
            </FilterSelect>
          </>
        ) : (
          <FilterSelect
            value={filters.eventType}
            onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
          >
            <option value="">Todos os eventos</option>
            <option value="UNAUTHORIZED_ACCESS_ATTEMPT">Tentativa de Acesso Não Autorizado</option>
            <option value="ROLE_MISMATCH">Discrepância de Role</option>
            <option value="TOKEN_TAMPERING">Manipulação de Token</option>
          </FilterSelect>
        )}

        <FilterInput
          type="text"
          placeholder="User ID (opcional)"
          value={filters.userId}
          onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
        />
        <FilterInput
          type="date"
          placeholder="Data início"
          value={filters.startDate}
          onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
        />
        <FilterInput
          type="date"
          placeholder="Data fim"
          value={filters.endDate}
          onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
        />
      </FiltersContainer>

      {stats.total !== undefined && (
        <StatsContainer>
          <StatCard>
            <StatLabel>Total</StatLabel>
            <StatValue>{stats.total || 0}</StatValue>
          </StatCard>
          {activeTab === 'errors' && (
            <StatCard>
              <StatLabel>Não Resolvidos</StatLabel>
              <StatValue color="#f39c12">{stats.unresolved || 0}</StatValue>
            </StatCard>
          )}
          <StatCard>
            <StatLabel>Críticos</StatLabel>
            <StatValue color="#e74c3c">
              {stats.bySeverity?.find(s => s.severity === 'CRITICAL')?.count || 0}
            </StatValue>
          </StatCard>
          <StatCard>
            <StatLabel>Altos</StatLabel>
            <StatValue color="#e67e22">
              {stats.bySeverity?.find(s => s.severity === 'HIGH')?.count || 0}
            </StatValue>
          </StatCard>
        </StatsContainer>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <LoadingText>A carregar logs...</LoadingText>
      ) : (
        <>
          <TableWrapper>
            <Table>
              <thead>
                {activeTab === 'errors' ? (
                  <tr>
                    <th>ID</th>
                    <th>Data / Hora</th>
                    <th>Tipo</th>
                    <th>Mensagem</th>
                    <th>URL</th>
                    <th>Severidade</th>
                    <th>Utilizador</th>
                    <th>Estado</th>
                    <th>Ações</th>
                  </tr>
                ) : (
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Tipo de Evento</th>
                    <th>Descrição</th>
                    <th>Severidade</th>
                    <th>Utilizador</th>
                    <th>IP</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {activeTab === 'errors' ? (
                  errorLogs.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                        Nenhum log de erro encontrado
                      </td>
                    </tr>
                  ) : (
                    errorLogs.map((log) => (
                      <tr key={log.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenErrorDetail(log)}>
                        <td>{log.id}</td>
                        <td>{formatDate(log.createdAt)}</td>
                        <td>{log.errorType}</td>
                        <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.message}
                        </td>
                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.url || ''}>
                          {log.url || '-'}
                        </td>
                        <td><SeverityBadge severity={log.severity}>{log.severity}</SeverityBadge></td>
                        <td>
                          {log.user ? `${log.user.firstName} ${log.user.lastName}${log.user.email ? ` (${log.user.email})` : ''} [ID: ${log.user.id}]` : '-'}
                        </td>
                        <td>
                          <ResolvedBadge resolved={log.resolved}>
                            {log.resolved ? 'Resolvido' : 'Pendente'}
                          </ResolvedBadge>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {!log.resolved && (
                            <ActionButton onClick={() => handleResolveError(log.id)}>
                              <FaCheck /> Resolvido
                            </ActionButton>
                          )}
                        </td>
                      </tr>
                    ))
                  )
                ) : (
                  securityLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                        Nenhum log de segurança encontrado
                      </td>
                    </tr>
                  ) : (
                    securityLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.id}</td>
                        <td>{formatDate(log.createdAt)}</td>
                        <td>{log.eventType}</td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.description}
                        </td>
                        <td><SeverityBadge severity={log.severity}>{log.severity}</SeverityBadge></td>
                        <td>
                          {log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.id})` : '-'}
                        </td>
                        <td>{log.ipAddress || '-'}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </Table>
          </TableWrapper>

          {pagination.totalPages > 1 && (
            <PaginationContainer>
              <PaginationButton
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
              >
                Anterior
              </PaginationButton>
              <span>
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <PaginationButton
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Próxima
              </PaginationButton>
            </PaginationContainer>
          )}
        </>
      )}

      {/* Modal de detalhe do erro */}
      {(detailLog || detailLoading) && (
        <DetailModalOverlay onClick={handleCloseDetail}>
          <DetailModalContent onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <LoadingText>A carregar detalhe...</LoadingText>
            ) : detailLog ? (
              <>
                <DetailModalTitle>Detalhe do erro #{detailLog.id}</DetailModalTitle>
                <DetailRow><strong>Data / Hora:</strong> {formatDate(detailLog.createdAt)}</DetailRow>
                <DetailRow><strong>Tipo:</strong> {detailLog.errorType}</DetailRow>
                <DetailRow><strong>Severidade:</strong> <SeverityBadge severity={detailLog.severity}>{detailLog.severity}</SeverityBadge></DetailRow>
                <DetailRow><strong>Mensagem:</strong> {detailLog.message}</DetailRow>
                <DetailRow><strong>URL:</strong> {detailLog.url || '-'}</DetailRow>
                <DetailRow>
                  <strong>Utilizador:</strong>{' '}
                  {detailLog.user
                    ? `${detailLog.user.firstName} ${detailLog.user.lastName}${detailLog.user.email ? ` (${detailLog.user.email})` : ''} [ID: ${detailLog.user.id}]`
                    : '-'}
                </DetailRow>
                {detailLog.stackTrace && (
                  <>
                    <DetailRow><strong>Stack trace:</strong></DetailRow>
                    <DetailPre>{detailLog.stackTrace}</DetailPre>
                  </>
                )}
                {detailLog.deviceInfo && (
                  <>
                    <DetailRow><strong>Dispositivo:</strong></DetailRow>
                    <DetailPre>{JSON.stringify(detailLog.deviceInfo, null, 2)}</DetailPre>
                  </>
                )}
                {detailLog.metadata && Object.keys(detailLog.metadata).length > 0 && (
                  <>
                    <DetailRow><strong>Metadata:</strong></DetailRow>
                    <DetailPre>{JSON.stringify(detailLog.metadata, null, 2)}</DetailPre>
                  </>
                )}
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  {!detailLog.resolved && (
                    <ActionButton onClick={() => { handleResolveError(detailLog.id); handleCloseDetail(); loadErrorLogs(); }}>
                      <FaCheck /> Marcar como Resolvido
                    </ActionButton>
                  )}
                  <ActionButton onClick={handleCloseDetail}><FaTimes /> Fechar</ActionButton>
                </div>
              </>
            ) : null}
          </DetailModalContent>
        </DetailModalOverlay>
      )}
    </PageContainer>
  );
};

export default AdminLogsPage;
