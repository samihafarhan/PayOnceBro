import { useState } from 'react';
import StarRating from '../common/StarRating';
import { createRating } from '../../services/ratingService';

/**
 * RatingModal — Modal for rating restaurant or rider after delivery
 * 
 * Props:
 *   - isOpen: boolean - show/hide modal
 *   - orderId: string - order ID for rating
 *   - restaurantId: string (optional) - restaurant ID for restaurant rating
 *   - riderId: string (optional) - rider ID for rider rating
 *   - type: 'restaurant' | 'rider' - rating type
 *   - onClose: function() - callback when modal closes
 *   - onDismiss: function() - callback when user dismisses (✕ button)
 *   - onSubmit: function() - callback after successful submission
 */
const RatingModal = ({
  isOpen,
  orderId,
  restaurantId,
  riderId,
  type = 'restaurant',
  onClose,
  onDismiss,
  onSubmit,
}) => {
  const [score, setScore] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (score === 0) {
      setError('Please select a rating');
      return;
    }

    setIsLoading(true);
    try {
      const ratingData = {
        orderId,
        score,
        reviewText,
      };

      if (type === 'restaurant') {
        ratingData.restaurantId = restaurantId;
        await createRating(ratingData);
      } else if (type === 'rider') {
        ratingData.riderId = riderId;
        await createRating(ratingData);
      }

      console.log(`✅ ${type} rating submitted: ${score}/5`);

      // Mark as submitted to prevent double-submission
      setIsSubmitted(true);

      // Reset form
      setScore(0);
      setReviewText('');

      // Callback after successful submission
      if (onSubmit) {
        onSubmit();
      }

      // Close modal after a short delay to show success message
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1000);
    } catch (err) {
      console.error(`Failed to submit ${type} rating:`, err);
      
      // Handle duplicate rating (409 conflict)
      if (err.message === 'You already rated this delivery before. Thank you!') {
        setError(err.message);
        setIsSubmitted(true);
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 1500);
      } else {
        setError(err?.message || `Failed to submit ${type} rating`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setScore(0);
    setReviewText('');
    setError(null);
    if (onClose) {
      onClose();
    }
  };

  const handleDismiss = () => {
    // Call dismiss callback first, then close modal
    if (onDismiss) {
      onDismiss();
    }
    // Reset form
    setScore(0);
    setReviewText('');
    setError(null);
    setIsSubmitted(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  const title = type === 'restaurant' ? 'Rate Restaurant' : 'Rate Rider';
  const placeholder =
    type === 'restaurant'
      ? 'How was your food? (optional)'
      : 'How was your delivery experience? (optional)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Header with Title and Dismiss Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            {title}
          </h2>
          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              color: '#999',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#d32f2f')}
            onMouseLeave={(e) => (e.target.style.color = '#999')}
            title="Dismiss"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500' }}>
              Rating
            </label>
            <StarRating value={score} onChange={setScore} size="large" />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Click on stars to select your rating, then click Submit below
            </p>
          </div>

          {/* Review Text */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Review (Optional)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={placeholder}
              maxLength={500}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {reviewText.length}/500
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading || isSubmitted}
              style={{
                padding: '10px 20px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: '#f5f5f5',
                cursor: isLoading || isSubmitted ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: isLoading || isSubmitted ? 0.6 : 1,
              }}
            >
              {isSubmitted ? '✅ Done' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading || score === 0 || isSubmitted}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: isSubmitted ? '#4CAF50' : score === 0 ? '#ccc' : '#4CAF50',
                color: 'white',
                cursor: isLoading || score === 0 || isSubmitted ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: isLoading || isSubmitted ? 1 : 1,
              }}
            >
              {isSubmitted ? '✅ Submitted!' : isLoading ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
