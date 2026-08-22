const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const MIN_USD = 100000;
const USDC_DECIMALS = 1000000;

app.get("/", (req, res) => {
  res.json({
    app: "Whale Bets",
    status: "online",
    source: "SX Bet",
    minimum_usd: MIN_USD
  });
});

app.get("/bets", async (req, res) => {
  try {
    const marketsResponse = await fetch(
      "https://api.sx.bet/markets/active"
    );

    if (!marketsResponse.ok) {
      throw new Error(
        "Erro ao buscar mercados: " + marketsResponse.status
      );
    }

    const marketsData = await marketsResponse.json();

    const markets = marketsData?.data?.markets || [];

    const whales = [];

    // Limita a 50 mercados por consulta para evitar sobrecarregar o serviço
    for (const market of markets.slice(0, 50)) {
      if (!market.marketHash) continue;

      try {
        const ordersResponse = await fetch(
          "https://api.sx.bet/orders?marketHash=" +
          market.marketHash
        );

        if (!ordersResponse.ok) continue;

        const ordersData = await ordersResponse.json();

        const orders =
          ordersData?.data ||
          ordersData?.orders ||
          [];

        for (const order of orders) {
          if (order.orderStatus !== "ACTIVE") continue;

          if (order.marketHash !== market.marketHash) continue;

          const totalBetSize = Number(
            order.totalBetSize || 0
          );

          const valueUsd =
            totalBetSize / USDC_DECIMALS;

          if (valueUsd < MIN_USD) continue;

          const odds =
            Number(order.percentageOdds || 0) /
            1000000000000000000;

          whales.push({
            value_usd: valueUsd,
            odds: odds,

            esporte: market.sportLabel || "",
            liga: market.leagueLabel || "",

            time1: market.teamOneName || "",
            time2: market.teamTwoName || "",

            outcome1: market.outcomeOneName || "",
            outcome2: market.outcomeTwoName || "",

            marketHash: market.marketHash,
            orderHash: order.orderHash,

            eventId: market.sportXeventId,

            gameTime: market.gameTime,

            status: order.orderStatus
          });
        }
      } catch (error) {
        console.log(
          "Erro ao consultar mercado:",
          error.message
        );
      }
    }

    whales.sort(
      (a, b) => b.value_usd - a.value_usd
    );

    res.json(whales.slice(0, 100));

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
