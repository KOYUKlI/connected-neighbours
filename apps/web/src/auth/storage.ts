const TOKEN_KEY = 'cn_access_token';

export const authStorage = {
  getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },
  clearToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  },
};