// src/services/appointmentService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/';

export const clientRequestNewAppointment = async (requestData, token) => {
  if (!token) throw new Error('Token de cliente não fornecido para clientRequestNewAppointment.');
  if (!requestData.staffId || !requestData.date || !requestData.time) {
    throw new Error('Dados insuficientes para solicitar consulta: staffId, date, e time são obrigatórios.');
  }
  try {
    const response = await fetch(`${API_URL}/appointments/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao solicitar consulta.');
    }
    return data;
  } catch (error) {
    console.error("Erro no serviço clientRequestNewAppointment:", error);
    throw error;
  }
};

export const getAllAppointments = async (token, filters = {}) => { 
  if (!token) throw new Error('Token não fornecido para getAllAppointments.');
  try {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    // Constrói a query string dos filtros
    const queryParams = new URLSearchParams();
    if (filters.staffId) queryParams.append('staffId', filters.staffId);
    if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.userId) queryParams.append('userId', filters.userId); // Para admin poder filtrar por cliente
    
    const queryString = queryParams.toString();
    const fetchURL = queryString ? `${API_URL}/appointments?${queryString}` : `${API_URL}/appointments`;
    
    const response = await fetch(fetchURL, { method: 'GET', headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar consultas.');
    return data; 
  } catch (error) { console.error("Erro no serviço getAllAppointments:", error); throw error; }
};

export const bookAppointment = async (appointmentId, token) => { 
  if (!token) throw new Error('Token não fornecido para marcar consulta.');
  try {
    const response = await fetch(`${API_URL}/appointments/${appointmentId}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao marcar consulta.');
    return data;
  } catch (error) { console.error("Erro em bookAppointment:", error); throw error; }
};

export const cancelAppointmentBooking = async (appointmentId, token) => { 
    if (!token) throw new Error('Token não fornecido para cancelar marcação.');
    try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}/book`, { // O endpoint de cancelamento é o mesmo mas com método DELETE
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao cancelar marcação.');
        return data;
    } catch (error) { console.error("Erro em cancelAppointmentBooking:", error); throw error; }
};

export const adminCreateAppointment = async (appointmentData, token) => { 
  if (!token) throw new Error('Token de administrador não fornecido para criar consulta.');
  try {
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(appointmentData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar consulta.');
    return data;
  } catch (error) { console.error("Erro em adminCreateAppointment:", error); throw error; }
};

export const adminGetAppointmentById = async (appointmentId, token) => { 
    if (!token) throw new Error('Token de administrador não fornecido para buscar consulta por ID.');
    try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao buscar consulta por ID.');
        return data;
    } catch (error) { console.error("Erro em adminGetAppointmentById:", error); throw error; }
};

export const adminUpdateAppointment = async (appointmentId, appointmentData, token) => { 
  if (!token) throw new Error('Token de administrador não fornecido para atualizar consulta.');
  try {
    const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(appointmentData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar consulta.');
    return data;
  } catch (error) { console.error("Erro em adminUpdateAppointment:", error); throw error; }
};

export const adminDeleteAppointment = async (appointmentId, token) => { 
  if (!token) throw new Error('Token de administrador não fornecido para eliminar consulta.');
  try {
    const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.status === 200 || response.status === 204) { // 200 com mensagem ou 204 sem conteúdo
        try {
            const data = await response.json(); // Tenta ler JSON se houver
            return data.message ? data : { message: "Consulta eliminada com sucesso." };
        } catch (e) { // Se não houver JSON (caso de 204), retorna mensagem padrão
            return { message: "Consulta eliminada com sucesso." };
        }
    }
    // Se a resposta não for ok e não for 204
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erro ao eliminar consulta.');
  } catch (error) { 
    console.error("Erro em adminDeleteAppointment:", error); 
    if (error instanceof Error) throw error;
    throw new Error('Erro ao comunicar com o servidor para eliminar consulta.');
  }
};

export const staffRespondToRequest = async (appointmentId, decision, token) => {
    if (!token) throw new Error('Token não fornecido para staffRespondToRequest.');
    try {
        const response = await fetch(`${API_URL}/appointments/${appointmentId}/respond`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ decision }), 
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao responder ao pedido de consulta.');
        return data;
    } catch (error) {
        console.error("Erro em staffRespondToRequest:", error);
        throw error;
    }
};