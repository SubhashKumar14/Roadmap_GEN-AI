import React from 'react';
import { format, startOfYear, endOfYear, eachDayOfInterval, getDay } from 'date-fns';

const ContributionCalendar = ({ data }) => {
  const currentYear = new Date().getFullYear();
  const yearStart = startOfYear(new Date(currentYear, 0, 1));
  const yearEnd = endOfYear(new Date(currentYear, 11, 31));
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  // Create a map for quick data lookup
  const dataMap = new Map();
  data.forEach(item => {
    dataMap.set(item.date, item);
  });

  // Group days by weeks
  const weeks = [];
  let currentWeek = [];

  allDays.forEach((day, index) => {
    const dayOfWeek = getDay(day);
    
    // Start a new week on Sunday
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    const dateString = format(day, 'yyyy-MM-dd');
    const dayData = dataMap.get(dateString);
    
    currentWeek.push({
      date: dateString,
      count: dayData?.count || 0,
      level: dayData?.level || 0
    });
    
    // Add the last week
    if (index === allDays.length - 1) {
      weeks.push(currentWeek);
    }
  });

  const getContributionColor = (level) => {
    const colors = {
      0: 'bg-muted',
      1: 'bg-green-200',
      2: 'bg-green-400', 
      3: 'bg-green-600',
      4: 'bg-green-800'
    };
    return colors[level] || colors[0];
  };

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Learning activity in {currentYear}
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex text-xs text-muted-foreground mb-1">
            {monthLabels.map((month, index) => (
              <div key={month} className="flex-1 text-left" style={{ minWidth: '44px' }}>
                {index % 2 === 0 ? month : ''}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col text-xs text-muted-foreground mr-2">
              <div className="h-3"></div> {/* Spacer for month labels */}
              {dayLabels.map((day, index) => (
                <div key={day} className="h-3 flex items-center" style={{ marginBottom: '2px' }}>
                  {index % 2 === 1 ? day.slice(0, 3) : ''}
                </div>
              ))}
            </div>

            {/* Contribution squares */}
            <div className="flex space-x-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col space-y-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={day.date}
                      className={`contribution-cell ${getContributionColor(day.level)}`}
                      data-level={day.level}
                      title={`${day.count} contributions on ${format(new Date(day.date), 'MMM d, yyyy')}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`contribution-cell ${getContributionColor(level)}`}
                  data-level={level}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionCalendar;
