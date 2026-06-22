require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { initDb } = require('./db/database');

const authRoutes = require('./routes/authRoutes');
const orcamentoRoutes = require('./routes/orcamentoRoutes');
const centroCustoRoutes = require('./routes/centroCustoRoutes');
const gastoRoutes = require('./routes/gastoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Healthcheck (útil para o monitoramento do Render).
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/orcamentos', orcamentoRoutes);
app.use('/api/centros-custo', centroCustoRoutes);
app.use('/api/gastos', gastoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 para rotas de API inexistentes.
app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// --- Servir o frontend buildado (deploy como serviço único) ---
// Se existir frontend/dist, o Express serve o React e faz fallback do SPA.
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
}

// Tratador de erros genérico.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Conecta/cria as tabelas e só então sobe o servidor.
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🟢 API My Budget rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Falha ao inicializar o banco de dados:', err.message);
    process.exit(1);
  });
