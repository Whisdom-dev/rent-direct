import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const StarRating = ({ rating = 0, totalStars = 5, size = 16, className, ...props }) => {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1;
  const emptyStars = totalStars - Math.ceil(rating);

  return (
    <div className={cn("flex items-center", className)} {...props}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={size} className="text-yellow-400 fill-current" />
      ))}
      {partialStar > 0 && (
         <div style={{ position: 'relative', display: 'inline-block' }}>
            <Star size={size} className="text-gray-300" />
            <div style={{ position: 'absolute', top: 0, left: 0, overflow: 'hidden', width: `${partialStar * 100}%` }}>
                <Star size={size} className="text-yellow-400 fill-current" />
            </div>
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} size={size} className="text-gray-300" />
      ))}
    </div>
  );
};

export default StarRating; 