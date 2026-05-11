// frontend/src/pages/admin/AdminManageAvailabilitySlotsPage.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import BackArrow from '../../components/BackArrow';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast/ToastProvider';
import { getAllStaffForSelection } from '../../services/staffService';
import { getAvailabilitySlotsService, setAvailabilitySlotsService } from '../../services/availabilityService';
import { FaSave, FaUndoAlt } from 'react-icons/fa';

const PageContainer = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: 0 clamp(15px, 4vw, 40px) 20px;
  font-family: ${({ theme }) => theme.fonts.main};
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  padding: 4px 0 10px;
`;

const Title = styled.h1`
  font-size: clamp(1.6rem, 4vw, 2.1rem);
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0;
  text-align: center;
  justify-self: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 14px;
  @media (min-width: 700px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 6px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMain};
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMain};
`;

const BlocksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  @media (min-width: 520px) {
    grid-template-columns: repeat(6, 1fr);
  }
  @media (min-width: 820px) {
    grid-template-columns: repeat(8, 1fr);
  }
`;

const BlockPill = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 999px;
  padding: 10px 8px;
  background: ${({ theme, $active }) => ($active ? `${theme.colors.primary}22` : theme.colors.background)};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textMain)};
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.05s ease, background 0.15s ease;
  &:active {
    transform: scale(0.98);
  }
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 14px;
`;

const ActionButton = styled.button`
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: ${({ theme, $variant }) =>
    $variant === 'primary' ? theme.colors.primary : theme.colors.buttonSecondaryBg};
  color: ${({ theme, $variant }) => ($variant === 'primary' ? theme.colors.textDark : theme.colors.textMain)};
  &:hover {
    background: ${({ theme, $variant }) =>
      $variant === 'primary' ? theme.colors.primaryHover : theme.colors.buttonSecondaryHoverBg};
  }
`;

const Meta = styled.div`
  margin-top: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const AdminManageAvailabilitySlotsPage = () => {
  const { authState } = useAuth();
  const { addToast } = useToast();

  const isAdmin = authState?.role === 'admin';

  const [staffOptions, setStaffOptions] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [allDayBlocks, setAllDayBlocks] = useState([]);
  const [defaultBlocks, setDefaultBlocks] = useState([]);
  const [mode, setMode] = useState('default');
  const [selectedBlocks, setSelectedBlocks] = useState(new Set());

  const selectedCount = selectedBlocks.size;

  useEffect(() => {
    if (!authState?.token) return;
    if (!isAdmin) {
      setStaffId(String(authState.id || ''));
      return;
    }
    getAllStaffForSelection(authState.token)
      .then((data) => {
        const allowed = (data || []).filter((s) =>
          ['physiotherapist', 'trainer', 'admin', 'osteopata', 'employee'].includes(s.role)
        );
        setStaffOptions(allowed);
        if (!staffId && allowed[0]?.id) setStaffId(String(allowed[0].id));
      })
      .catch(() => addToast('Erro ao carregar profissionais.', { type: 'error', category: 'availability' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState?.token, isAdmin]);

  const load = useCallback(async () => {
    if (!authState?.token) return;
    if (isAdmin && !staffId) return;
    setLoading(true);
    try {
      const data = await getAvailabilitySlotsService(
        { date, staffId: isAdmin ? staffId : undefined },
        authState.token
      );
      setAllDayBlocks(Array.isArray(data.allDayBlocks) ? data.allDayBlocks : []);
      setDefaultBlocks(Array.isArray(data.defaults) ? data.defaults : []);
      setMode(data.mode || 'default');
      const initial = new Set(Array.isArray(data.blocks) ? data.blocks : []);
      setSelectedBlocks(initial);
    } catch (e) {
      addToast(e.message || 'Erro ao carregar disponibilidade.', { type: 'error', category: 'availability' });
    } finally {
      setLoading(false);
    }
  }, [authState?.token, authState.token, date, isAdmin, staffId, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleBlock = (t) => {
    setSelectedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
    setMode('custom');
  };

  const handleResetToDefault = () => {
    setSelectedBlocks(new Set(defaultBlocks));
    setMode('default');
  };

  const handleSave = async () => {
    if (!authState?.token) return;
    if (isAdmin && !staffId) return;
    setSaving(true);
    try {
      const blocks = Array.from(selectedBlocks).sort();
      await setAvailabilitySlotsService(
        { date, staffId: isAdmin ? staffId : undefined, blocks },
        authState.token
      );
      addToast('Disponibilidade guardada.', { type: 'success', category: 'availability' });
      await load();
    } catch (e) {
      addToast(e.message || 'Erro ao guardar.', { type: 'error', category: 'availability' });
    } finally {
      setSaving(false);
    }
  };

  const staffLabel = useMemo(() => {
    if (!isAdmin) return 'Profissional';
    return 'Profissional';
  }, [isAdmin]);

  return (
    <PageContainer>
      <Header>
        <BackArrow to="/admin/dashboard" />
        <Title>Disponibilidade</Title>
        <div />
      </Header>

      <Card>
        <Row>
          <div>
            <Label>{staffLabel}</Label>
            {isAdmin ? (
              <Select value={staffId} onChange={(e) => setStaffId(e.target.value)} disabled={loading || saving}>
                {staffOptions.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </Select>
            ) : (
              <Input value={`${authState?.firstName || ''} ${authState?.lastName || ''}`.trim()} readOnly />
            )}
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={loading || saving} />
          </div>
        </Row>

        <BlocksGrid>
          {(allDayBlocks || []).map((t) => (
            <BlockPill
              key={t}
              type="button"
              onClick={() => toggleBlock(t)}
              $active={selectedBlocks.has(t)}
              disabled={loading || saving}
              aria-pressed={selectedBlocks.has(t)}
              title={selectedBlocks.has(t) ? 'Disponível' : 'Indisponível'}
            >
              {t}
            </BlockPill>
          ))}
        </BlocksGrid>

        <Actions>
          <ActionButton type="button" onClick={handleResetToDefault} disabled={loading || saving} $variant="secondary">
            <FaUndoAlt /> Repor default
          </ActionButton>
          <ActionButton type="button" onClick={handleSave} disabled={loading || saving} $variant="primary">
            <FaSave /> {saving ? 'A guardar…' : 'Guardar'}
          </ActionButton>
        </Actions>

        <Meta>
          <div>
            {loading ? 'A carregar…' : `Blocos selecionados: ${selectedCount}`}
          </div>
          <div>Modo: {mode === 'custom' ? 'Personalizado' : 'Default'}</div>
        </Meta>
      </Card>
    </PageContainer>
  );
};

export default AdminManageAvailabilitySlotsPage;

