import { describe, it, expect } from 'vitest'
import { kebabCase, pascalCase } from '../../src/lib/casing.js'

describe('casing', () => {
  it('should convert kebab case', () => {
    expect(kebabCase('BookingService')).toBe('booking-service')
  })

  it('should convert pascal case', () => {
    expect(pascalCase('booking-service')).toBe('BookingService')
  })

  it('should preserve pascal case when converting', () => {
    expect(pascalCase('BookingService')).toBe('BookingService')
  })
})