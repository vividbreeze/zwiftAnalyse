import { describe, it, expect } from 'vitest'
import {
    calculatePerformanceMetrics,
    analyzeOverallProgress,
    estimateZoneDistribution
} from './analysis'
import type { WeeklyStats, HRZones } from '../types'

describe('calculatePerformanceMetrics', () => {
    const mockStats = {
        avgPower: 150,
        avgHeartRate: 140,
        efficiencyFactor: '1.07'
    } as unknown as WeeklyStats

    const mockWeight = {
        weight: 75,
        fatRatio: 18,
        muscleMass: 35
    }

    it('should calculate power-to-weight ratio correctly', () => {
        const metrics = calculatePerformanceMetrics(mockStats, mockWeight, [], [])
        expect(metrics.powerToWeight).toBe('2.00') // 150W / 75kg = 2.00
    })

    it('should return null metrics when no weight data', () => {
        const metrics = calculatePerformanceMetrics(mockStats, null, [], [])
        expect(metrics.powerToWeight).toBeNull()
    })

    it('should return null metrics when no stats', () => {
        const metrics = calculatePerformanceMetrics(null as any, mockWeight, [], [])
        expect(metrics.powerToWeight).toBeNull()
    })

    it('should calculate efficiency per kg', () => {
        const metrics = calculatePerformanceMetrics(mockStats, mockWeight, [], [])
        expect(metrics.efficiencyPerKg).toBeDefined()
        expect(parseFloat(metrics.efficiencyPerKg!)).toBeGreaterThan(0)
    })

    it('should detect weight trend from body composition history', () => {
        const bodyComp = [
            { week: '01/01', weight: 78, fatRatio: 20, muscleMass: 34 },
            { week: '08/01', weight: 76, fatRatio: 19, muscleMass: 34.5 },
            { week: '15/01', weight: 75, fatRatio: 18, muscleMass: 35 }
        ]
        const metrics = calculatePerformanceMetrics(mockStats, mockWeight, bodyComp, [])
        expect(metrics.weightTrend).toBeDefined()
        expect(metrics.weightTrend!.direction).toBe('down')
    })

    it('should generate performance insights', () => {
        const metrics = calculatePerformanceMetrics(mockStats, mockWeight, [], [])
        expect(metrics.performanceInsight).toBeDefined()
        expect(metrics.performanceInsight!.length).toBeGreaterThan(0)
    })
})

describe('analyzeOverallProgress', () => {
    const mockStats = [
        { label: '01/01', avgPower: 100, avgHeartRate: 130, efficiencyFactor: 0.77, totalCalories: 400 },
        { label: '08/01', avgPower: 110, avgHeartRate: 135, efficiencyFactor: 0.81, totalCalories: 450 },
        { label: '15/01', avgPower: 120, avgHeartRate: 138, efficiencyFactor: 0.95, totalCalories: 500 }
    ] as unknown as WeeklyStats[]

    it('should return insufficient data for less than 2 weeks', () => {
        const result = analyzeOverallProgress([mockStats[0]], null, [])
        expect(result.status).toBe('Insufficient Data')
    })

    it('should detect building fitness when EF improves', () => {
        const result = analyzeOverallProgress(mockStats, null, [])
        // EF baseline ~0.79 -> current 0.95 = ~20% improvement > 2% threshold
        expect(result.status).toBe('Building Fitness')
        expect(result.color).toContain('green')
    })

    it('should include weight insight when weight data provided', () => {
        const weightData = { weight: 75 }
        const result = analyzeOverallProgress(mockStats, weightData, [])
        expect(result.weightInsight).toBeDefined()
        expect(result.weightInsight!.current).toBe(75)
    })

    it('should not include weight insight when no weight data', () => {
        const result = analyzeOverallProgress(mockStats, null, [])
        expect(result.weightInsight).toBeNull()
    })
})

describe('estimateZoneDistribution', () => {
    // Zones format matches calculateZones() output — using as HRZones since tests only need min/max
    const zones = {
        z1: { min: 100, max: 120, label: 'Z1' },
        z2: { min: 120, max: 140, label: 'Z2' },
        z3: { min: 140, max: 155, label: 'Z3' },
        z4: { min: 155, max: 170, label: 'Z4' },
        z5: { min: 170, max: 250, label: 'Z5' }
    } as HRZones

    it('should return a distribution that sums to total duration', () => {
        const duration = 60 // minutes
        const distribution = estimateZoneDistribution(135, 155, duration, zones)

        const total = Object.values(distribution!).reduce((sum, val) => sum + val, 0)
        expect(Math.round(total)).toBeCloseTo(duration, 0)
    })

    it('should have primary zone at average HR zone', () => {
        const distribution = estimateZoneDistribution(130, 150, 60, zones)
        // Avg HR 130 is in Z2 (max 140), so Z2 should have significant time
        expect(distribution!.Z2).toBeGreaterThan(0)
    })

    it('should handle edge case of very low HR', () => {
        const distribution = estimateZoneDistribution(100, 110, 60, zones)
        expect(distribution!.Z1).toBeGreaterThan(0)
    })
})
