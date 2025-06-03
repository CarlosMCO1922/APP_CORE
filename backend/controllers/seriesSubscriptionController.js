// backend/controllers/seriesSubscriptionController.js
const db = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

exports.createSeriesSubscription = async (req, res) => {
    const clientId = req.user.id;
    const {
        trainingSeriesId,
        clientSubscriptionStartDate, // Opcional
        clientSubscriptionEndDate    // Obrigatório para o cliente definir até quando quer
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

        // Datas efetivas da subscrição do cliente, respeitando os limites da série e a data de início do cliente (se fornecida)
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

        const instancesToBook = await db.Training.findAll({
            where: {
                trainingSeriesId: series.id,
                date: {
                    [Op.gte]: effectiveSubStartDate,
                    [Op.lte]: effectiveSubEndDate,
                },
                isGeneratedInstance: true,
                date: {
                    [Op.gte]: moment().format('YYYY-MM-DD'), // A partir de hoje
                    [Op.lte]: effectiveSubEndDate,
                },
            },
            // attributes: ['id', 'capacity'], // Podes precisar de mais atributos se o addParticipant os usar
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
            // Cria a entrada na tabela de junção UserTrainings
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
            subscription: newSubscription,
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