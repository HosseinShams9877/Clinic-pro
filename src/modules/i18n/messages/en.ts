/**
 * en.ts — English message catalog.
 *
 * Provenance, per source:
 *   - پلتفرم/assets/js/i18n.js (en)        — most keys, transcribed verbatim
 *   - پلتفرم/assets/js/i18n-extra.js (en)  — nav.svcSurg, nav.svcMed, sg.*,
 *                                             hs.4/4d, hs.5/5d, hs.6/6d
 *   - پلتفرم/assets/js/services.js (FL.en) — floor.*
 *   - پلتفرم/assets/js/home.js (T.en)      — status.*
 *
 * The reference ships no en for these keys, so their values are faithful
 * English translations of the canonical fa string (no clinic facts added):
 *   meta.description, meta.servicesDescription, hs.k, hs.t, hs.p
 *
 * The key set MUST be identical to fa.ts (LOCALIZATION_AND_CALENDAR.md §2);
 * this is enforced at compile time by `messages` in index.ts and at run time
 * by the key-completeness test.
 */

export const en = {
  "meta.title": "Dr. Kheirkhah Super-Specialty Surgical Center | Kashan, Iran",
  "meta.description":
    "Dr. Kheirkhah Super-Specialty Surgical Center in Kashan; 7 equipped operating rooms and more than 40 specialist and sub-specialist surgeons in eye, ear, nose & throat, gynecology, urology, orthopedics, general and aesthetic surgery.",
  "meta.services": "Services | Dr. Kheirkhah Super-Specialty Surgical Center",
  "meta.servicesDescription":
    "66 specialist and sub-specialist physicians of Dr. Kheirkhah Surgical Center in Kashan, in gynecology & infertility, eye, ear, nose & throat, general surgery, urology, cardiology and anesthesia.",

  "brand.small": "Super-Specialty Surgical Center",
  "brand.name": "Dr. Kheirkhah",
  "a11y.skip": "Skip to main content",
  "a11y.menu": "Menu",
  "a11y.top": "Back to top",
  "lang.label": "Language",

  /* 404 / error boundary pages (no reference 404 exists; UI chrome, not clinic content) */
  "err.notFoundTitle": "Page not found",
  "err.notFoundBody": "This page does not exist on the Dr. Kheirkhah Super-Specialty Surgical Center website.",
  "err.errorTitle": "Something went wrong",
  "err.errorBody": "An error occurred while loading this page. Please try again.",
  "err.retry": "Try again",

  "nav.home": "Home",
  "nav.about": "About",
  "nav.services": "Services",
  "nav.doctors": "Doctors",
  "nav.assistant": "Smart Guide",
  "nav.intl": "International Patients",
  "nav.contact": "Contact",
  "nav.svcSurg": "Surgical services",
  "nav.svcMed": "Medical services",
  "nav.aboutHist": "Center introduction",
  "nav.aboutMission": "Mission & vision",
  "nav.aboutGoals": "Organizational goals",
  "nav.aboutPolicy": "Core policies",
  "nav.aboutWhy": "Why Dr. Kheirkhah Center",
  "ix.menuGuide": "Before & after surgery",
  "ix.menuVisit": "Visiting hours & rules",
  "ix.menuRights": "Patient rights charter",
  "ix.menuAdm": "Admission & discharge",
  "ix.menuLoan": "Tejarat Bank medical loan",

  "cta.request": "Request an Appointment",
  /* header CTA — reference: i18n.js line 56 */
  "cta.book": "Appointment",

  "h.k": "Super-specialty surgical center in Kashan",
  "h.t1": "The crown of health,",
  "h.t2": "you deserve it",
  "h.lead":
    "Dr. Kheirkhah Specialist & Aesthetic Surgery Center — the country's first modern surgical center designed, planned and built with materials to German standards — has 7 equipped operating rooms and separate departments for eye, ENT, aesthetic, general, urology & lithotripsy, orthopedic and gynecologic surgery.",
  "h.phone": "Phone guidance",

  "h.since": "Since 2020",
  "h.sinceS": "by your side",
  "st.n1": "7",
  "st.l1": "Equipped operating rooms",
  "st.n2": "60+",
  "st.l2": "Specialists & sub-specialists",
  "st.n3": "40",
  "st.l3": "Inpatient beds",

  "help.title": "How can we help you?",
  "h.helpS":
    "Find your doctor, explore our services or read the patient guide.",
  "h.c2": "Surgical services",
  "h.c2s": "Explore our services",

  "sv.kicker": "Our Services",
  "h.svT": "Specialist surgical services",
  "h.svS":
    "A wide range of surgical services with modern methods and advanced equipment",
  "sv.all": "View all services",
  "h.see": "View services",
  "sv.1": "Eye Surgery",
  "sv.2": "Ear, Nose & Throat",
  "sv.3": "Gynecology & Infertility",
  "sv.4": "Urology & Kidney",
  "sv.6": "Orthopedics",
  "sv.7": "Anesthesia Clinic",
  "h.s1": "Cornea, LASIK, SMILE, retina & cataract",
  "h.s2": "Sinus, nose, tonsils & head and neck",
  "h.s3": "Gynecologic surgery & infertility care",
  "h.s4t": "General & Laparoscopic Surgery",
  "h.s4": "Gallbladder, hernia, stomach & bowel, minimally invasive",
  "h.s5": "Lithotripsy, ureteroscopy & cystoscopy",
  "h.s6t": "Aesthetics, Laser, Hair & Brow",
  "h.s6": "Rhinoplasty, liposuction, laser, hair & eyebrow transplant",
  "h.s7": "Pre-op anesthesia assessment & consultation",
  "h.s8": "Bone & joint surgery",

  /* bento one-liners — reference: home-svc.js SHORT (per category id) */
  "short.gen": "Gallbladder, hernia, stomach & bowel — minimally invasive",
  "short.plastic": "Reconstructive & cosmetic surgery with a dedicated anesthesia team",
  "short.ortho": "Bone & joint surgery",
  "short.uro": "Lithotripsy, ureteroscopy & cystoscopy",
  "short.eye": "Cornea, LASIK, SMILE, retina & cataract",
  "short.ent": "Sinus, nose, tonsils and head & neck surgery",
  "short.gyn": "Specialist gynecologic surgery & infertility care",
  "short.aes": "Aesthetic surgery, triple-wavelength laser, hair & eyebrow transplant",
  "short.anes": "Pre-operative anesthesia assessment & consultation",
  "short.endo": "Diagnostic & therapeutic endoscopy and colonoscopy",

  "care.title": "We are with you at every step",
  "h.careP":
    "From first consultation to discharge, our team is by your side with respect and honesty, so your experience is calm and confident.",
  "h.p1": "Consultation",
  "h.p2": "Admission",
  "h.p3": "Surgery",
  "h.p4": "Care & follow-up",

  "gd.kicker": "Patient Guide",
  "gd.title": "Visit & Admission Steps",
  "gd.sub": "What to know for a calm, worry-free visit.",
  "h.g1": "Hours & visiting",
  "h.g1s": "Admission and visiting times",
  "h.g1d": "Admission: Sat–Thu 07:30–20:00 · Visiting: daily 15:00–16:30",
  "h.g2": "Getting ready for surgery",
  "h.g2s": "Key tips before surgery",
  "h.g2d": "Prepare fasting, medicines and tests as your doctor instructs.",
  "h.g2l": "Full guide →",
  "h.g3": "Required documents",
  "h.g3s": "What to bring for admission",
  "gd.1d":
    "National ID or valid photo ID, your doctor's admission order, medical records and a list of current medications.",
  "h.g4": "Online booking",
  "h.g4s": "Request surgery without visiting in person",
  "h.g4d": "Send your doctor's referral online; our team will call you within 24–48 working hours to schedule your surgery.",
  "h.g4a": "Request an appointment",

  "hs.k": "Patient safety",
  "hs.t": "Hygiene & safety standards at Dr. Kheirkhah Center",
  "hs.p":
    "From operating-room design to discharge day, patient safety is built into every step.",
  "std.1": "Stainless-steel walls & Geofloor flooring",
  "std.1d":
    "All operating and recovery rooms with steel walls and Geofloor flooring",
  "std.2": "Central ventilation, zero contamination",
  "std.2d":
    "Professional air handling and advanced filtration at the heart of the OR",
  "std.3": "Central Sterile Services (CSR)",
  "std.3d":
    "Autoclave and plasma sterilization, with a dedicated lift delivering sets to the OR",
  "hs.4": "Anesthesia assessment before every operation",
  "hs.4d":
    "An anesthesiologist assesses you before surgery and looks after you before, during and after it.",
  "hs.5": "ID wristband for every patient",
  "hs.5d":
    "From admission to discharge, every patient's identity is checked with an ID wristband to prevent mistakes.",
  "hs.6": "Plant rooms outside clinical floors",
  "hs.6d":
    "Plant, power and oxygen systems sit on a separate floor so any fault cannot affect clinical areas.",

  "h.ctT": "We're here to help",
  "h.ctS": "Call admissions for appointments, advice or any question.",
  "h.addrS": "Shahid Zahiri Alley, Amir Kabir St., Kashan",
  "ct.hours": "Saturday – Thursday · 07:30 – 20:00",
  "ct.map": "Get directions",
  "h.qaCall": "Call",

  "sv2.k": "Specialist & sub-specialist services",
  "sv2.t1": "Our Services",
  "sv2.t2": "on your path to health",
  "sv2.p":
    "Surgical and medical care in 7 equipped operating rooms, by a team of specialists and sub-specialists.",
  "sv2.f1": "60+ specialist doctors",
  "sv2.f2": "Modern, advanced equipment",
  "sv2.f3": "Zero-contamination ORs",
  "sg.surg": "Surgical services",
  "sg.surgS":
    "Seven specialist and sub-specialist surgical fields in our operating rooms",
  "sg.med": "Medical services",
  "sg.medS":
    "Aesthetics & laser, anesthesia, and endoscopy & colonoscopy",

  "sv2.items": "Services in this field",
  "sv2.askK": "Expert advice",
  "sv2.askT": "Questions about our services?",
  "sv2.askP":
    "Our admissions team will answer your questions and help you choose the right doctor and treatment.",
  "sv2.call": "Call us",
  "sv2.book": "Request appointment",
  "sv2.docs": "Doctors in this field",
  "sv2.vid": "Department overview",
  "sv2.online": "Send records & consult online",
  /* video placeholder toast — reference: services.js VID.en */
  "sv2.vidSoon": "This department's video is coming soon.",
  "sv2.a1": "Answers during working hours",
  "sv2.a1s": "Sat – Thu · 07:30 – 20:00",
  "sv2.a2": "Full guidance",
  "sv2.a2s": "Treatment, admission & stay",
  "sv2.a3": "Easy scheduling",
  "sv2.a3s": "By phone or online",

  "floor.basm": "Basement (level −1)",
  "floor.ground": "Ground floor",
  "floor.second": "2nd floor",
  "floor.third": "3rd floor",
  /* short floor labels — reference: home-svc.js FL.SHORT (bento chips) */
  "floorS.basm": "Basement",
  "floorS.ground": "Ground floor",
  "floorS.second": "2nd floor",
  "floorS.third": "3rd floor",

  "status.open": "Admissions open now",
  "status.closed": "Admissions closed now",
  "status.left": "Closes in {h}h {m}m",
  "status.leftM": "Closes in {m} min",
  "status.opens": "Opens {d} at 07:30",
  "status.today": "today",
  "status.tomorrow": "tomorrow",
  "status.sat": "Saturday",

  "ft.p":
    "Safe and effective care delivered by expert staff and modern equipment, in line with national and international standards and the Patient Rights Charter.",
  "ft.h1": "Departments",
  "ft.l1": "Surgical suite",
  "ft.l2": "Anesthesia Clinic",
  "ft.l3": "General OR",
  "ft.l4": "Hair & eyebrow transplant",
  "ft.l5": "Laser clinic",
  "ft.l6": "Aesthetic clinic",
  "ft.h2": "Quick links",
  "ft.q1": "Medical tourism",
  "ft.q2": "Admission & discharge",
  "ft.q3": "Virtual Tour",
  "ft.q4": "Patient rights charter",
  "ft.q5": "Visiting hours & rules",
  "ft.q6": "Center introduction",
  "ft.h3": "Working Hours",
  "ft.days": "Saturday – Thursday",
  "ft.time": "07:30 – 20:00",
  "ft.visit": "Visiting hours",
  "ft.vtime": "15:00 – 16:30",
  "ft.copy":
    "© All rights reserved — Dr. Kheirkhah Super-Specialty Surgical Center.",
  "ft.company": "Mehrandish Kheirkhah Physicians Co.",

  "nav.guide": "Patient Guide",

  /* Loan feature (2026-11-18). The ln and lp keys are ported verbatim
     from پلتفرم/assets/js/i18n-extra.js; ln.st1..st4 and lp.h1..h4 are
     adapted to the digital request flow; lw is new UI chrome. fa is
     canonical. */
  "loan.meta": "Tejarat Bank medical loan | Dr. Kheirkhah Super-Specialty Surgical Center",
  "loan.metaDescription":
    "Tejarat Bank medical loan for surgery costs at Dr. Kheirkhah Surgical Center: the bank pays the center directly and you repay in installments. Check your credit with your national code.",

  "ln.k": "Fast medical loan",
  "ln.t1": "Pay for your surgery",
  "ln.t2": "in installments",
  "ln.p": "With the Tejarat Bank medical loan, the bank pays your surgery cost directly to the center and you repay it in installments. Our advisors guide you from start to finish.",
  "ln.b1": "Bank pays the center directly",
  "ln.b2": "No cash needed to start treatment",
  "ln.b3": "Our advisor helps at every step",
  "ln.st1": "Credit check with your national code",
  "ln.st2": "Enter the amount and get an OTP",
  "ln.st3": "Request registered with Tejarat Bank",
  "ln.st4": "The bank pays the center directly",
  "ln.more": "Learn about the medical loan",
  "ln.fT": "Request a medical loan",
  "ln.fP": "Enter your national code to check your available credit and submit your request directly.",
  "ln.nc": "National code",
  "ln.ncPh": "1234567890",
  "ln.start": "Start request",
  "ln.ncErr": "Enter a valid national code (10 digits).",
  "ln.privNc": "Your national code is used only for the Tejarat Bank credit check.",

  "lp.t": "Tejarat Bank medical loan",
  "lp.p": "You don't have to pay for surgery all at once. Tejarat Bank pays the center directly and you repay in installments, with our advisor beside you at every step.",
  "lp.f1": "Paid directly to the center",
  "lp.f2": "Repay in installments",
  "lp.bk": "Paying for surgery",
  "lp.bv": "In installments, via Tejarat Bank",
  "lp.hT": "How it works",
  "lp.h1": "You enter your national code and your available Tejarat Bank credit is checked.",
  "lp.h2": "You choose the amount and confirm the one-time code the bank sends to your mobile.",
  "lp.h3": "Your request is registered with Tejarat Bank and the amount is paid straight to the center.",
  "lp.h4": "Our advisor stays with you to complete the documents and set the surgery date.",
  "lp.wT": "Who is it for?",
  "lp.w1": "Insured patients who want to pay their share of the surgery cost in installments.",
  "lp.w2": "Tejarat Bank customers; the bank sets the exact terms and loan ceiling, and our advisor explains them to you.",
  "lp.dT": "Documents usually needed",
  "lp.d1": "National ID card",
  "lp.d2": "Doctor's admission order or letter",
  "lp.d3": "Cost estimate from the center's discharge office",
  "lp.d4": "Any documents Tejarat Bank requires under its rules",
  "lp.qT": "Frequently asked questions",
  "lp.q1": "Is the loan paid to my account?",
  "lp.a1": "No. The bank pays the center directly to settle your surgery cost; you only pay the installments to the bank.",
  "lp.q2": "Can I combine it with insurance?",
  "lp.a2": "Yes. Your insurance share is deducted first; the loan covers the part you pay yourself.",
  "lp.q3": "What are the amount, interest and number of installments?",
  "lp.a3": "Tejarat Bank sets these under its own rules. Our advisor will explain the current terms when they call.",
  "lp.q4": "How long does it take?",
  "lp.a4": "After your request is registered and the code confirmed, an advisor calls within 24 working hours to list the required documents.",
  "lp.note": "Final loan terms, including ceiling, interest and installments, are set by Tejarat Bank.",

  "lw.title": "Medical loan request",
  "lw.js": "Please enable JavaScript to submit the loan request.",
  "lw.s1": "National code",
  "lw.s2": "Credit check",
  "lw.s3": "Amount & code",
  "lw.s4": "Done",
  "lw.back": "Back",
  "lw.editNc": "Change national code",
  "lw.creditOf": "Credit {name}",
  "lw.balance": "Available balance",
  "lw.creditAmount": "Credit ceiling",
  "lw.customer": "Holder",
  "lw.chooseAmount": "Requested amount",
  "lw.amountHint": "Amount in rials, at most the available credit balance.",
  "lw.chooseCredit": "Choose a credit",
  "lw.amount": "Requested amount (rials)",
  "lw.amountErr": "Enter the amount as a whole number, at most the available credit balance.",
  "lw.sendOtp": "Get one-time code",
  "lw.sending": "Sending…",
  "lw.otpSent": "A one-time code was sent to {mobile}.",
  "lw.otp": "One-time code",
  "lw.otpPh": "e.g. 52320",
  "lw.verify": "Confirm and submit",
  "lw.verifying": "Submitting…",
  "lw.resend": "Resend code",
  "lw.processing": "Submitting your request…",
  "lw.polling": "Tracking the transaction at the bank…",
  "lw.successTitle": "Loan request submitted",
  "lw.pendingTitle": "Request submitted",
  "lw.pendingBody": "Your request is registered with Tejarat Bank and awaits final confirmation. Our advisor will call you within 24 working hours.",
  "lw.refNum": "Reference number",
  "lw.txId": "Transaction id",
  "lw.amountPaid": "Requested amount",
  "lw.failedTitle": "Request failed",
  "lw.retry": "Try again",
  "lw.newRequest": "New request",
  "lw.errNetwork": "Could not reach the bank service; please try again shortly.",
  "lw.errTooMany": "Too many requests; please wait a moment and try again.",
  "lw.errGeneric": "An error occurred; please try again.",
  "lw.noCredits": "No available credit found for this national code.",
  "lw.stPENDING": "Pending",
  "lw.stPROCESSING": "Processing",
  "lw.stCOMPLETED": "Completed",
  "lw.stCONFIRMED": "Confirmed",
  "lw.stFAILED": "Failed",
  "lw.stREFUNDED": "Refunded",
  "lw.stRETRY": "Retrying",
  "lw.submit": "Continue",
};
