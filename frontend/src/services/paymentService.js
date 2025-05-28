// src/services/paymentService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Funções de Admin (sem alterações)
export const adminCreatePayment = async (paymentData, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminCreatePayment.');
  try {
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(paymentData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao criar pagamento.');
    return data;
  } catch (error) { console.error("Erro em adminCreatePayment:", error); throw error; }
};

export const adminGetAllPayments = async (filters = {}, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminGetAllPayments.');
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const fetchURL = queryParams ? `${API_URL}/payments?${queryParams}` : `${API_URL}/payments`;

    const response = await fetch(fetchURL, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar todos os pagamentos.');
    return data;
  } catch (error) { console.error("Erro em adminGetAllPayments:", error); throw error; }
};

export const adminGetTotalPaid = async (token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminGetTotalPaid.');
  try {
    const response = await fetch(`${API_URL}/payments/total-paid`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar total pago.');
    return data;
  } catch (error) { console.error("Erro em adminGetTotalPaid:", error); throw error; }
};

export const adminUpdatePaymentStatus = async (paymentId, status, token) => {
  if (!token) throw new Error('Token de administrador não fornecido para adminUpdatePaymentStatus.');
  try {
    const response = await fetch(`${API_URL}/payments/${paymentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao atualizar status do pagamento.');
    return data;
  } catch (error) { console.error("Erro em adminUpdatePaymentStatus:", error); throw error; }
};

export const adminDeletePayment = async (paymentId, token) => {
    if (!token) throw new Error('Token de administrador não fornecido para adminDeletePayment.');
    try {
        const response = await fetch(`${API_URL}/payments/${paymentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.status === 204 || response.ok) {
             try {
                const data = await response.json();
                return data;
            } catch (e) {
                return { message: "Pagamento eliminado com sucesso." };
            }
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao eliminar pagamento.');
    } catch (error) {
        console.error("Erro em adminDeletePayment:", error);
        if (error instanceof Error) throw error;
        throw new Error('Erro ao comunicar com o servidor para eliminar pagamento.');
    }
};

// --- Funções de serviço para o Cliente ---
export const clientGetMyPayments = async (token) => {
  if (!token) throw new Error('Token de cliente não fornecido para clientGetMyPayments.');
  try {
    const response = await fetch(`${API_URL}/payments/my-payments`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar os seus pagamentos.');
    return data;
  } catch (error) { console.error("Erro em clientGetMyPayments:", error); throw error; }
};

// Função para o cliente "aceitar" pagamentos (LEGADO - Usado agora como base para confirmação)
export const clientAcceptPayment = async (paymentId, token) => {
  if (!token) throw new Error('Token de cliente não fornecido para clientAcceptPayment.');
  try {
    const response = await fetch(`${API_URL}/payments/${paymentId}/accept`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao aceitar pagamento.');
    return data;
  } catch (error) { console.error("Erro em clientAcceptPayment:", error); throw error; }
};

// =========================================================================
// == NOVA FUNÇÃO (ou pode usar a clientAcceptPayment diretamente) ==
// Função para o cliente confirmar pagamentos manuais (Mensalidades)
// =========================================================================
export const clientConfirmManualPayment = async (paymentId, token) => {
  if (!token) throw new Error('Token de cliente não fornecido para clientConfirmManualPayment.');
  try {
    // Usa o endpoint /accept. Certifique-se que o backend (paymentController.js)
    // tem a função `clientAcceptPayment` (ou similar) que lida com isto
    // e muda o status para 'pago' ou 'confirmada'.
    const response = await fetch(`${API_URL}/payments/${paymentId}/accept`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      // Não precisa de body se o backend apenas muda o status
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao confirmar pagamento.');
    return data;
  } catch (error) { console.error("Erro em clientConfirmManualPayment:", error); throw error; }
};
// =========================================================================

// Função para criar a intenção de pagamento Stripe
export const createStripePaymentIntentForSignal = async (internalPaymentId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!internalPaymentId) throw new Error('ID do Pagamento interno não fornecido.');
  try {
    const response = await fetch(`${API_URL}/payments/${internalPaymentId}/create-stripe-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar intenção de pagamento Stripe.');
    }
    return data;
  } catch (error) {
    console.error("Erro em createStripePaymentIntentForSignal:", error);
    throw error;
  }
};