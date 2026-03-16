import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app/create-app.js';

describe('GET /api/health', () => {
  it('returns ok', async () => {
    const response = await request(createApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('api');
    expect(typeof response.body.timestamp).toBe('string');
  });
});