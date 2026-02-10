import { vi } from 'vitest';

export const useWithings = vi.fn(() => ({
    connected: false,
    bodyComposition: [],
    latestWeight: null,
    connect: vi.fn()
}));
