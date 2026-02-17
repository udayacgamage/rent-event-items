import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    userName: { type: String, required: true }
  },
  { timestamps: true }
);

reviewSchema.index({ item: 1, user: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
