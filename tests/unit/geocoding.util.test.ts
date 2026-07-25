import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  matchesRequestedLocality,
  shouldRestrictToColombia,
  type NominatimSearchResult,
} from '../../src/modules/locations/geocoding.util.ts';

describe('geocoding.util locality matching', () => {
  it('acepta el resultado de Cucuta y rechaza Bogota para la misma calle', () => {
    const cucuta: NominatimSearchResult = {
      lat: '7.8939',
      lon: '-72.5078',
      display_name: 'Calle 13 #14-20, Cúcuta, Norte de Santander, Colombia',
      address: {
        city: 'Cúcuta',
        state: 'Norte de Santander',
        country: 'Colombia',
      },
    };

    const bogota: NominatimSearchResult = {
      lat: '4.7110',
      lon: '-74.0721',
      display_name: 'Calle 13 #14-20, Bogotá, Colombia',
      address: {
        city: 'Bogotá',
        state: 'Bogotá D.C.',
        country: 'Colombia',
      },
    };

    assert.equal(
      matchesRequestedLocality(cucuta, 'Cúcuta', 'Norte de Santander'),
      true,
    );
    assert.equal(
      matchesRequestedLocality(bogota, 'Cúcuta', 'Norte de Santander'),
      false,
    );
  });

  it('restringe a Colombia cuando el pais esta vacio pero hay ciudad/estado', () => {
    assert.equal(shouldRestrictToColombia(undefined, 'Cúcuta', 'Norte de Santander'), true);
    assert.equal(shouldRestrictToColombia('Colombia', 'Cúcuta', undefined), true);
    assert.equal(shouldRestrictToColombia('Mexico', 'Monterrey', undefined), false);
  });
});
