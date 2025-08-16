import { useMemo } from 'react'
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay } from 'date-fns'

const ContributionCalendar = ({ contributionData, year = new Date().getFullYear() }) => {
  const calendarData = useMemo(() => {
    // Generate all days of the year
    const startDate = startOfYear(new Date(year, 0, 1))
    const endDate = endOfYear(new Date(year, 11, 31))
    const allDays = eachDayOfInterval({ start: startDate, end: endDate })

    // Create map for quick lookup
    const dataMap = new Map()
    contributionData.forEach(day => {
      dataMap.set(day.date, day)
    })

    // Generate calendar weeks
    const weeks = []
    let currentWeek = []

    allDays.forEach((day, index) => {
      const dayOfWeek = getDay(day)
      
      // Start new week on Sunday
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      
      const dateString = format(day, 'yyyy-MM-dd')
      const dayData = dataMap.get(dateString) || { date: dateString, count: 0, level: 0 }
      
      currentWeek.push(dayData)
      
      // Add last week
      if (index === allDays.length - 1) {
        weeks.push(currentWeek)
      }
    })

    return weeks
  }, [contributionData, year])

  const getContributionColor = (level) => {
    const colors = {
      0: 'bg-gray-100 border-gray-200',
      1: 'bg-green-200 border-green-300',
      2: 'bg-green-400 border-green-500',
      3: 'bg-green-600 border-green-700',
      4: 'bg-green-800 border-green-900'
    }
    return colors[level] || colors[0]
  }

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const totalContributions = contributionData.reduce((sum, day) => sum + day.count, 0)
  const currentStreak = calculateCurrentStreak(contributionData)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {totalContributions} contributions in {year}
          </h3>
          <p className="text-sm text-gray-500">
            Current streak: {currentStreak} days
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-2.5 h-2.5 rounded-sm border ${getContributionColor(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto contribution-calendar">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2">
            <div className="w-8"></div> {/* Space for weekday labels */}
            {months.map((month, index) => (
              <div key={month} className="text-xs text-gray-500 flex-1" style={{ minWidth: '40px' }}>
                {index % 2 === 0 ? month : ''}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex">
            {/* Weekday labels */}
            <div className="flex flex-col space-y-1 mr-2">
              <div className="h-2.5"></div> {/* Spacer */}
              {weekdays.map((day, index) => (
                <div key={day} className="h-2.5 flex items-center text-xs text-gray-500">
                  {index % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            {/* Contribution squares */}
            <div className="flex space-x-1">
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="contribution-week">
                  {week.map((day, dayIndex) => (
                    <div
                      key={day.date}
                      className={`contribution-day ${getContributionColor(day.level)}`}
                      data-level={day.level}
                      title={`${day.count} contributions on ${format(new Date(day.date), 'MMM d, yyyy')}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate current streak
function calculateCurrentStreak(contributionData) {
  if (contributionData.length === 0) return 0

  const sortedData = contributionData
    .filter(day => day.count > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (sortedData.length === 0) return 0

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const day of sortedData) {
    const dayDate = new Date(day.date)
    const diffDays = Math.floor((currentDate - dayDate) / (1000 * 60 * 60 * 24))

    if (diffDays === streak) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

export default ContributionCalendar
