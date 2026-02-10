import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from './Dashboard'
import type { WeeklyStats } from '../types'
import { SettingsProvider } from '../context/SettingsContext'

// Mock chart components to avoid canvas rendering issues in tests
vi.mock('./charts/PowerHRChart', () => ({
    default: () => <div data-testid="power-hr-chart">PowerHRChart</div>
}))
vi.mock('./charts/EfficiencyChart', () => ({
    default: () => <div data-testid="efficiency-chart">EfficiencyChart</div>
}))
vi.mock('./charts/ZonesChart', () => ({
    default: () => <div data-testid="zones-chart">ZonesChart</div>
}))
vi.mock('./charts/BodyCompChart', () => ({
    default: () => <div data-testid="body-comp-chart">BodyCompChart</div>
}))

// Mock settings utils to prevent "loadSettings is not a function" error
vi.mock('../components/settings/utils', () => ({
    loadSettings: () => ({
        maxHr: 180,
        restingHr: 60,
        weight: 80,
        height: 180,
        dob: '1990-01-01',
        gender: 'male',
        ftp: 200,
        weeksToShow: 6,
        stravaClientId: 'test',
        stravaClientSecret: 'test'
    }),
    saveSettings: vi.fn(),
    DEFAULT_SETTINGS: {}
}))

// Mock custom hooks
vi.mock('../hooks/useWithings', () => ({
    useWithings: () => ({
        connected: false,
        bodyComposition: [],
        latestWeight: null,
        connect: vi.fn()
    })
}))

const mockStats: WeeklyStats[] = [
    {
        label: '30/01',
        timeHours: '5.5',
        avgHeartRate: 142,
        avgPower: 180,
        avgCadence: 85,
        totalCalories: 2500,
        count: 4,
        efficiencyFactor: 1.27,
        zonePcts: { Z1: '10', Z2: '60', Z3: '20', Z4: '8', Z5: '2' },
        zoneDistribution: { Z1: 30, Z2: 180, Z3: 60, Z4: 24, Z5: 6 },
        activities: [],
        improvementTime: '5.2',
        improvementHR: '-1.5'
    } as unknown as WeeklyStats
]

const renderWithProvider = (component: React.ReactNode) => {
    return render(
        <SettingsProvider>
            {component}
        </SettingsProvider>
    )
}

describe('Dashboard', () => {
    it('should render without crashing', () => {
        renderWithProvider(<Dashboard stats={mockStats} />)
        expect(screen.getByText(/Training Dashboard/i)).toBeInTheDocument()
    })

    it('should display weekly stats summary', () => {
        renderWithProvider(<Dashboard stats={mockStats} />)
        // Should show time, power, HR somewhere in the dashboard
        expect(screen.getByText(/5.5/)).toBeInTheDocument() // time hours
    })

    it('should render all chart components', () => {
        renderWithProvider(<Dashboard stats={mockStats} />)
        expect(screen.getByTestId('power-hr-chart')).toBeInTheDocument()
        expect(screen.getByTestId('efficiency-chart')).toBeInTheDocument()
        expect(screen.getByTestId('zones-chart')).toBeInTheDocument()
    })

    it('should show coach assessment section', () => {
        renderWithProvider(<Dashboard stats={mockStats} />)
        expect(screen.getAllByText(/Assessment/i).length).toBeGreaterThan(0)
    })

    it('should handle empty stats gracefully', () => {
        renderWithProvider(<Dashboard stats={[]} />)
        expect(screen.getByText(/Training Dashboard/i)).toBeInTheDocument()
    })
})
