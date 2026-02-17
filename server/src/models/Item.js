import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, enum: ['marquee', 'canopy', 'stage-setup', 'floral-design', 'lighting', 'catering'] },
    images: { type: [String], default: [] },
    rentalPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    rentedQuantity: { type: Number, default: 0, min: 0 },
    pendingRepairs: { type: Number, default: 0, min: 0 },
    dimensions: { type: String, default: '' },
    material: { type: String, default: '' },
    averageRating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    disabled: { type: Boolean, default: false },
    maintenanceNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

itemSchema.virtual('availableStock').get(function availableStock() {
  return Math.max(this.stockQuantity - this.rentedQuantity - this.pendingRepairs, 0);
});

itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

itemSchema.index({ name: 'text', description: 'text' });
itemSchema.index({ category: 1 });
itemSchema.index({ rentalPrice: 1 });

export default mongoose.model('Item', itemSchema);
