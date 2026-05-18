import mongoose from 'mongoose';

/**
 * Customer-support ticket.
 *
 * Created from the public-site widget (registered or guest) and replied
 * to by admins. The conversation lives in `messages` so we don't need
 * a separate collection for what is, in practice, a thin chat.
 *
 * The `email` and `phone` are captured at submission time (or pulled
 * from the user document) so admins can reach the customer outside the
 * app — useful when a non-registered guest opens a ticket.
 */
const messageSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    fromAdmin: { type: Boolean, default: false },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    /** Captured even for registered users so reply-by-email works. */
    name:    { type: String, required: true, trim: true, maxlength: 80 },
    email:   { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
    phone:   { type: String, trim: true, maxlength: 30 },

    /** Optional link back to the user document if signed in. */
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    subject: { type: String, trim: true, maxlength: 160 },
    status:  { type: String, enum: ['open', 'resolved'], default: 'open', index: true },

    messages: [messageSchema],

    /** Cached for fast list rendering — updated on every new message. */
    lastMessage:   { type: String, maxlength: 240 },
    lastMessageAt: { type: Date, default: Date.now, index: true },

    /** IP at submission for abuse triage. */
    ip: String,
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, lastMessageAt: -1 });
supportTicketSchema.index({ email: 1, status: 1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
