// frontend/src/pages/PublicBookingPage.js
// Página pública para pedir consulta ou inscrever-se em treino experimental (sem conta). Rota: /marcar
import React, { useState, useEffect, useCallback } from 'react';
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

const DURATION_MINUTES = 60;

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
      setTrainings(data);
      if (!selectedTrainingId && data.length) setSelectedTrainingId('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao carregar treinos.' });
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

  const trainingsWithVacancies = trainings.filter((t) => t.hasVacancies);

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
            ) : trainingsWithVacancies.length === 0 ? (
              <p style={{ textAlign: 'center', color: theme.colors.textMuted, margin: '16px 0' }}>
                Não há treinos com vagas disponíveis para inscrição experimental no momento.
              </p>
            ) : (
              <>
                <Label style={{ marginBottom: 8 }}>Treino *</Label>
                {trainingsWithVacancies.map((t) => (
                  <TrainingCard
                    key={t.id}
                    className={
                      String(selectedTrainingId) === String(t.id)
                        ? 'selected'
                        : ''
                    }
                    onClick={() => setSelectedTrainingId(String(t.id))}
                  >
                    <TrainingCardTitle>{t.name || `Treino ${t.id}`}</TrainingCardTitle>
                    <TrainingCardMeta>
                      {t.date} {t.time} · {t.participantsCount}/{t.capacity} ·{' '}
                      {t.instructor ? `${t.instructor.firstName} ${t.instructor.lastName}` : '—'}
                    </TrainingCardMeta>
                  </TrainingCard>
                ))}
                <Form onSubmit={handleSubmitTreino} style={{ marginTop: 20 }}>
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
                  <SubmitButton type="submit" disabled={submitting || !selectedTrainingId}>
                    {submitting ? 'A enviar...' : 'Enviar inscrição'}
                  </SubmitButton>
                </Form>
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
