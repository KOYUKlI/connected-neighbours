import { BadRequestException } from '@nestjs/common';

import {
  pointInsidePolygon,
  polygonsOverlap,
  validateGeoJsonPoint,
  validatePolygon,
} from './neighborhood-geometry';
import type { GeoJsonPolygon } from './schemas/neighborhood.schema';

describe('neighborhood geometry', () => {
  const square = polygon(2.34, 48.85, 2.36, 48.87);

  it('validates a closed polygon and computes a center', () => {
    const result = validatePolygon(square);

    expect(result.center.type).toBe('Point');
    expect(result.vertices).toBe(4);
  });

  it('rejects an open, degenerate or self-intersecting polygon', () => {
    const open = structuredClone(square);
    open.coordinates[0].pop();
    expect(() => validatePolygon(open)).toThrow(BadRequestException);
    expect(() =>
      validatePolygon({
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 1],
            [0, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('validates strict GeoJSON points and coordinate bounds', () => {
    expect(
      validateGeoJsonPoint({ type: 'Point', coordinates: [2.35, 48.86] }),
    ).toEqual({ type: 'Point', coordinates: [2.35, 48.86] });
    expect(() =>
      validateGeoJsonPoint({ type: 'Point', coordinates: [181, 0] }),
    ).toThrow(BadRequestException);
  });

  it('supports inclusion and excludes polygon holes', () => {
    const withHole: GeoJsonPolygon = {
      ...square,
      coordinates: [
        square.coordinates[0],
        [
          [2.345, 48.855],
          [2.355, 48.855],
          [2.355, 48.865],
          [2.345, 48.865],
          [2.345, 48.855],
        ],
      ],
    };
    expect(pointInsidePolygon([2.342, 48.852], withHole)).toBe(true);
    expect(pointInsidePolygon([2.35, 48.86], withHole)).toBe(false);
  });

  it('detects actual overlap but accepts touching boundaries', () => {
    expect(polygonsOverlap(square, polygon(2.35, 48.86, 2.37, 48.88))).toBe(
      true,
    );
    expect(polygonsOverlap(square, polygon(2.36, 48.85, 2.38, 48.87))).toBe(
      false,
    );
  });
});

function polygon(
  minLongitude: number,
  minLatitude: number,
  maxLongitude: number,
  maxLatitude: number,
): GeoJsonPolygon {
  return {
    type: 'Polygon',
    coordinates: [
      [
        [minLongitude, minLatitude],
        [maxLongitude, minLatitude],
        [maxLongitude, maxLatitude],
        [minLongitude, maxLatitude],
        [minLongitude, minLatitude],
      ],
    ],
  };
}
