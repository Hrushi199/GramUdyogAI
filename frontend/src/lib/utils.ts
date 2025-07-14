// Simple utility function for combining class names
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(' ');
}

// Function to get color based on event type
export function getEventTypeColor(type: string): string {
  const colors: { [key: string]: string } = {
    hackathon: 'bg-purple-100 text-purple-800',
    workshop: 'bg-blue-100 text-blue-800',
    competition: 'bg-red-100 text-red-800',
    training: 'bg-green-100 text-green-800',
    meetup: 'bg-orange-100 text-orange-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

// Function to get color based on event status
export function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    ongoing: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
