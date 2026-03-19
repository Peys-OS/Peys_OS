import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint — receives events from Supabase and forwards to WhatsApp
app.post('/webhook', async (req, res) => {
  try {
    const { event, payload } = req.body;
    console.log(`Received webhook: ${event}`, payload);
    // TODO: handle events (payment_created, payment_claimed, etc.)
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Peys WhatsApp bot server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});

export default app;
