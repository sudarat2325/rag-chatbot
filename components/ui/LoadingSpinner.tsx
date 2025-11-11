interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'orange' | 'blue' | 'green' | 'red';
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'md',
  color = 'orange',
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorClasses = {
    orange: 'border-orange-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
  };

  const spinner = (
    <div className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[color]}`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
          {spinner}
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return spinner;
}

export function LoadingCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}
