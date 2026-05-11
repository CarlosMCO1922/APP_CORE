// backend/controllers/availabilityController.js
const db = require('../models');

const BLOCK_MINUTES = 30;
const DAY_START = '08:00';
const DAY_END = '20:00';
const DEFAULT_WINDOWS = [
  { start: '11:00', end: '13:00' },
  { start: '15:00', end: '19:00' },
];

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map((v) => parseInt(v, 10));
  return h * 60 + m;
};

const minutesToHHMM = (mins) => {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
};

const buildAllDayBlocks = () => {
  const start = toMinutes(DAY_START);
  const end = toMinutes(DAY_END);
  const out = [];
  for (let t = start; t < end; t += BLOCK_MINUTES) {
    out.push(minutesToHHMM(t));
  }
  return out;
};

const buildDefaultBlocks = () => {
  const out = new Set();
  for (const w of DEFAULT_WINDOWS) {
    const start = toMinutes(w.start);
    const end = toMinutes(w.end);
    for (let t = start; t < end; t += BLOCK_MINUTES) {
      out.add(minutesToHHMM(t));
    }
  }
  return out;
};

const getSlotsForStaffAndDate = async ({ staffId, date }) => {
  const rows = await db.StaffAvailabilitySlot.findAll({
    where: { staffId, date },
    attributes: ['time'],
  });
  if (!rows || rows.length === 0) {
    return { mode: 'default', blocks: Array.from(buildDefaultBlocks()).sort() };
  }
  return { mode: 'custom', blocks: rows.map((r) => r.time).sort() };
};

/** GET /availability/slots?date=YYYY-MM-DD&staffId= */
const getAvailabilitySlots = async (req, res) => {
  try {
    const date = String(req.query.date || '').trim();
    const staffIdRaw = req.query.staffId;

    if (!date) return res.status(400).json({ message: 'Data é obrigatória.' });

    const isAdmin = req.staff?.role === 'admin';
    const resolvedStaffId = isAdmin && staffIdRaw != null ? parseInt(staffIdRaw, 10) : req.staff?.id;
    if (!resolvedStaffId || Number.isNaN(resolvedStaffId)) {
      return res.status(400).json({ message: 'staffId inválido.' });
    }

    const staff = await db.Staff.findByPk(resolvedStaffId, { attributes: ['id', 'firstName', 'lastName', 'role'] });
    if (!staff) return res.status(404).json({ message: 'Profissional não encontrado.' });

    const { mode, blocks } = await getSlotsForStaffAndDate({ staffId: resolvedStaffId, date });
    return res.status(200).json({
      staffId: resolvedStaffId,
      date,
      mode,
      blocks,
      allDayBlocks: buildAllDayBlocks(),
      defaults: Array.from(buildDefaultBlocks()).sort(),
    });
  } catch (error) {
    console.error('Erro ao obter disponibilidade:', error);
    return res.status(500).json({ message: 'Erro interno ao obter disponibilidade.', error: error.message });
  }
};

/** PUT /availability/slots  body: { date, staffId?, blocks: ["HH:mm", ...] } */
const setAvailabilitySlots = async (req, res) => {
  try {
    const { date, staffId, blocks } = req.body || {};
    const trimmedDate = String(date || '').trim();
    if (!trimmedDate) return res.status(400).json({ message: 'Data é obrigatória.' });

    const isAdmin = req.staff?.role === 'admin';
    const resolvedStaffId = isAdmin && staffId != null ? parseInt(staffId, 10) : req.staff?.id;
    if (!resolvedStaffId || Number.isNaN(resolvedStaffId)) {
      return res.status(400).json({ message: 'staffId inválido.' });
    }

    const allowedBlocks = new Set(buildAllDayBlocks());
    const normalizedBlocks = Array.isArray(blocks)
      ? blocks
          .map((t) => String(t).substring(0, 5))
          .filter((t) => allowedBlocks.has(t))
      : [];

    // Estratégia simples e robusta: "replace" por dia.
    await db.sequelize.transaction(async (t) => {
      await db.StaffAvailabilitySlot.destroy({ where: { staffId: resolvedStaffId, date: trimmedDate }, transaction: t });
      if (normalizedBlocks.length > 0) {
        await db.StaffAvailabilitySlot.bulkCreate(
          normalizedBlocks.map((time) => ({ staffId: resolvedStaffId, date: trimmedDate, time })),
          { transaction: t, ignoreDuplicates: true }
        );
      }
    });

    const result = await getSlotsForStaffAndDate({ staffId: resolvedStaffId, date: trimmedDate });
    return res.status(200).json({ staffId: resolvedStaffId, date: trimmedDate, ...result });
  } catch (error) {
    console.error('Erro ao guardar disponibilidade:', error);
    return res.status(500).json({ message: 'Erro interno ao guardar disponibilidade.', error: error.message });
  }
};

module.exports = {
  getAvailabilitySlots,
  setAvailabilitySlots,
  // exports internos úteis para reutilização
  _availability: {
    BLOCK_MINUTES,
    DAY_START,
    DAY_END,
    DEFAULT_WINDOWS,
    buildAllDayBlocks,
    buildDefaultBlocks,
    getSlotsForStaffAndDate,
    toMinutes,
    minutesToHHMM,
  },
};

