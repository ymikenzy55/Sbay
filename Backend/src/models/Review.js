import { Schema, model } from 'mongoose';

const reviewSchema = new Schema({
  seller:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  order:    { type: Schema.Types.ObjectId, ref: 'Order' },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  text:     { type: String, required: true, maxlength: 2000 },
}, { timestamps: true });

reviewSchema.index({ seller: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ seller: 1, createdAt: -1 });

export const Review = model('Review', reviewSchema);
