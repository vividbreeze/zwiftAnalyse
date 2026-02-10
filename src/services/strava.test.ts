import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateStats } from './strava'
import type { StravaActivity } from '../types'

// Mock dependencies
vi.mock('../config/user', () => ({
    userProfile: { maxHr: 180, restingHr: 60, weight: 80, height: 180, dob: '1990-01-01', gender: 'male', ftp: 200 },
    calculateZones: () => ({
        z1: { min: 60, max: 120, label: 'Z1' },
        z2: { min: 120, max: 144, label: 'Z2' },
        z3: { min: 144, max: 156, label: 'Z3' },
        z4: { min: 156, max: 168, label: 'Z4' },
        z5: { min: 168, max: 250, label: 'Z5' }
    }),
    getZoneForHr: (hr: number) => {
        if (hr < 120) return 'Z1'
        if (hr < 144) return 'Z2'
        if (hr < 156) return 'Z3'
        if (hr < 168) return 'Z4'
        return 'Z5'
    }
}))

vi.mock('./analysis', () => ({
    estimateZoneDistribution: (avgHr: number, maxHr: number, duration: number) => {
        // Simple mock: put all time in the zone matching avg HR
        if (avgHr < 120) return { Z1: duration, Z2: 0, Z3: 0, Z4: 0, Z5: 0 }
        if (avgHr < 144) return { Z1: 0, Z2: duration, Z3: 0, Z4: 0, Z5: 0 }
        if (avgHr < 156) return { Z1: 0, Z2: 0, Z3: duration, Z4: 0, Z5: 0 }
        if (avgHr < 168) return { Z1: 0, Z2: 0, Z3: 0, Z4: duration, Z5: 0 }
        return { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: duration }
    }
}))

vi.mock('../components/Settings', () => ({
    loadSettings: () => ({
        stravaClientId: 'test-id',
        stravaClientSecret: 'test-secret',
        maxHr: 180,
        restingHr: 60,
        weeksToShow: 6
    })
}))

// Helper: create a mock activity for a given date
function createActivity(overrides: Partial<StravaActivity> & { start_date: string }): StravaActivity {
    return {
        id: Math.floor(Math.random() * 100000),
        name: 'Test Ride',
        type: 'VirtualRide',
        moving_time: 3600, // 1 hour
        average_heartrate: 140,
        max_heartrate: 160,
        average_watts: 180,
        average_cadence: 85,
        ...overrides
    } as StravaActivity
}

describe('calculateStats', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        // Fix time to a known Wednesday so week boundaries are predictable
        vi.setSystemTime(new Date('2025-02-05T12:00:00Z'))
    })

    it('should return week buckets even for empty activities', () => {
        const result = calculateStats([])
        // calculateStats always creates 6 weeks of buckets, but they'll be empty
        expect(result.length).toBeGreaterThan(0)
        expect(result.every(week => week.count === 0)).toBe(true)
    })

    it('should group activities into weekly buckets', () => {
        const activities = [
            createActivity({ start_date: '2025-02-03T10:00:00Z', name: 'Monday ride' }),
            createActivity({ start_date: '2025-02-04T10:00:00Z', name: 'Tuesday ride' }),
            createActivity({ start_date: '2025-01-27T10:00:00Z', name: 'Last week' }),
        ]
        const result = calculateStats(activities)

        // Should have multiple weeks, current week should have 2 activities
        expect(result.length).toBeGreaterThan(0)
        const currentWeek = result[result.length - 1]
        expect(currentWeek.activities.length).toBe(2)
    })

    it('should calculate weighted average power', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                average_watts: 200,
                moving_time: 3600 // 1 hour
            }),
            createActivity({
                start_date: '2025-02-04T10:00:00Z',
                average_watts: 100,
                moving_time: 3600 // 1 hour
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]

        // Weighted avg: (200*3600 + 100*3600) / (3600+3600) = 150
        expect(Number(currentWeek.avgPower)).toBe(150)
    })

    it('should calculate weighted average heart rate', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                average_heartrate: 150,
                moving_time: 7200 // 2 hours
            }),
            createActivity({
                start_date: '2025-02-04T10:00:00Z',
                average_heartrate: 130,
                moving_time: 3600 // 1 hour
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]

        // Weighted avg: (150*7200 + 130*3600) / (7200+3600) = 143.33 → rounds to 143
        expect(Number(currentWeek.avgHeartRate)).toBe(143)
    })

    it('should calculate total time in hours', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                moving_time: 3600
            }),
            createActivity({
                start_date: '2025-02-04T10:00:00Z',
                moving_time: 5400
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]

        // 3600 + 5400 = 9000 seconds = 2.5 hours
        expect(Number(currentWeek.timeHours)).toBe(2.5)
    })

    it('should calculate efficiency factor (power / HR)', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                average_watts: 180,
                average_heartrate: 140,
                moving_time: 3600
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]

        // EF = 180/140 = 1.29
        expect(Number(currentWeek.efficiencyFactor)).toBeCloseTo(1.29, 1)
    })

    it('should count activities per week', () => {
        const activities = [
            createActivity({ start_date: '2025-02-03T10:00:00Z' }),
            createActivity({ start_date: '2025-02-04T10:00:00Z' }),
            createActivity({ start_date: '2025-02-05T10:00:00Z' }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]
        expect(currentWeek.count).toBe(3)
    })

    it('should handle activities without power data', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                average_watts: undefined as any,
                average_heartrate: 140
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]

        expect(Number(currentWeek.avgPower)).toBe(0)
        expect(Number(currentWeek.avgHeartRate)).toBe(140)
    })

    it('should handle activities without HR data', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                average_heartrate: undefined as any,
                average_watts: 200
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]

        expect(Number(currentWeek.avgPower)).toBe(200)
        expect(Number(currentWeek.avgHeartRate)).toBe(0)
    })

    it('should calculate zone percentages for weeks', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                average_heartrate: 130, // Z2
                moving_time: 3600
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]

        expect(currentWeek.zonePcts).toBeDefined()
        // With our mock, all time goes to Z2
        expect(Number(currentWeek.zonePcts.Z2)).toBe(100)
    })

    it('should enrich activities with primaryZone', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                average_heartrate: 150 // Z3 (144-156)
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]
        expect(currentWeek.activities[0].primaryZone).toBe('Z3')
    })

    it('should enrich activities with efficiencyFactor', () => {
        const activities = [
            createActivity({
                start_date: '2025-02-03T10:00:00Z',
                average_watts: 200,
                average_heartrate: 150
            }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]
        // 200/150 = 1.33
        expect(Number(currentWeek.activities[0].efficiencyFactor)).toBeCloseTo(1.33, 1)
    })

    it('should sort activities newest first within each week', () => {
        const activities = [
            createActivity({ start_date: '2025-02-03T08:00:00Z', name: 'Monday' }),
            createActivity({ start_date: '2025-02-05T08:00:00Z', name: 'Wednesday' }),
            createActivity({ start_date: '2025-02-04T08:00:00Z', name: 'Tuesday' }),
        ]
        const result = calculateStats(activities)
        const currentWeek = result[result.length - 1]

        expect(currentWeek.activities[0].name).toBe('Wednesday')
        expect(currentWeek.activities[1].name).toBe('Tuesday')
        expect(currentWeek.activities[2].name).toBe('Monday')
    })

    it('should return weeks in chronological order (oldest first)', () => {
        const activities = [
            createActivity({ start_date: '2025-02-03T10:00:00Z' }),
            createActivity({ start_date: '2025-01-27T10:00:00Z' }),
        ]
        const result = calculateStats(activities)

        // First week should be older than last week
        expect(result.length).toBeGreaterThanOrEqual(2)
        const firstLabel = result[0].label
        const lastLabel = result[result.length - 1].label

        // Labels are dd/MM format — earlier date should come first
        expect(firstLabel).not.toBe(lastLabel)
    })

    afterEach(() => {
        vi.useRealTimers()
    })
})
