import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true }
  },
  { timestamps: true }
);

wishlistSchema.index({ user: 1, item: 1 }, { unique: true });

export default mongoose.model('Wishlist', wishlistSchema);
