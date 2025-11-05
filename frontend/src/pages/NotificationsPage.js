// src/pages/NotificationsPage.js
import React, { useEffect, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FaBell, FaCheckDouble, FaArrowLeft, FaExternalLinkAlt, FaRegClock } from 'react-icons/fa';
import { useToast } from '../components/Toast/ToastProvider';
import { markNotificationAsReadService } from '../services/notificationService';



// --- Styled Components ---
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
  gap: 15px;
`;

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 2.8rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 25px;
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.borderRadius};
  transition: background-color 0.2s, color 0.2s;
  font-size: 0.95rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.cardBackground};
    color: ${({ theme }) => theme.colors.textMain};
  }
`;

const NotificationListContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(15px, 3vw, 25px);
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const SectionHeader = styled.h3`
  margin: 18px 0 10px 0; font-size: 0.95rem; font-weight: 600; color: ${({ theme }) => theme.colors.textMuted};
  border-bottom: 1px dashed ${({ theme }) => theme.colors.cardBorder}; padding-bottom: 6px;
`;

const NotificationItem = styled.label`
  display: block;
  background-color: ${props => props.$isRead ? props.theme.colors.cardBackground : props.theme.colors.cardBackgroundDarker};
  padding: ${props => props.$dense ? '10px' : '15px'};
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 4px solid ${props => props.$isRead ? props.theme.colors.textMuted : props.theme.colors.primary};
  outline: ${props => props.$focused ? `2px solid ${props.theme.colors.primary}` : 'none'};
  outline-offset: 2px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s, outline-color 0.2s;

  &:last-child { margin-bottom: 0; }
  &:hover { background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg}; border-left-color: ${({ theme }) => theme.colors.primary}; }

  display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: flex-start;
  input[type='checkbox'] { margin-top: 4px; }

  p { margin: 0 0 8px 0; font-size: ${props => props.$dense ? '0.85rem' : '0.9rem'}; line-height: 1.5; color: ${props => props.$isRead ? props.theme.colors.textMuted : props.theme.colors.textMain}; }
  small { font-size: ${props => props.$dense ? '0.7rem' : '0.75rem'}; color: ${({ theme }) => theme.colors.textMuted}; display: flex; align-items: center; gap: 5px; }
`;

const Chip = styled.span`
  display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 2px 8px; font-size: 0.7rem; font-weight: 600;
  background: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'new': return theme.colors.successBg;
      case 'payment': return 'rgba(212, 175, 55, 0.15)';
      case 'calendar': return theme.colors.buttonSecondaryBg;
      default: return 'transparent';
    }
  }};
  color: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'new': return theme.colors.success;
      case 'payment': return '#D4AF37';
      case 'calendar': return theme.colors.primary;
      default: return theme.colors.textMuted;
    }
  }};
  border: 1px solid ${({ theme, $variant }) => {
    switch ($variant) {
      case 'new': return theme.colors.success;
      case 'payment': return '#D4AF37';
      case 'calendar': return theme.colors.primary;
      default: return theme.colors.cardBorder;
    }
  }};
`;

const MarkAllReadButtonStyled = styled.button`
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMain};
  padding: 8px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 25px;
  gap: 10px;

  button {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
    padding: 8px 15px;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius};
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  &:hover:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.primaryHover};
    }
    &:disabled {
      background-color: ${({ theme }) => theme.colors.disabledBg};
      color: ${({ theme }) => theme.colors.disabledText};
      cursor: not-allowed;
    }
  }
  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.9rem;
  }
`;

const LoadingText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.primary};
  padding: 20px; font-style: italic;
`;
const ErrorText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.error};
  padding: 15px; background-color: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid ${({ theme }) => theme.colors.error};
  border-radius: ${({ theme }) => theme.borderRadius}; margin: 20px 0;
`;
const EmptyStateText = styled.p`
  text-align: center; font-size: 1rem; color: ${({ theme }) => theme.colors.textMuted};
  padding: 30px 15px; background-color: rgba(0,0,0,0.1);
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const FilterBar = styled.div`
  position: sticky; top: 0; z-index: 5;
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 15px;
  padding: 8px 0;
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  select { background: ${({ theme }) => theme.colors.buttonSecondaryBg}; color: ${({ theme }) => theme.colors.textMain}; border: 1px solid ${({ theme }) => theme.colors.cardBorder}; border-radius: 6px; padding: 6px 10px; }
  button.bulk, button.toggle { background: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textDark}; border: none; border-radius: 6px; padding: 8px 12px; cursor: pointer; }
`;

const SkeletonList = styled.div`
  .row { height: 64px; background: #444; border-radius: 8px; opacity: .25; animation: pulse 1.2s ease-in-out infinite; margin-bottom: 12px; }
`;

const NotificationsPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    notifications,
    unreadCount,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotifications();

  const ITEMS_PER_PAGE = 15;
  const [statusFilter, setStatusFilter] = React.useState(() => localStorage.getItem('notif_statusFilter') || 'all');
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [dense, setDense] = React.useState(() => localStorage.getItem('notif_density') === 'dense');
  const [collapsedGroups, setCollapsedGroups] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_collapsedGroups')||'{}'); } catch { return {}; }
  }); // key -> true/false
  const [sortOrder, setSortOrder] = React.useState(() => localStorage.getItem('notif_sortOrder') || 'desc'); // 'desc' | 'asc'
  const [focusedId, setFocusedId] = React.useState(null);

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchNotifications(1, ITEMS_PER_PAGE, statusFilter === 'all' ? null : statusFilter);
    }
  }, [authState.isAuthenticated, fetchNotifications, statusFilter]);

  // Persist preferences
  useEffect(() => { localStorage.setItem('notif_statusFilter', statusFilter); }, [statusFilter]);
  useEffect(() => { localStorage.setItem('notif_density', dense ? 'dense' : 'comfortable'); }, [dense]);
  useEffect(() => { localStorage.setItem('notif_collapsedGroups', JSON.stringify(collapsedGroups)); }, [collapsedGroups]);
  useEffect(() => { localStorage.setItem('notif_sortOrder', sortOrder); }, [sortOrder]);


  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleNotificationOpen = (notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchNotifications(newPage, ITEMS_PER_PAGE, statusFilter === 'all' ? null : statusFilter);
    }
  };

  const handleFilterChange = (e) => {
    const v = e.target.value;
    setStatusFilter(v);
    setSelectedIds(new Set());
    fetchNotifications(1, ITEMS_PER_PAGE, v === 'all' ? null : v);
  };

  const handleMarkAllReadClick = async () => {
      await markAllNotificationsAsRead();
      fetchNotifications(currentPage, ITEMS_PER_PAGE, null);
  };

  const groupByDay = (items) => {
    const today = new Date();
    const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const labelFor = d => {
      const dd = new Date(d);
      const diffDays = (startOfDay(today) - startOfDay(dd)) / (24*60*60*1000);
      if (diffDays === 0) return 'Hoje';
      if (diffDays === 1) return 'Ontem';
      return dd.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'short' });
    };
    const map = new Map();
    const itemsSorted = items.slice().sort((a,b)=> sortOrder === 'desc' ? (new Date(b.createdAt)-new Date(a.createdAt)) : (new Date(a.createdAt)-new Date(b.createdAt)) );

    // If many distinct days, coalesce into weekly buckets except for Today/Yesterday
    const uniqueDays = new Set(itemsSorted.map(n => new Date(n.createdAt).toDateString()));
    const manyDays = uniqueDays.size > 7;

    const startOfWeek = d => {
      const date = new Date(d);
      const day = (date.getDay() + 6) % 7; // Monday=0
      date.setHours(0,0,0,0);
      date.setDate(date.getDate() - day);
      return date.getTime();
    };

    const thisWeekStart = startOfWeek(today);
    const lastWeekStart = thisWeekStart - 7*24*60*60*1000;

    itemsSorted.forEach(n => {
      const created = new Date(n.createdAt);
      const dayKey = created.toDateString();
      if (manyDays) {
        const s = startOfWeek(created);
        let key, label;
        if (startOfDay(created) === startOfDay(today)) {
          key = 'today'; label = 'Hoje';
        } else if (startOfDay(created) === startOfDay(new Date(today.getTime()-24*60*60*1000))) {
          key = 'yesterday'; label = 'Ontem';
        } else if (s === thisWeekStart) {
          key = 'this_week'; label = 'Esta semana';
        } else if (s === lastWeekStart) {
          key = 'last_week'; label = 'Semana passada';
        } else {
          key = dayKey; label = labelFor(created);
        }
        if (!map.has(key)) map.set(key, { key, label, items: [] });
        map.get(key).items.push(n);
      } else {
        if (!map.has(dayKey)) map.set(dayKey, { key: dayKey, label: labelFor(created), items: [] });
        map.get(dayKey).items.push(n);
      }
    });

    return Array.from(map.values());
  };

  const visibleList = React.useMemo(() => {
    const groups = groupByDay(notifications);
    const list = [];
    groups.forEach(sec => {
      const items = (collapsedGroups[sec.key] ? sec.items.slice(0,5) : sec.items);
      items.forEach(n => list.push(n));
    });
    return list;
  }, [notifications, collapsedGroups, sortOrder, statusFilter]);

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.size === 0) return;
    try {
      const toMark = notifications.filter(n => selectedIds.has(n.id) && !n.isRead);
      for (const n of toMark) {
        await markNotificationAsReadService(n.id, authState.token);
      }
      addToast('Notificações selecionadas marcadas como lidas.', { type: 'success' });
      setSelectedIds(new Set());
      fetchNotifications(currentPage, ITEMS_PER_PAGE, statusFilter === 'all' ? null : statusFilter);
    } catch (err) {
      addToast('Falha ao marcar selecionadas.', { type: 'error' });
    }
  };

  // Keyboard shortcuts: 'a' select all visible, 'r' mark selected as read, arrows navigate, Enter open
  useEffect(() => {
    const onKey = (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      const key = e.key.toLowerCase();
      if (key === 'a') {
        e.preventDefault();
        const allIds = new Set(visibleList.map(n => n.id));
        setSelectedIds(allIds);
      } else if (key === 'r') {
        e.preventDefault();
        handleMarkSelectedAsRead();
      } else if (key === 'arrowdown') {
        e.preventDefault();
        const idx = visibleList.findIndex(n => n.id === focusedId);
        const next = visibleList[Math.min((idx < 0 ? -1 : idx) + 1, visibleList.length - 1)];
        if (next) setFocusedId(next.id);
      } else if (key === 'arrowup') {
        e.preventDefault();
        const idx = visibleList.findIndex(n => n.id === focusedId);
        const prev = visibleList[Math.max((idx < 0 ? 0 : idx) - 1, 0)];
        if (prev) setFocusedId(prev.id);
      } else if (key === 'enter') {
        if (focusedId) {
          const item = visibleList.find(n => n.id === focusedId);
          if (item) handleNotificationOpen(item);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visibleList, focusedId, handleMarkSelectedAsRead]);

  return (
    <PageContainer>
      <BackLink to={authState.role === 'user' ? "/dashboard" : "/admin/dashboard"}>
        ←
      </BackLink>
      <HeaderContainer>
        <Title><FaBell /> Minhas Notificações</Title>
        <FilterBar>
          <select value={statusFilter} onChange={handleFilterChange} aria-label="Filtro de estado">
            <option value="all">Todas</option>
            <option value="unread">Não Lidas</option>
            <option value="read">Lidas</option>
          </select>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} aria-label="Ordenar">
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigas</option>
          </select>
          <button className="toggle" onClick={() => setDense(d => !d)} aria-pressed={dense}>{dense ? 'Confortável' : 'Compacta'}</button>
          <button className="toggle" onClick={() => setSelectedIds(new Set())}>Limpar seleção</button>
          <button className="toggle" onClick={() => setSelectedIds(new Set(visibleList.map(n => n.id)))}>Selecionar página</button>
          {selectedIds.size > 0 && (
            <button className="bulk" onClick={handleMarkSelectedAsRead} disabled={isLoading}>Marcar selecionadas</button>
          )}
          {notifications.length > 0 && unreadCount > 0 && (
            <MarkAllReadButtonStyled onClick={handleMarkAllReadClick} disabled={isLoading || unreadCount === 0}>
              <FaCheckDouble /> Marcar todas como lidas ({unreadCount})
            </MarkAllReadButtonStyled>
          )}
        </FilterBar>
      </HeaderContainer>

      {isLoading && notifications.length === 0 && (
        <>
          <LoadingText>A carregar notificações...</LoadingText>
          <SkeletonList>
            {Array.from({length:6}).map((_,i)=>(<div className="row" key={i} />))}
          </SkeletonList>
          <style>{`@keyframes pulse { 0%{opacity:.2} 50%{opacity:.5} 100%{opacity:.2} }`}</style>
        </>
      )}
      {error && <ErrorText>{error}</ErrorText>}

      {!isLoading && !error && notifications.length === 0 && (
        <EmptyStateText>Não tem notificações de momento.</EmptyStateText>
      )}

      {!error && notifications.length > 0 && (
        <NotificationListContainer>
          {groupByDay(notifications).map(section => (
            <Fragment key={section.key}>
              <SectionHeader>{section.label}</SectionHeader>
              {(collapsedGroups[section.key] ? section.items.slice(0, 5) : section.items).map(notif => (
                <NotificationItem key={notif.id} $isRead={notif.isRead} $dense={dense} $focused={focusedId === notif.id} title={notif.isRead ? "Lida" : "Não lida. Clique para ler e aceder."}>
                  <input type="checkbox" checked={selectedIds.has(notif.id)} onChange={() => toggleSelect(notif.id)} aria-label={`Selecionar notificação ${notif.id}`} />
                  <div onClick={() => handleNotificationOpen(notif)}>
                    <p>
                      {!notif.isRead && <Chip $variant="new" style={{marginRight: 8}}>nova</Chip>}
                      {notif.message}
                    </p>
                    <small>
                      <FaRegClock /> {new Date(notif.createdAt).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                      {notif.type && (
                        <Chip style={{marginLeft: 8}} $variant={(notif.type || '').includes('PAY') ? 'payment' : ((notif.type || '').includes('APPOINT') || (notif.type || '').includes('TRAIN') || (notif.type || '').includes('CALENDAR')) ? 'calendar' : 'system'}>
                          {notif.type.replace(/_/g, ' ').toLowerCase()}
                        </Chip>
                      )}
                      {notif.link && <FaExternalLinkAlt style={{marginLeft: 'auto', color: theme.colors.primary}} title="Ir para"/>}
                    </small>
                  </div>
                </NotificationItem>
              ))}
              {section.items.length > 5 && (
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <MarkAllReadButtonStyled onClick={() => setCollapsedGroups(prev => ({ ...prev, [section.key]: !prev[section.key] }))}>
                    {collapsedGroups[section.key] ? 'Ver mais' : 'Ver menos'}
                  </MarkAllReadButtonStyled>
                </div>
              )}
            </Fragment>
          ))}
        </NotificationListContainer>
      )}

      {totalPages > 1 && (
        <PaginationControls>
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || isLoading}>
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || isLoading}>
            Próxima
          </button>
        </PaginationControls>
      )}
    </PageContainer>
  );
};

export default NotificationsPage;