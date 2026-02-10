import { describe, it, expect, vi, beforeEach } from 'vitest'

// We need to test the pure utility functions. Since parseMeasurements, getWeekKey, and avg
// are not exported, we test them indirectly through the exported functions, or test
// the exported credential/connection checking functions.

// Create a mock Settings module with state
const mockSettings: any = {
    withingsClientId: 'test-client-id',
    withingsClientSecret: 'test-client-secret',
    withingsAccessToken: null,
    withingsRefreshToken: null,
    withingsTokenExpiresAt: null,
    withingsUserId: null,
}

const setMockSettings = (overrides: any) => {
    Object.assign(mockSettings, overrides)
}

const resetMockSettings = () => {
    Object.assign(mockSettings, {
        withingsClientId: 'test-client-id',
        withingsClientSecret: 'test-client-secret',
        withingsAccessToken: null,
        withingsRefreshToken: null,
        withingsTokenExpiresAt: null,
        withingsUserId: null,
    })
}

// Mock dependencies
vi.mock('axios')
vi.mock('../components/Settings', () => ({
    loadSettings: () => ({ ...mockSettings }),
    saveSettings: (settings: any) => {
        Object.assign(mockSettings, settings)
        return true
    },
}))

import {
    getWithingsAuthUrl,
    isWithingsConnected,
    disconnectWithings,
} from './withings'

describe('isWithingsConnected', () => {
    beforeEach(() => {
        resetMockSettings()
    })

    it('should return false when no token is stored', () => {
        expect(isWithingsConnected()).toBe(false)
    })

    it('should return true when access token exists', () => {
        setMockSettings({ withingsAccessToken: 'test-token-123' })
        expect(isWithingsConnected()).toBe(true)
    })
})

describe('getWithingsAuthUrl', () => {
    beforeEach(() => {
        resetMockSettings()
    })

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
        setMockSettings({ withingsClientId: '' })
        const url = getWithingsAuthUrl()
        expect(url).toBeNull()
    })
})

describe('disconnectWithings', () => {
    beforeEach(() => {
        setMockSettings({
            withingsAccessToken: 'existing-token',
            withingsRefreshToken: 'existing-refresh',
            withingsTokenExpiresAt: 9999999999,
            withingsUserId: 'user-123',
        })
    })

    it('should clear all Withings tokens', () => {
        disconnectWithings()
        // Check the mockSettings directly since we can't easily access loadSettings
        expect(mockSettings.withingsAccessToken).toBeNull()
        expect(mockSettings.withingsRefreshToken).toBeNull()
        expect(mockSettings.withingsTokenExpiresAt).toBeNull()
        expect(mockSettings.withingsUserId).toBeNull()
    })
})
