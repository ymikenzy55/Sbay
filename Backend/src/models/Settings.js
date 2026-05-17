import mongoose from 'mongoose';

/**
 * Singleton settings document. There is exactly one row, identified
 * by `key: 'global'`. Edited only via the admin panel.
 */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    platformName: { type: String, default: 'sBay' },
    defaultEscrowFeePct: { type: Number, default: 5, min: 0, max: 100 },
    supportEmail: { type: String, default: '' },
    announcement: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

settingsSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) doc = await this.create({ key: 'global' });
  return doc;
};

export const Settings = mongoose.model('Settings', settingsSchema);
