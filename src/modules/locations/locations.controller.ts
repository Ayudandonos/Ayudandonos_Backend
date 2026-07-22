import type { Request, Response } from 'express';
import { ApiResponseBuilder } from '../../shared/responses/api.response.js';
import { API_MESSAGES } from '../../shared/constants/messages.constants.js';
import { asyncHandler } from '../../utils/async-handler.util.js';
import { locationsService } from './locations.service.js';
import type {
  CountryIsoParamInput,
  StateIsoParamInput,
} from './locations.validations.js';

export class LocationsController {
  /**
   * Entrada: req/res HTTP.
   * Proceso: Delega el listado de paises al servicio.
   * Salida: Responde 200 con el listado.
   */
  listCountries = asyncHandler(async (_req: Request, res: Response) => {
    const data = await locationsService.listCountries();

    res
      .status(200)
      .json(ApiResponseBuilder.success(data, API_MESSAGES.LOCATIONS_COUNTRIES_SUCCESS));
  });

  /**
   * Entrada: req con countryIso; res HTTP.
   * Proceso: Delega el listado de estados del pais.
   * Salida: Responde 200 con el listado.
   */
  listStates = asyncHandler(async (req: Request, res: Response) => {
    const { countryIso } = req.params as CountryIsoParamInput;
    const data = await locationsService.listStatesByCountry(countryIso);

    res
      .status(200)
      .json(ApiResponseBuilder.success(data, API_MESSAGES.LOCATIONS_STATES_SUCCESS));
  });

  /**
   * Entrada: req con countryIso y stateIso; res HTTP.
   * Proceso: Delega el listado de ciudades del estado.
   * Salida: Responde 200 con el listado.
   */
  listCities = asyncHandler(async (req: Request, res: Response) => {
    const { countryIso, stateIso } = req.params as StateIsoParamInput;
    const data = await locationsService.listCitiesByState(countryIso, stateIso);

    res
      .status(200)
      .json(ApiResponseBuilder.success(data, API_MESSAGES.LOCATIONS_CITIES_SUCCESS));
  });
}

export const locationsController = new LocationsController();
