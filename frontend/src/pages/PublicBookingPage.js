// frontend/src/pages/PublicBookingPage.js
// Página pública para pedir consulta ou inscrever-se em treino experimental (sem conta). Rota: /marcar
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import {
  getStaffForAppointments,
  getAvailableSlots,
  submitPublicAppointmentRequest,
  getPublicTrainings,
  submitGuestTrainingSignup,
} from '../services/publicBookingService';
import ThemeToggler from '../components/Theme/ThemeToggler';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

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

const ContentBox = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 28px 24px;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0 0 8px 0;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 24px 0;
  text-align: center;
`;

const TabRow = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const TabButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  background: none;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textMuted)};
  border-bottom: 3px solid ${({ theme, $active }) => ($active ? theme.colors.primary : 'transparent')};
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s;
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const TrainingCard = styled.div`
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  transition: border-color 0.2s, background-color 0.2s;
  &.selected {
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.primary}15;
  }
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TrainingCardTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMain};
  margin-bottom: 4px;
`;

const TrainingCardMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMain};
  display: block;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const Message = styled.p`
  font-size: 0.9rem;
  padding: 12px 14px;
  border-radius: 8px;
  margin: 0 0 12px 0;
  border: 1px solid;
  &.success {
    color: ${({ theme }) => theme.colors.success};
    background-color: ${({ theme }) => theme.colors.successBg};
    border-color: ${({ theme }) => theme.colors.success};
  }
  &.error {
    color: ${({ theme }) => theme.colors.error};
    background-color: ${({ theme }) => theme.colors.errorBg};
    border-color: ${({ theme }) => theme.colors.error};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  cursor: pointer;
  transition: opacity 0.2s;
  margin-top: 8px;
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoginLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 20px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const DayGroup = styled.div`
  margin-bottom: 12px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  overflow: hidden;
`;

const DayHeading = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
`;

const DayContent = styled.div`
  padding: 0 16px 12px 16px;
  background: ${({ theme }) => theme.colors.background};
`;

const TimeSlot = styled.div`
  margin-top: 12px;
`;

const TimeSlotLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const QuestionnaireSection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const QuestionnaireTitle = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMain};
  margin: 0 0 16px 0;
`;

const DURATION_MINUTES = 60;

function formatDayLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('pt-PT', options);
}

const TAB_CONSULTA = 'consulta';
const TAB_TREINO = 'treino';

function PublicBookingPage() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(TAB_CONSULTA);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [trainings, setTrainings] = useState([]);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [selectedTrainingId, setSelectedTrainingId] = useState('');
  const [expandedDays, setExpandedDays] = useState(new Set());

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const data = await getStaffForAppointments();
      setStaff(data);
      if (data.length && !staffId) setStaffId(String(data[0].id));
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao carregar profissionais.' });
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  useEffect(() => {
    if (!date || !staffId) {
      setSlots([]);
      setTime('');
      return;
    }
    setLoadingSlots(true);
    setTime('');
    getAvailableSlots(date, staffId, DURATION_MINUTES)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, staffId]);

  const fetchTrainings = useCallback(async () => {
    setLoadingTrainings(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await getPublicTrainings();
      setTrainings(Array.isArray(data) ? data : []);
      if (!selectedTrainingId && data.length) setSelectedTrainingId('');
    } catch (err) {
      const msg = err.message || 'Erro ao carregar treinos.';
      setMessage({
        type: 'error',
        text: msg.includes('fetch') || msg.includes('Failed')
          ? 'Não foi possível ligar ao servidor. Verifica a ligação e tenta novamente.'
          : msg,
      });
    } finally {
      setLoadingTrainings(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === TAB_TREINO) fetchTrainings();
  }, [activeTab, fetchTrainings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setMessage({ type: 'error', text: 'Nome, email e telemóvel são obrigatórios.' });
      return;
    }
    if (!staffId || !date || !time) {
      setMessage({ type: 'error', text: 'Seleciona profissional, data e hora.' });
      return;
    }
    setSubmitting(true);
    try {
      await submitPublicAppointmentRequest({
        staffId: parseInt(staffId, 10),
        date,
        time,
        durationMinutes: DURATION_MINUTES,
        notes: notes.trim() || undefined,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
      });
      setMessage({
        type: 'success',
        text: 'Pedido enviado com sucesso. Receberá um email de confirmação e será contactado quando o profissional aprovar ou rejeitar.',
      });
      setNotes('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao enviar pedido.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitTreino = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setMessage({ type: 'error', text: 'Nome, email e telemóvel são obrigatórios.' });
      return;
    }
    if (!selectedTrainingId) {
      setMessage({ type: 'error', text: 'Seleciona um treino.' });
      return;
    }
    setSubmitting(true);
    try {
      await submitGuestTrainingSignup(parseInt(selectedTrainingId, 10), {
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
      });
      setMessage({
        type: 'success',
        text: 'Inscrição enviada com sucesso. Receberá um email de confirmação e será contactado quando o instrutor aprovar ou rejeitar.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao enviar inscrição.' });
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  const next10Days = useMemo(() => {
    const days = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 10; i++) {
      days.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, []);

  // Mostrar todos os treinos (mesmos que os clientes veem); hasVacancies apenas para permitir/desativar inscrição
  const trainingsWithVacancies = trainings.filter((t) => t.hasVacancies);
  const trainingsByDayAndTime = useMemo(() => {
    const acc = {};
    trainings.forEach((t) => {
      const day = t.date || '';
      const time = String(t.time || '').substring(0, 5);
      if (!acc[day]) acc[day] = {};
      if (!acc[day][time]) acc[day][time] = [];
      acc[day][time].push(t);
    });
    next10Days.forEach((d) => {
      if (!acc[d]) acc[d] = {};
    });
    return acc;
  }, [trainings, next10Days]);

  const toggleDay = (day) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  useEffect(() => {
    if (trainings.length > 0 && expandedDays.size === 0) {
      const firstDayWithTrainings = next10Days.find(
        (d) => Object.keys(trainingsByDayAndTime[d] || {}).length > 0
      );
      if (firstDayWithTrainings) setExpandedDays(new Set([firstDayWithTrainings]));
    }
  }, [trainings.length, expandedDays.size, next10Days, trainingsByDayAndTime]);

  return (
    <PageContainer>
      <TogglerContainer>
        <ThemeToggler />
      </TogglerContainer>
      <ContentBox>
        <Title>{activeTab === TAB_CONSULTA ? 'Pedir consulta' : 'Treino experimental'}</Title>
        <Subtitle>
          {activeTab === TAB_CONSULTA
            ? 'Preenche os dados abaixo. Não é necessário ter conta. O profissional confirmará o pedido.'
            : 'Escolhe um treino e preenche os dados. Não é necessário ter conta. O instrutor confirmará a inscrição.'}
        </Subtitle>

        <TabRow>
          <TabButton type="button" $active={activeTab === TAB_CONSULTA} onClick={() => setActiveTab(TAB_CONSULTA)}>
            Pedir consulta
          </TabButton>
          <TabButton type="button" $active={activeTab === TAB_TREINO} onClick={() => setActiveTab(TAB_TREINO)}>
            Treino experimental
          </TabButton>
        </TabRow>

        {message.text && <Message className={message.type}>{message.text}</Message>}

        {activeTab === TAB_CONSULTA && (
        <Form onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="staff">Profissional *</Label>
            <Select
              id="staff"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              disabled={loadingStaff}
            >
              <option value="">— Escolher —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              min={minDateStr}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="time">Hora *</Label>
            <Select
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={loadingSlots || !date || !staffId}
            >
              <option value="">— Escolher —</option>
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="guestName">Nome completo *</Label>
            <Input
              id="guestName"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="O teu nome"
              required
            />
          </div>
          <div>
            <Label htmlFor="guestEmail">Email *</Label>
            <Input
              id="guestEmail"
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="email@exemplo.pt"
              required
            />
          </div>
          <div>
            <Label htmlFor="guestPhone">Telemóvel *</Label>
            <Input
              id="guestPhone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="912 345 678"
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: motivo da consulta"
            />
          </div>

          <SubmitButton type="submit" disabled={submitting}>
            {submitting ? 'A enviar...' : 'Enviar pedido'}
          </SubmitButton>
        </Form>
        )}

        {activeTab === TAB_TREINO && (
          <>
            {loadingTrainings ? (
              <p style={{ textAlign: 'center', color: theme.colors.textMuted, margin: '16px 0' }}>A carregar treinos...</p>
            ) : (
              <>
                <Label style={{ marginBottom: 12 }}>Próximos 10 dias</Label>
                {trainings.length === 0 && (
                  <p style={{ fontSize: '0.9rem', color: theme.colors.textMuted, margin: '0 0 12px 0' }}>
                    Não há treinos nos próximos 10 dias.
                  </p>
                )}
                {trainings.length > 0 && trainingsWithVacancies.length === 0 && (
                  <p style={{ fontSize: '0.9rem', color: theme.colors.textMuted, margin: '0 0 12px 0' }}>
                    Há treinos listados, mas todos estão completos. Expande um dia para verificar.
                  </p>
                )}
                {next10Days.map((day) => {
                  const slots = trainingsByDayAndTime[day] || {};
                  const slotKeys = Object.keys(slots).sort();
                  const hasTrainings = slotKeys.length > 0;
                  const isExpanded = expandedDays.has(day);

                  return (
                    <DayGroup key={day}>
                      <DayHeading type="button" onClick={() => toggleDay(day)}>
                        <span>{formatDayLabel(day)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {hasTrainings && (
                            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: theme.colors.textMuted }}>
                              {slotKeys.reduce((n, k) => n + slots[k].length, 0)} treino(s)
                            </span>
                          )}
                          {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
                        </span>
                      </DayHeading>
                      {isExpanded && (
                        <DayContent>
                          {!hasTrainings ? (
                            <p style={{ padding: '12px 0', margin: 0, fontSize: '0.9rem', color: theme.colors.textMuted }}>
                              Sem treinos disponíveis neste dia.
                            </p>
                          ) : (
                            slotKeys.map((time) => (
                              <TimeSlot key={time}>
                                <TimeSlotLabel>{time}</TimeSlotLabel>
                                {slots[time].map((t) => (
                                  <TrainingCard
                                    key={t.id}
                                    className={`${String(selectedTrainingId) === String(t.id) ? 'selected' : ''} ${!t.hasVacancies ? 'disabled' : ''}`}
                                    onClick={() => t.hasVacancies && setSelectedTrainingId(String(t.id))}
                                  >
                                    <TrainingCardTitle>{t.name || `Treino ${t.id}`}</TrainingCardTitle>
                                    <TrainingCardMeta>
                                      {t.hasVacancies
                                        ? `${t.capacity - t.participantsCount} vaga(s) · ${t.participantsCount}/${t.capacity}`
                                        : 'Completo'}
                                      {' · '}
                                      {t.instructor ? `${t.instructor.firstName} ${t.instructor.lastName}` : '—'}
                                    </TrainingCardMeta>
                                  </TrainingCard>
                                ))}
                              </TimeSlot>
                            ))
                          )}
                        </DayContent>
                      )}
                    </DayGroup>
                  );
                })}
                {selectedTrainingId ? (
                  <QuestionnaireSection>
                    <QuestionnaireTitle>Questionário de inscrição</QuestionnaireTitle>
                    <Form onSubmit={handleSubmitTreino}>
                      <div>
                        <Label htmlFor="guestNameTreino">Nome completo *</Label>
                        <Input
                          id="guestNameTreino"
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="O teu nome"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guestEmailTreino">Email *</Label>
                        <Input
                          id="guestEmailTreino"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="email@exemplo.pt"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="guestPhoneTreino">Telemóvel *</Label>
                        <Input
                          id="guestPhoneTreino"
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="912 345 678"
                          required
                        />
                      </div>
                      <SubmitButton type="submit" disabled={submitting}>
                        {submitting ? 'A enviar...' : 'Enviar inscrição'}
                      </SubmitButton>
                    </Form>
                  </QuestionnaireSection>
                ) : (
                  <p style={{ textAlign: 'center', color: theme.colors.textMuted, marginTop: 16, fontSize: '0.9rem' }}>
                    Seleciona um treino acima para preencheres o questionário de inscrição.
                  </p>
                )}
              </>
            )}
          </>
        )}

        <LoginLink to="/login">Já tens conta? Inicia sessão</LoginLink>
      </ContentBox>
    </PageContainer>
  );
}

export default PublicBookingPage;
