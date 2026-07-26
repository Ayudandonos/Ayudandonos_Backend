import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FoundationBranchStatus, type Foundation } from '@prisma/client';
import {
  getMissingFoundationProfileFields,
  pickBranchLocationForFoundationProfile,
} from '../../src/modules/foundations/foundation-profile.util.ts';

describe('foundation-profile.util location helpers', () => {
  it('lista country/city/department/address cuando faltan en el perfil', () => {
    const foundation = {
      name: 'Fundacion Demo',
      nit: '900',
      category: 'Educacion',
      country: null,
      city: null,
      department: null,
      address: null,
      institutionalEmail: 'a@b.com',
      phone: '300',
      legalRepresentativeName: 'Ana',
      legalRepresentativeDocument: '1',
      mission: 'm',
      vision: 'v',
      description: 'd',
    } as Foundation;

    assert.deepEqual(getMissingFoundationProfileFields(foundation), [
      'country',
      'city',
      'department',
      'address',
    ]);
  });

  it('elige ubicacion de una sede activa completa aunque otra sea placeholder', () => {
    const location = pickBranchLocationForFoundationProfile([
      {
        status: FoundationBranchStatus.ACTIVE,
        name: 'sdd',
        city: 'Cúcuta',
        department: 'Norte de Santander',
        address: 'Calle 13',
        phone: 'Por completar',
        openingHours: 'Por definir',
      },
      {
        status: FoundationBranchStatus.ACTIVE,
        name: 'Sede secundaria',
        city: 'Cúcuta',
        department: 'Norte de Santander',
        address: 'Belisario Betancourt calle 13',
        phone: '3105550101',
        openingHours: 'lunes a viernes',
      },
    ]);

    assert.deepEqual(location, {
      city: 'Cúcuta',
      department: 'Norte de Santander',
      address: 'Belisario Betancourt calle 13',
    });
  });
});
