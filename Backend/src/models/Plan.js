import mongoose from 'mongoose';

/**
 * Subscription plan for sellers.
 *
 * Editable from the admin panel — both `price` (GH₵/month) and
 * `feePct` (the platform's escrow service fee for sellers on this
 * plan) flow from here to the frontend. Nothing about pricing is
 * hardcoded in the React code.
 */
const planSchema = new mongoose.Schema(
  {
    code:     { type: String, required: true, unique: true, lowercase: true, trim: true }, // 'free' | 'plus' | 'pro' | ...
    name:     { type: String, required: true, trim: true },
    tag:      { type: String, default: '' },
    price:    { type: Number, required: true, min: 0 },     // GH₵ / month
    feePct:   { type: Number, required: true, min: 0, max: 100, default: 5 },
    features: { type: [String], default: [] },
    highlight:{ type: Boolean, default: false },
    active:   { type: Boolean, default: true },
    sortOrder:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Plan = mongoose.model('Plan', planSchema);
