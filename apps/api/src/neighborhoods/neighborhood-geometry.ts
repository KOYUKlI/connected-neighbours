import { BadRequestException } from '@nestjs/common';

import type {
  GeoJsonPoint,
  GeoJsonPolygon,
  GeoJsonPosition,
} from './schemas/neighborhood.schema';

export const MAX_GEOJSON_BYTES = 100_000;
export const MAX_POLYGON_VERTICES = 500;
const AREA_EPSILON = 1e-12;

export type GeometryValidationResult = {
  area: number;
  center: GeoJsonPoint;
  vertices: number;
};

export function validatePoint(
  point: unknown,
): asserts point is GeoJsonPosition {
  if (!Array.isArray(point) || point.length !== 2) {
    throw new BadRequestException(
      'Un point GeoJSON doit contenir [longitude, latitude].',
    );
  }

  const coordinates = point as unknown[];
  const longitude = coordinates[0];
  const latitude = coordinates[1];
  if (
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new BadRequestException(
      'La longitude doit être un nombre fini compris entre -180 et 180.',
    );
  }
  if (
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new BadRequestException(
      'La latitude doit être un nombre fini compris entre -90 et 90.',
    );
  }
}

export function validateGeoJsonPoint(value: unknown): GeoJsonPoint {
  if (!value || typeof value !== 'object') {
    throw new BadRequestException('Un point GeoJSON est requis.');
  }
  const point = value as Partial<GeoJsonPoint>;
  if (point.type !== 'Point') {
    throw new BadRequestException('Le GeoJSON doit être de type Point.');
  }
  validatePoint(point.coordinates);
  return { type: 'Point', coordinates: [...point.coordinates] };
}

export function validatePolygon(value: unknown): GeometryValidationResult {
  if (serializedSize(value) > MAX_GEOJSON_BYTES) {
    throw new BadRequestException(
      `La géométrie dépasse la limite de ${MAX_GEOJSON_BYTES} octets.`,
    );
  }
  if (!value || typeof value !== 'object') {
    throw new BadRequestException('Une géométrie GeoJSON est requise.');
  }
  const polygon = value as Partial<GeoJsonPolygon>;
  if (polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates)) {
    throw new BadRequestException('Le GeoJSON doit être de type Polygon.');
  }
  if (polygon.coordinates.length === 0) {
    throw new BadRequestException('Le polygone doit contenir un anneau.');
  }

  let vertices = 0;
  polygon.coordinates.forEach((ring, ringIndex) => {
    if (!Array.isArray(ring) || ring.length < 4) {
      throw new BadRequestException(
        'Chaque anneau du polygone doit contenir au moins quatre positions.',
      );
    }
    vertices += ring.length - 1;
    if (vertices > MAX_POLYGON_VERTICES) {
      throw new BadRequestException(
        `Un polygone ne peut pas dépasser ${MAX_POLYGON_VERTICES} sommets.`,
      );
    }
    ring.forEach(validatePoint);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      throw new BadRequestException(
        'Le premier et le dernier point de chaque anneau doivent être identiques.',
      );
    }
    const area = Math.abs(signedArea(ring));
    if (area <= AREA_EPSILON) {
      throw new BadRequestException(
        'Le polygone doit avoir une aire non nulle.',
      );
    }
    if (ringSelfIntersects(ring)) {
      throw new BadRequestException(
        `L’anneau ${ringIndex + 1} du polygone s’auto-intersecte.`,
      );
    }
  });

  const outerArea = Math.abs(signedArea(polygon.coordinates[0]));
  const holesArea = polygon.coordinates
    .slice(1)
    .reduce((sum, ring) => sum + Math.abs(signedArea(ring)), 0);
  const area = outerArea - holesArea;
  if (area <= AREA_EPSILON) {
    throw new BadRequestException(
      'Les anneaux intérieurs ne peuvent pas couvrir toute la zone.',
    );
  }

  return {
    area,
    center: polygonCenter(polygon as GeoJsonPolygon),
    vertices,
  };
}

export function clonePolygon(value: GeoJsonPolygon): GeoJsonPolygon {
  return {
    type: 'Polygon',
    coordinates: value.coordinates.map((ring) =>
      ring.map(([longitude, latitude]) => [longitude, latitude]),
    ),
  };
}

export function pointInsidePolygon(
  point: GeoJsonPosition,
  polygon: GeoJsonPolygon,
): boolean {
  if (!pointInsideRing(point, polygon.coordinates[0])) return false;
  return !polygon.coordinates
    .slice(1)
    .some((hole) => pointInsideRing(point, hole));
}

export function polygonsOverlap(
  left: GeoJsonPolygon,
  right: GeoJsonPolygon,
): boolean {
  const leftRing = left.coordinates[0];
  const rightRing = right.coordinates[0];
  if (!boundingBoxesOverlap(leftRing, rightRing)) return false;

  for (let leftIndex = 0; leftIndex < leftRing.length - 1; leftIndex += 1) {
    for (
      let rightIndex = 0;
      rightIndex < rightRing.length - 1;
      rightIndex += 1
    ) {
      if (
        segmentsCrossStrictly(
          leftRing[leftIndex],
          leftRing[leftIndex + 1],
          rightRing[rightIndex],
          rightRing[rightIndex + 1],
        )
      ) {
        return true;
      }
    }
  }

  return (
    pointInsidePolygon(leftRing[0], right) ||
    pointInsidePolygon(rightRing[0], left)
  );
}

function serializedSize(value: unknown) {
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function signedArea(ring: GeoJsonPosition[]) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function polygonCenter(polygon: GeoJsonPolygon): GeoJsonPoint {
  const ring = polygon.coordinates[0];
  const area = signedArea(ring);
  let longitude = 0;
  let latitude = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    const factor = current[0] * next[1] - next[0] * current[1];
    longitude += (current[0] + next[0]) * factor;
    latitude += (current[1] + next[1]) * factor;
  }
  const divisor = 6 * area;
  return {
    type: 'Point',
    coordinates: [longitude / divisor, latitude / divisor],
  };
}

function ringSelfIntersects(ring: GeoJsonPosition[]) {
  const segmentCount = ring.length - 1;
  for (let first = 0; first < segmentCount; first += 1) {
    for (let second = first + 1; second < segmentCount; second += 1) {
      if (
        second === first + 1 ||
        (first === 0 && second === segmentCount - 1)
      ) {
        continue;
      }
      if (
        segmentsIntersect(
          ring[first],
          ring[first + 1],
          ring[second],
          ring[second + 1],
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function pointInsideRing(point: GeoJsonPosition, ring: GeoJsonPosition[]) {
  let inside = false;
  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index++
  ) {
    const currentPoint = ring[index];
    const previousPoint = ring[previous];
    if (pointOnSegment(point, currentPoint, previousPoint)) return false;
    const intersects =
      currentPoint[1] > point[1] !== previousPoint[1] > point[1] &&
      point[0] <
        ((previousPoint[0] - currentPoint[0]) * (point[1] - currentPoint[1])) /
          (previousPoint[1] - currentPoint[1]) +
          currentPoint[0];
    if (intersects) inside = !inside;
  }
  return inside;
}

function boundingBoxesOverlap(
  left: GeoJsonPosition[],
  right: GeoJsonPosition[],
) {
  const leftBox = boundingBox(left);
  const rightBox = boundingBox(right);
  return !(
    leftBox.maxLongitude <= rightBox.minLongitude ||
    rightBox.maxLongitude <= leftBox.minLongitude ||
    leftBox.maxLatitude <= rightBox.minLatitude ||
    rightBox.maxLatitude <= leftBox.minLatitude
  );
}

function boundingBox(ring: GeoJsonPosition[]) {
  return ring.reduce(
    (box, [longitude, latitude]) => ({
      minLongitude: Math.min(box.minLongitude, longitude),
      maxLongitude: Math.max(box.maxLongitude, longitude),
      minLatitude: Math.min(box.minLatitude, latitude),
      maxLatitude: Math.max(box.maxLatitude, latitude),
    }),
    {
      minLongitude: Number.POSITIVE_INFINITY,
      maxLongitude: Number.NEGATIVE_INFINITY,
      minLatitude: Number.POSITIVE_INFINITY,
      maxLatitude: Number.NEGATIVE_INFINITY,
    },
  );
}

function orientation(
  first: GeoJsonPosition,
  second: GeoJsonPosition,
  third: GeoJsonPosition,
) {
  return (
    (second[0] - first[0]) * (third[1] - first[1]) -
    (second[1] - first[1]) * (third[0] - first[0])
  );
}

function segmentsCrossStrictly(
  firstStart: GeoJsonPosition,
  firstEnd: GeoJsonPosition,
  secondStart: GeoJsonPosition,
  secondEnd: GeoJsonPosition,
) {
  const firstSide = orientation(firstStart, firstEnd, secondStart);
  const secondSide = orientation(firstStart, firstEnd, secondEnd);
  const thirdSide = orientation(secondStart, secondEnd, firstStart);
  const fourthSide = orientation(secondStart, secondEnd, firstEnd);
  return firstSide * secondSide < 0 && thirdSide * fourthSide < 0;
}

function segmentsIntersect(
  firstStart: GeoJsonPosition,
  firstEnd: GeoJsonPosition,
  secondStart: GeoJsonPosition,
  secondEnd: GeoJsonPosition,
) {
  if (segmentsCrossStrictly(firstStart, firstEnd, secondStart, secondEnd)) {
    return true;
  }
  return (
    pointOnSegment(firstStart, secondStart, secondEnd) ||
    pointOnSegment(firstEnd, secondStart, secondEnd) ||
    pointOnSegment(secondStart, firstStart, firstEnd) ||
    pointOnSegment(secondEnd, firstStart, firstEnd)
  );
}

function pointOnSegment(
  point: GeoJsonPosition,
  start: GeoJsonPosition,
  end: GeoJsonPosition,
) {
  if (Math.abs(orientation(start, end, point)) > AREA_EPSILON) return false;
  return (
    point[0] >= Math.min(start[0], end[0]) - AREA_EPSILON &&
    point[0] <= Math.max(start[0], end[0]) + AREA_EPSILON &&
    point[1] >= Math.min(start[1], end[1]) - AREA_EPSILON &&
    point[1] <= Math.max(start[1], end[1]) + AREA_EPSILON
  );
}
