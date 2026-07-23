import { Injectable } from '@nestjs/common';

import { Neo4jService } from './neo4j.service';

@Injectable()
export class GraphHealthService {
  constructor(private readonly neo4jService: Neo4jService) {}

  status() {
    return this.neo4jService.health;
  }

  check() {
    return this.neo4jService.checkConnectivity(true);
  }
}
