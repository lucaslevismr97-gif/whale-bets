const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// US$ 100.000 em USDC (6 casas decimais)
const MIN_BET_SIZE = 100000000000;

app.get("/", (req, res) => {
  res.json({
    app: "Whale Bets",
    status: "online",
    source: "SX Bet",
    minimum_usd: 100000
  });
});

app.get("/bets", async (req, res) => {
  try {
    const response = await fetch("https://api.sx.bet/orders");

    if (!response.ok) {
      throw new Error(`SX Bet respondeu ${response.status}`);
    }

    const data = await response.json();

    const orders = Array.isArray(data)
      ? data
      : data.data  data.orders  [];

    const whales = orders
      .filter(order => {
        const size = BigInt(order.totalBetSize || "0");
        return size >= BigInt(MIN_BET_SIZE);
      })
      .filter(order => order.orderStatus === "ACTIVE")
      .map(order => ({
        marketHash: order.marketHash,
        orderHash: order.orderHash,
        value_usd: Number(order.totalBetSize) / 1000000,
        odds: Number(order.percentageOdds) / 1000000000000000000,
        eventId: order.sportXeventId,
        status: order.orderStatus
      }))
      .sort((a, b) => b.value_usd - a.value_usd);

    res.json(whales);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Não foi possível consultar a SX Bet",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Whale Bets rodando na porta ${PORT}`);
});
