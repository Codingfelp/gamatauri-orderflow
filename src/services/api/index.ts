// External API Service Layer
export { apiRequest, getStoredAuth, setStoredAuth, clearStoredAuth, ApiError, API_BASE } from './client';
export type { ExternalSession, ExternalUser } from './client';

export * as authApi from './auth';
export * as storeApi from './store';
export * as promotionsApi from './promotions';
export * as profileApi from './profile';
export * as addressesApi from './addresses';
export * as ordersApi from './orders';
export * as favoritesApi from './favorites';
export * as couponsApi from './coupons';
export * as shippingApi from './shipping';
