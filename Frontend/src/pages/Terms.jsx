import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import './Terms.css';

const SELLER_SECTIONS = [
  {
    id: 's1', title: '1. Eligibility',
    body: 'You must be at least 18 years old, or a verified student with a valid school ID, to sell on sBay. Sellers must accurately represent themselves and their location (campus / city). Creating multiple accounts to circumvent a suspension is prohibited and will result in a permanent ban.',
  },
  {
    id: 's2', title: '2. Honest Listings',
    body: 'You may only list items you legally own and have the right to sell. Descriptions, photographs, condition grades, prices, and stock availability must be accurate and not misleading. Misrepresentation may result in removal of the listing, full refunds to affected buyers, and account suspension.',
  },
  {
    id: 's3', title: '3. Prohibited Items',
    body: 'The following are strictly prohibited on sBay: alcohol, tobacco, drugs and drug paraphernalia, weapons and explosives, counterfeit or fake goods, examination papers and academic dishonesty services, stolen property, hazardous materials, live animals, adult content, and any item illegal under Ghanaian law or applicable regulations.',
  },
  {
    id: 's4', title: '4. Escrow & Platform Fees',
    body: 'When a buyer pays through sBay Escrow, the platform holds funds until the buyer confirms receipt. A platform service fee (configurable by sBay, default 5%) is deducted from each completed escrow transaction before funds are released to you. Cash-on-meetup transactions are not protected by sBay Escrow, and sBay assumes no liability for such transactions.',
  },
  {
    id: 's5', title: '5. Fulfilment & Cancellations',
    body: 'You agree to honour confirmed orders within 48 hours of payment, or within any mutually agreed timeline communicated to the buyer. Repeated cancellations, non-fulfilment, or ghosting buyers will result in lower seller ratings, listing removal, and potential account suspension.',
  },
  {
    id: 's6', title: '6. Meet-up Safety',
    body: "sBay strongly recommends all physical exchanges occur in public, well-lit campus or community locations during daylight hours. You assume full responsibility for in-person interactions. sBay is not liable for any incidents that occur outside the platform's escrow or chat systems.",
  },
  {
    id: 's7', title: '7. Disputes & Refunds',
    body: "Disputes are reviewed by sBay's Resolution Team on a case-by-case basis. You agree to co-operate fully, including providing chat logs, photos, proof of shipment, and any other requested evidence within 48 hours of a dispute being raised. Refund decisions made by sBay within the platform are binding.",
  },
  {
    id: 's8', title: '8. Ratings & Community Guidelines',
    body: "Buyers may rate and review your store after a completed transaction. You may not attempt to retaliate against, harass, or pressure buyers for positive reviews. Hate speech, discrimination, harassment, scam attempts, and spam are not tolerated and will lead to immediate and permanent account termination.",
  },
  {
    id: 's9', title: '9. Taxes',
    body: "You are solely responsible for any income taxes, VAT, or levies owed on your sales earnings. sBay does not withhold or remit taxes on your behalf. We recommend consulting a tax professional if you are unsure of your obligations.",
  },
  {
    id: 's10', title: '10. Account Suspension & Termination',
    body: "sBay reserves the right to suspend or permanently terminate accounts that violate these terms, post fraudulent or prohibited listings, or pose a risk to the community or platform integrity. You may close your account at any time; however, transactional history will be retained for legal compliance and dispute resolution purposes.",
  },
];

const PRIVACY_SECTIONS = [
  {
    id: 'p1', title: 'What We Collect',
    body: 'We collect the information you provide when creating an account: name, email address, phone number, and location. For sellers, we also collect store name, bio, and business registration details. For student verification, we collect your student ID photograph and university name. For transactions, we retain order history, chat messages, and payment metadata. We do not store full card numbers — only the last 4 digits and card brand for display.',
  },
  {
    id: 'p2', title: 'How We Use Your Information',
    body: 'We use your data to operate the marketplace: verify your identity, display your store and listings to buyers, process orders and escrow, resolve disputes, detect and prevent fraud, and continuously improve the sBay experience. We may send transactional emails (order confirmations, password resets, admin notices). With your consent, we may also send product updates and promotional content, which you can opt out of at any time.',
  },
  {
    id: 'p3', title: 'Who Sees What',
    body: 'Publicly visible on your profile: store name, bio, campus/location, active listings, ratings, and reviews. Visible to buyers you transact with: your name and chat messages. Visible only to sBay administrators: your email, phone number, student ID (during verification), full order history, and any dispute evidence submitted. We never sell your personal data to advertisers or third parties.',
  },
  {
    id: 'p4', title: 'Student ID Handling',
    body: "Your student ID photograph is collected and used solely to verify your campus membership for the seller eligibility check. It is stored with encryption, accessible only to authorised sBay verification staff, and permanently deleted within 30 days of your account closure or upon your written request — whichever occurs first.",
  },
  {
    id: 'p5', title: 'Cookies & Local Storage',
    body: "sBay uses essential browser storage (cookies and localStorage) to keep you signed in, remember your cart, and store your preferences. We use minimal, anonymised analytics to count page views and improve performance. We do not use cross-site tracking cookies or third-party advertising networks.",
  },
  {
    id: 'p6', title: 'Your Rights',
    body: "You have the right to access, correct, or export your personal data at any time. You may also request deletion of your account by emailing privacy@sbay.gh. Account deletion anonymises all personally identifiable information in our records, but does not erase transactional history which is retained for legal compliance.",
  },
  {
    id: 'p7', title: 'Data Retention',
    body: 'Data associated with active accounts is retained while the account exists. Upon account closure, all PII (name, email, phone, ID photos) is anonymised within 7 days. Transactional records (orders, payments, disputes) are retained for 7 years for accounting and legal compliance purposes.',
  },
  {
    id: 'p8', title: 'Security',
    body: 'All passwords are hashed using bcrypt with a high cost factor — they are never stored in plain text. All data is transmitted over HTTPS with TLS encryption. We follow industry best practices for access control and security. No system is 100% secure, so we encourage you to use a strong, unique password and enable any available security features.',
  },
  {
    id: 'p9', title: 'Contact Us',
    body: "For privacy-related questions, data requests, or to exercise your rights, contact us at privacy@sbay.gh or through the in-app Customer Support chat on the homepage.",
  },
];

function Accordion({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`terms-section ${open ? 'open' : ''}`}>
      <button className="terms-section-head" onClick={() => setOpen((o) => !o)}>
        <span>{section.title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <p className="terms-section-body">{section.body}</p>}
    </div>
  );
}

export default function Terms() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('seller');

  const sections = tab === 'seller' ? SELLER_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div className="terms-page">
      <div className="terms-topbar">
        <button className="terms-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <h1 className="terms-title">Legal &amp; Policies</h1>
      </div>

      <div className="terms-hero">
        <div className="terms-hero-icon">
          {tab === 'seller' ? <Shield size={32} /> : <Lock size={32} />}
        </div>
        <h2>{tab === 'seller' ? 'sBay Seller Agreement' : 'sBay Privacy Policy'}</h2>
        <p className="terms-hero-sub">Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="terms-tab-row">
        <button
          className={`terms-tab-btn ${tab === 'seller' ? 'active' : ''}`}
          onClick={() => setTab('seller')}
        >
          <Shield size={15} /> Seller Agreement
        </button>
        <button
          className={`terms-tab-btn ${tab === 'privacy' ? 'active' : ''}`}
          onClick={() => setTab('privacy')}
        >
          <Lock size={15} /> Privacy Policy
        </button>
      </div>

      <div className="terms-intro">
        {tab === 'seller' ? (
          <p>
            This Seller Agreement governs your use of sBay as a seller. By becoming a seller on sBay, you confirm that you have read, understood, and agree to be bound by all sections below.
          </p>
        ) : (
          <p>
            This Privacy Policy explains what personal data sBay collects, how we use it, who we share it with, and how we protect it. We are committed to handling your information responsibly and transparently.
          </p>
        )}
      </div>

      <div className="terms-accordion">
        {sections.map((s) => <Accordion key={s.id} section={s} />)}
      </div>

      <div className="terms-footer">
        <p className="muted small" style={{ textAlign: 'center' }}>
          Questions? Contact us at <strong>support@sbay.gh</strong> or use the in-app Support chat on the homepage.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 14, width: '100%' }} onClick={() => navigate(-1)}>
          ← Go Back
        </button>
      </div>
    </div>
  );
}
