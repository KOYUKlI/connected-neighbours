import express from "express";
import { MongoClient } from "mongodb";
import neo4j from "neo4j-driver";

const app = express();
app.use(express.json());

const PORT = Number(process.env.API_PORT || 3001);
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/connected";
const NEO4J_URI = process.env.NEO4J_URI || "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "neo4j_password";

const mongoClient = new MongoClient(MONGO_URI);

const neo4jDriver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
);

app.get("/health", async (_req, res) => {
  const result: Record<string, unknown> = {
    status: "ok",
    api: true,
    mongo: false,
    neo4j: false
  };

  try {
    await mongoClient.connect();
    await mongoClient.db().admin().ping();
    result.mongo = true;
  } catch (e) {
    result.mongo = false;
    result.mongoError = (e as Error).message;
  }

  try {
    const session = neo4jDriver.session();
    await session.run("RETURN 1 AS ok");
    await session.close();
    result.neo4j = true;
  } catch (e) {
    result.neo4j = false;
    result.neo4jError = (e as Error).message;
  }

  const httpCode = result.mongo && result.neo4j ? 200 : 503;
  return res.status(httpCode).json(result);
});

app.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
  console.log(`[api] health on http://localhost:${PORT}/health`);
});