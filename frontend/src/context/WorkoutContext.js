import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyLastPerformancesService, checkPersonalRecordsService } from '../services/progressService';
import { useAuth } from './AuthContext';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [isMinimized, setIsMinimized] = useState(true);
    const [lastPerformances, setLastPerformances] = useState({});
    const { authState } = useAuth();
    const navigate = useNavigate();

    // Carrega um treino ativo do localStorage ao iniciar a app
    useEffect(() => {
        try {
            const savedWorkout = localStorage.getItem('activeWorkoutSession');
            if (savedWorkout) {
                setActiveWorkout(JSON.parse(savedWorkout));
                setIsMinimized(true);
            }
        } catch (error) {
            console.error("Falha ao carregar treino do localStorage:", error);
            localStorage.removeItem('activeWorkoutSession');
        }
    }, []);

    // Guarda o treino no localStorage sempre que ele muda
    useEffect(() => {
        if (activeWorkout) {
            localStorage.setItem('activeWorkoutSession', JSON.stringify(activeWorkout));
        } else {
            localStorage.removeItem('activeWorkoutSession');
        }
    }, [activeWorkout]);

    const startWorkout = async (planData) => {
        if (activeWorkout) {
            alert("Já existe um treino em andamento. Finalize ou cancele o treino atual antes de iniciar um novo.");
            setIsMinimized(false);
            return;
        }

        try {
            const history = await getMyLastPerformancesService(authState.token);
            const historyMap = history.reduce((acc, perf) => {
                acc[perf.exerciseId] = perf;
                return acc;
            }, {});
            setLastPerformances(historyMap);
        } catch (error) {
            console.error("Não foi possível carregar o histórico de performances:", error);
            setLastPerformances({});
        }

        const workoutSession = { ...planData, startTime: Date.now(), setsData: {} };
        setActiveWorkout(workoutSession);
        setIsMinimized(false);
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
            } catch (error) { console.error("Erro ao verificar PRs:", error); }
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

    const value = { activeWorkout, isMinimized, lastPerformances, startWorkout, finishWorkout, cancelWorkout, updateSetData, setIsMinimized };

    return ( <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider> );
};

export const useWorkout = () => useContext(WorkoutContext);