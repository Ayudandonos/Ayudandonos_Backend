import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { locationsController } from './locations.controller.js';
import {
  countryIsoParamSchema,
  stateIsoParamSchema,
} from './locations.validations.js';

const locationsRoutes = Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Catalogo jerarquico de ubicaciones (paises, estados, ciudades)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       iso2:
 *                         type: string
 *                         example: CO
 *                       name:
 *                         type: string
 *                         example: Colombia
 *                       phonecode:
 *                         type: string
 *                         nullable: true
 *                       emoji:
 *                         type: string
 *                         nullable: true
 *                       flag:
 *                         type: string
 *                         nullable: true
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

export { locationsRoutes };
