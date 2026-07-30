import React from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface EventFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  city: string;
  onCityChange: (val: string) => void;
  isFeatured: boolean;
  onFeaturedChange: (val: boolean) => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({
  search,
  onSearchChange,
  city,
  onCityChange,
  isFeatured,
  onFeaturedChange,
}) => {
  return (
    <Card className="flex flex-col md:flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative w-full md:flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search events by name, description, venue..."
          className="input pl-10"
        />
      </div>

      {/* City Filter */}
      <div className="w-full md:w-48">
        <input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="Filter by city..."
          className="input"
        />
      </div>

      {/* Featured Checkbox */}
      <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => onFeaturedChange(e.target.checked)}
            className="w-4 h-4 rounded border-surface-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            Featured Only
          </span>
        </label>
      </div>
    </Card>
  );
};
