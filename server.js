const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// US$ 100.000 em USDC, com 6 casas decimais
const MIN_USD = 100000;
const MIN_BET_SIZE = BigInt(MIN_USD * 1000000);

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
    // 1. Buscar mercados ativos
    const marketsResponse = await fetch(
      "https://api.sx.bet/markets/active"
    );

    if (!marketsResponse.ok) {
      throw new Error(
        `Erro ao buscar mercados: ${marketsResponse.status}`
      );
    }

    const marketsData = await marketsResponse.json();

    const markets = marketsData?.data?.markets || [];

    const whales = [];

    // 2. Consultar as ordens dos mercados
    for (const market of markets.slice(0, 50)) {
      try {
        const ordersResponse = await fetch(
          https://api.sx.bet/orders?marketHash=${market.marketHash}
        );

        if (!ordersResponse.ok) continue;

        const ordersData = await ordersResponse.json();

        const orders = Array.isArray(ordersData)
          ? ordersData
          : ordersData?.data  ordersData?.orders  [];

        // 3. Filtrar grandes ordens
        for (const order of orders) {
          if (order.orderStatus !== "ACTIVE") continue;

          const size = BigInt(order.totalBetSize || "0");

          if (size < MIN_BET_SIZE) continue;

          // 4. Converter para dólares
          const valueUsd = Number(size) / 1000000;

          whales.push({
            value_usd: valueUsd,
            odds:
              Number(order.percentageOdds || 0) /
              1000000000000000000,

            sport: market.sportLabel,
            league: market.leagueLabel,

            team_one: market.teamOneName,
            team_two: market.teamTwoName,

            outcome_one: market.outcomeOneName,
            outcome_two: market.outcomeTwoName,

            market_hash: market.marketHash,
            order_hash: order.orderHash,
            event_id: market.sportXeventId,

            game_time: market.gameTime,

            status: order.orderStatus
          });
        }
      } catch (error) {
        console.error(
          Erro no mercado ${market.marketHash}:,
          error.message
        );
      }
    }

    // 5. Ordenar pelas maiores ordens
    whales.sort((a, b) => b.value_usd - a.value_usd);

    // 6. Limitar resultado
    res.json(whales.slice(0, 100));

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Erro ao consultar a SX Bet",
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Whale Bets rodando na porta ${PORT}`);
});
