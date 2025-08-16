import { cn } from '..utils.js'

const Progress = ({ className, value, ...props }) => (
  <div
    className={cn('relative h-4 w-full overflow-hidden rounded-full bg-gray-200', className)}
    {...props}
  >
    <div
      className="h-full w-full flex-1 bg-blue-600 transition-all duration-300"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
)

export { Progress }
