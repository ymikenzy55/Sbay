import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Plus, Check, ArrowRight, ArrowLeft as Back, X, Info,
  Tag, FileText, Image as ImageIcon, DollarSign, Eye,
} from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { sbay } from '../api/client';
import { useAuth } from '../store/AuthContext';
import './pages.css';
import './Sell.css';

/* Wizard steps — note that the listing TITLE comes first. The seller has to
   give the item a name before doing anything else, since the title drives
   defaults (suggested category, suggested condition) on later steps. */
const STEPS = [
  {
    id: 'title',
    label: 'Name',
    icon: Tag,
    title: 'What are you selling?',
    help: 'Start with a clear, specific name. Buyers find listings by title — include brand, model and a key spec (e.g. "Apple iPad Pro 12.9\" — 256GB").',
  },
  {
    id: 'photos',
    label: 'Photos',
    icon: ImageIcon,
    title: 'Add photos',
    help: 'Upload up to 6 clear, well-lit photos. The first photo is your cover image — make it count. Show the front, back, any flaws, and the box if you have it.',
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: DollarSign,
    title: 'Set your price',
    help: 'Set a fair price. You can add a discount price (struck-through "compare at") to highlight a deal. Set stock quantity if you have multiple identical items.',
  },
  {
    id: 'details',
    label: 'Details',
    icon: FileText,
    title: 'Item details',
    help: 'Pick a category and condition, then describe what makes the item special. Mention defects, accessories included, and pickup options.',
  },
  {
    id: 'preview',
    label: 'Preview',
    icon: Eye,
    title: 'Review & publish',
    help: 'Double-check everything below. Tap Publish to make your listing live on sBay.',
  },
];

const DEFAULT_CATEGORIES = [
  'Electronics', 'Fashion', 'Books', 'Sports', 'Beauty',
  'Music', 'Gaming', 'Food', 'Home', 'Other',
];

const CONDITIONS = ['Brand New', 'Like New', 'Slightly Used', 'Used · Fair'];

export default function Sell() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const routeParams = useParams();
  const { user } = useAuth();

  // Edit mode is supported via:
  //   /sell?edit=<id>          (legacy)
  //   /seller/listing/:id/edit (preferred — see EditListing.jsx)
  const editId = routeParams.id || params.get('edit');
  const isEdit = Boolean(editId);

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    title: '',
    price: '',
    discountPrice: '',
    stock: '1',
    condition: 'Brand New',
    category: 'Electronics',
    customCategory: '',
    desc: '',
  });
  const [done, setDone] = useState(false);

  // Pre-fill the form when editing.
  useEffect(() => {
    if (!isEdit) return;
    sbay.getProduct(editId).then((p) => {
      if (!p) return;
      setForm({
        title: p.title || '',
        price: p.price ? String(p.price) : '',
        discountPrice: p.discountPrice ? String(p.discountPrice) : '',
        stock: p.stock ? String(p.stock) : '1',
        condition: p.condition || 'Brand New',
        category: p.category || 'Electronics',
        customCategory: '',
        desc: p.description || '',
      });
      setPhotos(Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []));
    });
  }, [isEdit, editId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addPhotoSlot = () => {
    // In a real app this would open the file picker. For the mock, we add
    // a deterministic-ish placeholder using picsum so the seller can preview.
    setPhotos((p) => [...p, `https://picsum.photos/seed/${Date.now() + Math.random()}/500`]);
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const isCustomCat = form.category === '__custom';

  const canAdvance = () => {
    const id = STEPS[step].id;
    if (id === 'title')   return form.title.trim().length >= 3;
    if (id === 'photos')  return photos.length >= 1;
    if (id === 'pricing') return Number(form.price) > 0;
    if (id === 'details') {
      if (isCustomCat) return form.customCategory.trim().length >= 2;
      return form.category && form.condition;
    }
    return true;
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const submit = () => {
    setDone(true);
    // After publishing, send the seller to their store page so they can see
    // their new listing alongside the old ones, ready to be edited.
    setTimeout(() => {
      const dest = isEdit
        ? '/seller-dashboard'
        : (user?.id ? `/seller/${user.id}` : '/seller-dashboard');
      navigate(dest, { replace: true });
    }, 1600);
  };

  const StepIcon = STEPS[step].icon;
  const finalCategory = isCustomCat ? form.customCategory : form.category;

  return (
    <div className="page">
      <TopBar showBack title={isEdit ? 'Edit Listing' : 'New Listing'} showSearch={false} />

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`step ${i <= step ? 'done' : ''} ${i === step ? 'current' : ''}`}>
            <span className="circle">{i < step ? <Check size={14} /> : i + 1}</span>
            <span className="lbl">{s.label}</span>
          </div>
        ))}
      </div>

      <main className="page-main">
        {/* Per-step heading + help banner */}
        <div className="sell-step-head">
          <div className="sell-step-ic"><StepIcon size={20} /></div>
          <div>
            <h2 className="sell-step-title">{STEPS[step].title}</h2>
            <p className="sell-step-help">
              <Info size={13} /> {STEPS[step].help}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* 1. TITLE — must come first */}
            {STEPS[step].id === 'title' && (
              <label className="full">
                <span>Listing name</span>
                <input
                  className="sell-title-input"
                  autoFocus
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder='e.g. Apple iPad Pro 12.9" — 256GB Wi-Fi'
                />
                <p className="muted small" style={{ marginTop: 8 }}>
                  At least 3 characters. You can change this later.
                </p>
              </label>
            )}

            {/* 2. PHOTOS */}
            {STEPS[step].id === 'photos' && (
              <>
                <div className="photo-grid">
                  {photos.map((src, i) => (
                    <div key={i} className="photo" style={{ backgroundImage: `url(${src})` }}>
                      {i === 0 && <span className="photo-badge">Cover</span>}
                      <button
                        type="button"
                        className="photo-remove"
                        onClick={() => removePhoto(i)}
                        aria-label="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {photos.length < 6 && (
                    <button type="button" className="photo add" onClick={addPhotoSlot}>
                      <Camera size={22} />
                      <span>Add photo</span>
                    </button>
                  )}
                </div>
                <p className="muted small" style={{ marginTop: 10 }}>
                  {photos.length} of 6 photos added. Tap a photo's × to remove it.
                </p>
              </>
            )}

            {/* 3. PRICING */}
            {STEPS[step].id === 'pricing' && (
              <div className="form-grid">
                <label>
                  <span>Main price (GH₵) *</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="0.00"
                  />
                </label>
                <label>
                  <span>Discount / compare-at price</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={form.discountPrice}
                    onChange={(e) => set('discountPrice', e.target.value)}
                    placeholder="Optional, e.g. 5,000"
                  />
                  <p className="muted small" style={{ marginTop: 4 }}>
                    Shows as a struck-through price next to the main price.
                  </p>
                </label>
                <label>
                  <span>Stock quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={form.stock}
                    onChange={(e) => set('stock', e.target.value)}
                    placeholder="1"
                  />
                  <p className="muted small" style={{ marginTop: 4 }}>
                    How many of this exact item do you have?
                  </p>
                </label>
              </div>
            )}

            {/* 4. DETAILS */}
            {STEPS[step].id === 'details' && (
              <>
                <div className="form-grid">
                  <label>
                    <span>Condition *</span>
                    <select
                      value={form.condition}
                      onChange={(e) => set('condition', e.target.value)}
                    >
                      {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Category *</span>
                    <select
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                    >
                      {DEFAULT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="__custom">+ Add custom category…</option>
                    </select>
                  </label>
                  {isCustomCat && (
                    <label className="full">
                      <span>Custom category name *</span>
                      <input
                        autoFocus
                        value={form.customCategory}
                        onChange={(e) => set('customCategory', e.target.value)}
                        placeholder="e.g. Hostel furniture, Lab coats…"
                      />
                      <p className="muted small" style={{ marginTop: 4 }}>
                        Don't see your category? Add your own — admins may merge it
                        into the catalogue later.
                      </p>
                    </label>
                  )}
                </div>
                <label className="full" style={{ marginTop: 12 }}>
                  <span>Description</span>
                  <textarea
                    rows={6}
                    value={form.desc}
                    onChange={(e) => set('desc', e.target.value)}
                    placeholder="Share what's special, defects (if any), accessories included, and pickup options."
                  />
                </label>
              </>
            )}

            {/* 5. PREVIEW */}
            {STEPS[step].id === 'preview' && (
              <div className="preview-card">
                <div
                  className="preview-img"
                  style={{ backgroundImage: `url(${photos[0] || 'https://picsum.photos/seed/preview/600'})` }}
                />
                <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <h4>{form.title || 'Untitled item'}</h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span className="price">GH₵ {Number(form.price || 0).toLocaleString()}</span>
                    {form.discountPrice && Number(form.discountPrice) > Number(form.price) && (
                      <span className="muted small" style={{ textDecoration: 'line-through' }}>
                        GH₵ {Number(form.discountPrice).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="muted" style={{ fontSize: '.85rem' }}>
                    {form.condition} · {finalCategory} · {form.stock} in stock
                  </p>
                  <p style={{ fontSize: '.9rem' }}>{form.desc || 'No description.'}</p>
                </div>
              </div>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="step-actions">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={prev}><Back size={16} /> Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary"
              style={{ marginLeft: 'auto' }}
              onClick={next}
              disabled={!canAdvance()}
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="btn btn-primary"
              style={{ marginLeft: 'auto' }}
              onClick={submit}
              disabled={!canAdvance()}
            >
              {isEdit ? 'Save Changes' : 'Publish Listing'}
            </button>
          )}
        </div>
      </main>

      <AnimatePresence>
        {done && (
          <motion.div
            className="success-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="success-card"
              initial={{ scale: 0.6 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            >
              <div className="checkmark"><Check size={36} color="#fff" /></div>
              <h3>{isEdit ? 'Listing Updated!' : 'Listing Published!'}</h3>
              <p className="muted">
                {isEdit
                  ? 'Your changes are saved. Heading back to your dashboard…'
                  : 'Taking you to your store so you can manage it…'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
