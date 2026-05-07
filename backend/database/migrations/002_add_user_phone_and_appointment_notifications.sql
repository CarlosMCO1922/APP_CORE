-- 002_add_user_phone_and_appointment_notifications.sql
-- Adiciona telemóvel ao cliente e campos de idempotência para WhatsApp / lembretes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(32);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS pending_whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS paid_whatsapp_sent_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMP WITH TIME ZONE;

