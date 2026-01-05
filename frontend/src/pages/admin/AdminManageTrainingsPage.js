// src/pages/admin/AdminManageTrainingsPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { css, useTheme } from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import {
    getAllTrainings,
    adminCreateTraining,
    adminUpdateTraining,
    adminDeleteTraining,
    adminBookClientForTrainingService,
    adminCancelClientBookingService,
    adminGetTrainingWaitlistService,
    getTrainingById,
    adminPromoteClientFromWaitlistService,
    createTrainingSeriesService,
    checkRecurringTrainings
} from '../../services/trainingService';
import { adminGetAllStaff } from '../../services/staffService';
import { adminGetAllUsers } from '../../services/userService';
import {
    FaDumbbell, FaPlus, FaEdit, FaTrashAlt, FaListAlt,
    FaTimes, FaUsers, FaSearch, FaFilter, FaUserPlus, FaUserMinus, FaLevelUpAlt, FaRedoAlt
} from 'react-icons/fa';
import moment from 'moment';
import BackArrow from '../../components/BackArrow';
import ConfirmationModal from '../../components/Common/ConfirmationModal';

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
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 15px;
`;

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`;

const CreateButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 10px 18px;
  border-radius: ${({ theme }) => theme.borderRadius};
  text-decoration: none;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-2px);
  }
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
    font-size: 1rem;
    padding: 12px;
  }
`;


const TableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: ${({ theme }) => theme.boxShadow};
  background-color: ${({ theme }) => theme.colors.cardBackground};

  &::-webkit-scrollbar {
    height: 8px;
    background-color: ${({ theme }) => theme.colors.scrollbarTrackBg};
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.scrollbarThumbBg};
    border-radius: 4px;
  }
`;

const Table = styled.table`
  width: 100%;
  min-width: 950px;
  border-collapse: collapse;

  th, td {
    border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
    padding: 10px 12px;
    text-align: left;
    font-size: 0.85rem;
    white-space: nowrap;
    vertical-align: middle;
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
  tr:last-child td { border-bottom: none; }

  td.actions-cell {
    white-space: nowrap;
    text-align: right;
    min-width: 350px;
  }
  @media (max-width: 768px) {
    th, td { padding: 8px 10px; font-size: 0.8rem; }
    td.actions-cell { min-width: 320px; }
  }
`;

const ActionButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: nowrap;
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  font-size: 0.75rem;
  border-radius: 5px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease, transform 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;

  background-color: ${props => {
    if (props.danger) return props.theme.colors.error;
    if (props.secondary) return props.theme.colors.buttonSecondaryBg;
    if (props.plans) return props.theme.colors.mediaButtonBg || '#6c757d';
    if (props.signups) return props.theme.colors.info || '#17a2b8';
    return props.theme.colors.primary;
  }};
  color: ${props => (props.danger || props.plans || props.signups) ? 'white' : (props.secondary ? props.theme.colors.textMain : props.theme.colors.textDark)};

  &:hover:not(:disabled) {
    opacity: 0.85;
    transform: translateY(-1px);
    background-color: ${props => {
        if (props.danger) return props.theme.colors.error;
        if (props.secondary) return props.theme.colors.buttonSecondaryHoverBg;
        if (props.plans) return props.theme.colors.mediaButtonHoverBg || '#5a6268';
        if (props.signups) return props.theme.colors.info || '#17a2b8';
        return props.theme.colors.primaryHover;
    }};
  }
  &:disabled {
    background-color: ${({ theme }) => theme.colors.disabledBg};
    color: ${({ theme }) => theme.colors.disabledText};
    cursor: not-allowed;
  }
`;

const MessageBaseStyles = css`
  text-align: center;
  padding: 12px 18px;
  margin: 20px auto;
  border-radius: ${({ theme }) => theme.borderRadius};
  border-width: 1px;
  border-style: solid;
  max-width: 600px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const LoadingText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.primary};
  border-color: transparent;
  background: transparent;
  font-style: italic;
`;

const ErrorText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
`;

const MessageText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.success};
  background-color: ${({ theme }) => theme.colors.successBg};
  border-color: ${({ theme }) => theme.colors.success};
`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlayBg}; display: flex;
  justify-content: center; align-items: center;
  z-index: 1050; padding: 20px;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: clamp(25px, 4vw, 35px);
  border-radius: 10px; width: 100%;
  max-width: 550px; box-shadow: 0 8px 25px rgba(0,0,0,0.6);
  position: relative; max-height: 90vh; overflow-y: auto;
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
`;

const ModalTitle = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 0; margin-bottom: 20px;
  font-size: clamp(1.4rem, 3.5vw, 1.7rem);
  font-weight: 600; text-align: center;
  padding-bottom: 15px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const ModalForm = styled.form` display: flex; flex-direction: column; gap: 15px; `;

const ModalLabel = styled.label`
  font-size: 0.85rem; color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px; display: block; font-weight: 500;
`;

const ModalInput = styled.input`
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; }
`;

const ModalTextarea = styled.textarea`
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem;
  width: 100%; min-height: 80px; resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; }
`;

const ModalSelect = styled.select`
  padding: 10px 14px; background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.inputText}; font-size: 0.95rem;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primaryFocusRing}; }
`;

const ModalActions = styled.div`
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 25px; padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
  @media (min-width: 480px) { flex-direction: row; justify-content: flex-end; }
`;

const ModalButton = styled(ActionButton)`
  font-size: 0.9rem;
  padding: 10px 18px;
  gap: 6px;
  width: 100%;
  @media (min-width: 480px) { width: auto; }
`;

const CloseButton = styled.button`
  position: absolute; top: 15px; right: 15px; background: transparent; border: none;
  color: ${({ theme }) => theme.colors.textMuted}; font-size: 1.8rem; cursor: pointer; line-height: 1; padding: 5px;
  transition: color 0.2s, transform 0.2s; border-radius: 50%;
  &:hover { color: ${({ theme }) => theme.colors.textMain}; transform: scale(1.1); }
`;

const ModalErrorText = styled.p`
  ${MessageBaseStyles}
  color: ${({ theme }) => theme.colors.error};
  background-color: ${({ theme }) => theme.colors.errorBg};
  border-color: ${({ theme }) => theme.colors.error};
  margin: -5px 0 10px 0;
  text-align: left;
  font-size: 0.8rem;
  padding: 8px 12px;
`;

const SignupsModalContent = styled(ModalContent)`
  max-width: 600px;
`;

const ParticipantList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 10px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  background-color: ${({ theme }) => theme.colors.cardBackground};
`;

const ParticipantItem = styled.li`
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;

  &:last-child {
    border-bottom: none;
  }
  &:nth-child(even) {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  }
  .email {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.8rem;
    margin-left: 10px;
  }
`;

const FiltersContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 15px 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  margin-bottom: 25px;
  box-shadow: ${({ theme }) => theme.boxShadow};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  align-items: flex-end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const FilterLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 3px;
`;

const FilterInput = styled.input`
  padding: 9px 12px;
  background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FilterSelect = styled.select`
  padding: 9px 12px;
  background-color: ${({ theme }) => theme.colors.inputBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: ${({ theme }) => theme.borderRadius};
  color: ${({ theme }) => theme.colors.textMain};
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FilterActions = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  @media (min-width: 992px) {
    grid-column: span 2;
    justify-self: flex-end;
     button { min-width: 120px; }
  }
   @media (max-width: 991px) {
      grid-column: 1 / -1;
      flex-direction: column;
       button { width: 100%; }
   }
`;

const FilterButton = styled.button`
  background-color: ${({ theme, primary }) => primary ? theme.colors.primary : theme.colors.buttonSecondaryBg};
  color: ${({ theme, primary }) => primary ? theme.colors.textDark : theme.colors.textMain};
  padding: 9px 15px;
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 1px solid ${({ theme, primary }) => primary ? theme.colors.primary : theme.colors.cardBorder};
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: background-color 0.2s ease, transform 0.1s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;

  &:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddSignupFormContainer = styled.div`
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;

const AddSignupForm = styled.form`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const AddSignupSelect = styled(ModalSelect)`
  flex-grow: 1;
  min-width: 200px;
`;

const AddSignupButton = styled(ModalButton)`
  min-width: 150px;
  padding: 9px 15px;
  font-size: 0.85rem;
  height: 38px;
`;

const WaitlistSectionTitle = styled.h4`
  margin-top: 25px;
  color: ${({ theme }) => theme.colors.warning || '#FFA000'};
  padding-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
`;
// --- Fim Styled Components ---


const initialTrainingFormState = {
  name: '', description: '', date: '', time: '',
  capacity: 10, instructorId: '', durationMinutes: 45,
  isRecurring: false, 
  recurrenceType: 'weekly', 
  seriesStartDate: '', 
  seriesEndDate: '',
  dayOfWeek: '1',
};

const AdminManageTrainingsPage = () => {
  const theme = useTheme();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTrainingData, setCurrentTrainingData] = useState(initialTrainingFormState);
  const [currentTrainingId, setCurrentTrainingId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [filters, setFilters] = useState({
    instructorId: '', dateFrom: '', dateTo: '', nameSearch: '',
  });
  const [activeFilters, setActiveFilters] = useState({});

  const [showSignupsModal, setShowSignupsModal] = useState(false);
  const [selectedTrainingForSignups, setSelectedTrainingForSignups] = useState(null);
  const [userToBook, setUserToBook] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showCancelBookingConfirmModal, setShowCancelBookingConfirmModal] = useState(false);
  const [showPromoteConfirmModal, setShowPromoteConfirmModal] = useState(false);
  const [actionData, setActionData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedTrainingWaitlist, setSelectedTrainingWaitlist] = useState([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [promoteLoading, setPromoteLoading] = useState(null);

  const [showDeleteRecurringModal, setShowDeleteRecurringModal] = useState(false);
  const [deleteRecurringInfo, setDeleteRecurringInfo] = useState(null);
  const [trainingToDelete, setTrainingToDelete] = useState(null);
  
  const [showUpdateRecurringModal, setShowUpdateRecurringModal] = useState(false);
  const [updateRecurringInfo, setUpdateRecurringInfo] = useState(null);
  const [trainingDataToUpdate, setTrainingDataToUpdate] = useState(null);


  const fetchPageData = useCallback(async (appliedFilters = activeFilters) => {
    if (authState.token) {
      setLoading(true); setPageError('');
      try {
        const promises = [
            getAllTrainings(authState.token, appliedFilters),
        ];
        if (instructors.length === 0) {
            promises.push(adminGetAllStaff(authState.token));
        } else {
            promises.push(Promise.resolve(instructors));
        }
        if (allUsers.length === 0) {
            promises.push(adminGetAllUsers(authState.token));
        } else {
            promises.push(Promise.resolve(allUsers));
        }

        const [trainingsData, staffDataResult, usersDataResult] = await Promise.all(promises);

        setTrainings(trainingsData);
        if (instructors.length === 0 && Array.isArray(staffDataResult)) {
             setInstructors(staffDataResult.filter(staff => ['trainer', 'admin'].includes(staff.role)));
        }
        if (allUsers.length === 0 && Array.isArray(usersDataResult)) {
            setAllUsers(usersDataResult.filter(u => !u.isAdmin && !u.isStaff)); 
        }

      } catch (err) {
        setPageError(err.message || 'Não foi possível carregar os dados da página.');
        setTrainings([]);
      } finally {
        setLoading(false);
      }
    }
  }, [authState.token, activeFilters, instructors, allUsers ]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
        setPageError("A data 'Até' não pode ser anterior à data 'De'.");
        return;
    }
    setPageError('');
    setActiveFilters(filters);
  };

  const handleClearFilters = () => {
    setFilters({ instructorId: '', dateFrom: '', dateTo: '', nameSearch: '' });
    setActiveFilters({});
    setPageError('');
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false); setCurrentTrainingData(initialTrainingFormState);
    setCurrentTrainingId(null); setModalError(''); setSuccessMessage(''); setShowModal(true);
  };

  const handleOpenEditModal = (training) => {
    setIsEditing(true);
    setCurrentTrainingData({
      name: training.name, description: training.description || '', date: training.date,
      time: training.time ? training.time.substring(0,5) : '',
      capacity: training.capacity,
      instructorId: training.instructorId || (training.instructor?.id || ''),
      durationMinutes: training.durationMinutes || 45,
    });
    setCurrentTrainingId(training.id); setModalError(''); setSuccessMessage(''); setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false); setCurrentTrainingData(initialTrainingFormState);
    setCurrentTrainingId(null); setModalError('');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCurrentTrainingData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setModalError('');
    setPageError('');

    if (currentTrainingData.isRecurring) {
        // Lógica para criar SÉRIE DE TREINOS
        const seriesPayload = {
            name: currentTrainingData.name,
            description: currentTrainingData.description,
            instructorId: parseInt(currentTrainingData.instructorId),
            recurrenceType: currentTrainingData.recurrenceType,
            dayOfWeek: currentTrainingData.recurrenceType === 'weekly' ? parseInt(currentTrainingData.dayOfWeek) : null,
            startTime: currentTrainingData.time, 
            seriesStartDate: currentTrainingData.seriesStartDate,
            seriesEndDate: currentTrainingData.seriesEndDate,
            capacity: parseInt(currentTrainingData.capacity),
            location: currentTrainingData.location || '',
        };

        if (currentTrainingData.time && currentTrainingData.durationMinutes) {
            const [hours, minutes] = currentTrainingData.time.split(':').map(Number);
            const startMoment = moment().year(2000).month(0).date(1).hours(hours).minutes(minutes); // Data arbitrária para cálculo
            const endMoment = startMoment.add(parseInt(currentTrainingData.durationMinutes, 10), 'minutes');
            seriesPayload.endTime = endMoment.format('HH:mm:ss');
        } else {
             setModalError("Hora de início e duração são necessários para calcular a hora de fim da série.");
             setFormLoading(false);
             return;
        }

        if (!seriesPayload.seriesStartDate || !seriesPayload.seriesEndDate || !seriesPayload.instructorId) {
            setModalError("Para treinos recorrentes, preencha nome, instrutor, tipo de recorrência, datas de início/fim da série, hora de início e capacidade.");
            setFormLoading(false);
            return;
        }
         if (moment(seriesPayload.seriesEndDate).isBefore(seriesPayload.seriesStartDate)) {
            setModalError('A data de fim da série não pode ser anterior à data de início.');
            setFormLoading(false);
            return;
        }

        try {
            await createTrainingSeriesService(seriesPayload, authState.token);
            setSuccessMessage('Série de treinos recorrentes criada com sucesso!');
            fetchPageData(activeFilters); 
            handleCloseModal();
        } catch (err) {
            setModalError(err.message || 'Falha ao criar série de treinos recorrentes.');
        } finally {
            setFormLoading(false);
        }

    } else {
        const dataToSend = {
            name: currentTrainingData.name,
            description: currentTrainingData.description,
            date: currentTrainingData.date,
            time: currentTrainingData.time.length === 5 ? `${currentTrainingData.time}:00` : currentTrainingData.time,
            capacity: parseInt(currentTrainingData.capacity, 10),
            instructorId: parseInt(currentTrainingData.instructorId, 10),
            durationMinutes: parseInt(currentTrainingData.durationMinutes, 10),
        };
         if (!dataToSend.date || !dataToSend.time || !dataToSend.instructorId || isNaN(dataToSend.capacity) || dataToSend.capacity <=0 || isNaN(dataToSend.durationMinutes) || dataToSend.durationMinutes <=0 ) {
            setModalError("Para treino único, preencha nome, data, hora, duração, capacidade e instrutor.");
            setFormLoading(false); return;
        }
        try {
            if (isEditing && currentTrainingId) {
                // Verificar se o treino faz parte de uma série antes de atualizar
                try {
                    const recurringInfo = await checkRecurringTrainings(currentTrainingId, authState.token);
                    
                    if (recurringInfo.hasRecurring && recurringInfo.futureCount > 0) {
                        // Mostrar modal para perguntar se quer atualizar todos os futuros
                        setUpdateRecurringInfo(recurringInfo);
                        setTrainingDataToUpdate(dataToSend);
                        setShowUpdateRecurringModal(true);
                        setFormLoading(false);
                        return;
                    }
                } catch (checkErr) {
                    // Se falhar a verificação, continuar com update normal
                    console.warn("Erro ao verificar treinos recorrentes:", checkErr);
                }
                
                // Update normal (apenas este treino)
                await adminUpdateTraining(currentTrainingId, dataToSend, authState.token);
                setSuccessMessage('Treino atualizado com sucesso!');
            } else {
                await adminCreateTraining(dataToSend, authState.token);
                setSuccessMessage('Treino criado com sucesso!');
            }
            fetchPageData(activeFilters);
            handleCloseModal();
        } catch (err) {
            setModalError(err.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} treino.`);
        } finally {
            setFormLoading(false);
        }
    }
  };

  const handleDeleteTraining = async (trainingId) => {
    setPageError(''); setSuccessMessage('');
    
    try {
      // Verificar se há treinos recorrentes
      const recurringInfo = await checkRecurringTrainings(trainingId, authState.token);
      
      if (recurringInfo.hasRecurring && recurringInfo.futureCount > 0) {
        // Mostrar modal customizado com 3 opções
        setDeleteRecurringInfo(recurringInfo);
        setTrainingToDelete(trainingId);
        setShowDeleteRecurringModal(true);
      } else {
        // Não há treinos recorrentes, eliminação normal
        setActionData({ type: 'delete', trainingId });
        setShowDeleteConfirmModal(true);
      }
    } catch (err) {
      setPageError(err.message || 'Falha ao eliminar treino.');
    }
  };

  const handleDeleteAllRecurring = async () => {
    if (!trainingToDelete) return;
    try {
      await adminDeleteTraining(trainingToDelete, authState.token, true);
      setSuccessMessage(`Treino e ${deleteRecurringInfo.futureCount} treino(s) futuro(s) eliminados com sucesso.`);
      setShowDeleteRecurringModal(false);
      setDeleteRecurringInfo(null);
      setTrainingToDelete(null);
      fetchPageData(activeFilters);
    } catch (err) {
      setPageError(err.message || 'Falha ao eliminar treinos.');
      setShowDeleteRecurringModal(false);
    }
  };

  const handleDeleteCurrentOnly = async () => {
    if (!trainingToDelete) return;
    try {
      await adminDeleteTraining(trainingToDelete, authState.token, false);
      setSuccessMessage('Treino eliminado com sucesso.');
      setShowDeleteRecurringModal(false);
      setDeleteRecurringInfo(null);
      setTrainingToDelete(null);
      fetchPageData(activeFilters);
    } catch (err) {
      setPageError(err.message || 'Falha ao eliminar treino.');
      setShowDeleteRecurringModal(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteRecurringModal(false);
    setDeleteRecurringInfo(null);
    setTrainingToDelete(null);
  };

  const handleUpdateAllRecurring = async () => {
    if (!currentTrainingId || !trainingDataToUpdate) return;
    setFormLoading(true);
    setModalError('');
    setPageError('');
    try {
      const result = await adminUpdateTraining(currentTrainingId, trainingDataToUpdate, authState.token, true);
      setSuccessMessage(result.message || `Treino atualizado com sucesso. ${updateRecurringInfo.futureCount} treino(s) futuro(s) também foram atualizados.`);
      setShowUpdateRecurringModal(false);
      setUpdateRecurringInfo(null);
      setTrainingDataToUpdate(null);
      fetchPageData(activeFilters);
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || 'Falha ao atualizar treinos.');
      setShowUpdateRecurringModal(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateCurrentOnly = async () => {
    if (!currentTrainingId || !trainingDataToUpdate) return;
    setFormLoading(true);
    setModalError('');
    setPageError('');
    try {
      await adminUpdateTraining(currentTrainingId, trainingDataToUpdate, authState.token, false);
      setSuccessMessage('Treino atualizado com sucesso!');
      setShowUpdateRecurringModal(false);
      setUpdateRecurringInfo(null);
      setTrainingDataToUpdate(null);
      fetchPageData(activeFilters);
      handleCloseModal();
    } catch (err) {
      setModalError(err.message || 'Falha ao atualizar treino.');
      setShowUpdateRecurringModal(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelUpdate = () => {
    setShowUpdateRecurringModal(false);
    setUpdateRecurringInfo(null);
    setTrainingDataToUpdate(null);
    setFormLoading(false);
  };

  const handleOpenSignupsModal = async (training) => {
    setSelectedTrainingForSignups(training);
    setBookingError('');
    setSuccessMessage('');
    setUserToBook('');
    setShowSignupsModal(true);
    setWaitlistLoading(true);
    setSelectedTrainingWaitlist([]);
    try {
      const waitlistData = await adminGetTrainingWaitlistService(training.id, authState.token);
      setSelectedTrainingWaitlist(waitlistData || []);
    } catch (err) {
      console.error("Erro ao buscar lista de espera:", err);
      setBookingError("Falha ao carregar lista de espera: " + err.message);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleCloseSignupsModal = () => {
    setShowSignupsModal(false);
    setSelectedTrainingForSignups(null);
    setBookingError('');
    setSelectedTrainingWaitlist([]);
  };

  const handleAdminBookClient = async (e) => {
    e.preventDefault();
    if (!selectedTrainingForSignups || !userToBook) {
      setBookingError("Selecione um treino e um cliente.");
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    setSuccessMessage('');
    try {
      const result = await adminBookClientForTrainingService(selectedTrainingForSignups.id, userToBook, authState.token);
      setSuccessMessage(result.message || "Cliente inscrito com sucesso!");

      const updatedParticipants = result.training.participants || [];
      const newParticipantsCount = updatedParticipants.length;

      setSelectedTrainingForSignups(prev => ({...prev, participants: updatedParticipants, participantsCount: newParticipantsCount }));
      setTrainings(prevTrainings => prevTrainings.map(t =>
        t.id === selectedTrainingForSignups.id
        ? {...t, participants: updatedParticipants, participantsCount: newParticipantsCount}
        : t
      ));

      setUserToBook('');
    } catch (err) {
      setBookingError(err.message || "Falha ao inscrever cliente.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAdminCancelClientBooking = (trainingId, userIdToCancel, clientName) => {
    setActionData({ type: 'cancelBooking', trainingId, userIdToCancel, clientName });
    setShowCancelBookingConfirmModal(true);
  };

  const handleCancelBookingConfirm = async () => {
    if (!actionData || actionData.type !== 'cancelBooking') return;
    const { trainingId, userIdToCancel } = actionData;
    setBookingLoading(true);
    setBookingError('');
    setSuccessMessage('');
    try {
      const result = await adminCancelClientBookingService(trainingId, userIdToCancel, authState.token);
      setSuccessMessage(result.message || "Inscrição cancelada com sucesso!");

      const updatedParticipants = result.training.participants || [];
      const newParticipantsCount = updatedParticipants.length;

      setSelectedTrainingForSignups(prev => ({...prev, participants: updatedParticipants, participantsCount: newParticipantsCount }));
      setTrainings(prevTrainings => prevTrainings.map(t =>
        t.id === trainingId
        ? {...t, participants: updatedParticipants, participantsCount: newParticipantsCount}
        : t
      ));

    } catch (err) {
      setBookingError(err.message || "Falha ao cancelar inscrição.");
    } finally {
      setBookingLoading(false);
      setActionData(null);
      setShowCancelBookingConfirmModal(false);
    }
  };

  const handleAdminPromoteClient = async (trainingId, userIdToPromote, waitlistEntryId, clientName) => {
    if (!selectedTrainingForSignups) return;

    const currentParticipantsCount = selectedTrainingForSignups.participants?.length || 0;
    if (currentParticipantsCount >= selectedTrainingForSignups.capacity) {
      setBookingError("O treino já atingiu a capacidade máxima. Cancele uma inscrição primeiro.");
      return;
    }

    setActionData({ type: 'promote', trainingId, userIdToPromote, waitlistEntryId, clientName });
    setShowPromoteConfirmModal(true);
  };

  const handlePromoteConfirm = async () => {
    if (!actionData || actionData.type !== 'promote' || !selectedTrainingForSignups) return;
    const { trainingId, userIdToPromote, waitlistEntryId, clientName } = actionData;

    const currentParticipantsCount = selectedTrainingForSignups.participants?.length || 0;
    if (currentParticipantsCount >= selectedTrainingForSignups.capacity) {
      setBookingError("O treino já atingiu a capacidade máxima. Cancele uma inscrição primeiro.");
      setActionData(null);
      setShowPromoteConfirmModal(false);
      return;
    }

    setPromoteLoading(userIdToPromote);
    setBookingError(''); setSuccessMessage('');
    try {
      const result = await adminPromoteClientFromWaitlistService(trainingId, userIdToPromote, authState.token, waitlistEntryId);
      setSuccessMessage(result.message || "Cliente promovido com sucesso!");
      const [updatedTrainingData, updatedWaitlistData] = await Promise.all([
        getTrainingById(trainingId, authState.token),
        adminGetTrainingWaitlistService(trainingId, authState.token)
      ]);

      if (updatedTrainingData) {
        setSelectedTrainingForSignups(updatedTrainingData);
        setTrainings(prevTrainings => prevTrainings.map(t => t.id === trainingId ? updatedTrainingData : t));
      }
      setSelectedTrainingWaitlist(updatedWaitlistData || []);

    } catch (err) {
      setBookingError(err.message || "Falha ao promover cliente da lista de espera.");
    } finally {
      setPromoteLoading(null);
      setActionData(null);
      setShowPromoteConfirmModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!actionData || actionData.type !== 'delete') return;
    setActionLoading(true);
    setPageError('');
    setSuccessMessage('');
    setShowDeleteConfirmModal(false);
    try {
      await adminDeleteTraining(actionData.trainingId, authState.token, false);
      setSuccessMessage('Treino eliminado com sucesso.');
      setActionData(null);
      fetchPageData(activeFilters);
    } catch (err) {
      setPageError(err.message || 'Falha ao eliminar treino.');
      setActionData(null);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && trainings.length === 0 && Object.keys(activeFilters).length === 0) {
    return <PageContainer><LoadingText>A carregar treinos...</LoadingText></PageContainer>;
  }

  const availableUsersToBook = selectedTrainingForSignups
    ? allUsers.filter(user =>
        !selectedTrainingForSignups.participants?.some(p => p.id === user.id) &&
        !selectedTrainingWaitlist?.some(w => w.userId === user.id && w.status === 'PENDING')
      )
    : [];

  return (
    <PageContainer>
      <HeaderContainer>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackArrow to="/admin/dashboard" />
          <Title>Treinos</Title>
        </div>
        <CreateButton onClick={handleOpenCreateModal}><FaPlus /> Novo Treino</CreateButton>
      </HeaderContainer>

      <FiltersContainer>
        <FilterGroup>
          <FilterLabel htmlFor="nameSearchFilter">Pesquisar Nome</FilterLabel>
          <FilterInput type="text" id="nameSearchFilter" name="nameSearch" value={filters.nameSearch} onChange={handleFilterChange} placeholder="Nome do treino..." />
        </FilterGroup>
        <FilterGroup>
          <FilterLabel htmlFor="instructorIdFilter">Instrutor</FilterLabel>
          <FilterSelect id="instructorIdFilter" name="instructorId" value={filters.instructorId} onChange={handleFilterChange}>
            <option value="">Todos Instrutores</option>
            {instructors.map(instr => (
              <option key={instr.id} value={instr.id}>{instr.firstName} {instr.lastName}</option>
            ))}
          </FilterSelect>
        </FilterGroup>
        <FilterGroup>
          <FilterLabel htmlFor="dateFromFilter">Data De</FilterLabel>
          <FilterInput type="date" id="dateFromFilter" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
        </FilterGroup>
        <FilterGroup>
          <FilterLabel htmlFor="dateToFilter">Data Até</FilterLabel>
          <FilterInput type="date" id="dateToFilter" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
        </FilterGroup>
        <FilterActions>
          <FilterButton onClick={handleApplyFilters} primary><FaSearch /> Aplicar</FilterButton>
          <FilterButton onClick={handleClearFilters}><FaTimes /> Limpar</FilterButton>
        </FilterActions>
      </FiltersContainer>

      {pageError && <ErrorText>{pageError}</ErrorText>}
      {successMessage && !showModal && !showSignupsModal && <MessageText>{successMessage}</MessageText>}
      {loading && <LoadingText>A carregar treinos...</LoadingText>}

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Data</th>
              <th>Hora</th>
              <th>Duração</th>
              <th>Capacidade</th>
              <th>Inscritos</th>
              <th>Instrutor</th>
              <th className="actions-cell">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading && trainings.length > 0 ? trainings.map(training => (
              <tr key={training.id}>
                <td>{training.id}</td>
                <td>{training.name}</td>
                <td>{new Date(training.date).toLocaleDateString('pt-PT')}</td>
                <td>{training.time ? training.time.substring(0,5) : 'N/A'}</td>
                <td>{training.durationMinutes} min</td>
                <td>{training.capacity}</td>
                <td>{training.participantsCount ?? (training.participants?.length || 0)}</td>
                <td>{training.instructor ? `${training.instructor.firstName} ${training.instructor.lastName}` : 'N/A'}</td>
                <td className="actions-cell">
                  <ActionButtonContainer>
                    <ActionButton signups onClick={() => handleOpenSignupsModal(training)}>
                        <FaUsers /> Inscritos ({training.participantsCount ?? (training.participants?.length || 0)})
                    </ActionButton>
                    <ActionButton plans onClick={() => navigate(`/admin/trainings/${training.id}/manage-plans`)}>
                      <FaListAlt /> Planos
                    </ActionButton>
                    <ActionButton secondary onClick={() => handleOpenEditModal(training)}>
                      <FaEdit /> Editar
                    </ActionButton>
                    <ActionButton danger onClick={() => handleDeleteTraining(training.id)}>
                      <FaTrashAlt /> Eliminar
                    </ActionButton>
                  </ActionButtonContainer>
                </td>
              </tr>
            )) : (
              !loading && <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Nenhum treino encontrado com os filtros atuais.</td></tr>
            )}
          </tbody>
        </Table>
      </TableWrapper>

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseModal}><FaTimes /></CloseButton>
            <ModalTitle>{isEditing ? 'Editar Treino' : 'Criar Novo Treino'}</ModalTitle>
            {modalError && <ModalErrorText>{modalError}</ModalErrorText>}
            <ModalForm onSubmit={handleFormSubmit}>
              <ModalLabel htmlFor="nameTrainModalForm">Nome do Treino*</ModalLabel>
              <ModalInput type="text" name="name" id="nameTrainModalForm" value={currentTrainingData.name} onChange={handleFormChange} required />
              <ModalLabel htmlFor="descriptionTrainModalForm">Descrição</ModalLabel>
              <ModalTextarea name="description" id="descriptionTrainModalForm" value={currentTrainingData.description} onChange={handleFormChange} />
              <ModalLabel htmlFor="dateTrainModalForm">Data*</ModalLabel>
              <ModalInput type="date" name="date" id="dateTrainModalForm" value={currentTrainingData.date} onChange={handleFormChange} required />
              <ModalLabel htmlFor="timeTrainModalForm">Hora (HH:MM)*</ModalLabel>
              <ModalInput type="time" name="time" id="timeTrainModalForm" value={currentTrainingData.time} onChange={handleFormChange} required />
              <ModalLabel htmlFor="durationMinutesTrainModalForm">Duração (minutos)*</ModalLabel>
              <ModalInput type="number" name="durationMinutes" id="durationMinutesTrainModalForm" value={currentTrainingData.durationMinutes} onChange={handleFormChange} required min="1" />
              <ModalLabel htmlFor="capacityTrainModalForm">Capacidade*</ModalLabel>
              <ModalInput type="number" name="capacity" id="capacityTrainModalForm" value={currentTrainingData.capacity} onChange={handleFormChange} required min="1" />
              <ModalLabel htmlFor="instructorIdTrainModalForm">Instrutor*</ModalLabel>
              <ModalSelect name="instructorId" id="instructorIdTrainModalForm" value={currentTrainingData.instructorId} onChange={handleFormChange} required>
                <option value="">Selecione um instrutor</option>
                {instructors.map(instr => (
                  <option key={instr.id} value={instr.id}>{instr.firstName} {instr.lastName} ({instr.role})</option>
                ))}
              </ModalSelect>
              {!isEditing || (isEditing && !currentTrainingData.isGeneratedInstance) ? ( 
              <>
                <ModalLabel htmlFor="isRecurringTrainModalForm">Treino Recorrente?</ModalLabel>
                <ModalInput
                  type="checkbox"
                  name="isRecurring"
                  id="isRecurringTrainModalForm"
                  checked={currentTrainingData.isRecurring || false}
                  onChange={handleFormChange}
                  disabled={isEditing} 
                />
              </>
          ) : (
              isEditing && currentTrainingData.isGeneratedInstance && <p style={{fontSize: '0.8rem', color: theme.colors.textMuted}}>Este é um treino gerado por uma série, edite a série para alterar recorrências.</p>
          )}


          {currentTrainingData.isRecurring && !isEditing && ( 
              <>
                  <ModalLabel htmlFor="recurrenceTypeTrainModalForm">Repetir*</ModalLabel>
                  <ModalSelect name="recurrenceType" id="recurrenceTypeTrainModalForm" value={currentTrainingData.recurrenceType} onChange={handleFormChange}>
                      <option value="weekly">Semanalmente</option>
                      <option value="daily">Diariamente</option>
                      <option value="monthly">Mensalmente</option>
                  </ModalSelect>

                  {currentTrainingData.recurrenceType === 'weekly' && (
                      <>
                          <ModalLabel htmlFor="dayOfWeekTrainModalForm">Dia da Semana da Repetição*</ModalLabel>
                          <ModalSelect name="dayOfWeek" id="dayOfWeekTrainModalForm" value={currentTrainingData.dayOfWeek} onChange={handleFormChange}>
                              <option value="1">Segunda-feira</option>
                              <option value="2">Terça-feira</option>
                              <option value="3">Quarta-feira</option>
                              <option value="4">Quinta-feira</option>
                              <option value="5">Sexta-feira</option>
                              <option value="6">Sábado</option>
                              <option value="0">Domingo</option>
                          </ModalSelect>
                      </>
                  )}
                  <ModalLabel htmlFor="seriesStartDateTrainModalForm">Data de Início da Série*</ModalLabel>
                  <ModalInput type="date" name="seriesStartDate" id="seriesStartDateTrainModalForm" value={currentTrainingData.seriesStartDate} onChange={handleFormChange} />

                  <ModalLabel htmlFor="seriesEndDateTrainModalForm">Data de Fim da Série*</ModalLabel>
                  <ModalInput type="date" name="seriesEndDate" id="seriesEndDateTrainModalForm" value={currentTrainingData.seriesEndDate} onChange={handleFormChange} />
                
                  <p style={{fontSize: '0.8rem', color: theme.colors.textMuted}}>
                    A hora de início e duração definidas acima serão usadas para todas as ocorrências da série.
                    A hora de fim da série será calculada automaticamente.
                  </p>
              </>
          )}
              <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseModal} disabled={formLoading}>Cancelar</ModalButton>
                <ModalButton type="submit" primary disabled={formLoading}>
                  <FaDumbbell style={{marginRight: '8px'}} /> {formLoading ? 'A guardar...' : (isEditing ? 'Guardar Alterações' : 'Criar Treino')}
                </ModalButton>
              </ModalActions>
            </ModalForm>
          </ModalContent>
        </ModalOverlay>
      )}

      {showSignupsModal && selectedTrainingForSignups && (
        <ModalOverlay onClick={handleCloseSignupsModal}>
          <SignupsModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCloseSignupsModal}><FaTimes /></CloseButton>
            <ModalTitle>Gerir Inscrições: {selectedTrainingForSignups.name}</ModalTitle>
            
            {bookingError && <ModalErrorText>{bookingError}</ModalErrorText>}
            {successMessage && showSignupsModal && <MessageText style={{margin: '10px 0'}}>{successMessage}</MessageText>}

            <AddSignupFormContainer>
              <h4>Adicionar Cliente ao Treino</h4>
              <AddSignupForm onSubmit={handleAdminBookClient}>
                <ModalLabel htmlFor="userToBookSelectModalForm" style={{display: 'none'}}>Selecionar Cliente</ModalLabel>
                <AddSignupSelect
                  id="userToBookSelectModalForm"
                  value={userToBook}
                  onChange={(e) => setUserToBook(e.target.value)}
                  required
                >
                  <option value="">Selecione um cliente para inscrever...</option>
                  {availableUsersToBook.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </AddSignupSelect>
                <AddSignupButton type="submit" primary disabled={bookingLoading || !userToBook || (selectedTrainingForSignups.participants?.length || 0) >= selectedTrainingForSignups.capacity}>
                  {bookingLoading ? 'A inscrever...' : <><FaUserPlus /> Inscrever</>}
                </AddSignupButton>
              </AddSignupForm>
              {(selectedTrainingForSignups.participants?.length || 0) >= selectedTrainingForSignups.capacity && <p style={{fontSize: '0.8rem', color: theme.colors.warning, marginTop: '5px'}}>Este treino atingiu a capacidade máxima.</p>}
              {availableUsersToBook.length === 0 && !((selectedTrainingForSignups.participants?.length || 0) >= selectedTrainingForSignups.capacity) && <p style={{fontSize: '0.8rem', color: theme.colors.textMuted, marginTop: '5px'}}>Todos os clientes já estão inscritos, na lista de espera, ou não há clientes disponíveis.</p>}
            </AddSignupFormContainer>

            <h4 style={{marginTop: '25px', color: theme.colors.primary}}>Lista de Inscritos ({selectedTrainingForSignups.participants?.length || 0} / {selectedTrainingForSignups.capacity})</h4>
            {selectedTrainingForSignups.participants && selectedTrainingForSignups.participants.length > 0 ? (
                <ParticipantList>
                    {selectedTrainingForSignups.participants.map(participant => (
                        <ParticipantItem key={participant.id}>
                            <div>
                                <span>{participant.firstName} {participant.lastName}</span>
                                <span className="email">{participant.email}</span>
                            </div>
                            <ActionButton
                                danger
                                onClick={() => handleAdminCancelClientBooking(selectedTrainingForSignups.id, participant.id, `${participant.firstName} ${participant.lastName}`)}
                                disabled={bookingLoading}
                            >
                                <FaUserMinus/> Remover
                            </ActionButton>
                        </ParticipantItem>
                    ))}
                </ParticipantList>
            ) : (
                <p style={{textAlign: 'center', marginTop: '10px', color: '#aaa'}}>Nenhum cliente inscrito neste treino.</p>
            )}

            <WaitlistSectionTitle>
              <FaUsers style={{ marginRight: '8px' }} /> Lista de Espera ({selectedTrainingWaitlist.length})
            </WaitlistSectionTitle>
            {waitlistLoading && <LoadingText>A carregar lista de espera...</LoadingText>}
            {!waitlistLoading && selectedTrainingWaitlist.length > 0 ? (
              <ParticipantList>
                {selectedTrainingWaitlist.map(entry => (
                  <ParticipantItem key={entry.id}>
                    <div>
                      <span>{entry.user?.firstName} {entry.user?.lastName}</span>
                      <span className="email">{entry.user?.email} (Adicionado em: {new Date(entry.createdAt).toLocaleDateString('pt-PT')})</span>
                    </div>
                    <ActionButton
                      style={{backgroundColor: theme.colors.success, color: 'white'}}
                      onClick={() => handleAdminPromoteClient(selectedTrainingForSignups.id, entry.userId, entry.id, `${entry.user?.firstName} ${entry.user?.lastName}`)}
                      disabled={promoteLoading === entry.userId || (selectedTrainingForSignups.participants?.length || 0) >= selectedTrainingForSignups.capacity}
                    >
                      {promoteLoading === entry.userId ? 'A promover...' : <><FaLevelUpAlt /> Promover</>}
                    </ActionButton>
                  </ParticipantItem>
                ))}
              </ParticipantList>
            ) : (
              !waitlistLoading && <p style={{textAlign: 'center', marginTop: '10px', color: '#aaa'}}>Nenhum cliente na lista de espera.</p>
            )}

             <ModalActions>
                <ModalButton type="button" secondary onClick={handleCloseSignupsModal}>Fechar</ModalButton>
             </ModalActions>
          </SignupsModalContent>
        </ModalOverlay>
      )}

      {showDeleteRecurringModal && deleteRecurringInfo && (
        <ModalOverlay onClick={handleCancelDelete}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCancelDelete}><FaTimes /></CloseButton>
            <ModalTitle>Eliminar Treino Recorrente</ModalTitle>
            <p style={{color: theme.colors.textMain, marginBottom: '20px', lineHeight: '1.6'}}>
              Este treino faz parte de uma série recorrente.<br/><br/>
              Existem <strong>{deleteRecurringInfo.futureCount}</strong> treino(s) futuro(s) com as mesmas características.
            </p>
            <ModalActions style={{flexDirection: 'column', gap: '12px'}}>
              <ModalButton 
                type="button" 
                danger 
                onClick={handleDeleteAllRecurring}
                disabled={actionLoading}
                style={{width: '100%'}}
              >
                <FaTrashAlt style={{marginRight: '8px'}} />
                Eliminar Todos os Posteriores
              </ModalButton>
              <ModalButton 
                type="button" 
                primary 
                onClick={handleDeleteCurrentOnly}
                disabled={actionLoading}
                style={{width: '100%'}}
              >
                <FaTrashAlt style={{marginRight: '8px'}} />
                Apenas o Atual
              </ModalButton>
              <ModalButton 
                type="button" 
                secondary 
                onClick={handleCancelDelete}
                disabled={actionLoading}
                style={{width: '100%'}}
              >
                Cancelar
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {showUpdateRecurringModal && updateRecurringInfo && (
        <ModalOverlay onClick={handleCancelUpdate}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={handleCancelUpdate}><FaTimes /></CloseButton>
            <ModalTitle>Atualizar Treino Recorrente</ModalTitle>
            <p style={{color: theme.colors.textMain, marginBottom: '20px', lineHeight: '1.6'}}>
              Este treino faz parte de uma série recorrente.<br/><br/>
              Existem <strong>{updateRecurringInfo.futureCount}</strong> treino(s) futuro(s) com as mesmas características.
              <br/><br/>
              Queres atualizar apenas este treino ou todos os treinos futuros da série?
            </p>
            <ModalActions style={{flexDirection: 'column', gap: '12px'}}>
              <ModalButton 
                type="button" 
                primary 
                onClick={handleUpdateAllRecurring}
                disabled={formLoading}
                style={{width: '100%'}}
              >
                <FaRedoAlt style={{marginRight: '8px'}} />
                Atualizar Todos os Posteriores
              </ModalButton>
              <ModalButton 
                type="button" 
                secondary 
                onClick={handleUpdateCurrentOnly}
                disabled={formLoading}
                style={{width: '100%'}}
              >
                <FaEdit style={{marginRight: '8px'}} />
                Apenas Este Treino
              </ModalButton>
              <ModalButton 
                type="button" 
                secondary 
                onClick={handleCancelUpdate}
                disabled={formLoading}
                style={{width: '100%'}}
              >
                Cancelar
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={() => {
          if (!actionLoading) {
            setShowDeleteConfirmModal(false);
            setActionData(null);
          }
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Treino"
        message={actionData && actionData.type === 'delete' ? `Tens a certeza que queres eliminar o treino ID ${actionData.trainingId}?` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        danger={true}
        loading={actionLoading}
      />

      <ConfirmationModal
        isOpen={showCancelBookingConfirmModal}
        onClose={() => {
          if (!bookingLoading) {
            setShowCancelBookingConfirmModal(false);
            setActionData(null);
          }
        }}
        onConfirm={handleCancelBookingConfirm}
        title="Cancelar Inscrição"
        message={actionData && actionData.type === 'cancelBooking' ? `Tem a certeza que quer cancelar a inscrição de ${actionData.clientName} neste treino?` : ''}
        confirmText="Confirmar"
        cancelText="Cancelar"
        danger={true}
        loading={bookingLoading}
      />

      <ConfirmationModal
        isOpen={showPromoteConfirmModal}
        onClose={() => {
          if (promoteLoading === null) {
            setShowPromoteConfirmModal(false);
            setActionData(null);
          }
        }}
        onConfirm={handlePromoteConfirm}
        title="Promover da Lista de Espera"
        message={actionData && actionData.type === 'promote' ? `Tem a certeza que quer promover ${actionData.clientName} da lista de espera para este treino?` : ''}
        confirmText="Confirmar"
        cancelText="Cancelar"
        danger={false}
        loading={promoteLoading !== null}
      />
    </PageContainer>
  );
};

export default AdminManageTrainingsPage;