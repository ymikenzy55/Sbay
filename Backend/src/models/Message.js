import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chat:   { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:   { type: String, required: true, trim: true, maxlength: 4000 },
    readAt: Date,
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
