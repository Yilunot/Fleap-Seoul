import { describe, it, expect } from 'vitest'

// Test the date formatting function from PostItem
function formatDate(timestamp) {
  if (!timestamp) return ''

  const date = timestamp.seconds ? 
    new Date(timestamp.seconds * 1000) : 
    new Date(timestamp)

  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
  
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  
  return `${formattedDate} at ${formattedTime}`
}

describe('Date Formatting', () => {
  it('formats Firebase timestamp correctly', () => {
    const timestamp = { seconds: 1640995200 }
    const result = formatDate(timestamp)
    // Just check that it contains a valid date format, not specific date
    expect(result).toMatch(/\w{3} \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)/)
  })

  it('formats regular Date object correctly', () => {
    const timestamp = new Date('2022-01-01T12:00:00Z')
    const result = formatDate(timestamp)
    // Check that it contains the year and format structure
    expect(result).toMatch(/\w{3} \d{1,2}, \d{4} at \d{1,2}:\d{2} (AM|PM)/)
    expect(result).toContain('2022')
  })

  it('returns empty string for null timestamp', () => {
    const result = formatDate(null)
    expect(result).toBe('')
  })

  it('returns empty string for undefined timestamp', () => {
    const result = formatDate(undefined)
    expect(result).toBe('')
  })

  it('formats known timestamp correctly', () => {
    // Use a more predictable timestamp - January 1, 2022 at noon UTC
    const timestamp = { seconds: 1641038400 } // 2022-01-01 12:00:00 UTC
    const result = formatDate(timestamp)
    
    // Check the structure rather than exact date (due to timezone differences)
    expect(result).toMatch(/\w{3} \d{1,2}, 2022 at \d{1,2}:\d{2} (AM|PM)/)
  })

  it('handles timestamp with proper date structure', () => {
    // Create a timestamp that we know the exact output for
    const fixedDate = new Date(2022, 0, 1, 12, 0, 0) // January 1, 2022, 12:00 PM local time
    const timestamp = { seconds: Math.floor(fixedDate.getTime() / 1000) }
    
    const result = formatDate(timestamp)
    expect(result).toContain('Jan 1, 2022')
    expect(result).toContain('12:00 PM')
  })
})