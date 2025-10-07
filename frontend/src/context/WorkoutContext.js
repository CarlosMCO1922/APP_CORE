// src/context/WorkoutContext.js
import React, { createContext, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
    const [activeWorkout, setActiveWorkout] = useState(null);
    const [isMinimized, setIsMinimized] = useState(true);
    const navigate = useNavigate();

    const startWorkout = (planData) => {
        if (activeWorkout) {
            alert("Já existe um treino em andamento. Finalize ou cancele o treino atual antes de iniciar um novo.");
            setIsMinimized(false); // Leva o utilizador para o treino que já está a decorrer
            return;
        }
        
        // Adicionamos um campo 'setsData' para guardar o progresso
        const workoutSession = {
            ...planData,
            startTime: Date.now(),
            setsData: [] 
        };

        setActiveWorkout(workoutSession);
        setIsMinimized(false);
    };

    const finishWorkout = () => {
        console.log("Treino finalizado! A preparar dados para resumo...", activeWorkout);
        // Navega para a página de resumo, passando os dados
        navigate('/treino/resumo', { 
            state: { 
                sessionData: activeWorkout.setsData,
                duration: Math.floor((Date.now() - activeWorkout.startTime) / 1000),
                workoutName: activeWorkout.name,
                allPlanExercises: activeWorkout.planExercises,
                personalRecords: [] // A lógica de PRs será chamada aqui ou na página de resumo
            } 
        });
        setActiveWorkout(null); // Limpa o treino ativo
    };

    const cancelWorkout = () => {
        if (window.confirm("Tem a certeza que quer cancelar a sessão? Todos os dados registados serão perdidos.")) {
            setActiveWorkout(null);
        }
    };

    // Função para atualizar o progresso do treino (ex: registar uma série)
    const logSet = (setData) => {
        if (!activeWorkout) return;
        setActiveWorkout(prevWorkout => ({
            ...prevWorkout,
            setsData: [...prevWorkout.setsData, setData]
        }));
    };

    const value = {
        activeWorkout,
        isMinimized,
        startWorkout,
        finishWorkout,
        cancelWorkout,
        logSet,
        setIsMinimized,
    };

    return (
        <WorkoutContext.Provider value={value}>
            {children}
        </WorkoutContext.Provider>
    );
};

export const useWorkout = () => {
    return useContext(WorkoutContext);
};