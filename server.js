const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    app: "Whale Bets",
    status: "online",
    source: "SX Bet"
  });
});

app.get("/bets", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.sx.bet/markets/active"
    );

    if (!response.ok) {
      throw new Error(
        "Erro ao buscar mercados: " + response.status
      );
    }

    const data = await response.json();

    const markets = data.data.markets || [];

    const market = markets[0];

    if (!market) {
      return res.json([]);
    }

    const ordersResponse = await fetch(
      "https://api.sx.bet/orders?marketHash=" +
      market.marketHash
    );

    if (!ordersResponse.ok) {
      throw new Error(
        "Erro ao buscar ordens: " +
        ordersResponse.status
      );
    }

    const ordersData = await ordersResponse.json();

    const orders =
      ordersData.data ||
      ordersData.orders ||
      [];

    res.json({
      mercado: {
        esporte: market.sportLabel,
        liga: market.leagueLabel,
        time1: market.teamOneName,
        time2: market.teamTwoName,
        marketHash: market.marketHash
      },
      ordens: orders
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(
    "Whale Bets online na porta " + PORT
  );
});
