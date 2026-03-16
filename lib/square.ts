import { Client, Environment } from "square/legacy";

const squareEnv =
  process.env.SQUARE_ENV === "production"
    ? Environment.Production
    : Environment.Sandbox;

export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: squareEnv,
});

export const SQUARE_APP_ID = process.env.SQUARE_APPLICATION_ID || "";
export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";