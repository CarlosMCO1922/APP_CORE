import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyLastPerformancesService, checkPersonalRecordsService, logExercisePerformanceService, getMyPerformanceHistoryForExerciseService } from '../services/progressService';
import { useAuth } from './AuthContext';
import { safeGetItem, safeSetItem, validateWorkoutSession, clearInvalidStorage } from '../utils/storageUtils';
import { logger } from '../utils/logger';
import { ensurePlanExercisesOrdered } from '../utils/exerciseOrderUtils';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [isMinimized, setIsMinimized] = useState(true);
    const [lastPerformances, setLastPerformances] = useState({});
    const [exercisePlaceholders, setExercisePlaceholders] = useState({}); // { planExerciseId: [{ weight, reps }, ...] }
    const { authState } = useAuth();
    const navigate = useNavigate();

    // Carrega um treino ativo do localStorage ao iniciar a app
    useEffect(() => {
        // Limpa dados inválidos/antigos
        clearInvalidStorage();
        
        // Tenta carregar treino com validação
        const savedWorkout = safeGetItem('activeWorkoutSession', validateWorkoutSession);
        if (savedWorkout) {
            // GARANTIR que os exercícios estão ordenados ao carregar do localStorage
            const orderedWorkout = ensurePlanExercisesOrdered(savedWorkout);
            setActiveWorkout(orderedWorkout);
            setIsMinimized(true);
            logger.log("Treino carregado do localStorage com exercícios ordenados:", orderedWorkout);
            
            // Recarregar placeholders quando treino é restaurado
            if (authState.token && orderedWorkout.planExercises) {
                const loadPlaceholders = async () => {
                    const currentTrainingId = orderedWorkout.trainingId || null;
                    const placeholdersMap = {};
                    
                    await Promise.all(
                        orderedWorkout.planExercises.map(async (planExercise) => {
                            const planExerciseId = planExercise.id || planExercise.planExerciseId;
                            if (!planExerciseId) return;
                            
                            try {
                                const historyData = await getMyPerformanceHistoryForExerciseService(
                                    planExerciseId, 
                                    authState.token, 
                                    true, 
                                    currentTrainingId
                                );
                                
                                if (historyData && historyData.length > 0) {
                                    const placeholders = historyData.slice(0, 3).map(set => ({
                                        weight: set.performedWeight || null,
                                        reps: set.performedReps || null
                                    }));
                                    placeholdersMap[planExerciseId] = placeholders;
                                }
                            } catch (err) {
                                logger.warn(`Não foi possível buscar histórico para exercício ${planExerciseId}:`, err);
                            }
                        })
                    );
                    
                    setExercisePlaceholders(placeholdersMap);
                };
                
                loadPlaceholders();
            }
        }
    }, [authState.token]);

    // Função para recarregar placeholders de um exercício específico ou de todos
    const reloadPlaceholdersForActiveWorkout = React.useCallback(async (specificPlanExerciseId = null) => {
        if (!activeWorkout || !authState.token) return;
        
        try {
            const currentTrainingId = activeWorkout.trainingId || null;
            const exercisesToLoad = specificPlanExerciseId 
                ? activeWorkout.planExercises.filter(pe => {
                    const id = pe.id || pe.planExerciseId;
                    return id === specificPlanExerciseId;
                })
                : activeWorkout.planExercises;

            const placeholdersMap = {};
            
            await Promise.all(
                exercisesToLoad.map(async (planExercise) => {
                    const planExerciseId = planExercise.id || planExercise.planExerciseId;
                    if (!planExerciseId) return;
                    
                    try {
                        const historyData = await getMyPerformanceHistoryForExerciseService(
                            planExerciseId, 
                            authState.token, 
                            true, 
                            currentTrainingId
                        );
                        
                        if (historyData && historyData.length > 0) {
                            const placeholders = historyData.slice(0, 3).map(set => ({
                                weight: set.performedWeight || null,
                                reps: set.performedReps || null
                            }));
                            placeholdersMap[planExerciseId] = placeholders;
                            logger.log(`Placeholders recarregados para planExerciseId ${planExerciseId}:`, placeholders);
                        } else {
                            // Se não há histórico, manter placeholders vazios
                            placeholdersMap[planExerciseId] = [];
                        }
                    } catch (err) {
                        logger.warn(`Não foi possível recarregar histórico para exercício ${planExerciseId}:`, err);
                    }
                })
            );
            
            setExercisePlaceholders(prev => ({ ...prev, ...placeholdersMap }));
        } catch (error) {
            logger.error("Erro ao recarregar placeholders:", error);
        }
    }, [activeWorkout, authState.token]);

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
            // GARANTIR que os exercícios estão ordenados antes de iniciar o treino
            const orderedPlanData = ensurePlanExercisesOrdered(planData);
            
            // Buscar histórico completo (últimas 3 séries) de cada exercício para placeholders
            const placeholdersMap = {};
            if (orderedPlanData.planExercises && authState.token) {
                // Obter trainingId atual se existir (para excluir do histórico)
                const currentTrainingId = orderedPlanData.trainingId || null;
                
                await Promise.all(
                    orderedPlanData.planExercises.map(async (planExercise) => {
                        // Tentar ambos os campos para garantir compatibilidade
                        const planExerciseId = planExercise.id || planExercise.planExerciseId;
                        if (!planExerciseId) {
                            logger.warn('planExercise sem ID válido:', planExercise);
                            return;
                        }
                        
                        try {
                            const historyData = await getMyPerformanceHistoryForExerciseService(planExerciseId, authState.token, true, currentTrainingId);
                            // Mapear as séries do histórico para placeholders (máximo 3)
                            if (historyData && historyData.length > 0) {
                                const placeholders = historyData.slice(0, 3).map(set => ({
                                    weight: set.performedWeight || null,
                                    reps: set.performedReps || null
                                }));
                                placeholdersMap[planExerciseId] = placeholders;
                                logger.log(`Placeholders carregados para planExerciseId ${planExerciseId}:`, placeholders);
                            } else {
                                logger.log(`Nenhum histórico encontrado para planExerciseId ${planExerciseId}`);
                            }
                        } catch (err) {
                            logger.warn(`Não foi possível buscar histórico para exercício ${planExerciseId}:`, err);
                        }
                    })
                );
            }
            setExercisePlaceholders(placeholdersMap);
            
            const workoutSession = { ...orderedPlanData, startTime: Date.now(), setsData: {} };
            setActiveWorkout(workoutSession);
            setIsMinimized(false);
            logger.log("Treino iniciado com exercícios ordenados:", workoutSession.planExercises?.map(e => ({ order: e.order, internalOrder: e.internalOrder, name: e.exerciseDetails?.name })));
            return Promise.resolve(workoutSession);
        } catch (error) {
            logger.error("Erro ao iniciar treino:", error);
            return Promise.reject(error);
        }
    };

    const updateSetData = (planExerciseId, setNumber, field, value) => {
        if (!activeWorkout) return;
        setActiveWorkout(prev => {
            if (!prev) return prev;
            const newSetsData = { ...prev.setsData };
            const key = `${planExerciseId}-${setNumber}`;
            if (!newSetsData[key]) newSetsData[key] = { planExerciseId, setNumber };
            newSetsData[key][field] = value;
            const updated = { ...prev, setsData: newSetsData };
            
            // Salvar imediatamente no localStorage (sem esperar pelo useEffect)
            safeSetItem('activeWorkoutSession', updated);
            
            return updated;
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
        
        // Obter todos os sets completados
        const completedSets = Object.values(activeWorkout.setsData).filter(
            set => set.performedWeight && set.performedReps && set.isCompleted
        );

        // Criar mapa de planExerciseId -> exerciseId
        const planToExerciseIdMap = {};
        (activeWorkout.planExercises || []).forEach(pe => {
            const planId = pe.id ?? pe.planExerciseId;
            const exId = pe.exerciseDetails?.id;
            if (planId && exId) planToExerciseIdMap[planId] = exId;
        });

        // Gravar todos os sets no backend ANTES de navegar
        if (completedSets.length > 0) {
            try {
                const { token } = authState;
                if (!token) throw new Error('Sem token para gravar sets');

                // Gravar cada set no backend
                for (const setData of completedSets) {
                    const exerciseId = planToExerciseIdMap[setData.planExerciseId];
                    if (!exerciseId) {
                        logger.warn('Não foi possível mapear planExerciseId -> exerciseId', { planExerciseId: setData.planExerciseId });
                        continue;
                    }

                    const fullSetData = {
                        trainingId: activeWorkout.trainingId || null,
                        workoutPlanId: activeWorkout.id,
                        planExerciseId: setData.planExerciseId,
                        exerciseId,
                        setNumber: setData.setNumber,
                        weight: Number(setData.performedWeight),
                        reps: Number(setData.performedReps),
                        weightKg: Number(setData.performedWeight),
                        performedWeight: Number(setData.performedWeight),
                        performedReps: Number(setData.performedReps),
                        performedAt: setData.performedAt || new Date().toISOString(),
                    };

                    await logSet(fullSetData);
                }
            } catch (error) {
                logger.error('Erro ao gravar sets no backend:', error);
                alert('Falha ao gravar alguns dados do treino. Verifique a ligação e tente novamente.');
                throw error; // Impede navegação se houver erro
            }
        }

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

    const cancelWorkout = () => { setActiveWorkout(null); };

    const value = { 
        activeWorkout, 
        isMinimized, 
        lastPerformances, 
        exercisePlaceholders, 
        startWorkout, 
        finishWorkout, 
        cancelWorkout, 
        updateSetData, 
        setIsMinimized, 
        logSet,
        reloadPlaceholdersForActiveWorkout 
    };

    return ( <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider> );
};

export const useWorkout = () => useContext(WorkoutContext);