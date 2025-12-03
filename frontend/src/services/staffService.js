// src/services/staffService.js
import { logger } from '../utils/logger';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const getAllStaffForSelection = async (token) => {
  if (!token) throw new Error('Token não fornecido para getAllStaffForSelection.');
  try {
    const response = await fetch(`${API_URL}/staff/professionals`, { 
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar profissionais para seleção.');
    return data;
  } catch (error) { 
    logger.error("Erro em getAllStaffForSelection:", error); 
    throw error; 
  }
};

export const adminGetAllStaff = async (token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminGetAllStaff.');
  try {
    const response = await fetch(`${API_URL}/staff`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar todos os membros da equipa.');
    return data;
  } catch (error) { logger.error("Erro em adminGetAllStaff:", error); throw error; }
};

export const adminGetStaffById = async (staffId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminGetStaffById.');
  try {
    const response = await fetch(`${API_URL}/staff/${staffId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar membro da equipa por ID.');
    return data;
  } catch (error) { logger.error("Erro em adminGetStaffById:", error); throw error; }
};

export const adminCreateStaff = async (staffData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminCreateStaff.');
  try {
    const response = await fetch(`${API_URL}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(staffData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar membro da equipa.');
    return data;
  } catch (error) { logger.error("Erro em adminCreateStaff:", error); throw error; }
};

export const adminUpdateStaff = async (staffId, staffData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminUpdateStaff.');
  try {
    const response = await fetch(`${API_URL}/staff/${staffId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(staffData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar membro da equipa.');
    return data;
  } catch (error) { logger.error("Erro em adminUpdateStaff:", error); throw error; }
};

export const adminDeleteStaff = async (staffId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminDeleteStaff.');
  try {
    const response = await fetch(`${API_URL}/staff/${staffId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao eliminar membro da equipa.');
    return data;
  } catch (error) { logger.error("Erro em adminDeleteStaff:", error); throw error; }
};