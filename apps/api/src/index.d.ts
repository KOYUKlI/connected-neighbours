import "dotenv/config";
import express from "express";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";

const app = express();
app.use(express.json());

const PORT = Number(process.env.API_PORT ?? 3001);

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/connected";
const NEO4J_URI = process.env.NEO4J_URI ?? "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER ?? "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? "neo4j_password";

const mongo = new MongoClient(MONGO_URI);
const neo = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

app.get("/health", async (_req, res) => {
  const out: Record<string, unknown> = {
    status: "ok",
    api: true,
    mongo: false,
    neo4j: false
  };

  try {
    await mongo.connect();
    await mongo.db().admin().ping();
    out.mongo = true;
  } catch (e) {
    out.mongo = false;
    out.mongoError = e instanceof Error ? e.message : String(e);
  }

  try {
    const session = neo.session();
    await session.run("RETURN 1 AS ok");
    await session.close();
    out.neo4j = true;
  } catch (e) {
    out.neo4j = false;
    out.neo4jError = e instanceof Error ? e.message : String(e);
  }

  const httpCode = out.mongo && out.neo4j ? 200 : 503;
  res.status(httpCode).json(out);
});

app.listen(PORT, () => {
  console.log(`[api] running on http://localhost:${PORT}`);
  console.log(`[api] health on http://localhost:${PORT}/health`);
});