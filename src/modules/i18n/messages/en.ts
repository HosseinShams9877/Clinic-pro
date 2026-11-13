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
  "nav.services": "Services",
  "nav.contact": "Contact",
  "nav.svcSurg": "Surgical services",
  "nav.svcMed": "Medical services",

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
  "ft.l2": "Anesthesia Clinic",
  "ft.l3": "General OR",
  "ft.h3": "Working Hours",
  "ft.days": "Saturday – Thursday",
  "ft.time": "07:30 – 20:00",
  "ft.visit": "Visiting hours",
  "ft.vtime": "15:00 – 16:30",
  "ft.copy":
    "© All rights reserved — Dr. Kheirkhah Super-Specialty Surgical Center.",
  "ft.company": "Mehrandish Kheirkhah Physicians Co.",
};
