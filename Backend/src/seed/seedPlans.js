import { Plan } from '../models/Plan.js';

/**
 * Seed default subscription plans on first boot. Once present, admins
 * edit pricing/feePct from the admin panel — we don't reseed.
 */
const DEFAULT_PLANS = [
  {
    code: 'free',  name: 'Free',  tag: 'Get started',
    price: 0,    feePct: 7,
    features: ['Up to 5 active listings', 'Basic profile', 'Standard support'],
    sortOrder: 0,
  },
  {
    code: 'plus',  name: 'Plus',  tag: 'Most popular',
    price: 25,   feePct: 5,
    features: ['Up to 50 listings', 'Featured weekly', 'Priority support', 'Verified badge eligibility'],
    highlight: true, sortOrder: 1,
  },
  {
    code: 'pro',   name: 'Pro',   tag: 'For serious sellers',
    price: 75,   feePct: 3,
    features: ['Unlimited listings', 'Top placement', '24/7 support', 'Verified badge', 'Custom store URL'],
    sortOrder: 2,
  },
];

export async function seedPlansIfNeeded() {
  const count = await Plan.countDocuments({});
  if (count > 0) return;
  await Plan.insertMany(DEFAULT_PLANS.map((p) => ({ ...p, active: true })));
  // eslint-disable-next-line no-console
  console.log(`[seed] Inserted ${DEFAULT_PLANS.length} default subscription plans`);
}
