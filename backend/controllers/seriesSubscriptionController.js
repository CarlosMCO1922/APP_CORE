// backend/controllers/seriesSubscriptionController.js
const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

exports.createSeriesSubscription = async (req, res) => {
    const clientId = req.user.id;
    const {
        trainingSeriesId,
        clientSubscriptionStartDate, 
        clientSubscriptionEndDate   
    } = req.body;

    if (!trainingSeriesId || !clientSubscriptionEndDate) {
        return res.status(400).json({ message: 'ID da série de treino e data de fim da subscrição são obrigatórios.' });
    }

    const transaction = await db.sequelize.transaction();

    try {
        const series = await db.TrainingSeries.findByPk(parseInt(trainingSeriesId), { transaction });
        if (!series) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Série de treino não encontrada.' });
        }

        const clientUser = await db.User.findByPk(clientId, { transaction });
        if (!clientUser) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Utilizador cliente não encontrado.' });
        }

        
        const effectiveSubStartDate = moment.max(
            moment(series.seriesStartDate),
            clientSubscriptionStartDate ? moment(clientSubscriptionStartDate) : moment(series.seriesStartDate) // Usa início da série se cliente não especificar
        ).format('YYYY-MM-DD');

        const effectiveSubEndDate = moment.min(
            moment(series.seriesEndDate), // Não pode ir além do fim da série
            moment(clientSubscriptionEndDate) // Data escolhida pelo cliente
        ).format('YYYY-MM-DD');

        if (moment(effectiveSubEndDate).isBefore(effectiveSubStartDate)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Período de subscrição inválido ou fora dos limites da série.' });
        }

        const existingSubscription = await db.SeriesSubscription.findOne({
            where: { userId: clientId, trainingSeriesId: series.id, isActive: true },
            transaction
        });

        let periodStart, periodEnd, subscriptionToReturn;

        if (existingSubscription) {
            // Merge: alargar o período da subscrição existente e inscrever apenas nas sessões em falta
            const mergedStart = moment.max(
                moment(series.seriesStartDate),
                moment.min(moment(existingSubscription.clientSubscriptionStartDate), moment(effectiveSubStartDate))
            ).format('YYYY-MM-DD');
            const mergedEnd = moment.min(
                moment(series.seriesEndDate),
                moment.max(moment(existingSubscription.clientSubscriptionEndDate), moment(effectiveSubEndDate))
            ).format('YYYY-MM-DD');
            existingSubscription.clientSubscriptionStartDate = mergedStart;
            existingSubscription.clientSubscriptionEndDate = mergedEnd;
            await existingSubscription.save({ transaction });
            periodStart = mergedStart;
            periodEnd = mergedEnd;
            subscriptionToReturn = existingSubscription;
        } else {
            const newSubscription = await db.SeriesSubscription.create({
                userId: clientId,
                trainingSeriesId: series.id,
                clientSubscriptionStartDate: effectiveSubStartDate,
                clientSubscriptionEndDate: effectiveSubEndDate,
                isActive: true,
            }, { transaction });
            periodStart = effectiveSubStartDate;
            periodEnd = effectiveSubEndDate;
            subscriptionToReturn = newSubscription;
        }

        const fromDate = moment(periodStart).isAfter(moment()) ? periodStart : moment().format('YYYY-MM-DD');
        const instancesToBook = await db.Training.findAll({
            where: {
                trainingSeriesId: series.id,
                isGeneratedInstance: true,
                date: {
                    [Op.gte]: fromDate,
                    [Op.lte]: periodEnd,
                },
            },
            transaction
        });

        let bookingsSuccessful = 0;
        let bookingsSkippedDueToCapacity = 0;

        for (const instance of instancesToBook) {
            const participantsCount = await instance.countParticipants({ transaction }); // Método do Sequelize ou contagem manual

            if (instance.capacity !== null && participantsCount >= instance.capacity) {
                bookingsSkippedDueToCapacity++;
                console.warn(`Capacidade esgotada para treino ID ${instance.id} na data ${instance.date}. User ${clientId} não inscrito nesta instância da série.`);
                continue;
            }

            // Verificar se já está inscrito neste treino específico
            const isAlreadyBooked = await instance.hasParticipant(clientUser, { transaction });
            if (isAlreadyBooked) {
                console.warn(`User ${clientId} já está inscrito no treino ID ${instance.id} na data ${instance.date}. Pulando...`);
                continue;
            }

            // Verificar se já está inscrito noutro treino no mesmo dia e hora
            const conflictingTraining = await db.Training.findOne({
                where: {
                    date: instance.date,
                    time: instance.time,
                    id: { [Op.ne]: instance.id } // Excluir o treino atual
                },
                include: [{
                    model: db.User,
                    as: 'participants',
                    where: { id: clientId },
                    through: { attributes: [] }
                }],
                transaction
            });

            if (conflictingTraining) {
                console.warn(`User ${clientId} já está inscrito noutro treino no dia ${instance.date} às ${instance.time}. Pulando treino ID ${instance.id}...`);
                continue;
            }

            await instance.addParticipant(clientUser, { transaction });
            bookingsSuccessful++;
        }

        await transaction.commit();

        let responseMessage = `Inscrição na série "${series.name}" realizada! ${bookingsSuccessful} aulas agendadas no seu calendário.`;
        if (bookingsSkippedDueToCapacity > 0) {
            responseMessage += ` No entanto, ${bookingsSkippedDueToCapacity} aula(s) não puderam ser agendadas por falta de capacidade.`;
        }
        if (bookingsSuccessful === 0 && instancesToBook.length > 0 && bookingsSkippedDueToCapacity > 0) {
            responseMessage = `Inscrição na série "${series.name}" processada, mas todas as ${instancesToBook.length} aulas no período estão lotadas.`;
        } else if (bookingsSuccessful === 0 && instancesToBook.length === 0) {
            responseMessage = `Inscrição na série "${series.name}" realizada, mas não foram encontradas aulas agendáveis no período selecionado.`;
        }

        res.status(201).json({
            message: responseMessage,
            subscription: subscriptionToReturn,
            bookingsCreatedCount: bookingsSuccessful,
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