import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyLastPerformancesService, checkPersonalRecordsService, logExercisePerformanceService, getMyPerformanceHistoryForExerciseService, saveTrainingSessionDraftService, getTrainingSessionDraftService, deleteTrainingSessionDraftService } from '../services/progressService';
import { useAuth } from './AuthContext';
import { safeGetItem, safeSetItem, validateWorkoutSession, clearInvalidStorage, isWorkoutAbandoned, resolveWorkoutConflict, getWorkoutLastUpdate } from '../utils/storageUtils';
import { logger } from '../utils/logger';
import { ensurePlanExercisesOrdered } from '../utils/exerciseOrderUtils';
import { connectWebSocket, disconnectWebSocket, requestWorkoutSync, notifyWorkoutUpdate, notifyWorkoutFinished, getDeviceId, isWebSocketConnected } from '../services/websocketService';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [isMinimized, setIsMinimized] = useState(true);
    const [lastPerformances, setLastPerformances] = useState({});
    const [exercisePlaceholders, setExercisePlaceholders] = useState({}); // { planExerciseId: [{ weight, reps }, ...] }
    const [syncStatus, setSyncStatus] = useState({ synced: true, lastSync: null, error: null }); // Estado de sincronização
    const deviceIdRef = useRef(getDeviceId()); // ID do dispositivo atual
    const { authState } = useAuth();
    const navigate = useNavigate();

    // Carrega um treino ativo (tenta backend primeiro, depois localStorage, resolve conflitos)
    // IMPORTANTE: Este useEffect só executa quando a autenticação está completa
    // para não interferir com o processo de validação de autenticação
    useEffect(() => {
        // Não carregar workout se ainda está a validar autenticação ou se não está autenticado
        if (!authState.isAuthenticated || authState.isValidating || !authState.token) {
            return;
        }

        const loadWorkout = async () => {
            // Limpa dados inválidos/antigos
            clearInvalidStorage();
            
            let backendWorkout = null;
            let localWorkout = null;
            
            // PRIORIDADE 1: Tentar recuperar do backend primeiro
            // Usar Promise.race com timeout para não bloquear
            if (authState.token) {
                try {
                    // Timeout de 3 segundos - se demorar mais, usar localStorage
                    const draftPromise = getTrainingSessionDraftService(authState.token, null, null, deviceIdRef.current);
                    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
                    
                    const backendDraft = await Promise.race([draftPromise, timeoutPromise]);
                    
                    if (backendDraft && backendDraft.sessionData) {
                        // Reconstruir objeto workout a partir do draft do backend
                        backendWorkout = {
                            ...backendDraft.sessionData,
                            trainingId: backendDraft.trainingId,
                            id: backendDraft.workoutPlanId,
                            startTime: backendDraft.startTime,
                            lastUpdated: backendDraft.updatedAt ? new Date(backendDraft.updatedAt).getTime() : null,
                            source: 'backend',
                        };
                        logger.log("Treino recuperado do backend:", backendWorkout);
                    }
                } catch (err) {
                    // Erro silencioso - não bloquear o fluxo
                    logger.warn("Erro ao recuperar draft do backend, tentando localStorage:", err.message || err);
                }
            }
            
            // PRIORIDADE 2: Tentar recuperar do localStorage
            localWorkout = safeGetItem('activeWorkoutSession', validateWorkoutSession);
            if (localWorkout) {
                localWorkout.lastUpdated = getWorkoutLastUpdate(localWorkout);
                localWorkout.source = 'localStorage';
                logger.log("Treino carregado do localStorage:", localWorkout);
            }
            
            // RESOLUÇÃO DE CONFLITOS: Se ambos existem, usar o mais recente
            let savedWorkout = null;
            if (backendWorkout && localWorkout) {
                // Verificar se são do mesmo treino (mesmo workoutPlanId e trainingId)
                const sameWorkout = 
                    (backendWorkout.id === localWorkout.id || backendWorkout.workoutPlanId === localWorkout.workoutPlanId) &&
                    (backendWorkout.trainingId === localWorkout.trainingId);
                
                if (sameWorkout) {
                    // Resolver conflito usando o mais recente
                    savedWorkout = resolveWorkoutConflict(backendWorkout, localWorkout);
                    logger.log(`Conflito resolvido: usando treino de ${savedWorkout.source} (mais recente)`);
                    
                    // Sincronizar ambos com o mais recente
                    if (savedWorkout.source === 'backend') {
                        safeSetItem('activeWorkoutSession', savedWorkout);
                    } else if (authState.token) {
                        // Se localStorage é mais recente, sincronizar com backend
                        try {
                            await saveTrainingSessionDraftService(savedWorkout, authState.token);
                        } catch (err) {
                            logger.warn("Erro ao sincronizar treino mais recente com backend:", err);
                        }
                    }
                } else {
                    // Treinos diferentes - usar o mais recente
                    savedWorkout = resolveWorkoutConflict(backendWorkout, localWorkout);
                }
            } else if (backendWorkout) {
                savedWorkout = backendWorkout;
            } else if (localWorkout) {
                savedWorkout = localWorkout;
            }
            
            // VALIDAÇÃO: Verificar se o treino não é muito antigo (abandonado)
            if (savedWorkout) {
                if (isWorkoutAbandoned(savedWorkout, 48)) { // 48 horas
                    logger.warn("Treino muito antigo detectado, considerando abandonado:", savedWorkout);
                    // Limpar treino abandonado
                    safeSetItem('activeWorkoutSession', null);
                    if (authState.token && savedWorkout.trainingId && savedWorkout.id) {
                        try {
                            await deleteTrainingSessionDraftService(authState.token, null, savedWorkout.trainingId, savedWorkout.id);
                        } catch (err) {
                            logger.warn("Erro ao eliminar treino abandonado do backend:", err);
                        }
                    }
                    savedWorkout = null;
                }
            }
            
            if (savedWorkout) {
                // GARANTIR que os exercícios estão ordenados ao carregar
                const orderedWorkout = ensurePlanExercisesOrdered(savedWorkout);
                setActiveWorkout(orderedWorkout);
                setIsMinimized(true);
                logger.log("Treino carregado com exercícios ordenados:", orderedWorkout);
                
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
                                        // Ordenar por setNumber para garantir ordem correta
                                        const sortedHistory = [...historyData].sort((a, b) => {
                                            const setNumA = a.setNumber || 999;
                                            const setNumB = b.setNumber || 999;
                                            return setNumA - setNumB;
                                        });
                                        
                                        // Mapear usando setNumber como índice (setNumber 1 → índice 0)
                                        const placeholdersArray = [];
                                        sortedHistory.slice(0, 3).forEach(set => {
                                            const setNumber = set.setNumber || 1;
                                            const arrayIndex = setNumber - 1;
                                            placeholdersArray[arrayIndex] = {
                                                weight: set.performedWeight || null,
                                                reps: set.performedReps || null,
                                                setNumber: setNumber
                                            };
                                        });
                                        placeholdersMap[planExerciseId] = placeholdersArray;
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
        };
        
        loadWorkout();
    }, [authState.token, authState.isValidating]); // Aguardar validação terminar

    // Função auxiliar para sincronizar com backend com retry
    const syncWithBackend = React.useCallback(async (workout, retries = 3, delay = 1000) => {
        if (!authState.token || !workout) return false;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await saveTrainingSessionDraftService(workout, authState.token);
                setSyncStatus({ synced: true, lastSync: Date.now(), error: null });
                logger.log(`Treino sincronizado com backend (tentativa ${attempt}/${retries})`);
                return true;
            } catch (err) {
                const isNetworkError = err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('Failed to fetch');
                const isTimeoutError = err.message?.includes('Timeout') || err.message?.includes('timeout');
                const is404Error = err.message?.includes('404') || err.message?.includes('Not Found');
                const isLastAttempt = attempt === retries;
                
                // 404 não é um erro crítico - pode significar que ainda não existe draft
                if (is404Error && attempt < retries) {
                    logger.log('Draft não encontrado no backend (normal em primeira sincronização), tentando criar...');
                    // Continuar tentativa
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                
                if (isLastAttempt) {
                    // Só mostrar erro ao utilizador se for um erro real de rede ou servidor
                    // Timeout ou 404 após múltiplas tentativas = provavelmente sem conexão
                    if (isNetworkError || isTimeoutError || is404Error) {
                        setSyncStatus({ 
                            synced: false, 
                            lastSync: null, 
                            error: 'Sem conexão' 
                        });
                    } else {
                        // Outros erros - manter status atual, não atualizar para não alarmar desnecessariamente
                        logger.warn(`Falha ao sincronizar treino com backend após ${retries} tentativas:`, err.message || err);
                    }
                    return false;
                }
                
                // Esperar antes de tentar novamente (exponential backoff)
                const waitTime = delay * Math.pow(2, attempt - 1);
                logger.log(`Tentativa ${attempt}/${retries} falhou, tentando novamente em ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        return false;
    }, [authState.token]);

    // Função auxiliar para persistir o treino (localStorage + backend com retry)
    const persistWorkout = React.useCallback(async (workout) => {
        if (!workout) {
            safeSetItem('activeWorkoutSession', null);
            // Limpar draft do backend também
            if (authState.token) {
                try {
                    await deleteTrainingSessionDraftService(
                        authState.token,
                        null,
                        workout?.trainingId || null,
                        workout?.id || workout?.workoutPlanId || null
                    );
                    setSyncStatus({ synced: true, lastSync: Date.now(), error: null });
                } catch (err) {
                    logger.warn("Erro ao eliminar draft do backend:", err);
                    setSyncStatus({ synced: false, lastSync: null, error: 'Erro ao limpar' });
                }
            }
            return;
        }
        
        // Validar antes de persistir
        if (!validateWorkoutSession(workout)) {
            logger.warn("Tentativa de persistir treino inválido:", workout);
            return;
        }
        
        // Adicionar timestamp de última atualização
        const workoutWithTimestamp = {
            ...workout,
            lastUpdated: Date.now(),
        };
        
        // PRIORIDADE 1: Persistir no localStorage (sempre, offline-first)
        safeSetItem('activeWorkoutSession', workoutWithTimestamp);
        logger.log("Treino persistido automaticamente no localStorage");
        
        // PRIORIDADE 2: Sincronizar com backend (com retry logic)
        if (authState.token) {
            // Sincronizar em background (não bloquear)
            syncWithBackend(workoutWithTimestamp).catch(err => {
                logger.warn("Erro na sincronização em background:", err);
            });
        }

        // PRIORIDADE 3: Notificar outros dispositivos via WebSocket
        if (isWebSocketConnected() && workoutWithTimestamp.id) {
            notifyWorkoutUpdate(
                workoutWithTimestamp.id,
                workoutWithTimestamp.trainingId || null,
                deviceIdRef.current,
                workoutWithTimestamp.setsData || {}
            );
        }
    }, [authState.token, syncWithBackend]);

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
                            // Ordenar por setNumber para garantir ordem correta (o backend já ordena, mas garantir)
                            const sortedHistory = [...historyData].sort((a, b) => {
                                const setNumA = a.setNumber || 999; // Séries sem setNumber vão para o fim
                                const setNumB = b.setNumber || 999;
                                return setNumA - setNumB;
                            });
                            
                            // Mapear usando setNumber como índice (setNumber 1 → índice 0, setNumber 2 → índice 1, etc.)
                            // Criar array com até 3 posições, usando setNumber - 1 como índice
                            const placeholdersArray = [];
                            sortedHistory.slice(0, 3).forEach(set => {
                                const setNumber = set.setNumber || 1;
                                const arrayIndex = setNumber - 1; // setNumber 1 → índice 0
                                placeholdersArray[arrayIndex] = {
                                    weight: set.performedWeight || null,
                                    reps: set.performedReps || null,
                                    setNumber: setNumber
                                };
                            });
                            placeholdersMap[planExerciseId] = placeholdersArray;
                            logger.log(`Placeholders recarregados para planExerciseId ${planExerciseId}:`, placeholdersArray);
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
                            // Ordenar por setNumber para garantir ordem correta
                            const sortedHistory = [...historyData].sort((a, b) => {
                                const setNumA = a.setNumber || 999;
                                const setNumB = b.setNumber || 999;
                                return setNumA - setNumB;
                            });
                            
                            // Mapear usando setNumber como índice (setNumber 1 → índice 0)
                            const placeholdersArray = [];
                            sortedHistory.slice(0, 3).forEach(set => {
                                const setNumber = set.setNumber || 1;
                                const arrayIndex = setNumber - 1;
                                placeholdersArray[arrayIndex] = {
                                    weight: set.performedWeight || null,
                                    reps: set.performedReps || null,
                                    setNumber: setNumber
                                };
                            });
                            placeholdersMap[planExerciseId] = placeholdersArray;
                                logger.log(`Placeholders carregados para planExerciseId ${planExerciseId}:`, placeholdersArray);
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
            // Persistir imediatamente ao iniciar
            persistWorkout(workoutSession);
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
                const updated = { ...prev, setsData: newSetsData };
                // Persistir imediatamente após atualizar
                safeSetItem('activeWorkoutSession', updated);
                return updated;
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
                        materialUsed: performanceData.materialUsed ?? saved.materialUsed ?? null,
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

                    const firstSetKey = `${setData.planExerciseId}-1`;
                    const materialUsed = activeWorkout.setsData[firstSetKey]?.materialUsed ?? setData.materialUsed ?? null;

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
                        materialUsed: materialUsed && String(materialUsed).trim() ? String(materialUsed).trim() : undefined,
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
        
        // Limpar estado, localStorage e backend ao terminar
        const trainingId = activeWorkout.trainingId;
        const workoutPlanId = activeWorkout.id;
        
        setActiveWorkout(null);
        safeSetItem('activeWorkoutSession', null);
        
        // Eliminar draft do backend
        if (authState.token) {
            try {
                await deleteTrainingSessionDraftService(authState.token, null, trainingId, workoutPlanId);
                logger.log("Draft eliminado do backend após terminar treino");
            } catch (err) {
                logger.warn("Erro ao eliminar draft do backend:", err);
            }
        }

        // Notificar outros dispositivos via WebSocket
        if (isWebSocketConnected()) {
            notifyWorkoutFinished(workoutPlanId, trainingId, deviceIdRef.current);
        }
    };

    const cancelWorkout = async () => { 
        const trainingId = activeWorkout?.trainingId || null;
        const workoutPlanId = activeWorkout?.id;
        
        setActiveWorkout(null);
        // Limpar localStorage quando cancelar
        safeSetItem('activeWorkoutSession', null);
        
        // Eliminar draft do backend
        if (authState.token && workoutPlanId) {
            try {
                await deleteTrainingSessionDraftService(authState.token, null, trainingId, workoutPlanId);
                logger.log("Draft eliminado do backend após cancelar treino");
            } catch (err) {
                logger.warn("Erro ao eliminar draft do backend:", err);
            }
        }

        // Notificar outros dispositivos via WebSocket
        if (isWebSocketConnected() && workoutPlanId) {
            notifyWorkoutFinished(workoutPlanId, trainingId, deviceIdRef.current);
        }
    };

    // PERSISTÊNCIA AUTOMÁTICA: Guarda sempre que activeWorkout muda
    useEffect(() => {
        if (activeWorkout) {
            persistWorkout(activeWorkout);
        }
    }, [activeWorkout, persistWorkout]);

    // PERSISTÊNCIA PERIÓDICA: Guarda a cada 10 segundos durante treino ativo (reduzido para não sobrecarregar backend)
    useEffect(() => {
        if (!activeWorkout) return;

        const intervalId = setInterval(() => {
            if (activeWorkout) {
                persistWorkout(activeWorkout);
            }
        }, 10000); // A cada 10 segundos (reduzido de 5 para não sobrecarregar backend)

        return () => clearInterval(intervalId);
    }, [activeWorkout, persistWorkout]);

    // LISTENER VISIBILITY CHANGE: Guarda quando app vai para segundo plano
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && activeWorkout) {
                // App foi minimizada ou está em segundo plano
                logger.log("App minimizada - persistindo treino...");
                persistWorkout(activeWorkout);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [activeWorkout, persistWorkout]);

    // LISTENER BEFOREUNLOAD: Guarda antes de fechar a aba/app
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (activeWorkout) {
                // Tentar persistir de forma síncrona (pode não funcionar em todos os browsers)
                try {
                    persistWorkout(activeWorkout);
                    // Usar sendBeacon como fallback para garantir que os dados são enviados
                    if (navigator.sendBeacon) {
                        const data = JSON.stringify(activeWorkout);
                        navigator.sendBeacon('/api/workout/save-draft', data);
                    }
                } catch (error) {
                    logger.error("Erro ao persistir antes de fechar:", error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [activeWorkout, persistWorkout]);

    // MELHORAR RECUPERAÇÃO: Ajustar startTime para continuar o timer corretamente
    useEffect(() => {
        if (activeWorkout && activeWorkout.startTime) {
            // Verificar se o treino foi recuperado do localStorage
            const savedWorkout = safeGetItem('activeWorkoutSession', validateWorkoutSession);
            if (savedWorkout && savedWorkout.startTime === activeWorkout.startTime) {
                // Treino foi recuperado, manter o startTime original para timer correto
                // O startTime já está correto, não precisa ajustar
                logger.log("Treino recuperado - timer continuará de onde parou");
            }
        }
    }, [activeWorkout]);

    // Conectar WebSocket quando há token, treino ativo E autenticação completa
    useEffect(() => {
        // Não conectar se ainda está a validar autenticação ou se não está autenticado
        if (!authState.isAuthenticated || authState.isValidating || !authState.token) {
            disconnectWebSocket();
            return;
        }

        if (!activeWorkout) {
            // Se não há treino ativo, não conectar WebSocket
            disconnectWebSocket();
            return;
        }

        // Conectar WebSocket
        const socket = connectWebSocket(authState.token, {
            onConnect: () => {
                logger.log('WebSocket conectado para sincronização de treino');
                // Solicitar sincronização inicial
                if (activeWorkout.id) {
                    requestWorkoutSync(
                        activeWorkout.id,
                        activeWorkout.trainingId || null,
                        deviceIdRef.current
                    );
                }
            },
            onWorkoutSynced: (data) => {
                logger.log('Treino sincronizado noutro dispositivo:', data);
                // Opcional: mostrar notificação ao utilizador
            },
            onWorkoutUpdated: (data) => {
                logger.log('Atualização recebida de outro dispositivo:', data);
                // Se for do mesmo treino, recarregar do backend
                if (activeWorkout && 
                    activeWorkout.id === data.workoutPlanId && 
                    (activeWorkout.trainingId || null) === (data.trainingId || null)) {
                    // Recarregar treino do backend para ter dados atualizados
                    getTrainingSessionDraftService(authState.token, data.trainingId, data.workoutPlanId)
                        .then(draft => {
                            if (draft && draft.sessionData) {
                                const updatedWorkout = {
                                    ...draft.sessionData,
                                    trainingId: draft.trainingId,
                                    id: draft.workoutPlanId,
                                    startTime: draft.startTime,
                                    lastUpdated: draft.updatedAt ? new Date(draft.updatedAt).getTime() : null,
                                };
                                if (validateWorkoutSession(updatedWorkout)) {
                                    setActiveWorkout(ensurePlanExercisesOrdered(updatedWorkout));
                                    safeSetItem('activeWorkoutSession', updatedWorkout);
                                    logger.log('Treino atualizado com dados de outro dispositivo');
                                }
                            }
                        })
                        .catch(err => logger.warn('Erro ao recarregar treino após atualização:', err));
                }
            },
            onWorkoutFinished: (data) => {
                logger.log('Treino terminado noutro dispositivo:', data);
                // Se for do mesmo treino, limpar estado local
                if (activeWorkout && 
                    activeWorkout.id === data.workoutPlanId && 
                    (activeWorkout.trainingId || null) === (data.trainingId || null)) {
                    setActiveWorkout(null);
                    safeSetItem('activeWorkoutSession', null);
                    logger.log('Treino limpo após término noutro dispositivo');
                }
            },
        });

        return () => {
            // Não desconectar completamente, apenas limpar callbacks
            // A conexão pode ser útil para outras funcionalidades
        };
    }, [authState.token, authState.isAuthenticated, authState.isValidating, activeWorkout?.id, activeWorkout?.trainingId]);

    // Tentar sincronizar novamente quando conexão voltar
    useEffect(() => {
        if (!activeWorkout || !authState.token) return;
        
        const handleOnline = () => {
            if (syncStatus.synced === false) {
                logger.log("Conexão restaurada, tentando sincronizar novamente...");
                syncWithBackend(activeWorkout).catch(err => {
                    logger.warn("Erro ao sincronizar após reconexão:", err);
                });
            }
            // Reconectar WebSocket se necessário
            if (!isWebSocketConnected() && authState.token) {
                connectWebSocket(authState.token);
            }
        };
        
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [activeWorkout, authState.token, syncStatus.synced, syncWithBackend]);

    const value = { 
        activeWorkout, 
        isMinimized, 
        lastPerformances, 
        exercisePlaceholders, 
        syncStatus, // Expor estado de sincronização
        startWorkout, 
        finishWorkout, 
        cancelWorkout, 
        updateSetData, 
        setIsMinimized, 
        logSet,
        reloadPlaceholdersForActiveWorkout,
        syncWithBackend, // Expor função para sincronização manual
    };

    return ( <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider> );
};

export const useWorkout = () => useContext(WorkoutContext);