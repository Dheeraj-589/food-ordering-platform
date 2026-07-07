import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 10000, // 10 seconds global timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if available in client storage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Catch authorization expiry or failures and attempt silent refresh, plus network retries
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 1. Authorization refresh check for 401 status codes
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const url = originalRequest.url || '';

      // If authenticating or refreshing itself fails, clear token and reject immediately
      if (
        url.includes('/auth/refresh') ||
        url.includes('/auth/login') ||
        url.includes('/auth/login/verify') ||
        url.includes('/auth/register/verify')
      ) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        typeof window !== 'undefined' ? localStorage.getItem('auth_refresh_token') : null;
      if (!refreshToken) {
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
        }
        return Promise.reject(error);
      }

      try {
        const refreshBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const response = await axios.post(`${refreshBaseUrl}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', newAccessToken);
          localStorage.setItem('auth_refresh_token', newRefreshToken);
        }

        if (api.defaults.headers.common) {
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        }
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // 2. Intermittent network error or 5xx status retry mechanism
    const isNetworkOr5xx =
      !error.response || (error.response.status >= 500 && error.response.status <= 599);
    if (isNetworkOr5xx) {
      interface RetryConfig {
        __retryCount?: number;
        retry?: number;
        retryDelay?: number;
      }
      const cfg = originalRequest as RetryConfig & typeof originalRequest;
      cfg.__retryCount = cfg.__retryCount || 0;
      const maxRetries = cfg.retry !== undefined ? cfg.retry : 2;
      const retryDelay = cfg.retryDelay !== undefined ? cfg.retryDelay : 1000;

      if (cfg.__retryCount < maxRetries) {
        cfg.__retryCount += 1;
        console.warn(
          `Intermittent network/server error. Retrying request ${originalRequest.url} (Attempt ${cfg.__retryCount}/${maxRetries})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
