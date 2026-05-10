import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, GraduationCap, Briefcase, Upload, Shield,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../store/AuthContext';
import './Auth.css';
import './BecomeSeller.css';

const STEPS = ['Details', 'About You', 'Verification', 'Terms'];

export default function BecomeSeller() {
  const navigate = useNavigate();
  const { user, upgradeToSeller } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    storeName: '',
    bio: '',
    isStudent: null, // true | false
    university: '',
    studentId: null, // file
    occupation: '',
    businessReg: '',
    agreed: false,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = () => {
    if (step === 0) return form.storeName.trim().length >= 2;
    if (step === 1) return form.isStudent !== null;
    if (step === 2) {
      return form.isStudent
        ? !!form.studentId && !!form.university
        : !!form.occupation;
    }
    if (step === 3) return form.agreed;
    return true;
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    upgradeToSeller({
      sellerProfile: { ...form, studentId: undefined },
      role: 'seller',
    });
    navigate('/seller-dashboard', { replace: true });
  };

  return (
    <div className="auth-page kente-bg bs-page">
      <button className="auth-back" onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
      <div className="auth-logo"><Logo size="md" /></div>

      <div className="bs-card">
        <header className="bs-head">
          <h2>Become a Seller</h2>
          <p className="lede">A few quick steps to start selling on sBay.</p>
        </header>

        {/* Progress */}
        <div className="bs-progress">
          {STEPS.map((s, i) => (
            <div key={s} className={`bs-step ${i <= step ? 'done' : ''} ${i === step ? 'current' : ''}`}>
              <span className="bs-circle">{i < step ? <Check size={14} /> : i + 1}</span>
              <span className="bs-lbl">{s}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="bs-body"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <>
                <div className="field">
                  <label>Store name</label>
                  <div className="field-input">
                    <input value={form.storeName} onChange={(e) => set('storeName', e.target.value)} placeholder="e.g. Kofi Gadgets" />
                  </div>
                </div>
                <div className="field">
                  <label>Short bio</label>
                  <div className="field-input">
                    <input value={form.bio} onChange={(e) => set('bio', e.target.value)} placeholder="What kind of items do you sell?" />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="muted small">Are you currently a student?</p>
                <div className="role-grid" style={{ marginTop: 10 }}>
                  <button type="button" className={`role-card ${form.isStudent === true ? 'active' : ''}`} onClick={() => set('isStudent', true)}>
                    <GraduationCap size={28} color="#0A7E3E" />
                    <strong>Yes, I'm a student</strong>
                    <span>Verified with student ID</span>
                  </button>
                  <button type="button" className={`role-card ${form.isStudent === false ? 'active' : ''}`} onClick={() => set('isStudent', false)}>
                    <Briefcase size={28} color="#F5A623" />
                    <strong>No, I'm not</strong>
                    <span>Independent seller</span>
                  </button>
                </div>
              </>
            )}

            {step === 2 && form.isStudent && (
              <>
                <div className="field">
                  <label>University</label>
                  <div className="field-input">
                    <input value={form.university} onChange={(e) => set('university', e.target.value)} placeholder="University of Ghana, Legon" />
                  </div>
                </div>
                <div className="field">
                  <label>Upload Student ID</label>
                  <label className="file-drop">
                    <Upload size={22} />
                    <span>{form.studentId?.name || 'Tap to upload (JPG/PNG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => set('studentId', e.target.files?.[0] || null)}
                      hidden
                    />
                  </label>
                  <p className="muted small">Your ID is encrypted and only used for verification.</p>
                </div>
              </>
            )}

            {step === 2 && form.isStudent === false && (
              <>
                <div className="field">
                  <label>Occupation</label>
                  <div className="field-input">
                    <input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="e.g. Trader, Freelancer" />
                  </div>
                </div>
                <div className="field">
                  <label>Business registration (optional)</label>
                  <div className="field-input">
                    <input value={form.businessReg} onChange={(e) => set('businessReg', e.target.value)} placeholder="e.g. RGD certificate number" />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="terms-box">
                  <Shield size={20} color="#0A7E3E" />
                  <h4>sBay Seller Agreement & Privacy Policy</h4>
                  <div className="terms-scroll">
                    <p><strong>1. Honest listings.</strong> You agree to list only items you own and to describe them accurately, including condition, defects, and ownership.</p>
                    <p><strong>2. Prohibited items.</strong> No alcohol, drugs, weapons, counterfeit goods, exam papers, or stolen property. Violations result in suspension.</p>
                    <p><strong>3. Escrow & fees.</strong> When buyers choose escrow, sBay holds funds and releases them to you after the buyer confirms receipt. A 5% service fee applies to escrow transactions.</p>
                    <p><strong>4. Meet-up safety.</strong> For meet-ups, we recommend public, well-lit campus locations. sBay is not responsible for off-platform deals.</p>
                    <p><strong>5. Privacy.</strong> Your phone number, ID, and verification data are encrypted and never sold. We share only your store name, ratings, and listings publicly.</p>
                    <p><strong>6. Disputes.</strong> Disputes are reviewed by sBay's resolution team. You agree to provide evidence (chat logs, photos) when requested.</p>
                    <p><strong>7. Account closure.</strong> sBay reserves the right to suspend accounts that violate these terms or community guidelines.</p>
                  </div>
                  <label className="agree-row">
                    <input type="checkbox" checked={form.agreed} onChange={(e) => set('agreed', e.target.checked)} />
                    <span>I have read and agree to the Seller Agreement and Privacy Policy.</span>
                  </label>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="bs-actions">
          {step > 0 && <button className="btn btn-ghost" onClick={prev}><ArrowLeft size={16} /> Back</button>}
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary" disabled={!canNext()} onClick={next} style={{ marginLeft: 'auto' }}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary" disabled={!canNext()} onClick={finish} style={{ marginLeft: 'auto' }}>
              Agree & Continue <Check size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
