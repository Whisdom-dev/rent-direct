"use client"

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const LeaveReviewForm = ({ propertyId, landlordId, reviewerId, onReviewSubmitted }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a rating.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('reviews')
                .insert({
                    property_id: propertyId,
                    reviewee_id: landlordId,
                    reviewer_id: reviewerId,
                    rating: rating,
                    comment: comment
                });
            
            if (insertError) {
                // The unique constraint error is expected if a user tries to review twice
                if (insertError.code === '23505') { 
                    throw new Error("You have already submitted a review for this property.");
                }
                throw insertError;
            }

            // Reset form and notify parent component
            setComment('');
            setRating(0);
            if (onReviewSubmitted) {
                onReviewSubmitted();
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="font-semibold">Your Rating</label>
                <div className="flex items-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={24}
                            className={cn(
                                "cursor-pointer",
                                (hoverRating >= star || rating >= star) ? "text-yellow-400 fill-current" : "text-gray-300"
                            )}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor="comment" className="font-semibold">Your Review</label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this landlord..."
                    className="mt-2"
                    rows={4}
                />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Review"}
            </Button>
        </form>
    );
};

export default LeaveReviewForm; 