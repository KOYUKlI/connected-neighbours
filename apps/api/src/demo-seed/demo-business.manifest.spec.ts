import { ServiceStatus } from '../services/schemas/service.schema';
import {
  DEMO_EVENT_CATALOG,
  DEMO_NEIGHBORHOODS,
  DEMO_SERVICE_CATALOG,
  DEMO_VOTE_CATALOG,
} from './demo-business.manifest';
import { DEMO_IDENTITIES } from './demo-seed.manifest';

describe('demo business manifest', () => {
  it('déclare six quartiers GeoJSON fermés et non dégénérés', () => {
    expect(DEMO_NEIGHBORHOODS).toHaveLength(6);
    expect(new Set(DEMO_NEIGHBORHOODS.map((item) => item.slug)).size).toBe(6);

    for (const neighborhood of DEMO_NEIGHBORHOODS) {
      expect(neighborhood.geometry.type).toBe('Polygon');
      const ring = neighborhood.geometry.coordinates[0];
      expect(ring.length).toBeGreaterThanOrEqual(4);
      expect(ring[0]).toEqual(ring.at(-1));
      const longitudes = ring.map(([longitude]) => longitude);
      const latitudes = ring.map(([, latitude]) => latitude);
      expect(Math.max(...longitudes) - Math.min(...longitudes)).toBeGreaterThan(
        0,
      );
      expect(Math.max(...latitudes) - Math.min(...latitudes)).toBeGreaterThan(
        0,
      );
    }
  });

  it('référence uniquement des propriétaires et quartiers du manifeste', () => {
    const emails = new Set(DEMO_IDENTITIES.map((identity) => identity.email));
    const neighborhoods = new Set(
      DEMO_NEIGHBORHOODS.map((neighborhood) => neighborhood.slug),
    );

    expect(DEMO_SERVICE_CATALOG.length).toBeGreaterThanOrEqual(24);
    expect(DEMO_EVENT_CATALOG.length).toBeGreaterThanOrEqual(7);
    expect(DEMO_VOTE_CATALOG.length).toBeGreaterThanOrEqual(5);
    for (const service of DEMO_SERVICE_CATALOG) {
      expect(emails.has(service.ownerEmail)).toBe(true);
    }
    for (const event of DEMO_EVENT_CATALOG) {
      expect(emails.has(event.organizerEmail)).toBe(true);
      expect(neighborhoods.has(event.neighborhoodSlug)).toBe(true);
    }
    for (const vote of DEMO_VOTE_CATALOG) {
      expect(neighborhoods.has(vote.neighborhoodSlug)).toBe(true);
    }
  });

  it('possède des clés naturelles uniques et plusieurs états de service', () => {
    expect(new Set(DEMO_SERVICE_CATALOG.map((item) => item.title)).size).toBe(
      DEMO_SERVICE_CATALOG.length,
    );
    expect(new Set(DEMO_EVENT_CATALOG.map((item) => item.title)).size).toBe(
      DEMO_EVENT_CATALOG.length,
    );
    expect(new Set(DEMO_VOTE_CATALOG.map((item) => item.title)).size).toBe(
      DEMO_VOTE_CATALOG.length,
    );
    expect(
      DEMO_SERVICE_CATALOG.some(
        (service) => service.status === ServiceStatus.DRAFT,
      ),
    ).toBe(true);
    expect(
      DEMO_SERVICE_CATALOG.some(
        (service) => service.status === ServiceStatus.CANCELLED,
      ),
    ).toBe(true);
    expect(DEMO_SERVICE_CATALOG.some((service) => service.isPaid)).toBe(true);
    expect(DEMO_SERVICE_CATALOG.some((service) => !service.isPaid)).toBe(true);
  });
});
