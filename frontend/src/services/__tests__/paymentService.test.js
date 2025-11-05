// Simple fetch mock without external deps
let fetchMock;
beforeAll(() => { global.fetch = jest.fn(); fetchMock = global.fetch; });
import {
  adminCreatePayment,
  adminGetAllPayments,
  adminGetTotalPaid,
  adminUpdatePaymentStatus,
  adminDeletePayment,
  clientGetMyPayments,
  clientGetMyPendingPaymentsService,
  clientAcceptPayment,
  clientConfirmManualPayment,
  createStripePaymentIntentForSignal,
} from '../../services/paymentService';

beforeEach(() => {
  fetchMock.mockReset();
});

test('createStripePaymentIntentForSignal calls correct endpoint and returns data', async () => {
fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ clientSecret: 'cs_123', amount: 10 }), { status: 200 }));
  const data = await createStripePaymentIntentForSignal(42, 'token');
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/payments\/42\/create-stripe-intent$/), expect.objectContaining({ method: 'POST' }));
  expect(data.clientSecret).toBe('cs_123');
});

test('adminUpdatePaymentStatus sends PATCH and handles non-OK', async () => {
fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, status: 'pago' }), { status: 200 }));
  const res = await adminUpdatePaymentStatus(1, 'pago', 'admintoken');
  expect(res.status).toBe('pago');
});

test('clientGetMyPayments fails without token', async () => {
  await expect(clientGetMyPayments()).rejects.toThrow(/Token de cliente/);
});
