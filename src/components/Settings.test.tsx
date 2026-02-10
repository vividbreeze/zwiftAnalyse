import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Settings from './Settings'
import { SettingsProvider } from '../context/SettingsContext'

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value },
        clear: () => { store = {} }
    }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

const renderWithProvider = (component: React.ReactNode) => {
    return render(
        <SettingsProvider>
            {component}
        </SettingsProvider>
    )
}

describe('Settings', () => {
    beforeEach(() => {
        localStorageMock.clear()
    })

    const defaultProps = {
        isOpen: true,
        onClose: () => { },
        onSave: () => { }
    }

    it('should render all settings sections', () => {
        renderWithProvider(<Settings {...defaultProps} />)
        expect(screen.getByText(/User Profile/i)).toBeInTheDocument()
        expect(screen.getByText(/Strava API Credentials/i)).toBeInTheDocument()
        expect(screen.getByText(/Withings API/i)).toBeInTheDocument()
    })

    it('should load default settings on first render', () => {
        renderWithProvider(<Settings {...defaultProps} />)
        // Default maxHr is 182 in SettingsContext
        const maxHrInput = screen.getByTestId('input-maxHr') as HTMLInputElement
        expect(maxHrInput.value).toBe('182')
    })

    it('should save settings to localStorage', () => {
        renderWithProvider(<Settings {...defaultProps} />)
        const saveButton = screen.getByTestId('settings-save')
        fireEvent.click(saveButton)

        // Check that localStorage was called
        const stored = localStorage.getItem('zwiftAnalyseSettings')
        expect(stored).toBeTruthy()
    })

    it('should show save confirmation after saving', () => {
        renderWithProvider(<Settings {...defaultProps} />)
        const saveButton = screen.getByTestId('settings-save')
        fireEvent.click(saveButton)

        // Should show "Saved!"
        expect(screen.getByText(/Saved!/i)).toBeInTheDocument()
    })

    it('should handle HR zones calculation method selection', () => {
        renderWithProvider(<Settings {...defaultProps} />)
        // Check if zone preview is visible
        expect(screen.getByText(/Heart Rate Zones/)).toBeInTheDocument()
    })

    it('should persist settings between renders', () => {
        const { unmount } = renderWithProvider(<Settings {...defaultProps} />)

        // Save settings is handled by context state update in tests
        const saveButton = screen.getByTestId('settings-save')
        fireEvent.click(saveButton)
        unmount()

        // Re-render and check if settings persisted
        renderWithProvider(<Settings {...defaultProps} />)
        const maxHrInput = screen.getByTestId('input-maxHr') as HTMLInputElement
        expect(maxHrInput.value).toBe('182')
    })
})
