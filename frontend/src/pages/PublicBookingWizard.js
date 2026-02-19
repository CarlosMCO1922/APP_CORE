// frontend/src/pages/PublicBookingWizard.js
// Fluxo de marcação sem conta: Escolher serviço → Colaborador → Data/hora → Checkout (estilo das imagens).
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import {
  getStaffForAppointments,
  getAvailableSlots,
  submitPublicAppointmentRequest,
  getPublicTrainings,
  submitGuestTrainingSignup,
} from '../services/publicBookingService';
import ThemeToggler from '../components/Theme/ThemeToggler';
import { FaChevronLeft, FaChevronDown, FaChevronRight, FaCheck } from 'react-icons/fa';

// --- Constantes de passos e tipos de serviço ---
const STEP_SERVICE = 1;
const STEP_COLLABORATOR = 2;
const STEP_DATETIME = 3;
const STEP_CHECKOUT = 4;

const SERVICE_CONSULTA = 'consulta';
const SERVICE_TREINO_GRUPO = 'treino_grupo';
const SERVICE_TREINO_PT = 'treino_pt';

const DURATION_MINUTES = 60;

// Serviços fixos (Consulta e PT) – podem vir da API no futuro
const CONSULTA_OPTIONS = [
  { id: 'consulta_60', label: 'Consulta', duration: 60, price: '25,00 €' },
];
const PT_OPTIONS = [
  { id: 'pt_60', label: 'Sessão de PT', duration: 60, price: 'Sob consulta' },
];

// --- Styled ---
const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
  padding: 24px 20px 80px;
  font-family: ${({ theme }) => theme.fonts.main};
  color: ${({ theme }) => theme.colors.textMain};
`;

const TogglerContainer = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.textMain};
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.buttonSecondaryHoverBg};
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.colors.textMain};
`;

const ContentBox = styled.div`
  max-width: 520px;
  margin: 0 auto;
`;

const CategoryCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 10px;
  margin-bottom: 12px;
  overflow: hidden;
`;

const CategoryHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  }
`;

const ServiceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  }
  ${({ $selected, theme }) => $selected && `
    background: ${theme.colors.primary}20;
    border-left: 3px solid ${theme.colors.primary};
  `}
`;

const ServiceLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const ServiceInitial = styled.span`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
`;
const ServiceName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMain};
`;
const ServiceMeta = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`;
const Checkbox = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid ${({ theme }) => theme.colors.cardBorder};
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $checked, theme }) => $checked && `
    background: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
    color: ${theme.colors.textDark};
  `}
`;

const CollaboratorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  }
  ${({ $selected, theme }) => $selected && `
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primary}15;
  `}
`;

const ColabAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1rem;
  font-weight: 600;
`;

const CalendarNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 4px;
`;
const CalendarMonth = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMain};
  text-transform: capitalize;
`;
const NavBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  padding: 8px;
  &:hover { color: ${({ theme }) => theme.colors.primary }; }
`;

const Weekdays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;
`;
const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
`;
const DayCell = styled.button`
  aspect-ratio: 1;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.textMain};
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  ${({ $selected, theme }) => $selected && `
    background: ${theme.colors.primary};
    color: ${theme.colors.textDark};
  `}
  ${({ $today, $selected }) => $today && !$selected && `
    background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  `}
`;

const TimeSlotLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;
const TimeSlotBtn = styled.button`
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  background: ${({ theme }) => theme.colors.cardBackground};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.95rem;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary}15;
  }
  ${({ $selected, theme }) => $selected && `
    background: ${theme.colors.primary};
    border-color: ${theme.colors.primary};
    color: ${theme.colors.textDark};
  `}
`;

const CheckoutSummary = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;
const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.textMain};
`;
const SummaryLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMain};
  margin-bottom: 6px;
`;
const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  box-sizing: border-box;
  margin-bottom: 16px;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;
const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 1rem;
  box-sizing: border-box;
  margin-bottom: 16px;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const NextButton = styled.button`
  width: 100%;
  padding: 14px 20px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover || theme.colors.primary};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.p`
  font-size: 0.9rem;
  padding: 12px 14px;
  border-radius: 8px;
  margin: 0 0 16px 0;
  &.success { background: rgba(102,187,106,0.15); color: ${({ theme }) => theme.colors.success}; }
  &.error { background: ${({ theme }) => theme.colors.errorBg}; color: ${({ theme }) => theme.colors.error}; }
`;

const LoginLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 20px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const StickyFooter = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.cardBackground};
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 100;
  max-width: 520px;
  margin: 0 auto;
  box-sizing: border-box;
`;
const FooterSummary = styled.div`
  flex: 1;
  min-width: 0;
`;
const FooterSummaryName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const FooterSummaryPrice = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
`;
const FooterNextBtn = styled.button`
  padding: 12px 20px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover || theme.colors.primary};
  }
`;

const CheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-bottom: 24px;
  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
`;
const CheckoutFormSection = styled.section`
  & > h2 {
    font-size: 1rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMain};
    margin: 0 0 16px 0;
  }
`;
const CheckoutCard = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 12px;
  padding: 20px;
`;
const CheckoutCardLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;
const CheckoutCardLogoImg = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
  background: ${({ theme }) => theme.colors.background};
`;
const CheckoutCardTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.95rem;
`;
const CheckoutCardAddress = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
`;

function formatDayLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function PublicBookingWizard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState(STEP_SERVICE);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  // Service step
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [serviceType, setServiceType] = useState(null);
  const [selectedConsultaId, setSelectedConsultaId] = useState(null);
  const [selectedPTId, setSelectedPTId] = useState(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState(null);

  // Collaborator
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffId, setStaffId] = useState('');
  const [anyCollaborator, setAnyCollaborator] = useState(true);

  // Date/time
  const [trainings, setTrainings] = useState([]);
  const [loadingTrainings, setLoadingTrainings] = useState(false);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  // Guest
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true);
    try {
      const data = await getStaffForAppointments();
      setStaff(data || []);
      if (data?.length && !staffId) setStaffId(String(data[0].id));
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao carregar profissionais.' });
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const fetchTrainings = useCallback(async () => {
    setLoadingTrainings(true);
    try {
      const data = await getPublicTrainings();
      setTrainings(Array.isArray(data) ? data : []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao carregar treinos.' });
    } finally {
      setLoadingTrainings(false);
    }
  }, []);

  useEffect(() => {
    if (serviceType === SERVICE_TREINO_GRUPO) fetchTrainings();
  }, [serviceType, fetchTrainings]);

  const effectiveStaffId = anyCollaborator && staff.length ? String(staff[0].id) : staffId;
  useEffect(() => {
    if (serviceType !== SERVICE_TREINO_GRUPO && date && effectiveStaffId) {
      setLoadingSlots(true);
      setTime('');
      getAvailableSlots(date, effectiveStaffId, DURATION_MINUTES)
        .then(setSlots)
        .catch(() => setSlots([]))
        .finally(() => setLoadingSlots(false));
    } else {
      setSlots([]);
      setTime('');
    }
  }, [date, effectiveStaffId, serviceType]);

  const next10Days = useMemo(() => {
    const pad = (n) => String(n).padStart(2, '0');
    const days = [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, []);

  const canProceedService = useMemo(() => {
    if (serviceType === SERVICE_CONSULTA) return !!selectedConsultaId;
    if (serviceType === SERVICE_TREINO_PT) return !!selectedPTId;
    if (serviceType === SERVICE_TREINO_GRUPO) return !!selectedTrainingId;
    return false;
  }, [serviceType, selectedConsultaId, selectedPTId, selectedTrainingId]);

  const selectedTraining = useMemo(
    () => trainings.find((t) => String(t.id) === String(selectedTrainingId)),
    [trainings, selectedTrainingId]
  );

  const stepTitles = {
    [STEP_SERVICE]: 'Escolher serviço',
    [STEP_COLLABORATOR]: 'Escolher colaborador',
    [STEP_DATETIME]: 'Escolha uma hora.',
    [STEP_CHECKOUT]: 'Checkout',
  };

  const weekdaysShort = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const calendarDays = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const pad = (n) => String(n).padStart(2, '0');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = 0; i < startPad; i++) {
      const d = new Date(y, m, 1 - (startPad - i));
      out.push({
        dateStr: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${y}-${pad(m + 1)}-${pad(day)}`;
      const d = new Date(y, m, day);
      d.setHours(0, 0, 0, 0);
      out.push({
        dateStr,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
      });
    }
    const remaining = 42 - out.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(y, m + 1, i);
      out.push({
        dateStr: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        isCurrentMonth: false,
        isToday: false,
      });
    }
    return out;
  }, [calendarMonth]);

  const handleBack = () => {
    if (step === STEP_SERVICE) {
      navigate('/');
      return;
    }
    setStep((s) => s - 1);
    setMessage({ type: '', text: '' });
  };

  const handleNextFromService = () => {
    if (!canProceedService) return;
    if (serviceType === SERVICE_TREINO_GRUPO) {
      setStep(STEP_DATETIME);
      return;
    }
    setStep(STEP_COLLABORATOR);
  };

  const handleNextFromCollaborator = () => {
    setStep(STEP_DATETIME);
  };

  const handleNextFromDatetime = () => {
    if (serviceType === SERVICE_TREINO_GRUPO) {
      if (!selectedTrainingId) return;
      setStep(STEP_CHECKOUT);
      return;
    }
    if (!date || !time) return;
    setStep(STEP_CHECKOUT);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone.trim()) {
      setMessage({ type: 'error', text: 'Nome, email e telemóvel são obrigatórios.' });
      return;
    }
    if (serviceType === SERVICE_TREINO_GRUPO) {
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
          text: 'Inscrição enviada com sucesso. Receberá confirmação por email. O instrutor aprovará ou rejeitará o pedido.',
        });
        setTimeout(() => navigate('/'), 3000);
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Erro ao enviar inscrição.' });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!date || !time || !effectiveStaffId) {
      setMessage({ type: 'error', text: 'Seleciona data, hora e colaborador.' });
      return;
    }
    setSubmitting(true);
    try {
      await submitPublicAppointmentRequest({
        staffId: parseInt(effectiveStaffId, 10),
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
        text: 'Pedido enviado com sucesso. Receberá confirmação por email. O profissional aprovará ou rejeitará o pedido.',
      });
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erro ao enviar pedido.' });
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

  return (
    <PageContainer>
      <TogglerContainer>
        <ThemeToggler />
      </TogglerContainer>

      <ContentBox>
        <Header>
          <BackButton type="button" onClick={handleBack} aria-label="Voltar">
            <FaChevronLeft size={20} />
          </BackButton>
          <HeaderTitle>{stepTitles[step]}</HeaderTitle>
        </Header>

        {message.text && <Message className={message.type}>{message.text}</Message>}

        {step === STEP_SERVICE && (
          <>
            <CategoryCard>
              <CategoryHeader
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === SERVICE_CONSULTA ? null : SERVICE_CONSULTA)}
              >
                Consulta
                {expandedCategory === SERVICE_CONSULTA ? <FaChevronDown /> : <FaChevronRight />}
              </CategoryHeader>
              {expandedCategory === SERVICE_CONSULTA &&
                CONSULTA_OPTIONS.map((opt) => (
                  <ServiceRow
                    key={opt.id}
                    $selected={selectedConsultaId === opt.id && serviceType === SERVICE_CONSULTA}
                    onClick={() => {
                      setServiceType(SERVICE_CONSULTA);
                      setSelectedConsultaId(opt.id);
                      setSelectedPTId(null);
                      setSelectedTrainingId(null);
                    }}
                  >
                    <ServiceLabel>
                      <ServiceInitial>{opt.label.charAt(0)}</ServiceInitial>
                      <div>
                        <ServiceName>{opt.label}</ServiceName>
                        <ServiceMeta>{opt.duration} min • {opt.price}</ServiceMeta>
                      </div>
                    </ServiceLabel>
                    <Checkbox $checked={selectedConsultaId === opt.id && serviceType === SERVICE_CONSULTA}>
                      {selectedConsultaId === opt.id && serviceType === SERVICE_CONSULTA && <FaCheck size={12} />}
                    </Checkbox>
                  </ServiceRow>
                ))}
            </CategoryCard>

            <CategoryCard>
              <CategoryHeader
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === SERVICE_TREINO_PT ? null : SERVICE_TREINO_PT)}
              >
                Treino de PT
                {expandedCategory === SERVICE_TREINO_PT ? <FaChevronDown /> : <FaChevronRight />}
              </CategoryHeader>
              {expandedCategory === SERVICE_TREINO_PT &&
                PT_OPTIONS.map((opt) => (
                  <ServiceRow
                    key={opt.id}
                    $selected={selectedPTId === opt.id && serviceType === SERVICE_TREINO_PT}
                    onClick={() => {
                      setServiceType(SERVICE_TREINO_PT);
                      setSelectedPTId(opt.id);
                      setSelectedConsultaId(null);
                      setSelectedTrainingId(null);
                    }}
                  >
                    <ServiceLabel>
                      <ServiceInitial>P</ServiceInitial>
                      <div>
                        <ServiceName>{opt.label}</ServiceName>
                        <ServiceMeta>{opt.duration} min • {opt.price}</ServiceMeta>
                      </div>
                    </ServiceLabel>
                    <Checkbox $checked={selectedPTId === opt.id && serviceType === SERVICE_TREINO_PT}>
                      {selectedPTId === opt.id && serviceType === SERVICE_TREINO_PT && <FaCheck size={12} />}
                    </Checkbox>
                  </ServiceRow>
                ))}
            </CategoryCard>

            <CategoryCard>
              <CategoryHeader
                type="button"
                onClick={() => setExpandedCategory(expandedCategory === SERVICE_TREINO_GRUPO ? null : SERVICE_TREINO_GRUPO)}
              >
                Treino de grupo
                {expandedCategory === SERVICE_TREINO_GRUPO ? <FaChevronDown /> : <FaChevronRight />}
              </CategoryHeader>
              {expandedCategory === SERVICE_TREINO_GRUPO && (
                <>
                  {loadingTrainings && (
                    <div style={{ padding: 16, color: theme.colors.textMuted, textAlign: 'center' }}>
                      A carregar treinos...
                    </div>
                  )}
                  {!loadingTrainings && trainings.length === 0 && (
                    <div style={{ padding: 16, color: theme.colors.textMuted }}>
                      Não há treinos de grupo disponíveis nos próximos dias.
                    </div>
                  )}
                  {!loadingTrainings &&
                    trainings.filter((t) => t.hasVacancies).map((t) => (
                      <ServiceRow
                        key={t.id}
                        $selected={selectedTrainingId === String(t.id) && serviceType === SERVICE_TREINO_GRUPO}
                        onClick={() => {
                          setServiceType(SERVICE_TREINO_GRUPO);
                          setSelectedTrainingId(String(t.id));
                          setSelectedConsultaId(null);
                          setSelectedPTId(null);
                        }}
                      >
                        <ServiceLabel>
                          <ServiceInitial>T</ServiceInitial>
                          <div>
                            <ServiceName>{t.name || `Treino ${t.id}`}</ServiceName>
                            <ServiceMeta>
                              {t.date} {t.time ? String(t.time).substring(0, 5) : ''} • {t.capacity - (t.participantsCount || 0)} vaga(s)
                            </ServiceMeta>
                          </div>
                        </ServiceLabel>
                        <Checkbox $checked={selectedTrainingId === String(t.id) && serviceType === SERVICE_TREINO_GRUPO}>
                          {selectedTrainingId === String(t.id) && <FaCheck size={12} />}
                        </Checkbox>
                      </ServiceRow>
                    ))}
                </>
              )}
            </CategoryCard>

            {canProceedService && (
              <StickyFooter>
                <FooterSummary>
                  <FooterSummaryName>{getSelectedServiceLabel()}</FooterSummaryName>
                  <FooterSummaryPrice>{getSelectedServicePrice()}</FooterSummaryPrice>
                </FooterSummary>
                <FooterNextBtn type="button" onClick={handleNextFromService}>
                  Avançar &gt;
                </FooterNextBtn>
              </StickyFooter>
            )}
          </>
        )}

        {step === STEP_COLLABORATOR && (
          <>
            <CollaboratorRow
              $selected={anyCollaborator}
              onClick={() => {
                setAnyCollaborator(true);
                setStaffId(staff.length ? String(staff[0].id) : '');
              }}
            >
              <ColabAvatar>?</ColabAvatar>
              <div>
                <div style={{ fontWeight: 600 }}>Qualquer colaborador</div>
              </div>
              <FaChevronRight color={theme.colors.textMuted} />
            </CollaboratorRow>
            {staff.map((s) => (
              <CollaboratorRow
                key={s.id}
                $selected={!anyCollaborator && staffId === String(s.id)}
                onClick={() => {
                  setAnyCollaborator(false);
                  setStaffId(String(s.id));
                }}
              >
                <ColabAvatar>{(s.firstName || '')[0]}{(s.lastName || '')[0]}</ColabAvatar>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                </div>
                <FaChevronRight color={theme.colors.textMuted} />
              </CollaboratorRow>
            ))}
            <NextButton type="button" onClick={handleNextFromCollaborator}>
              Avançar
            </NextButton>
          </>
        )}

        {step === STEP_DATETIME && serviceType === SERVICE_TREINO_GRUPO && selectedTraining && (
          <>
            <div style={{ marginBottom: 16, padding: 16, background: theme.colors.cardBackground, borderRadius: 10 }}>
              <div style={{ fontWeight: 600 }}>{selectedTraining.name}</div>
              <div style={{ fontSize: '0.9rem', color: theme.colors.textMuted }}>
                {selectedTraining.date} {selectedTraining.time ? String(selectedTraining.time).substring(0, 5) : ''}
              </div>
            </div>
            <NextButton type="button" onClick={handleNextFromDatetime}>
              Avançar para os teus dados
            </NextButton>
          </>
        )}

        {step === STEP_DATETIME && serviceType !== SERVICE_TREINO_GRUPO && (
          <>
            <CalendarNav>
              <NavBtn type="button" onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))} aria-label="Mês anterior">
                &lt;
              </NavBtn>
              <CalendarMonth>
                {calendarMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
              </CalendarMonth>
              <NavBtn type="button" onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))} aria-label="Mês seguinte">
                &gt;
              </NavBtn>
            </CalendarNav>
            <Weekdays>
              {weekdaysShort.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </Weekdays>
            <DaysGrid>
              {calendarDays.map((cell) => {
                const isPast = cell.isCurrentMonth && cell.dateStr < minDateStr;
                return (
                  <DayCell
                    key={cell.dateStr}
                    type="button"
                    $selected={date === cell.dateStr}
                    $today={cell.isToday}
                    disabled={isPast}
                    onClick={() => !isPast && setDate(cell.dateStr)}
                  >
                    {cell.dateStr.slice(-2).replace(/^0/, '')}
                  </DayCell>
                );
              })}
            </DaysGrid>
            {date && (
              <p style={{ margin: '16px 0 8px', fontSize: '0.95rem', color: theme.colors.textMain }}>
                {formatDayLabel(date)}
              </p>
            )}
            {date && (
              <>
                <TimeSlotLabel style={{ marginTop: 16 }}>Horários disponíveis</TimeSlotLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {loadingSlots && <span style={{ color: theme.colors.textMuted }}>A carregar...</span>}
                  {!loadingSlots && slots.map((slot) => (
                    <TimeSlotBtn
                      key={slot}
                      type="button"
                      $selected={time === slot}
                      onClick={() => setTime(slot)}
                    >
                      {slot}
                    </TimeSlotBtn>
                  ))}
                  {!loadingSlots && slots.length === 0 && (
                    <span style={{ color: theme.colors.textMuted }}>Sem horários disponíveis neste dia.</span>
                  )}
                </div>
              </>
            )}
            <NextButton
              type="button"
              onClick={handleNextFromDatetime}
              disabled={!date || !time}
            >
              {date && time ? `${formatDayLabel(date)} ${time} • Avançar` : 'Avançar'}
            </NextButton>
          </>
        )}

        {step === STEP_CHECKOUT && (
          <form onSubmit={handleSubmit}>
            <CheckoutGrid>
              <CheckoutFormSection>
                <h2>A sua informação</h2>
                <Label htmlFor="guestName">Nome *</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
                <Label htmlFor="guestPhone">Número de telefone *</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+351 912 345 678"
                  required
                />
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="email@exemplo.pt"
                  required
                />
                <Label htmlFor="notes">Comentários (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Deseja incluir mais alguma informação adicional?"
                />
              </CheckoutFormSection>

              <CheckoutCard>
                <CheckoutCardLogo>
                  <CheckoutCardLogoImg src={theme.logoUrl} alt="CORE" />
                  <div>
                    <CheckoutCardTitle>CORE - Centro da Otimização da Reabilitação e do Exercício</CheckoutCardTitle>
                    <CheckoutCardAddress>R. da Marcha Gualteriana 596, 4810-264 Guimarães</CheckoutCardAddress>
                  </div>
                </CheckoutCardLogo>
                <SummaryRow>
                  <SummaryLabel>Data</SummaryLabel>
                  <span>
                    {serviceType === SERVICE_TREINO_GRUPO && selectedTraining
                      ? `${selectedTraining.date} ${selectedTraining.time ? String(selectedTraining.time).substring(0, 5) : ''}`
                      : date && time ? `${date} ${time}` : '—'}
                  </span>
                </SummaryRow>
                <SummaryRow>
                  <SummaryLabel>Duração</SummaryLabel>
                  <span>{serviceType === SERVICE_TREINO_GRUPO ? '—' : `${DURATION_MINUTES} min`}</span>
                </SummaryRow>
                <SummaryRow>
                  <SummaryLabel>Colaborador</SummaryLabel>
                  <span>
                    {serviceType === SERVICE_TREINO_GRUPO
                      ? selectedTraining?.instructor
                        ? `${selectedTraining.instructor.firstName} ${selectedTraining.instructor.lastName}`
                        : '—'
                      : anyCollaborator ? 'Qualquer' : staff.find((s) => String(s.id) === staffId)?.firstName + ' ' + staff.find((s) => String(s.id) === staffId)?.lastName || '—'}
                  </span>
                </SummaryRow>
                <SummaryRow>
                  <SummaryLabel>{getSelectedServiceLabel()}</SummaryLabel>
                  <span>{getSelectedServicePrice()}</span>
                </SummaryRow>
                <SummaryRow style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.colors.cardBorder}` }}>
                  <SummaryLabel>Montante total</SummaryLabel>
                  <span style={{ fontWeight: 600, color: theme.colors.primary }}>{getSelectedServicePrice()}</span>
                </SummaryRow>
              </CheckoutCard>
            </CheckoutGrid>
            <NextButton type="submit" disabled={submitting}>
              {submitting ? 'A enviar...' : 'Enviar pedido'}
            </NextButton>
          </form>
        )}

        <LoginLink to="/login">Já tens conta? Inicia sessão</LoginLink>
      </ContentBox>
    </PageContainer>
  );

  function getSelectedServiceLabel() {
    if (serviceType === SERVICE_CONSULTA && selectedConsultaId) {
      const o = CONSULTA_OPTIONS.find((x) => x.id === selectedConsultaId);
      return o ? o.label : 'Consulta';
    }
    if (serviceType === SERVICE_TREINO_PT && selectedPTId) {
      const o = PT_OPTIONS.find((x) => x.id === selectedPTId);
      return o ? o.label : 'Sessão PT';
    }
    if (serviceType === SERVICE_TREINO_GRUPO && selectedTraining) {
      return selectedTraining.name || 'Treino de grupo';
    }
    return '';
  }

  function getSelectedServicePrice() {
    if (serviceType === SERVICE_CONSULTA && selectedConsultaId) {
      const o = CONSULTA_OPTIONS.find((x) => x.id === selectedConsultaId);
      return o ? o.price : '';
    }
    if (serviceType === SERVICE_TREINO_PT && selectedPTId) {
      const o = PT_OPTIONS.find((x) => x.id === selectedPTId);
      return o ? o.price : '';
    }
    if (serviceType === SERVICE_TREINO_GRUPO && selectedTraining) {
      return '—';
    }
    return '';
  }
}

export default PublicBookingWizard;
