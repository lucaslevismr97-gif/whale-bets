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
    source: "SX Bet"
  });
});

app.get("/bets", async (req, res) => {
  try {
    const marketsResponse = await fetch(
      "https://api.sx.bet/markets/active"
    );

    if (!marketsResponse.ok) {
      throw new Error(
        "Erro ao buscar mercados: " +
        marketsResponse.status
      );
    }

    const marketsData = await marketsResponse.json();

    const markets =
      marketsData?.data?.markets || [];

    let totalMarkets = markets.length;
    let totalOrders = 0;
    let ordersAbove100k = 0;

    const whales = [];

    for (const market of markets) {
      if (!market.marketHash) continue;

      try {
        const ordersResponse = await fetch(
          "https://api.sx.bet/orders?marketHash=" +
          market.marketHash
        );

        if (!ordersResponse.ok) continue;

        const ordersData =
          await ordersResponse.json();

        const orders =
          ordersData?.data ||
          ordersData?.orders ||
          [];

        totalOrders += orders.length;

        for (const order of orders) {
          if (order.orderStatus !== "ACTIVE") {
            continue;
          }

          if (
            order.marketHash &&
            order.marketHash !== market.marketHash
          ) {
            continue;
          }

          const totalBetSize = Number(
            order.totalBetSize || 0
          );

          const valueUsd =
            totalBetSize / USDC_DECIMALS;

          if (valueUsd < MIN_USD) continue;

          ordersAbove100k++;

          whales.push({
            value_usd: valueUsd,

            odds:
              Number(order.percentageOdds || 0) /
              1000000000000000000,

            esporte:
              market.sportLabel || "",

            liga:
              market.leagueLabel || "",

            time1:
              market.teamOneName || "",

            time2:
              market.teamTwoName || "",

            outcome1:
              market.outcomeOneName || "",

            outcome2:
              market.outcomeTwoName || "",

            marketHash:
              market.marketHash,

            orderHash:
              order.orderHash,

            eventId:
              market.sportXeventId,

            status:
              order.orderStatus
          });
        }

      } catch (error) {
        console.log(
          "Erro no mercado:",
          error.message
        );
      }
    }

    whales.sort(
      (a, b) => b.value_usd - a.value_usd
    );

    res.json({
      resumo: {
        mercados_encontrados: totalMarkets,
        ordens_encontradas: totalOrders,
        ordens_acima_de_100_mil:
          ordersAbove100k
      },

      whales: whales.slice(0, 100)
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
