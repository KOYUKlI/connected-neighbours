import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from '../api/client';

export const authStorage = {
  getToken: getAuthToken,
  setToken: setAuthToken,
  clearToken: clearAuthToken,
};
