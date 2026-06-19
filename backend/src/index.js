require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Garante a criação do banco/tabelas ao subir o servidor.
require('./db/database');

const authRoutes = require('./routes/authRoutes');
const orcamentoRoutes = require('./routes/orcamentoRoutes');
const centroCustoRoutes = require('./routes/centroCustoRoutes');
const gastoRoutes = require('./routes/gastoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Healthcheck simples.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/centros-custo', centroCustoRoutes);
app.use('/api/gastos', gastoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 para rotas de API não encontradas.
app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Tratador de erros genérico.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`🟢 API My Budget rodando em http://localhost:${PORT}`);
});
