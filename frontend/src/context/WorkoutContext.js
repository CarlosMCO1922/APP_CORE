import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyLastPerformancesService, checkPersonalRecordsService, logExercisePerformanceService } from '../services/progressService';
import { useAuth } from './AuthContext';
import { safeGetItem, safeSetItem, validateWorkoutSession, clearInvalidStorage } from '../utils/storageUtils';
import { logger } from '../utils/logger';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [isMinimized, setIsMinimized] = useState(true);
    const [lastPerformances, setLastPerformances] = useState({});
    const { authState } = useAuth();
    const navigate = useNavigate();

    // Carrega um treino ativo do localStorage ao iniciar a app
    useEffect(() => {
        // Limpa dados inválidos/antigos
        clearInvalidStorage();
        
        // Tenta carregar treino com validação
        const savedWorkout = safeGetItem('activeWorkoutSession', validateWorkoutSession);
        if (savedWorkout) {
            setActiveWorkout(savedWorkout);
            setIsMinimized(true);
            logger.log("Treino carregado do localStorage:", savedWorkout);
        }
    }, []);

    // Guarda o treino no localStorage sempre que ele muda
    useEffect(() => {
        if (activeWorkout) {
            const success = safeSetItem('activeWorkoutSession', activeWorkout);
            if (!success) {
                logger.warn("Falha ao guardar treino no localStorage");
            }
        } else {
            localStorage.removeItem('activeWorkoutSession');
        }
    }, [activeWorkout]);

    const startWorkout = async (planData) => {
        if (activeWorkout) {
            alert("Já existe um treino em andamento. Finalize ou cancele o treino atual antes de iniciar um novo.");
            setIsMinimized(false);
            return Promise.reject(new Error("Treino já em andamento"));
        }

        if (!planData) {
            return Promise.reject(new Error("Dados do plano não fornecidos"));
        }

        try {
            const history = await getMyLastPerformancesService(authState.token);
            const historyMap = history.reduce((acc, perf) => {
                acc[perf.exerciseId] = perf;
                return acc;
            }, {});
            setLastPerformances(historyMap);
        } catch (error) {
            logger.error("Não foi possível carregar o histórico de performances:", error);
            setLastPerformances({});
        }

        try {
            const workoutSession = { ...planData, startTime: Date.now(), setsData: {} };
            setActiveWorkout(workoutSession);
            setIsMinimized(false);
            return Promise.resolve(workoutSession);
        } catch (error) {
            logger.error("Erro ao iniciar treino:", error);
            return Promise.reject(error);
        }
    };

    const updateSetData = (planExerciseId, setNumber, field, value) => {
        if (!activeWorkout) return;
        setActiveWorkout(prev => {
            const newSetsData = { ...prev.setsData };
            const key = `${planExerciseId}-${setNumber}`;
            if (!newSetsData[key]) newSetsData[key] = { planExerciseId, setNumber };
            newSetsData[key][field] = value;
            return { ...prev, setsData: newSetsData };
        });
    };

    // Regista uma série no backend e atualiza estado local (setsData e lastPerformances)
    const logSet = async (performanceData) => {
        try {
            const { token } = authState;
            if (!token) throw new Error('Sem token');
            const res = await logExercisePerformanceService(performanceData, token);
            const saved = res?.performance || {};
            // Atualiza setsData com o ID devolvido
            setActiveWorkout(prev => {
                if (!prev) return prev;
                const key = `${performanceData.planExerciseId}-${performanceData.setNumber}`;
                const current = prev.setsData[key] || {};
                const newSetsData = {
                    ...prev.setsData,
                    [key]: {
                        ...current,
                        ...performanceData,
                        id: saved.id ?? current.id,
                        performedAt: saved.performedAt ?? performanceData.performedAt,
                        isCompleted: true,
                    },
                };
                return { ...prev, setsData: newSetsData };
            });

            // Atualiza o último desempenho para o exercício (para alimentar UI)
            if (performanceData.exerciseId) {
                setLastPerformances(prev => ({
                    ...prev,
                    [performanceData.exerciseId]: {
                        id: saved.id,
                        exerciseId: performanceData.exerciseId,
                        planExerciseId: performanceData.planExerciseId,
                        performedAt: saved.performedAt ?? performanceData.performedAt,
                        performedWeight: performanceData.performedWeight,
                        performedReps: performanceData.performedReps,
                    },
                }));
            }
            return saved;
        } catch (err) {
            logger.error('Erro ao registar série:', err);
            alert('Falha ao registar a série. Verifique a ligação e tente novamente.');
            throw err;
        }
    };

    const finishWorkout = async () => {
        if (!activeWorkout) return;
        const completedSets = Object.values(activeWorkout.setsData).filter(
            set => set.performedWeight && set.performedReps
        );

        const totalVolume = completedSets.reduce((sum, set) => sum + (parseFloat(set.performedWeight) * parseInt(set.performedReps)), 0);
        
        let personalRecords = [];
        if (completedSets.length > 0) {
            try {
                const prResult = await checkPersonalRecordsService(completedSets, authState.token);
                personalRecords = prResult.records || [];
            } catch (error) { logger.error("Erro ao verificar PRs:", error); }
        }

        navigate('/treino/resumo', { 
            state: { 
                sessionData: completedSets,
                duration: Math.floor((Date.now() - activeWorkout.startTime) / 1000),
                workoutName: activeWorkout.name,
                totalVolume: totalVolume,
                personalRecords: personalRecords,
                allPlanExercises: activeWorkout.planExercises,
            } 
        });
        setActiveWorkout(null);
    };

    const cancelWorkout = () => { if (window.confirm("Tem a certeza? Todos os dados registados serão perdidos.")) setActiveWorkout(null); };

    const value = { activeWorkout, isMinimized, lastPerformances, startWorkout, finishWorkout, cancelWorkout, updateSetData, setIsMinimized, logSet };

    return ( <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider> );
};

export const useWorkout = () => useContext(WorkoutContext);