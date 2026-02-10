import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ActivityModal from './ActivityModal'
import type { EnrichedActivity, StravaActivity, ActivityAnalysis, HRZones } from '../types'

const mockZones: HRZones = {
    z1: { min: 60, max: 120, label: 'Z1' },
    z2: { min: 120, max: 144, label: 'Z2' },
    z3: { min: 144, max: 156, label: 'Z3' },
    z4: { min: 156, max: 168, label: 'Z4' },
    z5: { min: 168, max: 250, label: 'Z5' }
}

const mockActivity: EnrichedActivity = {
    id: 123,
    state: 'Active',
    name: 'Morning Ride',
    type: 'Ride',
    start_date: '2025-01-01T10:00:00Z',
    distance: 20000,
    moving_time: 3600,
    elapsed_time: 4000,
    total_elevation_gain: 100,
    average_speed: 25,
    max_speed: 40,
    average_heartrate: 140,
    max_heartrate: 160,
    average_watts: 200,
    primaryZone: 'Z2',
    zonePcts: { Z1: 10, Z2: 60, Z3: 20, Z4: 10, Z5: 0 },
    efficiencyFactor: 1.4,
    totalCalories: 600,
    hasHeartRate: true,
    hasPower: true
} as unknown as EnrichedActivity

const mockDetailedActivity: StravaActivity = {
    ...mockActivity,
    laps: []
} as unknown as StravaActivity

const mockAnalysis: ActivityAnalysis = {
    intervals: [
        { start: 0, end: 600, avgPower: 200, avgHr: 135, efficiency: 1.48 },
        { start: 600, end: 1200, avgPower: 210, avgHr: 145, efficiency: 1.45 }
    ],
    best20min: { start: 600, end: 1800, avgPower: 220, avgHr: 150, efficiency: 1.46 },
    best60min: null,
    // Add feedback which connects to FormatFeedback component
    feedback: 'Good effort on this ride.\nMain focus was Endurance.',
    metrics: {
        zones: {
            distribution: {
                Z1: { minutes: 10, pct: 10 },
                Z2: { minutes: 60, pct: 60 },
                Z3: { minutes: 20, pct: 20 },
                Z4: { minutes: 10, pct: 10 },
                Z5: { minutes: 0, pct: 0 }
            }
        }
    }
} as unknown as ActivityAnalysis

describe('ActivityModal', () => {
    it('should not render when no activity is selected', () => {
        render(
            <ActivityModal
                activity={null}
                detailedActivity={null}
                analysisValues={null}
                loadingDetails={false}
                zones={mockZones}
                onClose={() => { }}
            />
        )
        expect(screen.queryByTestId('activity-modal')).not.toBeInTheDocument()
    })

    it('should render basic activity details', () => {
        render(
            <ActivityModal
                activity={mockActivity}
                detailedActivity={null}
                analysisValues={null}
                loadingDetails={false}
                zones={mockZones}
                onClose={() => { }}
            />
        )
        expect(screen.getByText('Morning Ride')).toBeInTheDocument()
        // Check for summary card values
        expect(screen.getByText('200 W')).toBeInTheDocument()
        expect(screen.getByText('140 bpm')).toBeInTheDocument()
    })

    it('should show loading state', () => {
        render(
            <ActivityModal
                activity={mockActivity}
                detailedActivity={null}
                analysisValues={null}
                loadingDetails={true}
                zones={mockZones}
                onClose={() => { }}
            />
        )
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should render detailed analysis when available', () => {
        render(
            <ActivityModal
                activity={mockActivity}
                detailedActivity={mockDetailedActivity}
                analysisValues={mockAnalysis}
                loadingDetails={false}
                zones={mockZones}
                onClose={() => { }}
            />
        )
        // Should show feedback
        expect(screen.getByTestId('coach-feedback')).toBeInTheDocument()
        expect(screen.getByText(/Good effort/i)).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', () => {
        const onCloseSpy = vi.fn()
        render(
            <ActivityModal
                activity={mockActivity}
                detailedActivity={null}
                analysisValues={null}
                loadingDetails={false}
                zones={mockZones}
                onClose={onCloseSpy}
            />
        )
        // Find close button by test id
        const closeButton = screen.getByTestId('close-modal')
        fireEvent.click(closeButton)
        expect(onCloseSpy).toHaveBeenCalled()
    })
})
