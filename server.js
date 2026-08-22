const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    app: "Whale Bets",
    status: "online"
  });
});

app.get("/bets", async (req, res) => {
  try {
    const response = await fetch("https://api.sx.bet/markets/active");
    const data = await response.json();

    const markets = data.data.markets || [];

    res.json({
      quantidade_mercados: markets.length,
      primeiro_mercado: markets[0] || null
    });

  } catch (error) {
    res.status(500).json({
      erro: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log("Whale Bets online na porta " + PORT);
});
