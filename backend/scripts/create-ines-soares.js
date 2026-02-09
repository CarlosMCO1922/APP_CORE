#!/usr/bin/env node
/**
 * Cria ou substitui a conta de staff para Inês Soares (osteopata).
 * Uso: node backend/scripts/create-ines-soares.js
 * (executar a partir da raiz do projeto: node backend/scripts/create-ines-soares.js)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../models');
const { hashPassword } = require('../utils/passwordUtils');

const EMAIL = 'inessoares.osteopatia@gmail.com';
const PASSWORD = 'Ines123';
const FIRST_NAME = 'Inês';
const LAST_NAME = 'Soares';
const ROLE = 'osteopata';

async function run() {
  try {
    const existing = await db.Staff.findOne({ where: { email: EMAIL } });
    if (existing) {
      await existing.destroy();
      console.log('Conta existente com este email foi removida.');
    }

    const hashedPassword = await hashPassword(PASSWORD);
    const staff = await db.Staff.create({
      firstName: FIRST_NAME,
      lastName: LAST_NAME,
      email: EMAIL,
      password: hashedPassword,
      role: ROLE,
    });

    console.log('Conta criada com sucesso.');
    console.log('ID (staff):', staff.id);
    console.log('Email:', staff.email);
    console.log('Role:', staff.role);
    console.log('');
    console.log('Para partilhar o gabinete com a Elsa, adiciona ao .env do backend:');
    console.log('SHARED_OFFICE_STAFF_IDS=ID_ELSA,' + staff.id);
    process.exit(0);
  } catch (err) {
    console.error('Erro:', err.message || err);
    process.exit(1);
  }
}

run();
