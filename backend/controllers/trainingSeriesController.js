// backend/controllers/trainingSeriesController.js
const db = require('../models');
const moment = require('moment'); // Certifica-te que tens 'moment' instalado

exports.createTrainingSeries = async (req, res) => {
    const {
        name,
        description,
        instructorId,
        recurrenceType, // NOVO
        dayOfWeek,      // AGORA PODE SER NULL
        startTime,
        endTime,
        seriesStartDate,
        seriesEndDate,
        capacity,
        location,
        // workoutPlanId // OPCIONAL
    } = req.body;

    // Validações
    if (!name || instructorId === undefined || !recurrenceType || !startTime || !endTime || !seriesStartDate || !seriesEndDate) {
        return res.status(400).json({ message: 'Campos obrigatórios em falta (name, instructorId, recurrenceType, startTime, endTime, seriesStartDate, seriesEndDate).' });
    }
    if (moment(seriesEndDate).isBefore(seriesStartDate)) {
        return res.status(400).json({ message: 'A data de fim da série não pode ser anterior à data de início.' });
    }
    if (recurrenceType === 'weekly' && (dayOfWeek === undefined || dayOfWeek === null || parseInt(dayOfWeek) < 0 || parseInt(dayOfWeek) > 6)) {
        return res.status(400).json({ message: 'Dia da semana inválido (0-6) é obrigatório para recorrência semanal.' });
    }
    if (capacity !== undefined && (isNaN(parseInt(capacity)) || parseInt(capacity) <=0)) {
        return res.status(400).json({ message: 'Capacidade deve ser um número positivo.'});
    }

    const transaction = await db.sequelize.transaction();

    try {
        const newSeries = await db.TrainingSeries.create({
            name,
            description,
            instructorId: parseInt(instructorId),
            recurrenceType,
            dayOfWeek: recurrenceType === 'weekly' ? parseInt(dayOfWeek) : null,
            startTime,
            endTime,
            seriesStartDate,
            seriesEndDate,
            capacity: capacity ? parseInt(capacity) : 10,
            location,
            // workoutPlanId: workoutPlanId ? parseInt(workoutPlanId) : null,
        }, { transaction });

        const instancesToCreate = [];
        let currentDate = moment(newSeries.seriesStartDate);
        const finalEndDate = moment(newSeries.seriesEndDate);
        const trainingNameBase = newSeries.name;
        const seriesDurationMinutes = moment(newSeries.endTime, "HH:mm:ss").diff(moment(newSeries.startTime, "HH:mm:ss"), 'minutes');

        while (currentDate.isSameOrBefore(finalEndDate)) {
            let createInstanceToday = false;
            if (newSeries.recurrenceType === 'daily') {
                createInstanceToday = true;
            } else if (newSeries.recurrenceType === 'weekly') {
                if (currentDate.day() === newSeries.dayOfWeek) {
                    createInstanceToday = true;
                }
            } else if (newSeries.recurrenceType === 'monthly') {
                // Lógica para mensal: Exemplo - mesmo dia do mês
                // Se dayOfWeek também for relevante para mensal (ex: 1ª Segunda-feira do mês), ajusta aqui.
                if (currentDate.date() === moment(newSeries.seriesStartDate).date()) {
                     createInstanceToday = true;
                }
            }

            if (createInstanceToday) {
                instancesToCreate.push({
                    name: `${trainingNameBase} - ${currentDate.format('DD/MM/YYYY')}`,
                    description: newSeries.description,
                    date: currentDate.format('YYYY-MM-DD'),
                    time: newSeries.startTime,
                    durationMinutes: seriesDurationMinutes > 0 ? seriesDurationMinutes : 60, // Fallback para duração
                    instructorId: newSeries.instructorId,
                    capacity: newSeries.capacity,
                    location: newSeries.location,
                    status: 'scheduled',
                    // workoutPlanId: newSeries.workoutPlanId, // Se for usar
                    trainingSeriesId: newSeries.id,
                    isGeneratedInstance: true,
                });
            }
            currentDate.add(1, 'days');
        }

        let createdInstances = [];
        if (instancesToCreate.length > 0) {
            createdInstances = await db.Training.bulkCreate(instancesToCreate, { transaction });
        }

        await transaction.commit();
        res.status(201).json({
            message: `Série de treinos "${newSeries.name}" e ${createdInstances.length} instâncias criadas com sucesso!`,
            series: newSeries,
            instancesCreatedCount: createdInstances.length
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao criar série de treinos recorrentes:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Erro de validação', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao criar série.', errorDetails: error.message });
    }
};

// Adiciona outras funções do controller se existirem (listar, atualizar, apagar séries)...
// exports.getAllTrainingSeries = async (req, res) => { ... };