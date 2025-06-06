// src/services/userService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const getMyBookings = async (token) => {
  if (!token) throw new Error('Token não fornecido para getMyBookings.');
  try {
    const response = await fetch(`${API_URL}/users/me/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar marcações.');
    return data;
  } catch (error) { console.error(error); throw error; }
};

export const getMyProfile = async (token) => {
  if (!token) throw new Error('Token não fornecido para getMyProfile.');
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar perfil.');
    return data;
  } catch (error) { console.error(error); throw error; }
};

export const updateMyProfile = async (token, profileData) => {
  if (!token) throw new Error('Token não fornecido para updateMyProfile.');
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar perfil.');
    return data;
  } catch (error) { console.error(error); throw error; }
};

export const adminGetAllUsers = async (token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar todos os utilizadores.');
    return data;
  } catch (error) { console.error("Erro em adminGetAllUsers:", error); throw error; }
};

export const adminGetUserById = async (userId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar utilizador por ID.');
    return data;
  } catch (error) { console.error("Erro em adminGetUserById:", error); throw error; }
};

export const adminCreateUser = async (userData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar utilizador.');
    return data;
  } catch (error) { console.error("Erro em adminCreateUser:", error); throw error; }
};

export const adminUpdateUser = async (userId, userData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(userData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar utilizador.');
    return data;
  } catch (error) { console.error("Erro em adminUpdateUser:", error); throw error; }
};

export const adminDeleteUser = async (userId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json(); 
    if (!response.ok) throw new Error(data.message || 'Erro ao eliminar utilizador.');
    return data; 
  } catch (error) { console.error("Erro em adminDeleteUser:", error); throw error; }
};


export const adminGetUserTrainingsService = async (userId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!userId) throw new Error('ID do Utilizador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/users/${userId}/trainings`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar treinos do utilizador.');
    return data;
  } catch (error) {
    console.error(`Erro em adminGetUserTrainingsService para userId ${userId}:`, error);
    throw error;
  }
};

export const adminGetUserAppointmentsService = async (userId, token) => {
  if (!token) throw new Error('Token de administrador não fornecido.');
  if (!userId) throw new Error('ID do Utilizador não fornecido.');
  try {
    const response = await fetch(`${API_URL}/users/${userId}/appointments`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar consultas do utilizador.');
    return data;
  } catch (error) {
    console.error(`Erro em adminGetUserAppointmentsService para userId ${userId}:`, error);
    throw error;
  }
};