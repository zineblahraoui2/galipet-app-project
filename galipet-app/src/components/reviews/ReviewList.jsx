import ReviewCard from './ReviewCard.jsx'

export default function ReviewList({
  reviews,
  variant = 'ownerToPro',
  showResponseForm = false,
  proDisplayName,
  onReviewPosted,
}) {
  if (!reviews?.length) {
    return <p className="text-sm text-gray-600">No reviews to show yet.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => (
        <ReviewCard
          key={String(r._id)}
          review={r}
          variant={variant}
          showResponseForm={showResponseForm}
          proDisplayName={proDisplayName}
          onReviewPosted={onReviewPosted}
        />
      ))}
    </div>
  )
}
