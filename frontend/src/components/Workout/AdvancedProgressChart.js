// src/components/Workout/AdvancedProgressChart.js

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';

// Fórmula de Epley para estimar 1-Rep Max
const epley1RM = (weight, reps) => {
    if (reps === 1) return weight;
    if (reps === 0) return 0;
    return weight * (1 + reps / 30);
};

const AdvancedProgressChart = ({ historyLogs = [], metric = 'performedWeight', theme }) => {
    const data = historyLogs
        .map(log => {
            let value;
            switch (metric) {
                case 'volume':
                    value = (log.performedReps && log.performedWeight) ? log.performedReps * log.performedWeight : null;
                    break;
                case 'estimated1RM':
                    value = (log.performedReps && log.performedWeight) ? epley1RM(log.performedWeight, log.performedReps) : null;
                    break;
                case 'performedWeight':
                default:
                    value = log.performedWeight;
                    break;
            }
            return {
                date: moment(log.performedAt).format('DD/MM/YY'),
                value: value ? Number(value.toFixed(1)) : null,
            };
        })
        .filter(item => item.value !== null && item.value > 0);

    if (data.length < 2) {
        return <p style={{ color: theme.colors.textMuted, textAlign: 'center', padding: '20px' }}>São necessários pelo menos 2 registos para mostrar a progressão.</p>;
    }

    const yAxisLabel = {
        volume: 'Volume (kg)',
        estimated1RM: '1RM Estimado (kg)',
        performedWeight: 'Peso (kg)',
    }[metric];

    return (
        <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.cardBorder} />
                <XAxis dataKey="date" tick={{ fill: theme.colors.textMuted, fontSize: '0.75rem' }} />
                <YAxis yAxisId="left" tick={{ fill: theme.colors.textMuted, fontSize: '0.75rem' }} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: theme.colors.textMuted }} />
                <Tooltip
                    contentStyle={{ backgroundColor: theme.colors.cardBackground, border: `1px solid ${theme.colors.cardBorder}`}}
                    labelStyle={{ color: theme.colors.primary }}
                />
                <Legend wrapperStyle={{ fontSize: '0.9rem' }} />
                <Line yAxisId="left" type="monotone" dataKey="value" name={yAxisLabel} stroke={theme.colors.primary} strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default AdvancedProgressChart;