/**
 * Dedicated edit-listing page.
 *
 * The seller reaches this page via:
 *   - Seller dashboard → ✏️ Edit on a listing card
 *   - Their own store page → "Manage" button on each listing
 *
 * Uses the same wizard component as `Sell`, but mounted at a clearly
 * distinct route (`/seller/listing/:id/edit`) so the seller always knows
 * they are editing rather than creating.
 *
 * Sell.jsx reads the `:id` route param to enter edit mode and pre-fill
 * the form from the existing product.
 */
import Sell from './Sell';

export default function EditListing() {
  return <Sell />;
}
