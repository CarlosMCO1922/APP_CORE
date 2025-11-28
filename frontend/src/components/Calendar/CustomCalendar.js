// src/components/Calendar/CustomCalendar.js
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfDay,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaChevronLeft, FaChevronRight, FaUsers, FaUserMd, FaCalendarDay, FaListUl, FaClock } from 'react-icons/fa';

const Views = {
  MONTH: 'month',
  WEEK: 'week',
  DAY: 'day',
  AGENDA: 'agenda'
};

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 12px;
  overflow: hidden;
`;

const CalendarHeader = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 25px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.cardBackground};
  gap: 15px;
  
  @media (max-width: 768px) {
    padding: 10px 12px;
    gap: 8px;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
`;

const MobileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const DesktopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
    gap: 4px;
  }
`;

const FilterLabel = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const FilterButton = styled.button`
  background-color: ${({ $isActive, theme }) => 
    $isActive ? theme.colors.primary : theme.colors.buttonSecondaryBg};
  color: ${({ $isActive, theme }) => 
    $isActive ? theme.colors.textDark : theme.colors.textMain};
  border: 1px solid ${({ $isActive, theme }) => 
    $isActive ? theme.colors.primary : theme.colors.cardBorder};
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  
  &:hover {
    background-color: ${({ $isActive, theme }) => 
      $isActive ? theme.colors.primaryHover : theme.colors.buttonSecondaryHoverBg};
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    padding: 5px 6px;
    font-size: 0.65rem;
    flex: 1;
    justify-content: center;
    min-width: 0;
    min-height: 30px;
    gap: 3px;
    
    span {
      display: none;
    }
    
    svg {
      font-size: 0.75rem;
      flex-shrink: 0;
    }
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  
  @media (max-width: 768px) {
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
`;

const HeaderTitle = styled.h2`
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
  font-weight: 700;
  min-width: 200px;
  text-align: center;
  flex: 1;
  
  @media (max-width: 768px) {
    min-width: auto;
    font-size: 0.8rem;
    flex: 1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const NavigationButton = styled.button`
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  color: ${({ theme }) => theme.colors.textMain};
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  min-width: 44px;
  
  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textDark};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    
    svg {
      font-size: 0.75rem;
    }
  }
`;

const TodayButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textDark};
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  font-size: 0.9rem;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 0.7rem;
    min-height: 32px;
  }
`;

const ViewButtons = styled.div`
  display: flex;
  gap: 8px;
  background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
  padding: 4px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  
  @media (max-width: 768px) {
    gap: 2px;
    padding: 2px;
    width: 100%;
    justify-content: space-between;
  }
`;

const ViewButton = styled.button`
  background-color: ${({ $isActive, theme }) => 
    $isActive ? theme.colors.primary : 'transparent'};
  color: ${({ $isActive, theme }) => 
    $isActive ? theme.colors.textDark : theme.colors.textMain};
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 36px;
  white-space: nowrap;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: ${({ $isActive, theme }) => 
      $isActive ? theme.colors.primaryHover : theme.colors.buttonSecondaryHoverBg};
    color: ${({ $isActive, theme }) => 
      $isActive ? theme.colors.textDark : theme.colors.textMain};
  }
  
  @media (max-width: 768px) {
    padding: 10px 18px !important;
    font-size: 0.75rem !important;
    flex: 1;
    min-width: 0;
    min-height: 30px;
    text-align: center;
    
    svg {
      display: none;
    }
  }
`;

// Month View Styles
const MonthView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MonthHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 2px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || theme.colors.cardBackground};
`;

const WeekdayHeader = styled.div`
  padding: 12px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.primary};
  text-transform: capitalize;
  border-right: 1px solid ${({ theme }) => theme.colors.cardBorder};
  
  &:last-child {
    border-right: none;
  }
  
  @media (max-width: 768px) {
    padding: 10px 4px;
    font-size: 0.75rem;
  }
`;

const MonthGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(100px, 1fr);
  overflow-y: auto;
  gap: 1px;
  background-color: ${({ theme }) => theme.colors.cardBorder};
  
  @media (max-width: 768px) {
    grid-auto-rows: minmax(80px, 1fr);
  }
`;

const DayCell = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  padding: 8px;
  position: relative;
  min-height: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  
  ${({ $isToday, theme }) => $isToday && `
    background-color: ${theme.colors.primary}15;
    border-color: ${theme.colors.primary}40;
  `}
  
  ${({ $isOtherMonth, theme }) => $isOtherMonth && `
    background-color: ${theme.colors.cardBackgroundDarker || theme.colors.cardBackground};
    opacity: 0.5;
  `}
  
  ${({ $isSelected, theme }) => $isSelected && `
    background-color: ${theme.colors.primary}25;
    border-color: ${theme.colors.primary};
  `}
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonSecondaryBg};
    transform: scale(1.02);
    z-index: 1;
  }
  
  @media (max-width: 768px) {
    min-height: 80px;
    padding: 6px;
  }
`;

const DayNumber = styled.div`
  font-weight: ${({ $isToday }) => $isToday ? '700' : '600'};
  font-size: 0.9rem;
  color: ${({ $isToday, theme }) => 
    $isToday ? theme.colors.primary : theme.colors.textMain};
  margin-bottom: 4px;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const EventList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
  max-height: calc(100% - 30px);
  overflow-y: auto;
`;

const EventChip = styled.div`
  background-color: ${({ $eventType, theme }) => 
    $eventType === 'training' 
      ? theme.colors.primary 
      : `${theme.colors.success}CC`};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    transform: translateX(2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  
  svg {
    font-size: 0.7rem;
    flex-shrink: 0;
  }
  
  .event-text {
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 0.7rem;
    padding: 3px 6px;
    min-width: 20px;
    justify-content: center;
  }
`;

const MoreEventsIndicator = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  padding: 2px 6px;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

// Week View Styles
const WeekView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  border-bottom: 2px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || theme.colors.cardBackground};
  
  @media (max-width: 768px) {
    grid-template-columns: 60px repeat(7, 1fr);
  }
`;

const TimeColumn = styled.div`
  border-right: 2px solid ${({ theme }) => theme.colors.cardBorder};
  padding: 10px;
  text-align: center;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.85rem;
`;

const WeekDayHeader = styled.div`
  padding: 12px 8px;
  text-align: center;
  border-right: 1px solid ${({ theme }) => theme.colors.cardBorder};
  
  &:last-child {
    border-right: none;
  }
`;

const WeekDayName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMain};
  text-transform: capitalize;
  margin-bottom: 4px;
`;

const WeekDayNumber = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${({ $isToday, theme }) => 
    $isToday ? theme.colors.primary : theme.colors.textMain};
  
  ${({ $isToday, theme }) => $isToday && `
    background-color: ${theme.colors.primary};
    color: ${theme.colors.textDark};
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  `}
`;

const WeekGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  overflow-y: auto;
  position: relative;
  
  @media (max-width: 768px) {
    grid-template-columns: 60px repeat(7, 1fr);
  }
`;

const TimeSlot = styled.div`
  border-right: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-bottom: 1px solid ${({ theme }) => theme.colors.cardBorder};
  padding: 4px 8px;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  min-height: 60px;
  
  @media (max-width: 768px) {
    min-height: 50px;
    font-size: 0.7rem;
  }
`;

const WeekDayColumn = styled.div`
  border-right: 1px solid ${({ theme }) => theme.colors.cardBorder};
  position: relative;
  
  &:last-child {
    border-right: none;
  }
`;

const WeekEvent = styled.div`
  position: absolute;
  background-color: ${({ $eventType, theme }) => 
    $eventType === 'training' 
      ? theme.colors.primary 
      : `${theme.colors.success}CC`};
  color: ${({ theme }) => theme.colors.textDark};
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1;
  min-width: 24px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    z-index: 2;
  }
  
  svg {
    font-size: 0.75rem;
    flex-shrink: 0;
  }
  
  .event-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
    padding: 4px 6px;
    justify-content: center;
    min-width: 20px;
  }
`;

// Day View Styles
const DayView = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const DayHeader = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr;
  border-bottom: 2px solid ${({ theme }) => theme.colors.cardBorder};
  background-color: ${({ theme }) => theme.colors.cardBackgroundDarker || theme.colors.cardBackground};
  
  @media (max-width: 768px) {
    grid-template-columns: 60px 1fr;
  }
`;

const DayGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 80px 1fr;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    grid-template-columns: 60px 1fr;
  }
`;

const DayColumn = styled.div`
  position: relative;
`;

// Agenda View Styles
const AgendaView = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const AgendaDateGroup = styled.div`
  margin-bottom: 30px;
`;

const AgendaDateHeader = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.cardBorder};
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const AgendaEventCard = styled.div`
  background-color: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-left: 4px solid ${({ $eventType, theme }) => 
    $eventType === 'training' 
      ? theme.colors.primary 
      : theme.colors.success};
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-left-width: 6px;
  }
`;

const AgendaEventTime = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AgendaEventTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textMain};
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: ${({ $eventType, theme }) => 
      $eventType === 'training' 
        ? theme.colors.primary 
        : theme.colors.success};
  }
`;

const AgendaEventDetails = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  
  svg {
    font-size: 3rem;
    color: ${({ theme }) => theme.colors.primary}60;
    margin-bottom: 15px;
  }
`;

const CustomCalendar = ({
  events = [],
  currentDate: initialDate = new Date(),
  view: initialView = Views.WEEK,
  onNavigate,
  onViewChange,
  onSelectEvent,
  onSelectSlot,
  selectable = true,
  min = new Date(1970, 0, 1, 7, 0, 0),
  max = new Date(1970, 0, 1, 22, 0, 0),
  step = 60,
  messages = {}
}) => {
  // Garantir que events é sempre um array
  const safeEvents = Array.isArray(events) ? events : [];
  
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentView, setCurrentView] = useState(initialView);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventFilter, setEventFilter] = useState('all'); // 'all', 'training', 'appointment'

  const weekStartsOn = 1; // Monday

  const handleNavigate = (direction) => {
    let newDate;
    if (direction === 'prev') {
      if (currentView === Views.MONTH) {
        newDate = subMonths(currentDate, 1);
      } else if (currentView === Views.WEEK) {
        newDate = subWeeks(currentDate, 1);
      } else {
        newDate = subDays(currentDate, 1);
      }
    } else if (direction === 'next') {
      if (currentView === Views.MONTH) {
        newDate = addMonths(currentDate, 1);
      } else if (currentView === Views.WEEK) {
        newDate = addWeeks(currentDate, 1);
      } else {
        newDate = addDays(currentDate, 1);
      }
    } else {
      newDate = new Date();
    }
    setCurrentDate(newDate);
    if (onNavigate) onNavigate(newDate);
  };

  const handleViewChange = (newView) => {
    setCurrentView(newView);
    if (onViewChange) onViewChange(newView);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (onNavigate) onNavigate(today);
  };

  // Month View Logic
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getEventsForDay = (day) => {
    if (!filteredEvents || !Array.isArray(filteredEvents)) return [];
    
    const dayStart = startOfDay(day);
    return filteredEvents.filter(event => {
      if (!event || !event.start) return false;
      
      try {
        const eventStart = event.start instanceof Date ? event.start : parseISO(event.start);
        return isSameDay(eventStart, dayStart);
      } catch (error) {
        console.error('Error processing event:', error, event);
        return false;
      }
    });
  };

  // Week View Logic
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn });
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [currentDate]);

  const timeSlots = useMemo(() => {
    const slots = [];
    const startHour = getHours(min);
    const endHour = getHours(max);
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(setHours(setMinutes(new Date(1970, 0, 1), 0), hour));
    }
    return slots;
  }, [min, max]);

  // Filtrar eventos baseado no filtro selecionado
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return safeEvents;
    return safeEvents.filter(event => {
      const eventType = event.resource?.type;
      if (eventFilter === 'training') return eventType === 'training';
      if (eventFilter === 'appointment') return eventType === 'appointment';
      return true;
    });
  }, [safeEvents, eventFilter]);

  const getEventsForWeekDay = (day, hour) => {
    if (!filteredEvents || !Array.isArray(filteredEvents)) return [];
    
    return filteredEvents.filter(event => {
      if (!event || !event.start) return false;
      
      try {
        const eventStart = event.start instanceof Date ? event.start : parseISO(event.start);
        
        // Verifica se o evento começa neste dia específico
        if (!isSameDay(eventStart, day)) {
          return false;
        }
        
        // Verifica se o evento começa neste slot de hora específico
        const eventHour = getHours(eventStart);
        return eventHour === hour;
      } catch (error) {
        console.error('Error processing event:', error, event);
        return false;
      }
    });
  };

  // Função para calcular posicionamento lado a lado quando há sobreposição
  const calculateEventPositions = (events) => {
    if (!events || events.length === 0) return [];
    
    // Ordenar eventos por hora de início
    const sortedEvents = [...events].sort((a, b) => {
      try {
        const aStart = a.start instanceof Date ? a.start : parseISO(a.start);
        const bStart = b.start instanceof Date ? b.start : parseISO(b.start);
        const aMinutes = getHours(aStart) * 60 + getMinutes(aStart);
        const bMinutes = getHours(bStart) * 60 + getMinutes(bStart);
        return aMinutes - bMinutes;
      } catch {
        return 0;
      }
    });
    
    const positionedEvents = [];
    const columns = []; // Array de arrays, cada array representa uma coluna
    
    sortedEvents.forEach((event) => {
      try {
        const eventStart = event.start instanceof Date ? event.start : parseISO(event.start);
        const eventEnd = event.end instanceof Date ? event.end : parseISO(event.end);
        const startMinutes = getHours(eventStart) * 60 + getMinutes(eventStart);
        const endMinutes = getHours(eventEnd) * 60 + getMinutes(eventEnd);
        
        // Encontrar uma coluna disponível (sem sobreposição)
        let columnIndex = -1;
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          // Verificar se há sobreposição com algum evento nesta coluna
          const hasOverlap = column.some(existingEvent => {
            try {
              const existingStart = existingEvent.start instanceof Date ? existingEvent.start : parseISO(existingEvent.start);
              const existingEnd = existingEvent.end instanceof Date ? existingEvent.end : parseISO(existingEvent.end);
              const existingStartMinutes = getHours(existingStart) * 60 + getMinutes(existingStart);
              const existingEndMinutes = getHours(existingEnd) * 60 + getMinutes(existingEnd);
              
              // Verifica sobreposição: eventos sobrepõem-se se não são completamente separados
              return !(endMinutes <= existingStartMinutes || startMinutes >= existingEndMinutes);
            } catch {
              return false;
            }
          });
          
          if (!hasOverlap) {
            columnIndex = i;
            break;
          }
        }
        
        // Se não encontrou coluna disponível, cria uma nova
        if (columnIndex === -1) {
          columnIndex = columns.length;
          columns.push([]);
        }
        
        // Adicionar evento à coluna
        columns[columnIndex].push(event);
        
        positionedEvents.push({
          event,
          column: columnIndex,
          totalColumns: columns.length,
          startMinutes,
          endMinutes
        });
      } catch (error) {
        console.error('Error calculating event position:', error, event);
      }
    });
    
    return positionedEvents;
  };

  // Agenda View Logic
  const agendaEvents = useMemo(() => {
    if (!filteredEvents || !Array.isArray(filteredEvents)) return {};
    
    const sorted = [...filteredEvents].filter(event => event && event.start).sort((a, b) => {
      try {
        const aStart = a.start instanceof Date ? a.start : parseISO(a.start);
        const bStart = b.start instanceof Date ? b.start : parseISO(b.start);
        return aStart - bStart;
      } catch (error) {
        console.error('Error sorting events:', error);
        return 0;
      }
    });

    const grouped = {};
    sorted.forEach(event => {
      try {
        const eventStart = event.start instanceof Date ? event.start : parseISO(event.start);
        const dateKey = format(eventStart, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      } catch (error) {
        console.error('Error grouping event:', error, event);
      }
    });

    return grouped;
  }, [filteredEvents]);

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    if (onSelectEvent) onSelectEvent(event);
  };

  const handleDayClick = (day) => {
    setSelectedDate(day);
    if (onSelectSlot) {
      onSelectSlot({ start: day, end: addDays(day, 1) });
    }
  };

  const handleSlotClick = (day, hour) => {
    if (onSelectSlot && selectable) {
      const slotStart = setHours(setMinutes(startOfDay(day), 0), hour);
      const slotEnd = setHours(setMinutes(startOfDay(day), 59), hour);
      onSelectSlot({ start: slotStart, end: slotEnd });
    }
  };

  const formatDateTitle = () => {
    if (currentView === Views.MONTH) {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (currentView === Views.WEEK) {
      const weekStart = startOfWeek(currentDate, { weekStartsOn });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn });
      return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`;
    } else if (currentView === Views.DAY) {
      return format(currentDate, 'EEEE, d MMMM yyyy', { locale: ptBR });
    }
    return format(currentDate, 'MMMM yyyy', { locale: ptBR });
  };

  const renderMonthView = () => {
    const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return (
      <MonthView>
        <MonthHeader>
          {weekdays.map(day => (
            <WeekdayHeader key={day}>{day}</WeekdayHeader>
          ))}
        </MonthHeader>
        <MonthGrid>
          {monthDays.map((day, idx) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDay = isToday(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            
            return (
              <DayCell
                key={idx}
                $isOtherMonth={!isCurrentMonth}
                $isToday={isTodayDay}
                $isSelected={isSelected}
                onClick={() => handleDayClick(day)}
              >
                <DayNumber $isToday={isTodayDay}>
                  {format(day, 'd')}
                </DayNumber>
                <EventList>
                  {dayEvents.slice(0, 3).map((event, eventIdx) => (
                    <EventChip
                      key={eventIdx}
                      $eventType={event.resource?.type}
                      onClick={(e) => handleEventClick(event, e)}
                      title={event.title}
                    >
                      {event.resource?.type === 'training' ? <FaUsers /> : <FaUserMd />}
                      <span className="event-text">{event.title.split('(')[0].trim().split(':')[0]}</span>
                    </EventChip>
                  ))}
                  {dayEvents.length > 3 && (
                    <MoreEventsIndicator>
                      +{dayEvents.length - 3} mais
                    </MoreEventsIndicator>
                  )}
                </EventList>
              </DayCell>
            );
          })}
        </MonthGrid>
      </MonthView>
    );
  };

  const renderWeekView = () => {
    const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return (
      <WeekView>
        <WeekHeader>
          <TimeColumn></TimeColumn>
          {weekDays.map((day, idx) => {
            const isTodayDay = isToday(day);
            return (
              <WeekDayHeader key={idx}>
                <WeekDayName>{weekdays[day.getDay() === 0 ? 6 : day.getDay() - 1]}</WeekDayName>
                <WeekDayNumber $isToday={isTodayDay}>
                  {format(day, 'd')}
                </WeekDayNumber>
              </WeekDayHeader>
            );
          })}
        </WeekHeader>
        <WeekGrid>
          {timeSlots.map((slot, slotIdx) => {
            const hour = getHours(slot);
            return (
              <React.Fragment key={slotIdx}>
                <TimeSlot>
                  {format(slot, 'HH:mm')}
                </TimeSlot>
                {weekDays.map((day, dayIdx) => {
                  // Obter todos os eventos do dia para calcular sobreposições
                  const allDayEvents = filteredEvents.filter(event => {
                    if (!event || !event.start) return false;
                    try {
                      const eventStart = event.start instanceof Date ? event.start : parseISO(event.start);
                      return isSameDay(eventStart, day);
                    } catch {
                      return false;
                    }
                  });
                  
                  const positionedEvents = calculateEventPositions(allDayEvents);
                  const slotMinutes = hour * 60;
                  
                  return (
                    <WeekDayColumn
                      key={dayIdx}
                      onClick={() => handleSlotClick(day, hour)}
                    >
                      {positionedEvents.map(({ event, column, totalColumns, startMinutes, endMinutes }, eventIdx) => {
                        const top = ((startMinutes - slotMinutes) / 60) * 100;
                        const height = ((endMinutes - startMinutes) / 60) * 100;
                        const width = `${100 / totalColumns}%`;
                        const left = `${(column / totalColumns) * 100}%`;
                        
                        // Só renderizar se o evento está visível neste slot
                        if (endMinutes <= slotMinutes || startMinutes >= slotMinutes + 60) {
                          return null;
                        }
                        
                        return (
                          <WeekEvent
                            key={`${dayIdx}-${eventIdx}`}
                            $eventType={event.resource?.type}
                            onClick={(e) => handleEventClick(event, e)}
                            style={{
                              top: `${Math.max(0, top)}%`,
                              height: `${Math.max(20, height)}%`,
                              left: left,
                              width: width,
                              marginLeft: column > 0 ? '2px' : '4px',
                              marginRight: column < totalColumns - 1 ? '2px' : '4px',
                            }}
                            title={event.title}
                          >
                            {event.resource?.type === 'training' ? <FaUsers /> : <FaUserMd />}
                            <span className="event-text">{event.title.split('(')[0].trim().split(':')[0]}</span>
                          </WeekEvent>
                        );
                      })}
                    </WeekDayColumn>
                  );
                })}
              </React.Fragment>
            );
          })}
        </WeekGrid>
      </WeekView>
    );
  };

  const renderDayView = () => {
    return (
      <DayView>
        <DayHeader>
          <TimeColumn></TimeColumn>
          <WeekDayHeader>
            <WeekDayName>{format(currentDate, 'EEEE', { locale: ptBR })}</WeekDayName>
            <WeekDayNumber $isToday={isToday(currentDate)}>
              {format(currentDate, 'd')}
            </WeekDayNumber>
          </WeekDayHeader>
        </DayHeader>
        <DayGrid>
          {timeSlots.map((slot, slotIdx) => {
            const hour = getHours(slot);
            // Obter todos os eventos do dia para calcular sobreposições
            const allDayEvents = filteredEvents.filter(event => {
              if (!event || !event.start) return false;
              try {
                const eventStart = event.start instanceof Date ? event.start : parseISO(event.start);
                return isSameDay(eventStart, currentDate);
              } catch {
                return false;
              }
            });
            
            const positionedEvents = calculateEventPositions(allDayEvents);
            const slotMinutes = hour * 60;
            
            return (
              <React.Fragment key={slotIdx}>
                <TimeSlot>
                  {format(slot, 'HH:mm')}
                </TimeSlot>
                <DayColumn onClick={() => handleSlotClick(currentDate, hour)}>
                  {positionedEvents.map(({ event, column, totalColumns, startMinutes, endMinutes }, eventIdx) => {
                    const top = ((startMinutes - slotMinutes) / 60) * 100;
                    const height = ((endMinutes - startMinutes) / 60) * 100;
                    const width = `${100 / totalColumns}%`;
                    const left = `${(column / totalColumns) * 100}%`;
                    
                    // Só renderizar se o evento está visível neste slot
                    if (endMinutes <= slotMinutes || startMinutes >= slotMinutes + 60) {
                      return null;
                    }
                    
                    return (
                      <WeekEvent
                        key={eventIdx}
                        $eventType={event.resource?.type}
                        onClick={(e) => handleEventClick(event, e)}
                        style={{
                          top: `${Math.max(0, top)}%`,
                          height: `${Math.max(20, height)}%`,
                          left: left,
                          width: width,
                          marginLeft: column > 0 ? '2px' : '4px',
                          marginRight: column < totalColumns - 1 ? '2px' : '4px',
                        }}
                        title={event.title}
                      >
                        {event.resource?.type === 'training' ? <FaUsers /> : <FaUserMd />}
                        <span className="event-text">{event.title.split('(')[0].trim().split(':')[0]}</span>
                      </WeekEvent>
                    );
                  })}
                </DayColumn>
              </React.Fragment>
            );
          })}
        </DayGrid>
      </DayView>
    );
  };

  const renderAgendaView = () => {
    const dateKeys = Object.keys(agendaEvents).sort();
    
    if (dateKeys.length === 0) {
      return (
        <EmptyState>
          <FaCalendarDay />
          <p>Nenhum evento agendado</p>
        </EmptyState>
      );
    }
    
    return (
      <AgendaView>
        {dateKeys.map(dateKey => {
          const dateEvents = agendaEvents[dateKey];
          const date = parseISO(dateKey);
          
          return (
            <AgendaDateGroup key={dateKey}>
              <AgendaDateHeader>
                {format(date, 'EEEE, d MMMM yyyy', { locale: ptBR })}
              </AgendaDateHeader>
              {dateEvents.map((event, idx) => {
                const eventStart = event.start instanceof Date ? event.start : parseISO(event.start);
                const eventEnd = event.end instanceof Date ? event.end : parseISO(event.end);
                
                return (
                  <AgendaEventCard
                    key={idx}
                    $eventType={event.resource?.type}
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    <AgendaEventTime>
                      <FaClock />
                      {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
                    </AgendaEventTime>
                    <AgendaEventTitle $eventType={event.resource?.type}>
                      {event.resource?.type === 'training' ? <FaUsers /> : <FaUserMd />}
                      {event.title}
                    </AgendaEventTitle>
                    {event.resource && (
                      <AgendaEventDetails>
                        {event.resource.type === 'training' && event.resource.capacity && (
                          <div>Capacidade: {event.resource.participants?.length || 0}/{event.resource.capacity}</div>
                        )}
                        {event.resource.type === 'appointment' && event.resource.status && (
                          <div>Estado: {event.resource.status}</div>
                        )}
                      </AgendaEventDetails>
                    )}
                  </AgendaEventCard>
                );
              })}
            </AgendaDateGroup>
          );
        })}
      </AgendaView>
    );
  };

  return (
    <CalendarContainer>
      <CalendarHeader>
        {/* Desktop Layout */}
        <DesktopRow>
          <HeaderLeft>
            <NavigationButton onClick={() => handleNavigate('prev')}>
              <FaChevronLeft />
            </NavigationButton>
            <HeaderTitle>{formatDateTitle()}</HeaderTitle>
            <NavigationButton onClick={() => handleNavigate('next')}>
              <FaChevronRight />
            </NavigationButton>
            <TodayButton onClick={handleToday}>Hoje</TodayButton>
          </HeaderLeft>
          <ViewButtons>
            <ViewButton
              $isActive={currentView === Views.MONTH}
              onClick={() => handleViewChange(Views.MONTH)}
            >
              <FaCalendarDay style={{ marginRight: '6px' }} />
              Mês
            </ViewButton>
            <ViewButton
              $isActive={currentView === Views.WEEK}
              onClick={() => handleViewChange(Views.WEEK)}
            >
              Semana
            </ViewButton>
            <ViewButton
              $isActive={currentView === Views.DAY}
              onClick={() => handleViewChange(Views.DAY)}
            >
              Dia
            </ViewButton>
            <ViewButton
              $isActive={currentView === Views.AGENDA}
              onClick={() => handleViewChange(Views.AGENDA)}
            >
              <FaListUl style={{ marginRight: '6px' }} />
              Agenda
            </ViewButton>
          </ViewButtons>
        </DesktopRow>
        
        {/* Mobile Layout - Row 1: Navigation */}
        <MobileRow>
          <NavigationButton onClick={() => handleNavigate('prev')}>
            <FaChevronLeft />
          </NavigationButton>
          <HeaderTitle>{formatDateTitle()}</HeaderTitle>
          <NavigationButton onClick={() => handleNavigate('next')}>
            <FaChevronRight />
          </NavigationButton>
          <TodayButton onClick={handleToday}>Hoje</TodayButton>
        </MobileRow>
        
        {/* Mobile Layout - Row 2: View Buttons */}
        <MobileRow>
          <ViewButtons>
            <ViewButton
              $isActive={currentView === Views.MONTH}
              onClick={() => handleViewChange(Views.MONTH)}
            >
              Mês
            </ViewButton>
            <ViewButton
              $isActive={currentView === Views.WEEK}
              onClick={() => handleViewChange(Views.WEEK)}
            >
              Semana
            </ViewButton>
            <ViewButton
              $isActive={currentView === Views.DAY}
              onClick={() => handleViewChange(Views.DAY)}
            >
              Dia
            </ViewButton>
            <ViewButton
              $isActive={currentView === Views.AGENDA}
              onClick={() => handleViewChange(Views.AGENDA)}
            >
              Agenda
            </ViewButton>
          </ViewButtons>
        </MobileRow>
        
        {/* Filter Section */}
        <FilterContainer>
          <FilterLabel>Filtrar:</FilterLabel>
          <FilterButton
            $isActive={eventFilter === 'all'}
            onClick={() => setEventFilter('all')}
          >
            <FaUsers style={{ fontSize: '0.85rem' }} />
            <FaUserMd style={{ fontSize: '0.85rem' }} />
            <span>Todos</span>
          </FilterButton>
          <FilterButton
            $isActive={eventFilter === 'training'}
            onClick={() => setEventFilter('training')}
          >
            <FaUsers style={{ fontSize: '0.85rem' }} />
            <span>Treinos</span>
          </FilterButton>
          <FilterButton
            $isActive={eventFilter === 'appointment'}
            onClick={() => setEventFilter('appointment')}
          >
            <FaUserMd style={{ fontSize: '0.85rem' }} />
            <span>Consultas</span>
          </FilterButton>
        </FilterContainer>
      </CalendarHeader>
      
      {currentView === Views.MONTH && renderMonthView()}
      {currentView === Views.WEEK && renderWeekView()}
      {currentView === Views.DAY && renderDayView()}
      {currentView === Views.AGENDA && renderAgendaView()}
    </CalendarContainer>
  );
};

export default CustomCalendar;
export { Views };

