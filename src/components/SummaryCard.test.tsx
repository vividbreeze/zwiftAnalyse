import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SummaryCard from './SummaryCard'
import { Activity } from 'lucide-react'

describe('SummaryCard', () => {
    it('should render title and value', () => {
        render(<SummaryCard title="Total Time" value="10.5h" icon={<Activity />} />)
        expect(screen.getByText('Total Time')).toBeInTheDocument()
        expect(screen.getByText('10.5h')).toBeInTheDocument()
    })

    it('should render without tooltip when not provided', () => {
        render(<SummaryCard title="Power" value="200W" icon={<Activity />} />)
        expect(screen.getByText('Power')).toBeInTheDocument()
    })

    it('should render tooltip when provided', () => {
        render(<SummaryCard title="EF" value="1.25" icon={<Activity />} tooltip="Efficiency Factor" />)
        expect(screen.getByText('EF')).toBeInTheDocument()
        // Tooltip is shown on hover (HelpCircle icon should exist)
        const { container } = render(<SummaryCard title="EF" value="1.25" icon={<Activity />} tooltip="Efficiency Factor" />)
        expect(container.querySelector('.cursor-help')).toBeInTheDocument()
    })

    it('should handle string values', () => {
        render(<SummaryCard title="Count" value="42" icon={<Activity />} />)
        expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should render icon component', () => {
        const { container } = render(<SummaryCard title="Test" value="123" icon={<Activity />} />)
        // Icon should be rendered (lucide-react icons render as SVG)
        expect(container.querySelector('svg')).toBeInTheDocument()
    })
})
