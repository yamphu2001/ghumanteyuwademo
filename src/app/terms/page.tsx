"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  AlertTriangle, 
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
  XCircle,
  Gavel,
  Target,
  TrendingUp,
  Award,
  Users,
  Ban,
  Zap,
  DollarSign,
  Gift,
  Shield,
  Scale,
  BookOpen,
  Building
} from 'lucide-react';
import styles from './terms.module.css';

export default function TermsOfService() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const sections = [
    { id: 'introduction', label: 'Introduction', icon: ShieldCheck },
    { id: 'definitions', label: 'Definitions', icon: BookOpen },
    { id: 'acceptance', label: 'Acceptance', icon: CheckCircle },
    { id: 'eligibility', label: 'Eligibility', icon: UserCircle },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'intellectual-property', label: 'Intellectual Property', icon: Shield },
    { id: 'license', label: 'License to Use', icon: FileText },
    { id: 'safety', label: 'Physical Safety', icon: AlertTriangle },
    { id: 'prohibited', label: 'Prohibited Conduct', icon: XCircle },
    { id: 'location', label: 'Location Accuracy', icon: MapPin },
    { id: 'community', label: 'Community Mode', icon: Users },
    { id: 'cheating', label: 'Anti-Cheating', icon: Ban },
    { id: 'points', label: 'Points System', icon: TrendingUp },
    { id: 'rewards', label: 'Rewards', icon: Gift },
    { id: 'gambling', label: 'Non-Gambling', icon: DollarSign },
    { id: 'sponsors', label: 'Sponsors', icon: Building },
    { id: 'minors', label: 'Minors', icon: UserCircle },
    { id: 'privacy', label: 'Privacy Reference', icon: Eye },
    { id: 'disclaimer', label: 'Service Disclaimer', icon: AlertCircle },
    { id: 'liability', label: 'Limitation of Liability', icon: Shield },
    { id: 'indemnification', label: 'Indemnification', icon: Scale },
    { id: 'termination', label: 'Termination', icon: Trash2 },
    { id: 'modifications', label: 'Modifications', icon: FileText },
    { id: 'governing-law', label: 'Governing Law', icon: Gavel },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  return (
    <div className={styles.termsPage}>
      {/* Navigation Header */}
      <header className={styles.termsNav}>
        <div className={`${styles.containerWide} ${styles.navContent}`}>
          <Link href="/images/Logo/logo.png" className={styles.navLogo}>
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
            <p className={styles.navTitle}>Navigation</p>
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
              <Gavel size={14} />
              Legally Binding Agreement
            </span>
            <h1 className={styles.titleXl}>
              Terms and <span className={styles.redText}>Conditions</span>
            </h1>
            <p className={styles.subtitle}>
              Your rights, responsibilities, and legal agreement
            </p>
            <div className={styles.metaInfo}>
              <div className={styles.metaItem}>
                <strong>Last Updated:</strong> February 2, 2026
              </div>
              <div className={styles.metaItem}>
                <strong>Effective Date:</strong> February 2, 2026
              </div>
              <div className={styles.metaItem}>
                <strong>Operator:</strong> La Garau Pvt. Ltd.
              </div>
            </div>
            <div className={styles.warningBox}>
              <AlertTriangle size={24} />
              <div>
                <h3>Important Notice</h3>
                <p>
                  By creating an account, clicking "I Agree", or using the App in any capacity, you acknowledge 
                  that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. 
                  <strong> If you do not agree to these Terms, you must immediately cease using the App and delete your account.</strong>
                </p>
              </div>
            </div>
          </section>

          {/* Definitions */}
          <section id="definitions" className={styles.section}>
            <div className={styles.sectionHeader}>
              <BookOpen className={styles.sectionIcon} />
              <h2>1. Definitions & Interpretation</h2>
            </div>
            <p className={styles.sectionIntro}>
              The following terms have specific meanings throughout this agreement:
            </p>

            <div className={styles.definitionGrid}>
              <div className={styles.definitionCard}>
                <h4>"App" / "Service"</h4>
                <p>The Ghumante Yuwa mobile application, including all features, content, and functionality.</p>
              </div>
              <div className={styles.definitionCard}>
                <h4>"User"</h4>
                <p>Any individual who creates an account or accesses the App.</p>
              </div>
              <div className={styles.definitionCard}>
                <h4>"Minor"</h4>
                <p>Any individual under 18 years of age as defined by Nepalese law.</p>
              </div>
              <div className={styles.definitionCard}>
                <h4>"Guardian"</h4>
                <p>A parent or legal guardian who has provided consent for a Minor's use of the App.</p>
              </div>
              <div className={styles.definitionCard}>
                <h4>"Sponsor"</h4>
                <p>A third-party business that provides rewards or benefits to Users through the App.</p>
              </div>
              <div className={styles.definitionCard}>
                <h4>"Points"</h4>
                <p>Non-monetary, non-transferable virtual credits earned through exploration. Points have no cash value.</p>
              </div>
              <div className={styles.definitionCard}>
                <h4>"Community Mode"</h4>
                <p>Feature allowing anonymized and delayed exploration data to be displayed on the public map.</p>
              </div>
              <div className={styles.definitionCard}>
                <h4>"Private Mode"</h4>
                <p>Setting that prevents User's exploration activity from appearing on the community map.</p>
              </div>
            </div>
          </section>

          {/* Acceptance */}
          <section id="acceptance" className={styles.section}>
            <div className={styles.sectionHeader}>
              <CheckCircle className={styles.sectionIcon} />
              <h2>2. Acceptance of Terms</h2>
            </div>

            <div className={styles.acceptanceBox}>
              <h3>Binding Agreement</h3>
              <p>These Terms form a binding legal contract. This agreement becomes effective upon:</p>
              <ul className={styles.checkList}>
                <li><CheckCircle size={18} /> Creating an account in the App</li>
                <li><CheckCircle size={18} /> Clicking "I Agree", "Accept", or similar button</li>
                <li><CheckCircle size={18} /> Accessing or using any feature of the App</li>
                <li><CheckCircle size={18} /> Continued use after Terms are updated</li>
              </ul>
            </div>

            <div className={styles.requirementBox}>
              <XCircle size={24} className={styles.warningIcon} />
              <div>
                <h4>You Cannot Use the App Unless You Accept These Terms</h4>
                <p>If you disagree with any provision, you must refrain from creating an account, immediately cease using the App, and delete your account if already created.</p>
              </div>
            </div>
          </section>

          {/* Eligibility */}
          <section id="eligibility" className={styles.section}>
            <div className={styles.sectionHeader}>
              <UserCircle className={styles.sectionIcon} />
              <h2>3. Eligibility & User Representations</h2>
            </div>

            <div className={styles.eligibilityGrid}>
              <div className={styles.eligibilityCard}>
                <div className={styles.cardNumber}>16+</div>
                <h4>Minimum Age</h4>
                <p>You must be at least 16 years old to use Ghumante Yuwa.</p>
              </div>

              <div className={styles.eligibilityCard}>
                <div className={styles.cardNumber}>16-17</div>
                <h4>Guardian Consent</h4>
                <p>Minors aged 16-17 must have verifiable parental consent and provide guardian email.</p>
              </div>
            </div>

            <h4 className={styles.subsectionTitle}>User Representations</h4>
            <p>By using the App, you represent and warrant that:</p>
            <ul className={styles.representationList}>
              <li>All information you provide is <strong>accurate, current, and complete</strong></li>
              <li>You will use the App only for <strong>lawful purposes</strong></li>
              <li>You have the <strong>legal capacity</strong> to enter into this binding agreement</li>
              <li>You are not prohibited by law from using the App</li>
              <li>You will not violate any terms of this agreement</li>
            </ul>
          </section>

          {/* Account */}
          <section id="account" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Lock className={styles.sectionIcon} />
              <h2>4. Account Registration & Responsibility</h2>
            </div>

            <div className={styles.accountFeatures}>
              <div className={styles.featureItem}>
                <Globe size={20} className={styles.featureIcon} />
                <div>
                  <h4>Google Authentication</h4>
                  <p>We use Google Sign-In for secure authentication. You authorize access to your Google identity information (name, email, profile picture).</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <Lock size={20} className={styles.featureIcon} />
                <div>
                  <h4>Account Security</h4>
                  <p>Your account is personal and may not be shared, sold, or transferred. You're responsible for maintaining confidentiality.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <AlertCircle size={20} className={styles.featureIcon} />
                <div>
                  <h4>Full Responsibility</h4>
                  <p>You are fully responsible for all activities under your account, regardless of authorization.</p>
                </div>
              </div>
            </div>

            <div className={styles.prohibitedBox}>
              <h4>Prohibited Account Practices</h4>
              <ul>
                <li>Creating multiple accounts for the same person</li>
                <li>Sharing account credentials with others</li>
                <li>Selling, trading, or transferring your account</li>
                <li>Using another person's account without permission</li>
                <li>Creating accounts with false information</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section id="intellectual-property" className={styles.ipSection}>
            <div className={styles.sectionHeader}>
              <Shield className={styles.sectionIcon} style={{ color: '#fff' }} />
              <h2 style={{ color: '#fff' }}>5. Intellectual Property Protection</h2>
            </div>

            <div className={styles.ownershipBox}>
              <h3>La Garau Pvt. Ltd. Retains Exclusive Ownership</h3>
              <div className={styles.ownershipGrid}>
                <div className={styles.ownershipItem}>
                  <Target size={24} />
                  <p>Geographic block system & map technology</p>
                </div>
                <div className={styles.ownershipItem}>
                  <TrendingUp size={24} />
                  <p>Points calculation & reward algorithms</p>
                </div>
                <div className={styles.ownershipItem}>
                  <Zap size={24} />
                  <p>Game mechanics & exploration logic</p>
                </div>
                <div className={styles.ownershipItem}>
                  <FileText size={24} />
                  <p>Software code & technical infrastructure</p>
                </div>
                <div className={styles.ownershipItem}>
                  <Award size={24} />
                  <p>Branding, trademarks, & "Ghumante Yuwa" name</p>
                </div>
                <div className={styles.ownershipItem}>
                  <Eye size={24} />
                  <p>UI/UX design & visual elements</p>
                </div>
              </div>
            </div>

            <div className={styles.prohibitedIpBox}>
              <h4>You Expressly Agree NOT To:</h4>
              <div className={styles.prohibitedIpList}>
                <div className={styles.prohibitedItem}>
                  <Ban size={20} />
                  <span>Scrape, extract, or download App data</span>
                </div>
                <div className={styles.prohibitedItem}>
                  <Ban size={20} />
                  <span>Reverse engineer or decompile the App</span>
                </div>
                <div className={styles.prohibitedItem}>
                  <Ban size={20} />
                  <span>Create derivative works or clones</span>
                </div>
                <div className={styles.prohibitedItem}>
                  <Ban size={20} />
                  <span>Copy or redistribute App content</span>
                </div>
              </div>
            </div>
          </section>

          {/* License */}
          <section id="license" className={styles.section}>
            <div className={styles.sectionHeader}>
              <FileText className={styles.sectionIcon} />
              <h2>6. License to Use the App</h2>
            </div>

            <div className={styles.licenseBox}>
              <h4>Limited License Grant</h4>
              <p>
                We grant you a <strong>limited, non-exclusive, non-transferable, revocable license</strong> to 
                access and use the App solely for your personal, non-commercial enjoyment.
              </p>
            </div>

            <div className={styles.restrictionsBox}>
              <h4>This License Does NOT Permit:</h4>
              <ul>
                <li>Commercial use or financial gain</li>
                <li>Sublicensing, renting, or distributing to others</li>
                <li>Modifying or creating derivative works</li>
                <li>Accessing through automated means (bots, scripts)</li>
                <li>Any use violating applicable laws</li>
              </ul>
            </div>
          </section>

          {/* Physical Safety */}
          <section id="safety" className={styles.safetySection}>
            <div className={styles.sectionHeader}>
              <AlertTriangle className={styles.sectionIcon} style={{ color: '#fff' }} />
              <h2 style={{ color: '#fff' }}>7. Physical Safety & Risk Assumption</h2>
            </div>

            <div className={styles.criticalWarning}>
              <AlertTriangle size={32} />
              <h3>CRITICAL SAFETY WARNING</h3>
              <p>
                <strong>YOU ACKNOWLEDGE AND ACCEPT FULL RESPONSIBILITY FOR ALL REAL-WORLD RISKS</strong> associated 
                with using the App, including physical injury, illness, death, accidents, encounters with dangerous 
                individuals or environments, adverse weather, and property damage.
              </p>
            </div>

            <div className={styles.safetyRules}>
              <h4>You MUST:</h4>
              <div className={styles.safetyRulesList}>
                <div className={styles.safetyRule}>
                  <CheckCircle size={20} className={styles.safetyIcon} />
                  <span>Remain aware of your surroundings at all times</span>
                </div>
                <div className={styles.safetyRule}>
                  <CheckCircle size={20} className={styles.safetyIcon} />
                  <span>Obey all traffic laws and pedestrian regulations</span>
                </div>
                <div className={styles.safetyRule}>
                  <CheckCircle size={20} className={styles.safetyIcon} />
                  <span>Avoid restricted, dangerous, or prohibited areas</span>
                </div>
                <div className={styles.safetyRule}>
                  <CheckCircle size={20} className={styles.safetyIcon} />
                  <span>Never use the App while driving or operating machinery</span>
                </div>
                <div className={styles.safetyRule}>
                  <CheckCircle size={20} className={styles.safetyIcon} />
                  <span>Exercise reasonable judgment regarding personal safety</span>
                </div>
              </div>
            </div>

            <div className={styles.noLiabilityBox}>
              <XCircle size={24} />
              <p><strong>La Garau Pvt. Ltd. SHALL NOT BE LIABLE</strong> for any physical injury, death, property damage, or other harm resulting from your use of the App.</p>
            </div>
          </section>

          {/* Prohibited Conduct */}
          <section id="prohibited" className={styles.section}>
            <div className={styles.sectionHeader}>
              <XCircle className={styles.sectionIcon} />
              <h2>8. Prohibited Use & Conduct</h2>
            </div>

            <div className={styles.prohibitedCategories}>
              <div className={styles.prohibitedCategory}>
                <div className={styles.categoryHeader}>
                  <MapPin size={24} className={styles.categoryIcon} />
                  <h4>Trespassing & Restricted Areas</h4>
                </div>
                <ul>
                  <li>Trespassing on private property</li>
                  <li>Entering government or military zones</li>
                  <li>Accessing dangerous locations (construction sites, railways)</li>
                  <li>Violating "No Entry" or restricted area warnings</li>
                </ul>
              </div>

              <div className={styles.prohibitedCategory}>
                <div className={styles.categoryHeader}>
                  <Ban size={24} className={styles.categoryIcon} />
                  <h4>Illegal Activities</h4>
                </div>
                <ul>
                  <li>Participating in illegal gatherings or protests</li>
                  <li>Engaging in any criminal activity</li>
                  <li>Coordinating illegal actions with others</li>
                  <li>Evading law enforcement</li>
                </ul>
              </div>

              <div className={styles.prohibitedCategory}>
                <div className={styles.categoryHeader}>
                  <Users size={24} className={styles.categoryIcon} />
                  <h4>Harassment & Stalking</h4>
                </div>
                <ul>
                  <li>Stalking or surveilling other users</li>
                  <li>Harassing or threatening users</li>
                  <li>Using location data to track individuals</li>
                  <li>Sharing others' personal information</li>
                </ul>
              </div>

              <div className={styles.prohibitedCategory}>
                <div className={styles.categoryHeader}>
                  <AlertTriangle size={24} className={styles.categoryIcon} />
                  <h4>Dangerous Use</h4>
                </div>
                <ul>
                  <li>Using App while driving or cycling</li>
                  <li>Entering hazardous areas (roads, railways, water)</li>
                  <li>Interfering with emergency services</li>
                  <li>Facilitating crimes through the App</li>
                </ul>
              </div>
            </div>

            <div className={styles.enforcementBox}>
              <h4>Enforcement & Consequences</h4>
              <p>Violation may result in: immediate account suspension/termination, forfeiture of points and rewards, legal action, and civil liability for damages.</p>
            </div>
          </section>

          {/* Location Accuracy */}
          <section id="location" className={styles.section}>
            <div className={styles.sectionHeader}>
              <MapPin className={styles.sectionIcon} />
              <h2>9. Location Accuracy Disclaimer</h2>
            </div>

            <div className={styles.disclaimerBox}>
              <AlertCircle size={32} />
              <div>
                <h3>GPS & Location Services Are Not Perfectly Accurate</h3>
                <p>Location data may be affected by device limitations, satellite signal strength, urban environments, weather conditions, and network connectivity.</p>
              </div>
            </div>

            <div className={styles.noGuaranteeGrid}>
              <div className={styles.noGuaranteeItem}>
                <XCircle size={20} />
                <p>No guarantee of coordinate accuracy</p>
              </div>
              <div className={styles.noGuaranteeItem}>
                <XCircle size={20} />
                <p>Blocks may fail to unlock</p>
              </div>
              <div className={styles.noGuaranteeItem}>
                <XCircle size={20} />
                <p>No compensation for GPS errors</p>
              </div>
              <div className={styles.noGuaranteeItem}>
                <XCircle size={20} />
                <p>App may not recognize visits</p>
              </div>
            </div>
          </section>

          {/* Community Mode */}
          <section id="community" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Users className={styles.sectionIcon} />
              <h2>10. Community Mode & User-Generated Data</h2>
            </div>

            <div className={styles.communityModeBox}>
              <h4>When Community Mode is Enabled:</h4>
              <ul className={styles.communityFeatures}>
                <li><Eye size={18} /> Your exploration paths appear on the public map</li>
                <li><Clock size={18} /> All data is <strong>delayed by 24 hours</strong> to prevent real-time tracking</li>
                <li><Shield size={18} /> Data is <strong>anonymized</strong> (not linked to your identity)</li>
                <li><Lock size={18} /> You can disable Community Mode anytime via Private Mode</li>
              </ul>
            </div>

            <div className={styles.licensingBox}>
              <h4>Data License</h4>
              <p>By using Community Mode, you grant us a <strong>perpetual, irrevocable, worldwide, royalty-free license</strong> to display your anonymized exploration data and use aggregated statistics.</p>
            </div>

            <div className={styles.privateModeBox}>
              <Eye size={24} />
              <h4>Private Mode</h4>
              <p>Opt out anytime. In Private Mode, your exploration won't appear on the community map, but you'll continue earning points normally.</p>
            </div>
          </section>

          {/* Anti-Cheating */}
          <section id="cheating" className={styles.cheatingSection}>
            <div className={styles.sectionHeader}>
              <Ban className={styles.sectionIcon} style={{ color: '#fff' }} />
              <h2 style={{ color: '#fff' }}>11. Anti-Cheating & Fair Use Policy</h2>
            </div>

            <div className={styles.cheatingWarning}>
              <Ban size={48} />
              <h3>ZERO TOLERANCE FOR CHEATING</h3>
              <p>The following actions are STRICTLY PROHIBITED and will result in immediate permanent ban:</p>
            </div>

            <div className={styles.cheatingMethods}>
              <div className={styles.cheatingMethod}>
                <Ban size={20} />
                <div>
                  <h5>GPS Spoofing</h5>
                  <p>Using software or hardware to fake your location</p>
                </div>
              </div>
              <div className={styles.cheatingMethod}>
                <Ban size={20} />
                <div>
                  <h5>Mock Locations</h5>
                  <p>Enabling developer options or mock location apps</p>
                </div>
              </div>
              <div className={styles.cheatingMethod}>
                <Ban size={20} />
                <div>
                  <h5>Emulators</h5>
                  <p>Running the App on Android emulators or virtual devices</p>
                </div>
              </div>
              <div className={styles.cheatingMethod}>
                <Ban size={20} />
                <div>
                  <h5>Bots & Automation</h5>
                  <p>Using scripts, macros, or automated tools</p>
                </div>
              </div>
              <div className={styles.cheatingMethod}>
                <Ban size={20} />
                <div>
                  <h5>Modified Apps</h5>
                  <p>Using altered, hacked, or unofficial versions</p>
                </div>
              </div>
              <div className={styles.cheatingMethod}>
                <Ban size={20} />
                <div>
                  <h5>Exploits</h5>
                  <p>Intentionally exploiting bugs or vulnerabilities</p>
                </div>
              </div>
            </div>

            <div className={styles.consequencesBox}>
              <h4>Consequences</h4>
              <p>Immediate account termination, void all points/rewards, device ban, app store reporting, and potential legal action. <strong>All decisions are final and non-negotiable.</strong></p>
            </div>
          </section>

          {/* Points System */}
          <section id="points" className={styles.section}>
            <div className={styles.sectionHeader}>
              <TrendingUp className={styles.sectionIcon} />
              <h2>12. Points System Disclaimer</h2>
            </div>

            <div className={styles.pointsNature}>
              <h3>Points in Ghumante Yuwa:</h3>
              <div className={styles.pointsGrid}>
                <div className={styles.pointsCard}>
                  <XCircle size={24} className={styles.noIcon} />
                  <h4>NOT Money</h4>
                  <p>Virtual credits with no real-world cash value</p>
                </div>
                <div className={styles.pointsCard}>
                  <XCircle size={24} className={styles.noIcon} />
                  <h4>NOT Property</h4>
                  <p>You don't own your points; they're just a record</p>
                </div>
                <div className={styles.pointsCard}>
                  <XCircle size={24} className={styles.noIcon} />
                  <h4>NOT Transferable</h4>
                  <p>Cannot be sold, traded, gifted, or inherited</p>
                </div>
                <div className={styles.pointsCard}>
                  <XCircle size={24} className={styles.noIcon} />
                  <h4>NOT Redeemable</h4>
                  <p>Cannot be exchanged for money under any circumstances</p>
                </div>
              </div>
            </div>

            <div className={styles.adjustmentRights}>
              <h4>Company Rights</h4>
              <p>We reserve the unilateral right to adjust, reduce, increase, or reset points at any time without notice or compensation. Points may be lost due to technical issues with no entitlement to compensation.</p>
            </div>
          </section>

          {/* Rewards */}
          <section id="rewards" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Gift className={styles.sectionIcon} />
              <h2>13. Rewards & Promotions</h2>
            </div>

            <div className={styles.rewardsNature}>
              <h4>Nature of Rewards:</h4>
              <ul className={styles.rewardsList}>
                <li><Gift size={18} /> <strong>Promotional benefits</strong> at Company/Sponsor discretion</li>
                <li><Award size={18} /> <strong>Complimentary</strong> - no purchase or payment required</li>
                <li><AlertCircle size={18} /> <strong>Limited in quantity</strong> and subject to availability</li>
                <li><Target size={18} /> <strong>Discretionary</strong> - may be offered to some but not others</li>
              </ul>
            </div>

            <div className={styles.noGuaranteeBox}>
              <h4>No Guarantees</h4>
              <p>We do NOT guarantee that any specific reward will be available, that you'll qualify for rewards, that sufficient stock exists, or that rewards will meet your expectations. Rewards may be modified, substituted, or discontinued at any time.</p>
            </div>

            <div className={styles.forfeitureBox}>
              <Trash2 size={24} />
              <div>
                <h4>Forfeiture</h4>
                <p>Rewards may be forfeited if your account is terminated, you violate Terms, engage in cheating, or rewards expire. Forfeited rewards will not be replaced.</p>
              </div>
            </div>
          </section>

          {/* Non-Gambling */}
          <section id="gambling" className={styles.gamblingSection}>
            <div className={styles.sectionHeader}>
              <DollarSign className={styles.sectionIcon} />
              <h2>14. Complimentary Benefits (Non-Gambling Clause)</h2>
            </div>

            <div className={styles.noGamblingBox}>
              <CheckCircle size={48} className={styles.successIcon} />
              <h3>Ghumante Yuwa is NOT Gambling</h3>
              <p>The App does not involve monetary stakes, games of chance for money, paid entries, or any financial consideration to participate.</p>
            </div>

            <div className={styles.freeToUseBox}>
              <h4>Entirely Free to Use</h4>
              <p>No cost to download, create account, explore, earn points, or participate in promotions.</p>
            </div>

            <div className={styles.discretionaryBox}>
              <h4>Discretionary Allocation</h4>
              <p>Rewards are selected at discretion, not guaranteed, not based on gambling-style random chance, and are promotional gifts requiring no consideration.</p>
            </div>
          </section>

          {/* Sponsors */}
          <section id="sponsors" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Building className={styles.sectionIcon} />
              <h2>15. Sponsor Relationships Disclaimer</h2>
            </div>

            <div className={styles.sponsorDisclaimer}>
              <AlertTriangle size={24} />
              <div>
                <h4>Third-Party Independence</h4>
                <p><strong>Sponsors are independent third parties</strong>, not employees or representatives of La Garau Pvt. Ltd.</p>
              </div>
            </div>

            <div className={styles.noResponsibilityBox}>
              <h4>The Company is NOT Responsible For:</h4>
              <ul>
                <li>Quality, safety, or legality of Sponsor products/services</li>
                <li>Fulfillment, delivery, or availability of rewards</li>
                <li>Sponsor customer service or support</li>
                <li>Sponsor business practices or legal compliance</li>
                <li>Any harm or loss from Sponsor interactions</li>
              </ul>
            </div>

            <div className={styles.directRelationship}>
              <p><strong>Any issues with rewards must be resolved directly with the Sponsor.</strong> We have no obligation to mediate disputes or provide refunds.</p>
            </div>
          </section>

          {/* Minors */}
          <section id="minors" className={styles.section}>
            <div className={styles.sectionHeader}>
              <UserCircle className={styles.sectionIcon} />
              <h2>16. Minor Users & Guardian Responsibility</h2>
            </div>

            <div className={styles.guardianResponsibility}>
              <h4>Guardian Consent Requirement</h4>
              <p>If you are 16-17 years old, you represent that a parent/guardian has reviewed and approved your use, the guardian email is accurate, and your guardian accepts these Terms on your behalf.</p>
            </div>

            <div className={styles.guardianLiability}>
              <AlertTriangle size={24} />
              <div>
                <h4>Guardian Legal Responsibility</h4>
                <p><strong>Guardians accept FULL LEGAL RESPONSIBILITY for:</strong> the Minor's actions and compliance, data shared, all physical risks, and any damages or liabilities.</p>
              </div>
            </div>

            <div className={styles.noSupervisionBox}>
              <h4>No Company Supervision</h4>
              <p>La Garau Pvt. Ltd. has NO OBLIGATION to supervise Minors, monitor interactions, prevent access to features, or enforce parental controls. Guardians are solely responsible.</p>
            </div>
          </section>

          {/* Privacy Reference */}
          <section id="privacy" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Eye className={styles.sectionIcon} />
              <h2>17. Privacy & Data Reference</h2>
            </div>

            <div className={styles.privacyReference}>
              <Shield size={32} />
              <div>
                <h4>Privacy Policy Incorporation</h4>
                <p>Your use of the App is also governed by our <strong>Privacy Policy</strong>, which is incorporated by reference into these Terms. All data practices are detailed in the Privacy Policy.</p>
              </div>
            </div>

            <Link href="/privacy" className={styles.btnSecondary}>
              <Eye size={18} /> View Privacy Policy
            </Link>
          </section>

          {/* Service Disclaimer */}
          <section id="disclaimer" className={styles.disclaimerSection}>
            <div className={styles.sectionHeader}>
              <AlertCircle className={styles.sectionIcon} />
              <h2>18. "As Is" & "As Available" Service Disclaimer</h2>
            </div>

            <div className={styles.asIsWarning}>
              <AlertTriangle size={48} />
              <h3>THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES</h3>
              <p>No warranties of any kind, express or implied, including merchantability, fitness for purpose, accuracy, reliability, or uninterrupted operation.</p>
            </div>

            <div className={styles.technicalIssues}>
              <h4>Potential Issues</h4>
              <p>The App may experience downtime, bugs, glitches, data loss, or compatibility issues. We reserve the right to change, suspend, or discontinue the Service at any time without liability or compensation.</p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section id="liability" className={styles.liabilitySection}>
            <div className={styles.sectionHeader}>
              <Shield className={styles.sectionIcon} style={{ color: '#fff' }} />
              <h2 style={{ color: '#fff' }}>19. Extreme Limitation of Liability</h2>
            </div>

            <div className={styles.liabilityCap}>
              <h3>MAXIMUM LIABILITY: NPR 1,000</h3>
              <p>To the maximum extent permitted by law, La Garau Pvt. Ltd.'s total cumulative liability shall not exceed <strong>NPR 1,000 (One Thousand Nepalese Rupees)</strong> or the amount you've paid us (if any) in the past 12 months, whichever is less.</p>
            </div>

            <div className={styles.notLiableFor}>
              <h4>We Are NOT Liable For:</h4>
              <div className={styles.notLiableGrid}>
                <div className={styles.notLiableItem}><XCircle size={18} /> Personal injury or death</div>
                <div className={styles.notLiableItem}><XCircle size={18} /> Device loss or damage</div>
                <div className={styles.notLiableItem}><XCircle size={18} /> Data loss or corruption</div>
                <div className={styles.notLiableItem}><XCircle size={18} /> Third-party misconduct</div>
                <div className={styles.notLiableItem}><XCircle size={18} /> Emotional distress</div>
                <div className={styles.notLiableItem}><XCircle size={18} /> Lost opportunities</div>
                <div className={styles.notLiableItem}><XCircle size={18} /> Financial losses</div>
                <div className={styles.notLiableItem}><XCircle size={18} /> Indirect/consequential damages</div>
              </div>
            </div>
          </section>

          {/* Indemnification */}
          <section id="indemnification" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Scale className={styles.sectionIcon} />
              <h2>20. Indemnification</h2>
            </div>

            <div className={styles.indemnificationBox}>
              <h4>You Agree to Indemnify La Garau Pvt. Ltd.</h4>
              <p>You agree to indemnify, defend, and hold harmless the Company from any claims, losses, damages, liabilities, costs, or attorney's fees arising from:</p>
              <ul>
                <li>Your misuse of the App or violation of these Terms</li>
                <li>Your violation of any law or regulation</li>
                <li>Your infringement of intellectual property rights</li>
                <li>Your prohibited conduct (trespassing, stalking, cheating)</li>
                <li>Harm caused to others as a result of your actions</li>
                <li>Your failure to supervise Minor Users (if guardian)</li>
                <li>Claims by third parties arising from your conduct</li>
              </ul>
            </div>

            <div className={styles.survivalNote}>
              <p><strong>This indemnification obligation survives termination</strong> of your account and these Terms.</p>
            </div>
          </section>

          {/* Termination */}
          <section id="termination" className={styles.section}>
            <div className={styles.sectionHeader}>
              <Trash2 className={styles.sectionIcon} />
              <h2>21. Account Suspension & Termination</h2>
            </div>

            <div className={styles.terminationRights}>
              <h4>Company Termination Rights</h4>
              <p>We reserve the absolute right to suspend or terminate your account at any time, for any reason or no reason, with or without notice.</p>
            </div>

            <div className={styles.terminationReasons}>
              <h4>Common Reasons:</h4>
              <div className={styles.reasonsGrid}>
                <div className={styles.reasonItem}>Violation of Terms</div>
                <div className={styles.reasonItem}>Cheating or prohibited conduct</div>
                <div className={styles.reasonItem}>Extended inactivity</div>
                <div className={styles.reasonItem}>Security concerns</div>
                <div className={styles.reasonItem}>Discretionary business decisions</div>
              </div>
            </div>

            <div className={styles.terminationEffects}>
              <h4>Effect of Termination</h4>
              <ul>
                <li>Immediate access revocation</li>
                <li>All points, progress, and rewards forfeited (no compensation)</li>
                <li>Loss of right to redeem unredeemed rewards</li>
                <li>Device may be permanently banned</li>
              </ul>
            </div>

            <div className={styles.voluntaryTermination}>
              <h4>Voluntary Termination</h4>
              <p>You may delete your account anytime via Settings → Account → Delete My Account or by emailing support@ghumanteyuwa.com.</p>
            </div>
          </section>

          {/* Modifications */}
          <section id="modifications" className={styles.section}>
            <div className={styles.sectionHeader}>
              <FileText className={styles.sectionIcon} />
              <h2>22. Modifications to Terms</h2>
            </div>

            <div className={styles.modificationRights}>
              <h4>Right to Update</h4>
              <p>We reserve the right to modify, amend, or update these Terms at any time, at our sole discretion, without prior notice.</p>
            </div>

            <div className={styles.notificationMethod}>
              <h4>How You'll Be Notified</h4>
              <ul>
                <li>The "Last Updated" date will change</li>
                <li>We may notify via in-app notification or email</li>
                <li>Updated Terms accessible in the App</li>
              </ul>
            </div>

            <div className={styles.continuedUse}>
              <AlertTriangle size={24} />
              <div>
                <h4>Continued Use = Acceptance</h4>
                <p><strong>Your continued use after changes constitutes acceptance.</strong> If you don't agree, you must cease using the App and delete your account.</p>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section id="governing-law" className={styles.governingSection}>
            <div className={styles.sectionHeader}>
              <Gavel className={styles.sectionIcon} style={{ color: '#fff' }} />
              <h2 style={{ color: '#fff' }}>23. Governing Law & Jurisdiction</h2>
            </div>

            <div className={styles.lawBox}>
              <h4>Applicable Law</h4>
              <p>These Terms are governed by the <strong>laws of Nepal</strong>, including:</p>
              <ul>
                <li>Contract Act, 2056 (2000)</li>
                <li>Electronic Transactions Act, 2063 (2008)</li>
                <li>Consumer Protection Act, 2075 (2018)</li>
              </ul>
            </div>

            <div className={styles.jurisdictionBox}>
              <h4>Exclusive Jurisdiction</h4>
              <p>Any disputes shall be resolved exclusively in the <strong>competent courts of Kathmandu, Nepal</strong>. You waive any right to bring claims in other jurisdictions.</p>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className={styles.contactSection}>
            <div className={styles.sectionHeader}>
              <Mail className={styles.sectionIcon} style={{ color: '#fff' }} />
              <h2 style={{ color: '#fff' }}>24. Company Information & Contact</h2>
            </div>

            <div className={styles.companyInfo}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <strong>Application:</strong> Ghumante Yuwa
                </div>
                <div className={styles.infoItem}>
                  <strong>Operator:</strong> La Garau Pvt. Ltd.
                </div>
                <div className={styles.infoItem}>
                  <strong>Jurisdiction:</strong> Nepal
                </div>
                <div className={styles.infoItem}>
                  <strong>Office:</strong> Kathmandu, Nepal
                </div>
              </div>
            </div>

            <div className={styles.contactDetails}>
              <h4>Contact Us</h4>
              <p>For questions or concerns regarding these Terms:</p>
              <a href="mailto:support@ghumanteyuwa.com" className={styles.btnPrimary}>
                <Mail size={18} /> support@ghumanteyuwa.com
              </a>
              <p className={styles.responseTime}>Response time: Within 7 business days</p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className={styles.acknowledgmentSection}>
            <h2>Acknowledgment & Agreement</h2>
            <div className={styles.acknowledgmentBox}>
              <CheckCircle size={48} className={styles.acknowledgeIcon} />
              <div>
                <p><strong>BY CREATING AN ACCOUNT, CLICKING "I AGREE", OR USING THE APP, YOU ACKNOWLEDGE THAT:</strong></p>
                <ul>
                  <li>You have read and understood these Terms in their entirety</li>
                  <li>You agree to be legally bound by all provisions</li>
                  <li>You have the legal capacity to enter into this agreement</li>
                  <li>You accept all risks associated with using the App</li>
                  <li>You understand that violation may result in termination and legal action</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Final Statement */}
          <section className={styles.finalStatement}>
            <h3>Final Statement</h3>
            <p>
              La Garau Pvt. Ltd. is committed to providing a safe, enjoyable, and legally compliant platform 
              for exploring Nepal. These Terms are designed to protect both users and the Company while fostering 
              a vibrant community of explorers.
            </p>
            <div className={styles.finalEmoji}>
              🌄 <strong>Ghumante Yuwa</strong> – Your Adventure, Your Responsibility.
            </div>
          </section>

          {/* Legal Footer */}
          <section className={styles.legalFooter}>
            <p>© 2026 La Garau Pvt. Ltd. All Rights Reserved.</p>
            <p className={styles.footerLinks}>
              <Link href="/">Home</Link>
              <span>•</span>
              <Link href="/terms">Terms of Service</Link>
              <span>•</span>
              <Link href="/privacy">Privacy Policy</Link>
            </p>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© {new Date().getFullYear()} La Garau Pvt. Ltd. • Kathmandu, Nepal</p>
          <p className={styles.footerLinksList}>
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