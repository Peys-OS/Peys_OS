import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../web')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.html'));
});

// Web API endpoints for pages
app.get('/api/web/user/:phone', (req, res) => {
  res.json({
    success: true,
    user: { name: 'Moses', phone: req.params.phone },
    balance: '1250.00'
  });
});

app.get('/api/web/balance/:phone', (req, res) => {
  res.json({ balance: '1250.00', currency: 'USDC' });
});

app.get('/api/web/transactions/:phone', (req, res) => {
  res.json({
    transactions: [
      { id: 1, type: 'received', amount: '100.00', recipient: 'You', sender: 'Alice', createdAt: '2024-02-28' },
      { id: 2, type: 'sent', amount: '50.00', recipient: 'Bob', sender: 'You', createdAt: '2024-02-27' },
      { id: 3, type: 'received', amount: '250.00', recipient: 'You', sender: 'Sarah', createdAt: '2024-02-25' },
    ]
  });
});

app.get('/api/web/claims/pending', (req, res) => {
  res.json({ claims: [] });
});

app.post('/api/web/register', (req, res) => {
  res.json({ success: true, message: 'Registration successful' });
});

app.post('/api/web/send', (req, res) => {
  res.json({ success: true, txHash: '0x1234...5678' });
});

// Legacy API endpoints
app.get('/api/balance/:wallet', (req, res) => {
  res.json({ balance: '1250.00', currency: 'USDC' });
});

app.get('/api/transactions/:wallet', (req, res) => {
  res.json({
    transactions: [
      { id: 1, type: 'received', amount: '100.00', from: '0x1234...', date: '2024-02-28', status: 'completed' },
      { id: 2, type: 'sent', amount: '50.00', to: '0x5678...', date: '2024-02-27', status: 'completed' },
    ]
  });
});

const sequelize = new Sequelize(
  process.env.DB_NAME || 'peydot',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
  }
);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log('Server running without database');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
