export const APP_CONFIG = {
    REDIRECT_URI: 'http://localhost:5173/',
    STRAVA: {
        AUTH_URL: 'https://www.strava.com/oauth/authorize',
        TOKEN_URL: 'https://www.strava.com/oauth/token',
        API_URL: 'https://www.strava.com/api/v3',
        SCOPE: 'activity:read_all',
    },
    WITHINGS: {
        AUTH_URL: 'https://account.withings.com/oauth2_user/authorize2',
        TOKEN_URL: 'https://wbsapi.withings.net/v2/oauth2',
        MEASURE_URL: 'https://wbsapi.withings.net/measure',
        SCOPE: 'user.metrics,user.info',
    }
};

export const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;
