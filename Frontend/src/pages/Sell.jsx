import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Plus, Check, ArrowRight, ArrowLeft as Back } from 'lucide-react';
import TopBar from '../components/TopBar';
import BottomNav from '../components/BottomNav';
import { sbay } from '../api/client';
import './pages.css';
import './Sell.css';

const STEPS = ['Photos', 'Basic Info', 'Description', 'Preview'];

export default function Sell() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('edit');
  const isEdit = Boolean(editId);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    title: '', price: '', condition: 'Brand New', category: 'Electronics', desc: '',
  });
  const [done, setDone] = useState(false);

  // Pre-fill the form when editing an existing listing.
  useEffect(() => {
    if (!isEdit) return;
    sbay.getProduct(editId).then((p) => {
      if (!p) return;
      setForm({
        title: p.title || '',
        price: p.price ? String(p.price) : '',
        condition: p.condition || 'Brand New',
        category: p.category || 'Electronics',
        desc: p.description || '',
      });
      setPhotos(Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []));
    });
  }, [isEdit, editId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const addPhotoSlot = () =>
    setPhotos((p) => [...p, `https://picsum.photos/seed/${Date.now() + Math.random()}/500`]);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const submit = () => {
    setDone(true);
    setTimeout(() => navigate(isEdit ? '/seller-dashboard' : '/home'), 1600);
  };

  return (
    <div className="page">
      <TopBar showBack title={isEdit ? 'Edit Listing' : 'Create Listing'} showSearch={false} />

      {/* Stepper */}
      <div className="stepper">
        {STEPS.map((s, i) => (
          <div key={s} className={`step ${i <= step ? 'done' : ''}`}>
            <span className="circle">{i < step ? <Check size={14} /> : i + 1}</span>
            <span className="lbl">{s}</span>
          </div>
        ))}
      </div>

      <main className="page-main">
        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            className="card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <>
                <h3 className="page-h2">Add photos</h3>
                <p className="muted" style={{ marginTop: 4 }}>Upload up to 6 clear photos.</p>
                <div className="photo-grid">
                  {photos.map((src, i) => (
                    <div key={i} className="photo" style={{ backgroundImage: `url(${src})` }} />
                  ))}
                  {photos.length < 6 && (
                    <button className="photo add" onClick={addPhotoSlot}>
                      <Camera size={22} />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h3 className="page-h2">Basic info</h3>
                <div className="form-grid">
                  <label>
                    <span>Title</span>
                    <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. iPad Pro 12.9 inch" />
                  </label>
                  <label>
                    <span>Price (GH₵)</span>
                    <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" />
                  </label>
                  <label>
                    <span>Condition</span>
                    <select value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                      <option>Brand New</option><option>Like New</option>
                      <option>Slightly Used</option><option>Used · Fair</option>
                    </select>
                  </label>
                  <label>
                    <span>Category</span>
                    <select value={form.category} onChange={(e) => set('category', e.target.value)}>
                      <option>Electronics</option><option>Fashion</option>
                      <option>Books</option><option>Sports</option><option>Beauty</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="page-h2">Tell buyers more</h3>
                <label className="full">
                  <span>Description</span>
                  <textarea
                    rows={6}
                    value={form.desc}
                    onChange={(e) => set('desc', e.target.value)}
                    placeholder="Share what's special, defects (if any), and pickup options."
                  />
                </label>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="page-h2">Preview</h3>
                <div className="preview-card">
                  <div
                    className="preview-img"
                    style={{ backgroundImage: `url(${photos[0] || 'https://picsum.photos/seed/preview/600'})` }}
                  />
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <h4>{form.title || 'Untitled item'}</h4>
                    <span className="price">GH₵ {Number(form.price || 0).toLocaleString()}</span>
                    <p className="muted" style={{ fontSize: '.85rem' }}>
                      {form.condition} · {form.category}
                    </p>
                    <p style={{ fontSize: '.9rem' }}>{form.desc || 'No description.'}</p>
                  </div>
                </div>
              </>
            )}
          </motion.section>
        </AnimatePresence>

        <div className="step-actions">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={prev}><Back size={16} /> Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={next}>
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={submit}>
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
                {isEdit ? 'Your changes are saved.' : 'Your item is now live on sBay.'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
