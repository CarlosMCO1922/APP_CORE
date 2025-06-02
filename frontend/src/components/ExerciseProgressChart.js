// src/components/ExerciseProgressChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const ExerciseProgressChart = ({ historyLogs = [], metric = 'performedWeight', theme }) => {
    const data = historyLogs
        .map(log => {
            let value;
            switch (metric) {
                case 'volume':
                    value = (log.performedReps && log.performedWeight) ? log.performedReps * log.performedWeight : null;
                    break;
                case 'performedWeight':
                    value = log.performedWeight;
                    break;
                case 'performedReps':
                    value = log.performedReps;
                    break;
                case 'performedDurationSeconds':
                    value = log.performedDurationSeconds;
                    break;
                default:
                    value = null;
            }
            return {
                // Armazenar a data original para ordenação, e formatada para exibição
                originalDate: new Date(log.performedAt),
                date: new Date(log.performedAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit'}),
                value: value,
                notes: log.notes // Para exibir no Tooltip se desejar
            };
        })
        .filter(item => item.value !== null && item.value !== undefined) // Filtrar entradas sem valor para a métrica selecionada
        .sort((a, b) => a.originalDate - b.originalDate); // Ordenar por data

    if (data.length === 0) {
        return <p style={{ color: theme?.colors?.textMuted || '#aaa', textAlign: 'center', padding: '20px' }}>Não há dados suficientes para exibir o gráfico para esta métrica.</p>;
    }

    let yAxisLabel = "Valor";
    let strokeColor = theme?.colors?.primary || "#8884d8";
    let lineName = "Valor";

    switch (metric) {
        case 'performedWeight':
            yAxisLabel = "Peso (kg)";
            lineName = "Peso";
            strokeColor = theme?.colors?.chartWeightLine || "#82ca9d";
            break;
        case 'performedReps':
            yAxisLabel = "Repetições";
            lineName = "Reps";
            strokeColor = theme?.colors?.chartRepsLine || "#ffc658";
            break;
        case 'volume':
            yAxisLabel = "Volume (Reps x Peso)";
            lineName = "Volume";
            strokeColor = theme?.colors?.chartVolumeLine || "#8884d8";
            break;
        case 'performedDurationSeconds':
            yAxisLabel = "Duração (s)";
            lineName = "Duração";
            strokeColor = theme?.colors?.chartDurationLine || "#FF8042";
            break;
        default:
            break;
    }
    
    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const entry = payload[0].payload; // Dados completos do ponto
            return (
            <div style={{ 
                backgroundColor: theme?.colors?.cardBackground || '#333', 
                padding: '10px', 
                border: `1px solid ${theme?.colors?.cardBorder || '#555'}`, 
                borderRadius: theme?.borderRadius || '4px',
                color: theme?.colors?.textMain || '#fff'
            }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{`Data: ${label}`}</p>
                <p style={{ margin: '5px 0 0 0' }}>{`${lineName}: ${payload[0].value}`}</p>
                {entry.notes && <p style={{ margin: '5px 0 0 0', fontSize: '0.8em', fontStyle: 'italic' }}>{`Notas: ${entry.notes}`}</p>}
            </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}> {/* Ajuste left margin */}
                <CartesianGrid strokeDasharray="3 3" stroke={theme?.colors?.cardBorderAlpha || "rgba(255,255,255,0.1)"} />
                <XAxis 
                    dataKey="date" 
                    tick={{ fill: theme?.colors?.textMuted || '#aaa', fontSize: '0.75rem' }} 
                    angle={-30} 
                    textAnchor="end" 
                    height={50} // Aumentar altura para acomodar texto inclinado
                />
                <YAxis 
                    label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: theme?.colors?.textMuted || '#aaa', fontSize: '0.85rem', dx: -5 }} 
                    tick={{ fill: theme?.colors?.textMuted || '#aaa', fontSize: '0.75rem' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="value" name={lineName} stroke={strokeColor} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                {/* Exemplo de linha de referência (ex: média), se tiver esses dados
                <ReferenceLine y={mediaValor} label="Média" stroke="red" strokeDasharray="3 3" /> 
                */}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default ExerciseProgressChart;