import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { locationsController } from './locations.controller.js';
import {
  countryIsoParamSchema,
  geocodeQuerySchema,
  stateIsoParamSchema,
} from './locations.validations.js';

const locationsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Catalogo jerarquico de ubicaciones y geocodificacion estructurada
 */

/**
 * @swagger
 * /locations/countries:
 *   get:
 *     summary: Listar paises
 *     tags: [Locations]
 *     responses:
 *       200:
 *         description: Listado de paises obtenido
 *       503:
 *         description: Proveedor de ubicaciones no disponible o no configurado
 */
locationsRoutes.get('/countries', locationsController.listCountries);

/**
 * @swagger
 * /locations/countries/{countryIso}/states:
 *   get:
 *     summary: Listar estados/departamentos de un pais
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: countryIso
 *         required: true
 *         schema:
 *           type: string
 *           example: CO
 *     responses:
 *       200:
 *         description: Listado de estados obtenido
 *       400:
 *         description: Codigo ISO invalido
 *       503:
 *         description: Proveedor de ubicaciones no disponible
 */
locationsRoutes.get(
  '/countries/:countryIso/states',
  validate(countryIsoParamSchema, 'params'),
  locationsController.listStates,
);

/**
 * @swagger
 * /locations/countries/{countryIso}/states/{stateIso}/cities:
 *   get:
 *     summary: Listar ciudades de un estado
 *     tags: [Locations]
 *     parameters:
 *       - in: path
 *         name: countryIso
 *         required: true
 *         schema:
 *           type: string
 *           example: CO
 *       - in: path
 *         name: stateIso
 *         required: true
 *         schema:
 *           type: string
 *           example: NSA
 *     responses:
 *       200:
 *         description: Listado de ciudades obtenido
 *       400:
 *         description: Codigos ISO invalidos
 *       503:
 *         description: Proveedor de ubicaciones no disponible
 */
locationsRoutes.get(
  '/countries/:countryIso/states/:stateIso/cities',
  validate(stateIsoParamSchema, 'params'),
  locationsController.listCities,
);

/**
 * @swagger
 * /locations/geocode:
 *   get:
 *     summary: Geocodificar direccion estructurada (Nominatim)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: street
 *         schema:
 *           type: string
 *           example: Calle 13 #14-20 Belisario
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *           example: Cucuta
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           example: Norte de Santander
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: Colombia
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Texto libre opcional (solo fallback)
 *     responses:
 *       200:
 *         description: Coordenadas obtenidas
 *       400:
 *         description: Validacion (street sin city/state, etc.)
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Sin match confiable
 *       503:
 *         description: Proveedor de geocoding no disponible
 */
locationsRoutes.get(
  '/geocode',
  authenticate,
  validate(geocodeQuerySchema, 'query'),
  locationsController.geocode,
);

export { locationsRoutes };
