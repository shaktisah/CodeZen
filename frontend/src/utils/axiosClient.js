import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'https://codezen-i3ih.onrender.com',
    withCredentials: true,
    timeout: 60000, // 60 seconds timeout for Render cold starts
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor for handling network errors & Render cold starts with automatic retry
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        if (!config) return Promise.reject(error);

        // Track retry attempts
        config._retryCount = config._retryCount || 0;

        // Check if error is a network error (e.g. Render waking up) or temporary 502/503/504 status
        const isNetworkOrServerError = !error.response || [502, 503, 504].includes(error.response?.status);

        if (isNetworkOrServerError && config._retryCount < 3) {
            config._retryCount += 1;
            const delayMs = config._retryCount * 2000;
            console.warn(`[AxiosClient] Retrying request (${config._retryCount}/3) after ${delayMs}ms due to network/cold-start issue: ${config.url}`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return axiosClient(config);
        }

        return Promise.reject(error);
    }
);

export default axiosClient;



