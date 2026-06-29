import { Injectable } from '@nestjs/common';

import { DslQueryDto } from './dto/dsl-query.dto';
import { DslExecutorService } from './dsl-executor.service';
import { DslParserService } from './dsl-parser.service';

@Injectable()
export class DslService {
  constructor(
    private readonly parser: DslParserService,
    private readonly executor: DslExecutorService,
  ) {}

  parse(dto: DslQueryDto) {
    return this.parser.parse(dto);
  }

  execute(dto: DslQueryDto) {
    const parsedQuery = this.parser.parse(dto);

    return this.executor.execute(parsedQuery);
  }

  getExamples() {
    return this.parser.getExamples();
  }
}
