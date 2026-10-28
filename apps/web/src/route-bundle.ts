import {settings} from './settings';
import {validateRouteBundle as validate} from '../../../server/route-schema';
export type {RouteBundle} from '../../../server/route-schema';
export {requireMetricScale} from '../../../server/route-schema';
export const validateRouteBundle=(value:unknown)=>validate(value,settings.QUATERNION_NORM_TOLERANCE);
