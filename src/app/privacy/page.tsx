"use client";
import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  Camera, 
  Clock, 
  UserCircle, 
  Trash2, 
  Mail, 
  ArrowLeft,
  Eye,
  Lock,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
  Edit,
  Baby,
  Database
} from 'lucide-react';
import styles from './privacy.module.css';

export default function PrivacyPolicy() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sections = [
    { id: 'introduction', label: 'Introduction', icon: ShieldCheck },
    { id: 'collection', label: 'Data We Collect', icon: Database },
    { id: 'usage', label: 'How We Use Data', icon: FileText },
    { id: 'safety', label: 'Safety Features', icon: Lock },
    { id: 'minors', label: 'Protecting Minors', icon: Baby },
    { id: 'sharing', label: 'Data Sharing', icon: Globe },
    { id: 'rights', label: 'Your Rights', icon: CheckCircle },
    { id: 'security', label: 'Security Measures', icon: AlertCircle },
    { id: 'contact', label: 'Contact Us', icon: Mail },
  ];

  return (
    <div className={styles.policyPage}>
      {/* Navigation Header */}
      <header className={styles.policyNav}>
        <div className={`${styles.containerWide} ${styles.navContent}`}>
          <Link href="/" className={styles.navLogo}>
            <span>Ghumante Yuwa</span>
          </Link>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <div className={`${styles.containerWide} ${styles.mainGrid}`}>
        {/* Sidebar Navigation */}
        <aside className={styles.sidebar}>
          <div className={styles.stickyNav}>
            <p className={styles.navTitle}>Quick Navigation</p>
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button 
                  key={section.id} 
                  onClick={() => scrollToSection(section.id)} 
                  className={styles.navItem}
                >
                  <IconComponent size={16} />
                  {section.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {/* Hero Section */}
          <section id="introduction" className={styles.heroSection}>
            <span className={styles.badge}>
              <ShieldCheck size={14} />
              Nepal Privacy Act 2075 Compliant
            </span>
            <h1 className={styles.titleXl}>
              Privacy <span className={styles.redText}>Policy</span>
            </h1>
            <p className={styles.subtitle}>
              Your journey through Nepal, protected with care
            </p>
            <div className={styles.metaInfo}>
              <div className={styles.metaItem}>
                <strong>Last Updated:</strong> February 2, 2026
              </div>
              <div className={styles.metaItem}>
                <strong>Operator:</strong> La Garau Pvt. Ltd.
              </div>
              <div className={styles.metaItem}>
                <strong>Location:</strong> Kathmandu, Nepal
              </div>
            </div>
            <p className={styles.introText}>
              At Ghumante Yuwa, we want you to explore Nepal without worrying about your data. 
              We built this app with a "Privacy First" mindset. This policy explains how we handle 
              your information in accordance with the <strong>Individual Privacy Act (2075)</strong>.
            </p>
          </section>

          {/* Data Collection Section */}
          <section id="collection" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Database className={styles.sectionIcon} />
              <h2>The Data We Collect</h2>
            </div>
            <p className={styles.sectionIntro}>
              We only ask for what we absolutely need to make the game fun and functional.
            </p>

            <div className={styles.cardGrid}>
              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>
                  <UserCircle size={24} />
                </div>
                <h3>Account Information</h3>
                <ul className={styles.detailList}>
                  <li><strong>Google Identity:</strong> We use Google to let you log in safely. We only see your name, email, and profile picture.</li>
                  <li><strong>Date of Birth:</strong> To confirm you are 16 or older and understand our community demographics.</li>
                  <li><strong>Guardian Email (ages 16-17):</strong> Required for minors to ensure parental permission.</li>
                </ul>
              </div>

              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>
                  <MapPin size={24} />
                </div>
                <h3>Location Data (GPS)</h3>
                <ul className={styles.detailList}>
                  <li>Collected <strong>only when the app is open</strong></li>
                  <li>Used to unlock geographic blocks and track exploration</li>
                  <li>Historical data stored to maintain your personal map</li>
                  <li>Never shared in real-time with other users</li>
                </ul>
              </div>

              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>
                  <Camera size={24} />
                </div>
                <h3>Camera Access</h3>
                <ul className={styles.detailList}>
                  <li>Used <strong>only for QR code scanning</strong> at locations</li>
                  <li>We don't capture, store, or transmit photos</li>
                  <li>Permission requested only when you choose to scan</li>
                </ul>
              </div>

              <div className={styles.dataCard}>
                <div className={styles.cardIcon}>
                  <FileText size={24} />
                </div>
                <h3>Technical Data</h3>
                <ul className={styles.detailList}>
                  <li>Device type and operating system version</li>
                  <li>Unique device identifiers for security</li>
                  <li>App usage statistics (anonymized)</li>
                  <li>Used to ensure compatibility and improve performance</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Data Section */}
          <section id="usage" className={styles.section}>
            <div className={styles.sectionHeader}>
              <FileText className={styles.sectionIcon} />
              <h2>How We Use Your Information</h2>
            </div>
            
            <div className={styles.usageGrid}>
              <div className={styles.usageCard}>
                <h4>✓ Core Functionality</h4>
                <p>Authentication, block unlocking, progress tracking, and personal map generation</p>
              </div>
              <div className={styles.usageCard}>
                <h4>✓ Safety & Privacy</h4>
                <p>Implementing 24-hour delays, Private Mode, and minor protection features</p>
              </div>
              <div className={styles.usageCard}>
                <h4>✓ Communication</h4>
                <p>Service updates, security alerts, and support responses</p>
              </div>
              <div className={styles.usageCard}>
                <h4>✓ Legal Compliance</h4>
                <p>Meeting legal requirements and protecting user safety</p>
              </div>
            </div>

            <div className={styles.noDataBox}>
              <AlertCircle size={20} />
              <p><strong>We do NOT use your data for:</strong> Advertising, third-party marketing, or any purpose not explicitly stated here.</p>
            </div>
          </section>

          {/* Safety Features Section */}
          <section id="safety" className={styles.safetySection}>
            <div className={styles.sectionHeader}>
              <Lock className={styles.sectionIcon} style={{ color: '#fff' }} />
              <h2 style={{ color: '#fff' }}>Your Safety: Advanced Protection</h2>
            </div>

            <div className={styles.safetyGrid}>
              <div className={styles.safetyCard}>
                <Clock size={32} className={styles.featureIcon} />
                <h3>24-Hour Security Delay</h3>
                <p>
                  <strong>Your live location is NEVER shown to other people.</strong> Any "path" 
                  or "area" you color on the community map is delayed by 24 hours to prevent 
                  real-time tracking or stalking.
                </p>
              </div>

              <div className={styles.safetyCard}>
                <Eye size={32} className={styles.featureIcon} />
                <h3>Private Mode</h3>
                <p>
                  You can choose to stay completely invisible. In Private Mode, you still unlock 
                  blocks and earn rewards, but your travels won't appear on the public community 
                  map at all.
                </p>
              </div>

              <div className={styles.safetyCard}>
                <Lock size={32} className={styles.featureIcon} />
                <h3>HTTPS Encryption</h3>
                <p>
                  Every connection to Ghumante Yuwa is encrypted using industry-standard 
                  HTTPS/TLS protocols. Your data is protected during transmission.
                </p>
              </div>

              <div className={styles.safetyCard}>
                <Database size={32} className={styles.featureIcon} />
                <h3>Secure Storage</h3>
                <p>
                  We store your data on Google Firebase (Google Cloud Platform) with encryption 
                  at rest, access controls, and regular security audits.
                </p>
              </div>
            </div>
          </section>

          {/* Protecting Minors Section */}
          <section id="minors" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Baby className={styles.sectionIcon} />
              <h2>Special Protections for Minors (Ages 16-17)</h2>
            </div>
            <p className={styles.sectionIntro}>
              In Nepal, individuals under 18 are considered minors. We take extra care to protect young explorers.
            </p>

            <div className={styles.minorProtections}>
              <div className={styles.protectionItem}>
                <CheckCircle className={styles.checkIcon} />
                <div>
                  <h4>Age Verification Required</h4>
                  <p>Users must be <strong>at least 16 years old</strong> to create an account. We verify age through date of birth during registration.</p>
                </div>
              </div>

              <div className={styles.protectionItem}>
                <CheckCircle className={styles.checkIcon} />
                <div>
                  <h4>Parental Consent (Ages 16-17)</h4>
                  <p>If you are between 16 and 17, you must provide a <strong>parent or guardian's email address</strong> during signup. We may contact them to confirm consent.</p>
                </div>
              </div>

              <div className={styles.protectionItem}>
                <CheckCircle className={styles.checkIcon} />
                <div>
                  <h4>Enhanced Privacy by Default</h4>
                  <p>Minor accounts have stricter privacy settings automatically enabled. We collect only the minimum data necessary for basic app functionality.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Sharing Section */}
          <section id="sharing" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Globe className={styles.sectionIcon} />
              <h2>Data Sharing & Disclosure</h2>
            </div>

            <div className={styles.noSellBox}>
              <ShieldCheck size={32} />
              <h3>We Do NOT Sell Your Data</h3>
              <p>
                <strong>We will never sell, rent, lease, or trade your personal information 
                to advertisers or third parties for their marketing purposes.</strong> Your data 
                stays within our secure Firebase (Google Cloud) environment.
              </p>
            </div>

            <h4 className={styles.subsectionTitle}>Limited Sharing Circumstances</h4>
            <div className={styles.sharingList}>
              <div className={styles.sharingItem}>
                <strong>Service Providers:</strong> We use trusted third-party services (Google Firebase, authentication) 
                bound by strict confidentiality agreements. They only use your data to perform services on our behalf.
              </div>
              <div className={styles.sharingItem}>
                <strong>Legal Obligations:</strong> We may disclose information if required by law, court order, 
                or to protect rights, property, or safety.
              </div>
              <div className={styles.sharingItem}>
                <strong>Community Features:</strong> Your username and aggregated stats (e.g., total blocks unlocked) 
                may be visible on leaderboards. Historical location data (delayed 24 hours) appears on the community 
                map unless Private Mode is enabled.
              </div>
            </div>
          </section>

          {/* Your Rights Section */}
          <section id="rights" className={styles.rightsSection}>
            <div className={styles.sectionHeader}>
              <CheckCircle className={styles.sectionIcon} />
              <h2>Your Rights & Choices</h2>
            </div>
            <p className={styles.sectionIntro}>
              Under the Individual Privacy Act, 2075, and our commitment to transparency, you have full control over your data.
            </p>

            <div className={styles.rightsGrid}>
              <div className={styles.rightCard}>
                <Eye size={24} className={styles.rightIcon} />
                <h4>Right to Access</h4>
                <p>Request a copy of all personal information we hold about you at any time.</p>
              </div>

              <div className={styles.rightCard}>
                <Edit size={24} className={styles.rightIcon} />
                <h4>Right to Correction</h4>
                <p>If any information is inaccurate or incomplete, request that we correct or update it.</p>
              </div>

              <div className={styles.rightCard}>
                <Trash2 size={24} className={styles.rightIcon} />
                <h4>Right to Deletion</h4>
                <p>Delete your account and all associated data. We wipe everything within <strong>30 days</strong>.</p>
              </div>

              <div className={styles.rightCard}>
                <Lock size={24} className={styles.rightIcon} />
                <h4>Right to Restrict Processing</h4>
                <p>Request that we limit how we process your data (e.g., enable Private Mode).</p>
              </div>

              <div className={styles.rightCard}>
                <Download size={24} className={styles.rightIcon} />
                <h4>Right to Data Portability</h4>
                <p>Receive your personal data in a structured, machine-readable format (JSON/CSV).</p>
              </div>

              <div className={styles.rightCard}>
                <AlertCircle size={24} className={styles.rightIcon} />
                <h4>Right to Withdraw Consent</h4>
                <p>Withdraw consent at any time. This won't affect lawfulness of prior processing.</p>
              </div>
            </div>

            <div className={styles.deleteAccountBox}>
              <h4>How to Delete Your Account</h4>
              <ol className={styles.deleteSteps}>
                <li>Navigate to <strong>Settings → Account → Delete My Account</strong> in the App, or</li>
                <li>Email us at <strong>support@ghumanteyuwa.com</strong> with subject "Account Deletion Request"</li>
                <li>We'll confirm your identity and process within <strong>30 days</strong></li>
              </ol>
            </div>
          </section>

          {/* Security Section */}
          <section id="security" className={styles.section}>
            <div className={styles.sectionHeader}>
              <AlertCircle className={styles.sectionIcon} />
              <h2>Security Measures</h2>
            </div>

            <div className={styles.securityMeasures}>
              <div className={styles.measureCard}>
                <Lock size={20} />
                <div>
                  <h4>Encryption in Transit</h4>
                  <p>All data transmitted between your device and our servers uses HTTPS/TLS encryption.</p>
                </div>
              </div>
              <div className={styles.measureCard}>
                <Database size={20} />
                <div>
                  <h4>Encryption at Rest</h4>
                  <p>Your data is stored with encryption on Google Cloud Platform's secure infrastructure.</p>
                </div>
              </div>
              <div className={styles.measureCard}>
                <ShieldCheck size={20} />
                <div>
                  <h4>Access Controls</h4>
                  <p>Strict authentication safeguards prevent unauthorized access to your account.</p>
                </div>
              </div>
              <div className={styles.measureCard}>
                <AlertCircle size={20} />
                <div>
                  <h4>Regular Audits</h4>
                  <p>Our infrastructure undergoes regular security audits and vulnerability assessments.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Retention Section */}
          <section id="retention" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Clock className={styles.sectionIcon} />
              <h2>Data Retention</h2>
            </div>

            <div className={styles.retentionInfo}>
              <div className={styles.retentionItem}>
                <h4>Active Accounts</h4>
                <p>We retain your account information and location history for as long as your account remains active.</p>
              </div>
              <div className={styles.retentionItem}>
                <h4>Inactive Accounts</h4>
                <p>If you don't use the app for <strong>2 consecutive years</strong>, we may contact you to confirm whether you wish to keep your account active.</p>
              </div>
              <div className={styles.retentionItem}>
                <h4>After Deletion</h4>
                <p>Upon account deletion, we permanently erase your personal data within <strong>30 days</strong>, except where retention is required by law.</p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className={styles.contactSection}>
            <div className={styles.sectionHeader}>
              <Mail className={styles.sectionIcon} style={{ color: '#fff' }} />
              <h2 style={{ color: '#fff' }}>Contact Us</h2>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '2rem' }}>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out:
            </p>

            <div className={styles.contactCard}>
              <div className={styles.contactItem}>
                <strong>Company:</strong> La Garau Pvt. Ltd.
              </div>
              <div className={styles.contactItem}>
                <strong>Location:</strong> Kathmandu, Nepal
              </div>
              <div className={styles.contactItem}>
                <strong>Email:</strong> <a href="mailto:support@ghumanteyuwa.com">support@ghumanteyuwa.com</a>
              </div>
              <div className={styles.contactItem}>
                <strong>Response Time:</strong> We aim to respond within 7 business days
              </div>
            </div>

            <a href="mailto:support@ghumanteyuwa.com" className={styles.btnPrimary}>
              <Mail size={18} /> Send Us an Email
            </a>
          </section>

          {/* Closing Statement */}
          <section className={styles.closingSection}>
            <h3>Your Trust Matters</h3>
            <p>
              At Ghumante Yuwa, we believe that exploration should be liberating, not invasive. 
              This Privacy Policy is our promise to you: <strong>your journey is yours, and we will protect it.</strong>
            </p>
            <div className={styles.closingEmoji}>
             Explore freely. Your data is safe with us.
            </div>
          </section>

          {/* Legal Footer */}
          <section className={styles.legalFooter}>
            <p className={styles.legalText}>
              <strong>Governing Law:</strong> This Privacy Policy is governed by the laws of Nepal, 
              including the Individual Privacy Act, 2075 (2018). Any disputes shall be resolved in 
              the courts of Kathmandu, Nepal.
            </p>
            <p className={styles.acknowledgment}>
              By creating an account and using Ghumante Yuwa, you acknowledge that you have read, 
              understood, and agree to this Privacy Policy.
            </p>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© {new Date().getFullYear()} La Garau Pvt. Ltd. • Kathmandu, Nepal</p>
          <p className={styles.footerLinks}>
            <Link href="/">Home</Link>
            <span>•</span>
            <Link href="/terms">Terms of Service</Link>
            <span>•</span>
            <Link href="/privacy">Privacy Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}