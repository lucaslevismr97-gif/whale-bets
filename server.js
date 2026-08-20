const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Filtro padrão do Whale Bets
const MIN_BET_USD = 100000;

// Dados de demonstração
let bets = [
  {
    bettor: "DemoWhale",
    sport: "Futebol",
    market: "Demonstração",
    amount_usd: 250000,
    odds: 1.80,
    timestamp: new Date().toISOString()
  }
];

// Página inicial da API
app.get("/", (req, res) => {
  res.json({
    app: "Whale Bets",
    status: "online",
    minimum_bet_usd: MIN_BET_USD,
    period: "24 horas"
  });
});

// Retorna somente apostas acima de US$ 100 mil
app.get("/bets", (req, res) => {
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;

  const filtered = bets
    .filter(bet => bet.amount_usd >= MIN_BET_USD)
    .filter(bet => new Date(bet.timestamp).getTime() >= last24h)
    .sort((a, b) => b.amount_usd - a.amount_usd);

  res.json(filtered);
});

// Endpoint para uma fonte autorizada enviar novas apostas
app.post("/bets", (req, res) => {
  const bet = req.body;

  if (!bet.amount_usd || bet.amount_usd < MIN_BET_USD) {
    return res.status(400).json({
      error: "A aposta precisa ser de pelo menos US$ 100.000"
    });
  }

  bets.push({
    ...bet,
    timestamp: bet.timestamp || new Date().toISOString()
  });

  res.json({
    success: true,
    message: "Aposta recebida"
  });
});

app.listen(PORT, () => {
  console.log(`Whale Bets rodando na porta ${PORT}`);
});
