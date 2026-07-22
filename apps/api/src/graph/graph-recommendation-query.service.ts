import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';

import { GraphRecommendationCandidate } from './graph.types';
import { Neo4jService } from './neo4j.service';

type RecommendationQuery = {
  userId: string;
  neighborhoodMongoId: string | null;
  interests: string[];
  category?: string;
  excludeIds: string[];
  limit: number;
};

@Injectable()
export class GraphRecommendationQueryService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async services(query: RecommendationQuery) {
    const result = await this.neo4jService.executeRead(
      `MATCH (user:User {mongoId: $userId})
       MATCH (service:Service)-[:LOCATED_IN]->(neighborhood:Neighborhood)
       WHERE service.status IN ['published', 'application_received']
         AND NOT (user)-[:CREATED_SERVICE]->(service)
         AND NOT service.mongoId IN $excludeIds
         AND ($category IS NULL OR toLower(service.category) = toLower($category))
         AND ($neighborhoodMongoId IS NULL OR neighborhood.mongoId = $neighborhoodMongoId)
       OPTIONAL MATCH (owner:User)-[:CREATED_SERVICE]->(service)
       OPTIONAL MATCH (user)-[helped:HELPED]-(owner)
       WITH DISTINCT service, neighborhood, owner, count(helped) AS helpedCount,
            neighborhood.mongoId = $neighborhoodMongoId AS sameNeighborhood,
            toLower(service.category) IN $interests AS commonInterest
       WITH service,
            (CASE WHEN sameNeighborhood THEN 50 ELSE 0 END) +
            (CASE WHEN commonInterest THEN 25 ELSE 0 END) +
            (CASE WHEN helpedCount > 0 THEN 10 ELSE 0 END) AS score,
            (CASE WHEN sameNeighborhood THEN ['same_neighborhood'] ELSE [] END) +
            (CASE WHEN commonInterest THEN ['common_interest'] ELSE [] END) +
            (CASE WHEN helpedCount > 0 THEN ['previous_help'] ELSE [] END) AS reasons
       RETURN service.mongoId AS id, score, reasons
       ORDER BY score DESC, service.createdAt DESC, service.mongoId ASC
       LIMIT $limit`,
      {
        userId: query.userId,
        neighborhoodMongoId: query.neighborhoodMongoId,
        interests: query.interests,
        category: query.category ?? null,
        excludeIds: query.excludeIds,
        limit: neo4j.int(query.limit),
      },
    );
    return this.candidates(result.records);
  }

  async events(query: RecommendationQuery) {
    const result = await this.neo4jService.executeRead(
      `MATCH (user:User {mongoId: $userId})
       MATCH (event:Event)-[:LOCATED_IN]->(neighborhood:Neighborhood)
       WHERE event.status IN ['published', 'open_registration', 'full', 'scheduled']
         AND event.startsAt > $now
         AND NOT event.mongoId IN $excludeIds
         AND NOT (user)-[:PARTICIPATED_IN|INTERESTED_IN]->(event)
         AND ($category IS NULL OR event.category = $category)
         AND ($neighborhoodMongoId IS NULL OR neighborhood.mongoId = $neighborhoodMongoId)
       OPTIONAL MATCH (participant:User)-[:PARTICIPATED_IN]->(event)
       OPTIONAL MATCH (user)-[helped:HELPED]-(participant)
       WITH DISTINCT event, neighborhood, count(helped) AS connectedParticipants,
            neighborhood.mongoId = $neighborhoodMongoId AS sameNeighborhood,
            event.category IN $interests AS commonInterest
       WITH event,
            (CASE WHEN sameNeighborhood THEN 50 ELSE 0 END) +
            (CASE WHEN commonInterest THEN 25 ELSE 0 END) +
            (CASE WHEN connectedParticipants > 0 THEN 10 ELSE 0 END) AS score,
            (CASE WHEN sameNeighborhood THEN ['same_neighborhood'] ELSE [] END) +
            (CASE WHEN commonInterest THEN ['common_interest'] ELSE [] END) +
            (CASE WHEN connectedParticipants > 0 THEN ['known_participants'] ELSE [] END) AS reasons
       RETURN event.mongoId AS id, score, reasons
       ORDER BY score DESC, event.startsAt ASC, event.mongoId ASC
       LIMIT $limit`,
      {
        userId: query.userId,
        neighborhoodMongoId: query.neighborhoodMongoId,
        interests: query.interests,
        category: query.category ?? null,
        excludeIds: query.excludeIds,
        now: new Date().toISOString(),
        limit: neo4j.int(query.limit),
      },
    );
    return this.candidates(result.records);
  }

  async neighbors(query: RecommendationQuery) {
    if (!query.neighborhoodMongoId) return [];
    const result = await this.neo4jService.executeRead(
      `MATCH (user:User {mongoId: $userId})-[:LIVES_IN]->(neighborhood:Neighborhood {mongoId: $neighborhoodMongoId})
       MATCH (candidate:User)-[:LIVES_IN]->(neighborhood)
       WHERE candidate.mongoId <> user.mongoId
         AND candidate.accountStatus = 'active'
         AND candidate.profileVisibility = 'neighborhood'
         AND NOT candidate.mongoId IN $excludeIds
       OPTIONAL MATCH (user)-[helped:HELPED]-(candidate)
       OPTIONAL MATCH (user)-[:PARTICIPATED_IN]->(event:Event)<-[:PARTICIPATED_IN]-(candidate)
       WITH DISTINCT candidate, count(DISTINCT helped) AS helpedCount,
            count(DISTINCT event) AS commonEvents,
            size([interest IN coalesce(user.interests, []) WHERE interest IN coalesce(candidate.interests, [])]) AS commonInterests
       WITH candidate,
            50 +
            CASE WHEN commonInterests > 0 THEN 25 ELSE 0 END +
            CASE WHEN helpedCount > 0 THEN 15 ELSE 0 END +
            CASE WHEN commonEvents > 0 THEN 10 ELSE 0 END AS score,
            ['same_neighborhood'] +
            (CASE WHEN commonInterests > 0 THEN ['common_interest'] ELSE [] END) +
            (CASE WHEN helpedCount > 0 THEN ['previous_help'] ELSE [] END) +
            (CASE WHEN commonEvents > 0 THEN ['common_event'] ELSE [] END) AS reasons
       RETURN candidate.mongoId AS id, score, reasons
       ORDER BY score DESC, candidate.displayName ASC, candidate.mongoId ASC
       LIMIT $limit`,
      {
        userId: query.userId,
        neighborhoodMongoId: query.neighborhoodMongoId,
        excludeIds: query.excludeIds,
        limit: neo4j.int(query.limit),
      },
    );
    return this.candidates(result.records);
  }

  private candidates(records: Array<{ get: (key: string) => unknown }>) {
    return records.map<GraphRecommendationCandidate>((record) => ({
      id: String(record.get('id')),
      score: this.toNumber(record.get('score')),
      reasons: Array.isArray(record.get('reasons'))
        ? (record.get('reasons') as unknown[]).map(String)
        : [],
    }));
  }

  private toNumber(value: unknown) {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null && 'toNumber' in value) {
      return (value as { toNumber: () => number }).toNumber();
    }
    return Number(value ?? 0);
  }
}
