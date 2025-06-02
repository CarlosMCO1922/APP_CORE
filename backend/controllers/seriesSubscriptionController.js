// backend/controllers/seriesSubscriptionController.js
const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

// @desc    Cliente inscreve-se numa série de treinos recorrentes
// @route   POST /api/series-subscriptions (Exemplo de rota)
// @access  Privado (Cliente)
exports.createSeriesSubscription = async (req, res) => {
    const clientId = req.user.id; // Assumindo que req.user.id é o ID do cliente
    const {
        trainingSeriesId,
        clientSubscriptionStartDate, // Opcional: cliente pode querer começar depois do início da série
        clientSubscriptionEndDate    // Opcional: cliente pode querer terminar antes do fim da série
    } = req.body;

    if (!trainingSeriesId) {
        return res.status(400).json({ message: 'ID da série de treino é obrigatório.' });
    }

    const transaction = await db.sequelize.transaction();

    try {
        const series = await db.TrainingSeries.findByPk(parseInt(trainingSeriesId), { transaction });
        if (!series) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Série de treino não encontrada.' });
        }

        // Definir datas de subscrição do cliente, respeitando os limites da série
        const effectiveSubStartDate = moment.max(
            moment(series.seriesStartDate), 
            clientSubscriptionStartDate ? moment(clientSubscriptionStartDate) : moment(series.seriesStartDate)
        ).format('YYYY-MM-DD');

        const effectiveSubEndDate = moment.min(
            moment(series.seriesEndDate),
            clientSubscriptionEndDate ? moment(clientSubscriptionEndDate) : moment(series.seriesEndDate)
        ).format('YYYY-MM-DD');

        if (moment(effectiveSubEndDate).isBefore(effectiveSubStartDate)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Período de subscrição inválido ou fora dos limites da série.' });
        }

        // Verificar se já existe uma subscrição ativa
        const existingSubscription = await db.SeriesSubscription.findOne({
            where: { userId: clientId, trainingSeriesId: series.id, isActive: true },
            transaction
        });

        if (existingSubscription) {
            await transaction.rollback();
            return res.status(409).json({ message: 'Você já possui uma subscrição ativa para esta série.' });
        }

        const newSubscription = await db.SeriesSubscription.create({
            userId: clientId,
            trainingSeriesId: series.id,
            clientSubscriptionStartDate: effectiveSubStartDate,
            clientSubscriptionEndDate: effectiveSubEndDate,
            isActive: true,
        }, { transaction });

        // Criar Bookings individuais para cada instância de treino aplicável à subscrição do cliente
        const instancesToBook = await db.Training.findAll({
            where: {
                trainingSeriesId: series.id,
                date: {
                    [Op.gte]: effectiveSubStartDate,
                    [Op.lte]: effectiveSubEndDate,
                },
                status: 'scheduled', // Apenas inscreve em aulas agendadas
            },
            attributes: ['id', 'capacity'], // Apenas os campos necessários
            transaction
        });

        const bookingsToCreate = [];
        let bookingsSkippedDueToCapacity = 0;

        for (const instance of instancesToBook) {
            const currentBookingsCount = await db.Booking.count({
                where: { trainingId: instance.id },
                transaction
            });

            if (instance.capacity !== null && currentBookingsCount >= instance.capacity) {
                bookingsSkippedDueToCapacity++;
                console.warn(`Capacidade esgotada para treino ID ${instance.id} na data ${instance.date}. User ${clientId} não inscrito nesta instância.`);
                continue; // Pula esta instância se estiver lotada
            }

            bookingsToCreate.push({
                clientId: clientId, // No seu modelo Booking, confirme o nome da foreign key para User/Client
                trainingId: instance.id,
                bookingDate: moment().toISOString(), // Data/hora da criação do booking
                status: 'confirmed', // Status inicial do booking
                // seriesSubscriptionId: newSubscription.id, // Opcional: linkar booking à subscrição
            });
        }

        if (bookingsToCreate.length > 0) {
            await db.Booking.bulkCreate(bookingsToCreate, { transaction });
        }

        await transaction.commit();
        
        let responseMessage = 'Inscrição na série realizada com sucesso!';
        if (bookingsSkippedDueToCapacity > 0) {
            responseMessage += ` No entanto, ${bookingsSkippedDueToCapacity} aula(s) não puderam ser agendadas por falta de capacidade.`;
        }
        if (bookingsToCreate.length === 0 && bookingsSkippedDueToCapacity === 0 && instancesToBook.length > 0) {
            responseMessage = 'Inscrição na série realizada, mas não foram encontradas aulas agendáveis no período (verifique capacidade ou status das aulas).';
        } else if (instancesToBook.length === 0) {
             responseMessage = 'Inscrição na série realizada, mas não existem aulas futuras agendadas para este período.';
        }


        res.status(201).json({
            message: responseMessage,
            subscription: newSubscription,
            bookingsCreatedCount: bookingsToCreate.length,
            bookingsSkippedCount: bookingsSkippedDueToCapacity
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Erro ao criar subscrição na série:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Conflito: Subscrição já existente ou dados duplicados.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao processar subscrição.', errorDetails: error.message });
    }
};

// Outras funções: listar subscrições do cliente, cancelar subscrição, etc.
// exports.getMySeriesSubscriptions = async (req, res) => { ... };
// exports.cancelSeriesSubscription = async (req, res) => { ... }; // (Isto precisaria de apagar Bookings futuros)