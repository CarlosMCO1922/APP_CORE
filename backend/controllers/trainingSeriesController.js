// backend/controllers/trainingSeriesController.js
const db = require('../models');
const moment = require('moment'); // Lembre-se de instalar: npm install moment

// @desc    Admin cria uma nova série de treinos recorrentes e as suas instâncias
// @route   POST /api/admin/training-series  (Exemplo de rota, ajuste conforme necessário)
// @access  Privado (Admin)
exports.createTrainingSeries = async (req, res) => {
    const {
        name,
        description,
        instructorId, // ID do instrutor para a série e instâncias
        dayOfWeek,    // Número: 0 (Dom) a 6 (Sáb)
        startTime,    // String: "HH:MM:SS"
        endTime,      // String: "HH:MM:SS"
        seriesStartDate, // String: "YYYY-MM-DD"
        seriesEndDate,   // String: "YYYY-MM-DD"
        capacity,
        location,
        // workoutPlanId // Opcional: se a série tem um plano fixo
    } = req.body;

    // Validações
    if (!name || instructorId === undefined || dayOfWeek === undefined || !startTime || !endTime || !seriesStartDate || !seriesEndDate) {
        return res.status(400).json({ message: 'Campos obrigatórios em falta (name, instructorId, dayOfWeek, startTime, endTime, seriesStartDate, seriesEndDate).' });
    }
    if (moment(seriesEndDate).isBefore(seriesStartDate)) {
        return res.status(400).json({ message: 'A data de fim da série não pode ser anterior à data de início.' });
    }
    if (parseInt(dayOfWeek) < 0 || parseInt(dayOfWeek) > 6) {
        return res.status(400).json({ message: 'Dia da semana inválido (deve ser 0-6).' });
    }
    
    const transaction = await db.sequelize.transaction();

    try {
        const newSeries = await db.TrainingSeries.create({
            name,
            description,
            instructorId: parseInt(instructorId),
            dayOfWeek: parseInt(dayOfWeek),
            startTime,
            endTime,
            seriesStartDate,
            seriesEndDate,
            capacity: capacity ? parseInt(capacity) : 10, // Default capacity
            location,
            // workoutPlanId: workoutPlanId ? parseInt(workoutPlanId) : null,
        }, { transaction });

        const instancesToCreate = [];
        let currentDate = moment(newSeries.seriesStartDate); // Usa moment para iteração
        const finalEndDate = moment(newSeries.seriesEndDate);

        while (currentDate.isSameOrBefore(finalEndDate)) {
            if (currentDate.day() === newSeries.dayOfWeek) { // moment().day() é 0 para Domingo, 1 para Segunda...
                instancesToCreate.push({
                    name: `${newSeries.name} - ${currentDate.format('DD/MM/YYYY')}`,
                    description: newSeries.description,
                    date: currentDate.format('YYYY-MM-DD'),
                    time: newSeries.startTime,
                    instructorId: newSeries.instructorId, // Instrutor da série
                    capacity: newSeries.capacity,
                    location: newSeries.location,
                    status: 'scheduled',
                    // workoutPlanId: newSeries.workoutPlanId,
                    trainingSeriesId: newSeries.id, // Link para a série mãe
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
            message: 'Série de treinos e instâncias criadas com sucesso!', 
            series: newSeries, 
            instancesCreated: createdInstances.length 
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

// Outras funções para listar, atualizar, apagar séries podem ser adicionadas aqui
// exports.getAllTrainingSeries = async (req, res) => { ... };
// exports.getTrainingSeriesById = async (req, res) => { ... };
// exports.updateTrainingSeries = async (req, res) => { ... }; // Cuidado ao atualizar, pode precisar regenerar instâncias
// exports.deleteTrainingSeries = async (req, res) => { ... }; // Apagará instâncias devido ao onDelete: 'CASCADE'