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
const market = markets[0];

if (!market) {
  return res.json([]);
}

const ordersResponse = await fetch(
  "https://api.sx.bet/orders?marketHash=" + market.marketHash
);

const ordersData = await ordersResponse.json();

const orders = ordersData.data || ordersData.orders || [];

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
