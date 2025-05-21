// src/services/paymentService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
        if (response.status === 204 || response.ok) { // Tratar 204 ou 200 com json de mensagem
             try {
                const data = await response.json();
                return data;
            } catch (e) { // Se for 204, .json() falha, então retorna mensagem padrão
                return { message: "Pagamento eliminado com sucesso." };
            }
        }
        // Se não for ok, tenta ler json para a mensagem de erro
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao eliminar pagamento.');
    } catch (error) { 
        console.error("Erro em adminDeletePayment:", error); 
        // Se o erro já for um Error, re-lança. Senão, cria um novo.
        if (error instanceof Error) throw error;
        throw new Error('Erro ao comunicar com o servidor para eliminar pagamento.');
    }
};

// --- Funções de serviço para o Cliente ---
export const clientGetMyPayments = async (token) => {
  if (!token) throw new Error('Token de cliente não fornecido para clientGetMyPayments.');
  try {
    const response = await fetch(`${API_URL}/payments/my-payments`, { // Ajusta o endpoint se necessário
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao buscar os seus pagamentos.');
    return data;
  } catch (error) { console.error("Erro em clientGetMyPayments:", error); throw error; }
};

// Função para o cliente "aceitar" pagamentos (simulação, para pagamentos não-Stripe se necessário)
// Se todos os pagamentos online forem via Stripe, esta função pode não ser mais necessária ou
// só ser chamada internamente pelo admin.
export const clientAcceptPayment = async (paymentId, token) => {
  if (!token) throw new Error('Token de cliente não fornecido para clientAcceptPayment.');
  try {
    // Esta rota no backend agora é clientAcceptNonStripePayment
    const response = await fetch(`${API_URL}/payments/${paymentId}/accept`, { // Ajusta o endpoint se necessário
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro ao aceitar pagamento.');
    return data;
  } catch (error) { console.error("Erro em clientAcceptPayment:", error); throw error; }
};

// NOVA FUNÇÃO para criar a intenção de pagamento Stripe
export const createStripePaymentIntentForSignal = async (internalPaymentId, token) => {
  if (!token) throw new Error('Token não fornecido.');
  if (!internalPaymentId) throw new Error('ID do Pagamento interno não fornecido.');
  try {
    const response = await fetch(`${API_URL}/payments/${internalPaymentId}/create-stripe-intent`, { // Confirma este endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // O corpo pode ser vazio se o backend obtiver o paymentId da URL
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar intenção de pagamento Stripe.');
    }
    return data; // Espera-se { clientSecret, paymentId, amount }
  } catch (error) {
    console.error("Erro em createStripePaymentIntentForSignal:", error);
    throw error;
  }
};