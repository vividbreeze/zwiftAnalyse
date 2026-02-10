import { describe, it, expect, vi, beforeEach } from 'vitest'

// Inline mock with internal state closure
vi.mock('../components/settings/utils', () => {
    const DEFAULT_MOCK_SETTINGS = {
        withingsClientId: 'test-client-id',
        withingsClientSecret: 'test-client-secret',
        withingsAccessToken: null,
        withingsRefreshToken: null,
        withingsTokenExpiresAt: null,
        withingsUserId: null,
        stravaClientId: 'test',
        stravaClientSecret: 'test',
        maxHr: 180,
        restingHr: 60,
        zoneMethod: 'karvonen'
    };

    let mockState = { ...DEFAULT_MOCK_SETTINGS };

    return {
        loadSettings: () => ({ ...mockState }),
        saveSettings: (settings: any) => {
            mockState = { ...mockState, ...settings };
            return true;
        },
        DEFAULT_SETTINGS: { ...DEFAULT_MOCK_SETTINGS },
        // EXPOSE HELPERS directly on the module
        __setMockState: (overrides: any) => {
            mockState = { ...mockState, ...overrides };
        },
        __resetMockState: () => {
            mockState = { ...DEFAULT_MOCK_SETTINGS };
        }
    }
})

// Import the mocked module
import * as settingsUtils from '../components/settings/utils';
import {
    getWithingsAuthUrl,
    isWithingsConnected,
    disconnectWithings,
} from './withings'

// Type safe helper access
const getMockUtils = () => settingsUtils as any;

describe('Withings Service', () => {
    beforeEach(() => {
        // Reset state before each test
        const utils = getMockUtils();
        if (utils.__resetMockState) {
            utils.__resetMockState();
        }
    })

    describe('isWithingsConnected', () => {
        it('should return false when no token is stored', () => {
            expect(isWithingsConnected()).toBe(false)
        })

        it('should return true when access token exists', () => {
            getMockUtils().__setMockState({ withingsAccessToken: 'test-token-123' })
            expect(isWithingsConnected()).toBe(true)
        })
    })

    describe('getWithingsAuthUrl', () => {
        it('should return a valid authorization URL', () => {
            const url = getWithingsAuthUrl()
            expect(url).toBeDefined()
            expect(url).toContain('account.withings.com')
            expect(url).toContain('test-client-id')
            expect(url).toContain('redirect_uri=')
        })

        it('should include required OAuth parameters', () => {
            const url = getWithingsAuthUrl()!
            expect(url).toContain('response_type=code')
            expect(url).toContain('scope=')
            expect(url).toContain('state=')
        })

        it('should return null when no client ID configured', () => {
            getMockUtils().__setMockState({ withingsClientId: '' })
            const url = getWithingsAuthUrl()
            expect(url).toBeNull()
        })
    })

    describe('disconnectWithings', () => {
        it('should clear all Withings tokens', () => {
            // Set initial state
            getMockUtils().__setMockState({
                withingsAccessToken: 'existing-token',
                withingsRefreshToken: 'existing-refresh',
                withingsTokenExpiresAt: 9999999999,
                withingsUserId: 'user-123',
            })

            // Perform action
            disconnectWithings()

            // Check result via loadSettings (public API of the mock)
            const currentSettings = settingsUtils.loadSettings();
            expect(currentSettings.withingsAccessToken).toBeNull()
            expect(currentSettings.withingsRefreshToken).toBeNull()
            expect(currentSettings.withingsTokenExpiresAt).toBeNull()
        })
    })
})
