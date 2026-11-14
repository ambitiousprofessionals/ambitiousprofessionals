/* ============================================================
   DATA
   ============================================================ */
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Generates the next `count` upcoming attempts from a repeating set of exam
 * months (0-indexed, e.g. 8 = Sep). The current month is always excluded,
 * so the list automatically rolls forward as real dates pass — no manual
 * updates needed, ever.
 */
function generateAttempts(cycleMonths, count){
  const now = new Date();
  const candidates = [];
  for(let y = now.getFullYear(); y <= now.getFullYear() + 6; y++){
    cycleMonths.forEach(m => candidates.push(new Date(y, m, 1)));
  }
  const upcoming = candidates
    .filter(d => d.getFullYear() > now.getFullYear() || (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth()))
    .sort((a,b) => a - b);
  return upcoming.slice(0, count).map(d => MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear());
}

/* the full list of upcoming attempts for an exam level (as before) */
function allAttemptsFor(course, level){
  if(course === 'CA' && level === 'Final') return generateAttempts([10,4], 6);   // Nov, May
  if(course === 'CMA' && level === 'Final') return generateAttempts([5,11], 5);  // Jun, Dec — 5 attempts
  if(course === 'CMA') return generateAttempts([5,11], 3);                       // Jun, Dec — 3 attempts (Foundation/Inter)
  if(course === 'CS' && level === 'CSEET') return generateAttempts([1,5,9], 4);  // Feb, Jun, Oct — 4 attempts
  if(course === 'CS' && level === 'Executive') return generateAttempts([5,11], 3); // Jun, Dec — 3 attempts
  if(course === 'CS' && level === 'Professional') return generateAttempts([5,11], 5); // Jun, Dec — 5 attempts
  return generateAttempts([0,4,8], 4);                                          // Jan, May, Sep
}

/* How many upcoming attempts the LECTURES list shows for these levels (everything else keeps its full list) */
const LECTURE_ATTEMPT_COUNT = { 'CA|Foundation':2, 'CMA|Foundation':2, 'CS|CSEET':3 };
/* The TEST SERIES list always shows only the next 2 attempts */
const TEST_SERIES_ATTEMPT_COUNT = 2;

function getAttemptsFor(course, level, forTestSeries){
  const list = allAttemptsFor(course, level);
  if(forTestSeries) return list.slice(0, TEST_SERIES_ATTEMPT_COUNT);
  const n = LECTURE_ATTEMPT_COUNT[course + '|' + level];
  return n ? list.slice(0, n) : list;
}

const CLASS_TYPES = ["Regular","Fast-track"];
const BOOK_PREFERENCES = ["Hard Copy","E-Book","Without Books"];
const MODES = ["Offline Face to Face","Online Google Drive Live + Recorded","Online Google Drive Recorded"];
/* Fast-track batches have exactly ONE mode */
const FASTTRACK_MODES = ["Online Google Drive Recorded"];
const OFFLINE_MODE = "Offline Face to Face";

/* ============================================================
   CUSTOM FACULTY NAME DIALOG
   ============================================================ */
const OTHER_LABEL = 'Other (please specify)';
let facultyOtherActiveSelect = null;
let facultyOtherActiveHidden = null;
let facultyOtherActiveOptionEl = null;

function openFacultyOtherDialog(selectEl, hiddenInputEl, optionEl){
  facultyOtherActiveSelect = selectEl;
  facultyOtherActiveHidden = hiddenInputEl;
  facultyOtherActiveOptionEl = optionEl;
  const input = document.getElementById('facultyOtherInput');
  input.value = hiddenInputEl.value || '';
  openOverlay('facultyOtherOverlay');
  setTimeout(()=> input.focus(), 50);
}

function confirmFacultyOtherDialog(){
  const input = document.getElementById('facultyOtherInput');
  const typed = input.value.trim();
  if(facultyOtherActiveHidden){
    facultyOtherActiveHidden.value = typed;
  }
  if(facultyOtherActiveOptionEl){
    facultyOtherActiveOptionEl.textContent = typed ? typed : OTHER_LABEL;
  }
  closeOverlay('facultyOtherOverlay');
  checkOrderReady();
}

function cancelFacultyOtherDialog(){
  // If nothing was ever typed, fall back to blank text on the select so it's clear it's unfinished.
  if(facultyOtherActiveOptionEl && !facultyOtherActiveHidden.value){
    facultyOtherActiveOptionEl.textContent = OTHER_LABEL;
  }
  closeOverlay('facultyOtherOverlay');
  checkOrderReady();
}

(function(){
  const confirmBtn = document.getElementById('facultyOtherConfirm');
  const cancelBtn = document.getElementById('facultyOtherCancel');
  const otherInput = document.getElementById('facultyOtherInput');
  if(confirmBtn) confirmBtn.addEventListener('click', confirmFacultyOtherDialog);
  if(cancelBtn) cancelBtn.addEventListener('click', cancelFacultyOtherDialog);
  if(otherInput) otherInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      e.preventDefault();
      confirmFacultyOtherDialog();
    }
  });
})();

const COURSES = {
CA: {
  Foundation: [
    {no:"Paper 1", name:"Principles and Practice of Accounting", faculty:["Prof. Suvraprasad Tripathy"]},
    {no:"Paper 2", name:"Business Laws", faculty:["Prof. Abanindra Sahu"]},
    {no:"Paper 3", name:"Quantitative Aptitude", faculty:["Prof. SP Praveen K Rao"]},
    {no:"Paper 4", name:"Business Economics", faculty:["Prof. Prateek Nanda"]}
  ],
  Intermediate: [
    {no:"Paper 1", name:"Advanced Accounting", group:"Group 1", faculty:["CA Parveen Sharma","CA Rohit Sethi","CA Anand Bhangariya","CA Jai Chawla","CA Chiranjeev Jain","CA Abhishek Zaware","CA Aakash Kandoi","CA Parveen Jindal","CA Tejas Suchak"]},
    {no:"Paper 2", name:"Corporate & Other Laws", group:"Group 1", faculty:["CA Shubham Singhal","CA Harsh Gupta","CA Ankita Patni","CA Amit Popli","CA Siddharth Agarwal","CA Abhishek Bansal","CS Arjun Chhabra","CA Shivangi Agrawal"]},
    {no:"Paper 3A", name:"Income Tax Law", group:"Group 1", faculty:["CA Bhanwar Borana","CA Vijay Sarda","CA Vijender Aggarwal","CA Vivek Gaba","CA Yash Khandelwal","CA Shirish Vyas","CA Subodh Shah","CA Neeraj Arora","CA Amit Mahajan"]},
    {no:"Paper 3B", name:"Goods and Service Tax", group:"Group 1", faculty:["CA Vishal Bhattad","CA Raj Kumar","CA Yashvant Mangal","CA Vijender Aggarwal","CA Vivek Gaba","CA Pooja Kamdar Date"]},
    {no:"Paper 4", name:"Cost and Management Accounting", group:"Group 2", faculty:["CA Parag Gupta","CA Harshad Jaju","CA Purushottam Aggarwal","CA Ashish Kalra","CA Namit Arora","CA Pranav Popat","CA R.K. Mehta","CA Rahul Garg","CA Ranjan Periwal","CA Darshan Chandaliya"]},
    {no:"Paper 5", name:"Auditing and Ethics", group:"Group 2", faculty:["CA Shubham Keswani","CA Neeraj Arora","CA Kapil Goyal","CA Rishabh Jain","CA Pankaj Garg","CA Surbhi Bansal","CA Harshad Jaju","CA Sarthak Jain","CA Amit Popli"]},
    {no:"Paper 6A", name:"Financial Management", group:"Group 2", faculty:["CA Aaditya Jain","CFA Sanjay Saraf","CA Namit Arora","CA Nitin Guru","CA Swapnil Patni","CA Ranjan Periwal","CA Rahul Garg","CA Sanjay Khemka","CA Ashish Kalra","CA Abhishek Zaware"]},
    {no:"Paper 6B", name:"Strategic Management", group:"Group 2", faculty:["Prof. Sonali Jain","CA Ashish Kalra","CA Namit Arora","CA Sanjay Khemka","CA Aaditya Jain","CA Rishabh Jain","CA CS Siddharth Agarwal","CA Neeraj Arora","CA Swapnil Patni","CA Mayank Saraf"]}
  ],
  Final: [
    {no:"Paper 1", name:"Financial Reporting", group:"Group 1", faculty:["CA Praveen Sharma","CA Parveen Jindal","CA Aakash Kandoi","CA Sarthak Jain","CA Pratik Jagati","CA Chiranjeev Jain","CA Jai Chawla","CA Avinash Sancheti","CA Suraj Lakhotia","CA Sumit Sarda"]},
    {no:"Paper 2", name:"Advanced Financial Management", group:"Group 1", faculty:["CFA Sanjay Saraf","CA Aaditya Jain","CA Ajay Agarwal","CA Mayank Kothari","CA Sankalp Kanstiya","CA Nitin Guru","CA Nagendra Sah","Prof. Archana Khetan","CA Praveen Khatod","CA Abhishek Zaware"]},
    {no:"Paper 3", name:"Advanced Auditing, Assurance & Professional Ethics", group:"Group 1", faculty:["CA Shubham Keswani","CA Pankaj Garg","CA Harshad Jaju","CA Pradnya Mundada","CA Kapil Goyal","CA Neeraj Arora","CA Abhishek Bansal","CA Amit Tated","CA Aarti Lahoti","CA Sarthak Jain"]},
    {no:"Paper 4", name:"Direct Tax Laws & International Taxation", group:"Group 2", faculty:["CA Bhanwar Borana","CA Vijay Sarda","CA Yash Khandelwal","CA Atul Agarwal","CA Shubham Singhal","CA Vinod Gupta","CA Punarvas Jayakumar","CA Shirish Vyas","CA Durgesh Singh"]},
    {no:"Paper 5", name:"Indirect Tax Laws", group:"Group 2", faculty:["CA Vishal Bhattad","CA Raj Kumar","CA Ramesh Soni","CA Yashvant Mangal","CA Akshansh Garg","CA Riddhi Baghmar","CA Brindavan Giri","CA Nikunj Goenka","CA Amit Jain"]}
  ]
},
CMA: {
  Foundation: [
    {no:"Paper 1", name:"Fundamentals of Business Laws and Business Communication", faculty:["Prof. Abanindra Sahu"]},
    {no:"Paper 2", name:"Fundamentals of Financial and Cost Accounting", faculty:["Prof. Suvraprasad Tripathy"]},
    {no:"Paper 3", name:"Fundamentals of Business Mathematics and Statistics", faculty:["Prof. SP Praveen K Rao"]},
    {no:"Paper 4", name:"Fundamentals of Business Economics and Management", faculty:["Prof. Prateek Nanda"]}
  ],
  Intermediate: [
    {no:"Paper 5", name:"Business Laws and Ethics", group:"Group 1", faculty:["Prof. Abanindra Sahu"]},
    {no:"Paper 6", name:"Financial Accounting", group:"Group 1", faculty:["Prof. Abhisek Mahapatro"]},
    {no:"Paper 7A", name:"Direct Taxation", group:"Group 1", faculty:["Prof. Aayush Dash"]},
    {no:"Paper 7B", name:"Indirect Taxation", group:"Group 1", faculty:["Prof. Aayush Dash"]},
    {no:"Paper 8", name:"Cost Accounting", group:"Group 1", faculty:["Prof. A. Sourav Patro"]},
    {no:"Paper 9A", name:"Operations Management", group:"Group 2", faculty:["Prof. A. Sourav Patro"]},
    {no:"Paper 9B", name:"Strategic Management", group:"Group 2", faculty:["Prof. A. Sourav Patro"]},
    {no:"Paper 10", name:"Corporate Accounting and Auditing", group:"Group 2", faculty:["Prof. Abanindra Sahu"]},
    {no:"Paper 11", name:"Financial Management and Business Data Analytics", group:"Group 2", faculty:["Prof. Abhisek Mahapatro"]},
    {no:"Paper 12", name:"Management Accounting", group:"Group 2", faculty:["Prof. A. Sourav Patro"]}
  ],
  Final: [
    {no:"Paper 13", name:"Corporate and Economic Laws", group:"Group 1", faculty:["Prof. Abanindra Sahu","CS Arjun Chhabra","CA Shivangi Agrawal","CA Amit Popli","CA Amit Bachhawat","CA CS Jaspreet Singh Johar","CA Abhishek Bansal","CA Siddharth Agarwal"]},
    {no:"Paper 14", name:"Strategic Financial Management", group:"Group 1", faculty:["CFA Sanjay Saraf","CA Aditya Jain","CA Ranjan Periwal","CA Satish Jalan","CA Gourav Kabra","CA Mayank Kothari","CA Nitin Guru","CA Sankalp Kanstiya","CA Ashish Kalra","CA Praveen Khatod"]},
    {no:"Paper 15", name:"Direct Tax Laws and International Taxation", group:"Group 1", faculty:["CA Bhanwar Borana","CA Vijay Sarda","CA Yash Khandelwal","CA Atul Agarwal","CA Shubham Singhal","CA Vinod Gupta","CA Punarvas Jayakumar","CA Shirish Vyas","CA Durgesh Singh"]},
    {no:"Paper 16", name:"Strategic Cost Management", group:"Group 1", faculty:["CA Satish Jalan","CA Ranjan Periwal","CA Sankalp Kanstiya","CA Purushottam Aggarwal","CA Nitin Guru","CA Namit Arora","CA Sachin Gupta","CA Dani Khandelwal","CA Ashish Kalra","CMA Sumit Rastogi"]},
    {no:"Paper 17", name:"Cost and Management Audit", group:"Group 2", faculty:["CMA Sumit Rastogi","CA Ranjan Periwal","CA Satish Jalan","CA Sankalp Kanstiya","CA Purushottam Aggarwal","CA Nitin Guru","CA Namit Arora","CA Sachin Gupta","CA Dani Khandelwal","CA Ashish Kalra"]},
    {no:"Paper 18", name:"Corporate Financial Reporting", group:"Group 2", faculty:["CA Parveen Sharma","CA CS Avinash Sancheti","CA Sarthak Jain","CA Parveen Jindal","CA Aakash Kandoi","CA Pratik Jagati","CA Jai Chawla","CA Abhimanyu Agarwal","CA Raj K Agrawal","CA Ranjan Periwal"]},
    {no:"Paper 19", name:"Indirect Tax Laws and Practice", group:"Group 2", faculty:["CA Vishal Bhattad","CA Raj Kumar","CA Ramesh Soni","CA Yashvant Mangal","CA Akshansh Garg","CA Riddhi Baghmar","CA Brindavan Giri","CA Nikunj Goenka","CA Amit Jain"]},
    {no:"Paper 20A", name:"Strategic Performance Management and Business Valuation", group:"Group 2", faculty:["CFA Sanjay Saraf","CA Ranjan Periwal","CA Satish Jalan","CA Gourav Kabra","CA Sanjay Khemka","CA Aditya Jain","CA Nitin Guru","CA Sankalp Kanstiya","CA Namit Arora","CA Purushottam Aggarwal"]}
  ]
},
CS: {
  CSEET: [
    {no:"Paper 1", name:"Business Communication", faculty:["CS Shubham Modi","CA CS Divya Agarwal","CS Alok Jha","CS Muskan Gupta","Prof. Sameer Gupte","Prof. Ishan Gupta","CA Shivangi Agrawal","Prof. Yashika Vardhan","CS Jaspreet Singh Johar"]},
    {no:"Paper 2", name:"Legal Aptitude and Logical Reasoning", faculty:["CS Arjun Chhabra","CS Shubham Modi","CA Sudhir Sachdeva","CS Alok Jha","Prof. Nitin Bharadwaj","CS Vaibhav Chitlangia","CS Vikas Vohra","CS Amit Vohra"]},
    {no:"Paper 3", name:"Economic and Business Environment", faculty:["CA Harshad Jaju","CS Shubham Modi","CA CS Divya Agarwal","Prof. Sandeep Giri","CS Mayank Saraf","Prof. Vinit Kumar","CA Amit Tated","CS Muskan Gupta","Prof. Yashika Vardhan","CA Raj K Agrawal"]},
    {no:"Paper 4", name:"Current Affairs and Quantitative Aptitude", faculty:["Prof. Mayank Agarwal","CS Shubham Modi","CA Pranav Chandak","Prof. Navneet Mundhra","Prof. Deepack Sir","CS Vaibhav Chitlangia","Prof. Sandeep Giri","CS Vikas Vohra","Prof. Vinit Kumar","CA Sanjay Khemka"]}
  ],
  Executive: [
    {no:"Paper 1", name:"Jurisprudence, Interpretation and General Laws (JIGL)", group:"Group 1", faculty:["CS Arjun Chhabra","CS Amit Vohra","CA Sudhir Sachdeva","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]},
    {no:"Paper 2", name:"Company Law and Practice", group:"Group 1", faculty:["CS Arjun Chhabra","CS Amit Vohra","CA Sudhir Sachdeva","CS Shubham Modi","CS Alok Jha","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra","CA Shivangi Agrawal"]},
    {no:"Paper 3", name:"Setting Up of Business, Industrial and Labour Laws (SBILL)", group:"Group 1", faculty:["CS Arjun Chhabra","CS Amit Vohra","CA Sudhir Sachdeva","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]},
    {no:"Paper 4", name:"Corporate Accounting and Financial Management (CAFM)", group:"Group 1", faculty:["CA CS Avinash Sancheti","CA Ranjan Periwal","CA Satish Jalan","CA CMA Santosh Kumar","CA CMA Abhimanyu Agarwal","CA Sarthak Jain","CA Nitin Guru","Prof. Raj Awate","CA Ashish Kalra","CA Gourav Kabra"]},
    {no:"Paper 5", name:"Capital Market and Securities Laws (CMSL)", group:"Group 2", faculty:["CS Arjun Chhabra","CS Amit Vohra","CS Shubham Modi","CS Alok Jha","CA Sanjay Khemka","CFA Sanjay Saraf","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]},
    {no:"Paper 6", name:"Economic, Commercial and Intellectual Property Laws (ECIPL)", group:"Group 2", faculty:["CS Arjun Chhabra","CS Amit Vohra","CS Shubham Modi","CA Sudhir Sachdeva","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]},
    {no:"Paper 7", name:"Tax Laws and Practice (TLP)", group:"Group 2", faculty:["CA Bhanwar Borana","CA Vishal Bhattad","CA Vijay Sarda","CA Nikunj Goenka","CA Jaspreet Singh Johar","CA Raj Kumar","CA Ramesh Soni","CA Yashvant Mangal","CA Vivek Gaba"]}
  ],
  Professional: [
    {no:"Paper 1", name:"Environmental, Social and Governance (ESG) – Principles and Practice", group:"Group 1", faculty:["CS Arjun Chhabra","CS Amit Vohra","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra","CA Shivangi Agrawal"]},
    {no:"Paper 2", name:"Drafting, Pleadings and Appearances", group:"Group 1", faculty:["CS Arjun Chhabra","CS Amit Vohra","CA Sudhir Sachdeva","CS Shubham Modi","CS Alok Jha","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra","CS Devendra Subhash"]},
    {no:"Paper 3", name:"Compliance Management, Audit and Due Diligence", group:"Group 1", faculty:["CS Arjun Chhabra","CS Amit Vohra","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra","CS Pankaj Garg"]},
    {no:"Paper 5", name:"Strategic Management and Corporate Finance", group:"Group 2", faculty:["CFA Sanjay Saraf","CA Aditya Jain","CA Ranjan Periwal","CA Satish Jalan","CA Gourav Kabra","CA Mayank Kothari","CA Nitin Guru","CA Sankalp Kanstiya","CA Ashish Kalra","CS Amit Vohra"]},
    {no:"Paper 6", name:"Corporate Restructuring, Valuation and Insolvency", group:"Group 2", faculty:["CS Arjun Chhabra","CS Amit Vohra","CFA Sanjay Saraf","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]}
  ]
}
};


/* ============================================================
   LECTURES CATALOG — products, prices, product details
   ------------------------------------------------------------
   Every single-lecture card on the Lectures page is generated
   automatically from the COURSES list above: one "Regular" card
   and one "Fast-track" card for every paper + faculty pair.
   So you never add single products by hand — you only add PRICES,
   COMBOS, PRODUCT DETAILS and FACULTY INFO in the tables below.
   ============================================================ */

const BATCH_TYPES = {
  regular:   { key:'regular',   label:'Regular',          tag:'Regular Lectures' },
  fasttrack: { key:'fasttrack', label:'Fast-track',       tag:'Fast-track Lectures' },
  writing:   { key:'writing',   label:'Writing Practice', tag:'Writing Practice Lectures' }
};

/* ============================================================
   CARD COLOURS — the soft background behind the faculty photo
   ------------------------------------------------------------
   Every exam level has its own pair of colours: one for the Regular cards and one for the
   Fast-track cards. Each colour is [top-left light shade, bottom-right slightly deeper shade].
   They are kept very light on purpose, so both dark and light clothes look good in front of them.
   To change a colour, just replace the two hex codes.
   (The red "Regular Lectures / Fast-track Lectures" tag is always red — it is not set here.)
   ============================================================ */
const CARD_TONES = {
  'CA|Foundation':  { regular:['#E4EEFB','#C9DBF3'], fasttrack:['#FDE9DC','#F7D1B8'] },   // light blue   / peach
  'CA|Intermediate':{ regular:['#E0F5E9','#BFE6CF'], fasttrack:['#FBE4EA','#F4C3D1'] },   // mint green   / light pink
  'CA|Final':       { regular:['#ECE7F9','#D3C9EF'], fasttrack:['#FBF3D2','#F2E39F'] },   // lavender     / butter
  'CMA|Foundation': { regular:['#DDF1F5','#B9E1EA'], fasttrack:['#FCE0C9','#F5BF93'] },   // sky          / apricot
  'CMA|Intermediate':{regular:['#E7EFD9','#CADDB0'], fasttrack:['#F3E3F5','#E2BFE8'] },   // sage         / orchid
  'CMA|Final':      { regular:['#E3E7FA','#C4CCF1'], fasttrack:['#FBDDD8','#F4B8AF'] },   // periwinkle   / coral
  'CS|CSEET':       { regular:['#EAE8E4','#D2CFC8'], fasttrack:['#D9F0EC','#AEDDD5'] },   // warm grey    / teal
  'CS|Executive':   { regular:['#E1E7EE','#BFCBD8'], fasttrack:['#F2EAD9','#E2D1AE'] },   // slate        / sand
  'CS|Professional':{ regular:['#EBF3CE','#D2E39B'], fasttrack:['#F5E2DD','#E8C2B9'] }    // lime         / rose
};
function getCardTone(course, level, batch){
  const t = CARD_TONES[course + '|' + level];
  if(batch === 'writing') return (t && t.writing) || ['#FFF3C4','#FBE08A'];     // Writing Practice cards: soft lemon
  return (t && t[batch]) || ['#EAE8E4','#D2CFC8'];
}

/* the small line shown under the exam name on every card — set to '' to hide it */
const CARD_TAGLINE = 'NEW RECORDED';

/* Faculty shown first (in this exact order) — then the second list — then everyone else.
   Names are matched ignoring capital letters and full stops, so "Prof. A. Sourav Patro"
   and "Prof. A Sourav Patro" are treated as the same person. */
const FACULTY_ORDER_FIRST = [
  "Prof. Abanindra Sahu","Prof. Abhisek Mahapatro","Prof. A. Sourav Patro","Prof. Suvraprasad Tripathy",
  "Prof. Prateek Nanda","Prof. SP Praveen K Rao","Prof. Aayush Dash"
];
const FACULTY_ORDER_SECOND = [
  "CA Vijay Sarda","CA Vishal Bhattad","CA Sneha Budhia","CA Pranay Gangan",
  "CA Shubham Singhal","CA Bhanwar Borana","CA Parveen Sharma","CA Rishabh Jain"
];

function normName(n){
  return String(n || '').toLowerCase().replace(/\./g,' ').replace(/\s+/g,' ').trim();
}
function slugify(n){
  return normName(n).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
/* returns {tier, idx}: tier 0 = first list, 1 = second list, 2 = everyone else */
function facultyTier(name){
  const k = normName(name);
  let i = FACULTY_ORDER_FIRST.findIndex(f => normName(f) === k);
  if(i > -1) return { tier:0, idx:i };
  i = FACULTY_ORDER_SECOND.findIndex(f => normName(f) === k);
  if(i > -1) return { tier:1, idx:i };
  return { tier:2, idx:0 };
}

/* paper numbers: "Paper 3A" -> "Paper-3A" (cards) and "P3A" (filters, lists) */
function paperLabel(no){ return String(no || '').replace(/^Paper\s*/i, 'Paper-'); }
function paperShort(no){ return 'P' + String(no || '').replace(/^Paper\s*/i, ''); }

function getShortExamLabel(course, level){
  if(course === 'CS' && level === 'CSEET') return 'CSEET';
  const map = { Foundation:'Foundation', Intermediate:'Inter', Final:'Final', Executive:'Executive', Professional:'Professional' };
  return course + ' ' + (map[level] || level);
}

/* Short forms of subject names, used on combo cards ("ADV. ACC + LAW + DT + GST").
   Anything not listed here gets an automatic short form made from its capital letters. */
const SUBJECT_SHORT = {
  "Principles and Practice of Accounting":"ACC", "Business Laws":"LAW", "Quantitative Aptitude":"QA", "Business Economics":"BE",
  "Advanced Accounting":"ADV. ACC", "Corporate & Other Laws":"LAW", "Income Tax Law":"DT", "Goods and Service Tax":"GST",
  "Cost and Management Accounting":"COST", "Auditing and Ethics":"AUDIT", "Financial Management":"FM", "Strategic Management":"SM",
  "Financial Reporting":"FR", "Advanced Financial Management":"AFM", "Advanced Auditing, Assurance & Professional Ethics":"AUDIT",
  "Direct Tax Laws & International Taxation":"DT", "Indirect Tax Laws":"IDT",
  "Fundamentals of Business Laws and Business Communication":"LAW & COMM", "Fundamentals of Financial and Cost Accounting":"FCA",
  "Fundamentals of Business Mathematics and Statistics":"BMS", "Fundamentals of Business Economics and Management":"BEM",
  "Business Laws and Ethics":"LAW", "Financial Accounting":"FA", "Direct Taxation":"DT", "Indirect Taxation":"IDT", "Cost Accounting":"COST",
  "Operations Management and Strategic Management":"OM & SM", "Operations Management":"OM", "Corporate Accounting and Auditing":"CAA",
  "Financial Management and Business Data Analytics":"FM & BDA", "Management Accounting":"MA",
  "Corporate and Economic Laws":"CEL", "Strategic Financial Management":"SFM", "Direct Tax Laws and International Taxation":"DT",
  "Strategic Cost Management":"SCM", "Cost and Management Audit":"AUDIT", "Corporate Financial Reporting":"CFR",
  "Indirect Tax Laws and Practice":"IDT", "Strategic Performance Management and Business Valuation":"SPM",
  "Business Communication":"COMM", "Legal Aptitude and Logical Reasoning":"LAW & LR", "Economic and Business Environment":"EBE",
  "Current Affairs and Quantitative Aptitude":"CA & QA",
  "Company Law and Practice":"COMPANY LAW", "Drafting, Pleadings and Appearances":"DPA",
  "Compliance Management, Audit and Due Diligence":"CMADD", "Strategic Management and Corporate Finance":"SMCF",
  "Corporate Restructuring, Valuation and Insolvency":"CRVI"
};
function getSubjectShort(name){
  if(SUBJECT_SHORT[name]) return SUBJECT_SHORT[name];
  const m = String(name).match(/\(([A-Z&]{2,8})\)\s*$/);          // e.g. "... (JIGL)" -> JIGL
  if(m) return m[1];
  const initials = String(name).split(/[\s,]+/).filter(w => /^[A-Za-z]/.test(w) && !/^(and|of|the|&)$/i.test(w)).map(w => w[0].toUpperCase()).join('');
  return initials || String(name).toUpperCase();
}

/* Faculty initials for combo titles, e.g. "CA Aakash Kandoi" -> AK  (CA Inter Group 1 Regular Lectures_AK_DK_VS) */
function facultyInitials(name){
  const words = String(name).replace(/\./g,' ').split(/\s+/).filter(Boolean)
    .filter(w => !/^(prof|dr|ca|cs|cma|cfa|mr|mrs|ms)$/i.test(w));
  return words.map(w => (w === w.toUpperCase() && w.length <= 3) ? w : w[0].toUpperCase()).join('');
}

/* Builds the full ordered product list for one exam (e.g. CA + Intermediate). */
function buildCatalog(course, level){
  if(isCurated(course, level)) return buildCuratedCatalog(course, level);
  const papers = (COURSES[course] && COURSES[course][level]) || [];
  const entries = [];
  const firstSeen = {};
  let seenCounter = 0;
  papers.forEach((paper, pIdx)=>{
    paper.faculty.forEach((fac)=>{
      const k = normName(fac);
      if(firstSeen[k] === undefined) firstSeen[k] = seenCounter++;
      const t = facultyTier(fac);
      entries.push({ paper, pIdx, faculty:fac, tier:t.tier, idx:t.idx, seen:firstSeen[k] });
    });
  });
  const byOrder = (a, b)=>{
    if(a.idx !== b.idx) return a.idx - b.idx;
    if(a.seen !== b.seen) return a.seen - b.seen;
    return a.pIdx - b.pIdx;
  };
  const first  = entries.filter(e => e.tier === 0).sort(byOrder);
  const second = entries.filter(e => e.tier === 1).sort(byOrder);
  const others = entries.filter(e => e.tier === 2).sort(byOrder);

  const seq = [];
  first.forEach(e  => seq.push({ e, batch:'regular' }));                                          // 1) our own faculties: REGULAR lectures only (never fast-track)
  second.forEach(e => { seq.push({ e, batch:'regular' }); seq.push({ e, batch:'fasttrack' }); }); // 2) regular + fast-track, one by one
  others.forEach(e => { seq.push({ e, batch:'regular' }); seq.push({ e, batch:'fasttrack' }); }); // 3) everyone else

  const list = seq.map(x => makeSingleProduct(course, level, x.e.paper, x.e.faculty, x.batch));
  const combos = buildCombos(course, level);                                                       // 5) combos (when you add them)
  const all = list.concat(combos);
  all.forEach((p, i) => { p.rank = i; });
  return all;
}

function makeSingleProduct(course, level, paper, faculty, batch){
  const id = slugify([course, level, paper.no, faculty, batch].join(' '));
  const p = {
    id,
    category:'single',
    course, level,
    examLabel: getShortExamLabel(course, level),
    examFull: getExamLabelSafe(course, level),
    batch,
    group: paper.group || '',
    subjects:[ paper.name ],
    faculties:[ faculty ],
    items:[ { paperNo:paper.no, paperName:paper.name, faculty } ],
    paperNo: paper.no
  };
  p.title = p.examLabel + ' ' + paper.name + ' ' + BATCH_TYPES[batch].label + ' Lectures by ' + faculty;
  const pr = getPriceInfo(p);
  p.pricing = (pr.price > 0) ? { fixed:{ price:pr.price, mrp:pr.mrp || null, disc:pr.discount || 0 } } : null;
  applyCardPrice(p);
  return p;
}

function getExamLabelSafe(course, level){
  return (course === 'CS' && level === 'CSEET') ? 'CSEET' : (course + ' ' + level);
}

/* ============================================================
   INSTITUTES — internal bookkeeping only (the website NEVER shows these names).
   Our own faculties are "AP"; every other code is an associate institute.
   The order below is the order the cards are shown in (after our own faculties).
   ============================================================ */
const INSTITUTES = {
  AP:  'Ambitious Professionals',
  BB:  'BB Virtuals',
  VS:  'Vsmart Academy',
  EK:  'Ekatvam Academy',
  AL:  'Aldine CA',
  SPC: 'Swapnil Patni Classes (SPC)'
};
const INSTITUTE_ORDER = {
  CA:  ['AP','BB','VS','EK','AL','SPC'],
  CMA: ['AP','EK','VS','BB']
};
function instituteRank(course, code){
  const order = INSTITUTE_ORDER[course] || INSTITUTE_ORDER.CA;
  const i = order.indexOf(code);
  return i < 0 ? 99 : i;
}

/* ============================================================
   FEATURES (Swapnil Patni Classes — Regular lectures)
   ============================================================ */
const FEATURE_NAMES = ['Silver','Gold','Platinum'];
const FEATURE_VIEWS = { Silver:'1 Live + 2 Recorded', Gold:'1 Live + 3 Recorded', Platinum:'1 Live + Unlimited' };

/* What the Product Info tab shows when "Offline Face to Face" is chosen (left column | right column) */
const OFFLINE_INFO_ROWS = [
  ['Stay Upto',       'Stay upto Batch end (If you have opted for IPP Batch, stay is valid till your Attempt)'],
  ['Tests',           '4 Class tests for each Subject'],
  ['Food',            'Included (Breakfast, Lunch & Dinner)'],
  ['Transport',       'Included in Fees'],
  ['Laundry',         'Included in Fees'],
  ['Library',         'Multiple Library Access (24×7)'],
  ['Only CA Students','Yes, From Across India'],
  ['Application',     'Live Stream Access (with Backup)'],
  ['Security',        '24×7 CCTV Surveillance'],
  ['Cafeteria',       'Yes, In The Premises'],
  ['Parent Reporting','Test Marks & Attendance via Parents Login']
];

/* ============================================================
   SYSTEM REQUIREMENTS (copied from the product sheets)
   ============================================================ */
const SYS = {
  BB: 'Windows\nSupports both laptop and desktop\nMinimum processor: 64-bit\nMinimum RAM: 4 GB\nWindows 10 or above\n\nAndroid\nMinimum RAM: 2 GB (Recommended: 4 GB)\nMinimum Android version: 11 or above\nMinimum free space required: 2 GB or more\n\niOS\niOS (Apple) devices are supported\nDevice should have good performance\niOS version 17 or above\n\nmacOS\nmacOS 14 or above\nApple Silicon (M1 chip or above)\n(Intel-based Macs are not supported.)',
  VS: 'Laptop, Tablet & Mobile Devices (Lectures would be played on any one device, either Windows or Android.)',
  EK: 'Windows\nLaptop & Desktop both supported\nMinimum Processor: Pentium D\nMinimum RAM: 4 GB\nSupported OS: Windows 7, 8, 10\nNote: Windows 7 Home Basic version is not supported\n\nAndroid\nMinimum RAM: 4 GB\nMinimum Android Version: 7.0 and above\nDevice should offer good performance\n\niOS\niPhone: Requires iOS 12.1 or later\niPad: Requires iPadOS 12.1 or later\nMac Laptops are not supported',
  SPC: 'Android Devices\nAndroid 10 or above\nMinimum 4 GB RAM\nAll processors except MediaTek supported\n\niOS Devices\niOS 17 or above\n\nWindows Laptop\nFor i3 laptops, minimum 10th generation processor required\nFor i5 and above, minimum 6th generation processor required\nMinimum clock speed: 2.0 GHz\nLectures will not play on a PC\nOS: Windows 10 or higher (10 N not supported)\nRAM: Minimum 4 GB\n\nmacOS Devices\nMacBook Pro and MacBook Air 2016 or later\nmacOS 13 Ventura or newer\n\nInternet Requirement\nMinimum 10 Mbps speed\nStable internet connection required',
  CMAF: 'A stable internet connection and compatible device are recommended for best experience.',
  ALLDEV: 'Windows Laptop, Android, Mac Book, IOS Devices',
  BBV: 'Video Runs On Windows Based Computer , Laptop, Mobile Operating',
  JAL: 'Android Mobile: Android 10 | 4 GB Ram | (This application is not supported in iPhone/iPad/MacBook)\nLaptop: Windows 10 & above | System type (64-bit) | Processor (3.30Ghz) | RAM (4GB & Above)',
  SHIV: 'Video Runs on Either Windows/Android\nRequirements for Windows:\n• Windows 7 & Above'
};

/* price helper:  fx(price, mrp, discount%)   — no mrp means "show the price only" */
function fx(price, mrp, disc){ return { price:price, mrp:(mrp && mrp > 0) ? mrp : null, disc:disc || 0 }; }

/* all ways of picking n items out of a list, and all ways of picking one item from each list */
function combinations(arr, n){
  const out = [];
  (function rec(start, cur){
    if(cur.length === n){ out.push(cur.slice()); return; }
    for(let i = start; i < arr.length; i++){ cur.push(arr[i]); rec(i + 1, cur); cur.pop(); }
  })(0, []);
  return out;
}
function crossPick(groups){
  let out = [[]];
  groups.forEach(g => {
    const next = [];
    out.forEach(o => g.forEach(x => next.push(o.concat([x]))));
    out = next;
  });
  return out;
}
/* turns a list of part keys into combo rows sharing one price/format */
function comboRows(prefix, inst, batch, partLists, pricing, extra){
  return partLists.map(parts => Object.assign({ k: prefix + '-' + parts.join('-'), inst:inst, batch:batch, parts:parts, pricing:pricing }, extra || {}));
}
/* a Swapnil Patni Classes (SPC) product: 3 features, each with its own price */
function spcPricing(silver, gold, platinum){ return { feature:{ Silver:silver, Gold:gold, Platinum:platinum } }; }
const SPC_SINGLE = spcPricing(fx(4999, 6999, 29), fx(5999, 6999, 14), fx(6999, 6999, 0));
const SPC_COMBO_PRICES = spcPricing(fx(15000, 18000, 17), fx(18000, 18000, 0), fx(21000, 18000, -17));
const SPC_GURUKUL = {
  'SPC Gurukul':                  fx(140000, 155000, 10),
  'SPC Gurukul with IPP till Exam': fx(165000, 185000, 11)
};
const BB_FT_SUBJECTS = ['bb2','bb4','bb7','bb9'];

/* ============================================================
   THE PRODUCT SHEETS  (CA Foundation, CMA Foundation, CMA Intermediate)
   ------------------------------------------------------------
   k       = short name of the product (used inside combos)       inst  = institute code
   paper   = which paper                                          fac   = faculty / faculties teaching it
   batch   = 'regular' / 'fasttrack' / 'writing'                  pricing = see the helpers above
   info    = the Product Info rows:  lectures, duration, validity, views, mat (study material), sys
             duration: a number means hours, "1.5m" means months.  validity: "10m" = 10 months, "1y" = 1 year
             "6m/12m" means the buyer picks one (the price list then has an axis).
   Our own (Ambitious Professionals) faculties are NOT listed here — they come from the COURSES list
   (Regular lectures only, prices left blank).
   ============================================================ */
const CURATED = {

'CA|Foundation': {
  singles: [
    /* ---------- BB Virtuals ---------- */
    {k:'bb1',  inst:'BB', paper:'Paper 1', fac:['CA Hardik Manchanda'], batch:'regular',
      pricing:{fixed:fx(4000, 4500, 11)},
      info:{lectures:'100', duration:'220', validity:'10m', views:'2', mat:'2 Books (Question Bank - Module 1 & Module 2)', sys:SYS.BB}},
    {k:'bb2',  inst:'BB', paper:'Paper 1', fac:['CA Hardik Manchanda'], batch:'fasttrack',
      pricing:{fixed:fx(3500)},
      info:{lectures:'55-60', duration:'150', validity:'10m', views:'2', mat:'1. Handwritten Notes\n2. 2 Question Bank (Covering All Study Material Questions and Important PYQs, RTPs Questions)', sys:SYS.BB}},
    {k:'bb3',  inst:'BB', paper:'Paper 2', fac:['CS Arjun Chhabra'], batch:'regular',
      pricing:{fixed:fx(5500, 6000, 8)},
      info:{lectures:'70-75', duration:'150', validity:'10m', views:'2', mat:'Total 3 (1 Concept Book | Question Bank | Chart Book)', sys:SYS.BB}},
    {k:'bb4',  inst:'BB', paper:'Paper 2', fac:['CS Arjun Chhabra'], batch:'fasttrack',
      pricing:{fixed:fx(3500)},
      info:{lectures:'40', duration:'80', validity:'10m', views:'2', mat:"1. Concept Book\n2. Chart Book\n3. Bull's Eye Latest Edition. (Question Bank)\nNote: All past exam questions, MTPs, RTPs and self-drafted questions by Arjun Sir include answers of the same", sys:SYS.BB}},
    {k:'bb5',  inst:'BB', paper:'Paper 2', fac:['CS Arjun Chhabra'], batch:'writing',
      pricing:{fixed:fx(699, 899, 22)},
      info:{lectures:'5', duration:'25', validity:'1y', views:'1.5', mat:'NA', sys:SYS.BB}},
    {k:'bb6',  inst:'BB', paper:'Paper 3', fac:['Prof. Akash Agrawal'], batch:'regular',
      pricing:{fixed:fx(5000, 5500, 9)},
      info:{lectures:'80', duration:'180', validity:'10m', views:'2', mat:'3 Coloured Printed Books\nSuper Chart PRO\nMCQ Compiler PRO\nPocket Book', sys:SYS.BB}},
    {k:'bb7',  inst:'BB', paper:'Paper 3', fac:['Prof. Akash Agrawal'], batch:'fasttrack',
      pricing:{fixed:fx(3500)},
      info:{lectures:'50-55', duration:'150', validity:'10m', views:'2', mat:'1. Super Chart - EO Version\n2. Mcq\'s Compiler - EO Version\n3. Pocket Book', sys:SYS.BB}},
    {k:'bb8',  inst:'BB', paper:'Paper 4', fac:['CA Mohnish Vora'], batch:'regular',
      pricing:{fixed:fx(4499, 5499, 18)},
      info:{lectures:'90', duration:'180', validity:'10m', views:'2', mat:'3 Books (Concept Book - Micro & Macro & MCQ Book)', sys:SYS.BB}},
    {k:'bb9',  inst:'BB', paper:'Paper 4', fac:['CA Mohnish Vora'], batch:'fasttrack',
      pricing:{fixed:fx(3500)},
      info:{lectures:'60', duration:'120', validity:'10m', views:'2', mat:'', sys:SYS.BB}},
    {k:'bb10', inst:'BB', paper:'Paper 4', fac:['CA Hardik Manchanda'], batch:'regular',
      pricing:{fixed:fx(4000, 4500, 11)},
      info:{lectures:'90', duration:'180', validity:'10m', views:'2', mat:'3 Books (Maths Stats Notes, Question Bank, PYQs)', sys:SYS.BB}},

    /* ---------- Vsmart Academy (upcoming attempt = first price, later attempts = second price) ---------- */
    {k:'vs23', inst:'VS', paper:'Paper 1', fac:['CA Parag Gupta'], batch:'regular',
      pricing:{attempt:[fx(5999), fx(6124)]},
      info:{lectures:'---', duration:'150', validity:'Till Exam', views:'5', mat:'Printed Books', sys:SYS.VS}},
    {k:'vs24', inst:'VS', paper:'Paper 4', fac:['CA Parag Gupta'], batch:'regular',
      pricing:{attempt:[fx(3999), fx(4124)]},
      info:{lectures:'---', duration:'100', validity:'Till Exam', views:'5', mat:'Printed Books', sys:SYS.VS}},
    {k:'vs26', inst:'VS', paper:'Paper 2', fac:['CA Amol Jain'], batch:'fasttrack',
      pricing:{fixed:fx(1999)},
      info:{lectures:'---', duration:'---', validity:'Till Exam', views:'5', mat:'Printed Books', sys:SYS.VS}},
    {k:'vs27', inst:'VS', paper:'Paper 2', fac:['CA Amol Jain'], batch:'regular',
      pricing:{attempt:[fx(4999), fx(5124)]},
      info:{lectures:'---', duration:'120', validity:'Till Exam', views:'5', mat:'Printed Books', sys:SYS.VS}},
    {k:'vs28', inst:'VS', paper:'Paper 3', fac:['CA Aman Kedia'], batch:'regular',
      pricing:{attempt:[fx(5999), fx(6124)]},
      info:{lectures:'---', duration:'150', validity:'Till Exam', views:'5', mat:'Printed Books', sys:SYS.VS}},
    {k:'vs29', inst:'VS', paper:'Paper 3', fac:['CA Aman Kedia'], batch:'fasttrack',
      pricing:{fixed:fx(3999)},
      info:{lectures:'---', duration:'---', validity:'Till Exam', views:'5', mat:'Printed Books', sys:SYS.VS}},

    /* ---------- Ekatvam Academy ---------- */
    {k:'ek33', inst:'EK', paper:'Paper 1', fac:['CA Manish Tardeja'], batch:'fasttrack',
      pricing:{fixed:fx(4000)},
      info:{lectures:'---', duration:'1.5m', validity:'12m', views:'1', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'ek34', inst:'EK', paper:'Paper 1', fac:['CA Abhishek Zaware','CA Manish Tardeja'], batch:'regular',
      pricing:{fixed:fx(8000)},
      info:{lectures:'100', duration:'200', validity:'12m', views:'2', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'ek35', inst:'EK', paper:'Paper 3', fac:['Prof. G. B. Joshi'], batch:'regular',
      pricing:{fixed:fx(8000)},
      info:{lectures:'100', duration:'200', validity:'12m', views:'2', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'ek36', inst:'EK', paper:'Paper 3', fac:['Prof. G. B. Joshi'], batch:'fasttrack',
      pricing:{fixed:fx(4000)},
      info:{lectures:'---', duration:'1.5m', validity:'12m', views:'1', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'ek37', inst:'EK', paper:'Paper 4', fac:['CA Vijay Sarda','CA Manish Tardeja'], batch:'fasttrack',
      pricing:{fixed:fx(4000)},
      info:{lectures:'---', duration:'1.5m', validity:'12m', views:'1', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'ek38', inst:'EK', paper:'Paper 4', fac:['CA Vijay Sarda','CA Manish Tardeja'], batch:'regular',
      pricing:{fixed:fx(6299, 6999, 10)},
      info:{lectures:'---', duration:'200', validity:'12m', views:'2', mat:'Hard Copy Notes', sys:SYS.EK}},

    /* ---------- Swapnil Patni Classes (SPC): Regular = Silver / Gold / Platinum ---------- */
    {k:'spc39', inst:'SPC', paper:'Paper 1', fac:['CA Anand Bhangariya'], batch:'regular', pricing:SPC_SINGLE, freeFT:'spc46',
      info:{lectures:'96', duration:'152', validity:'12m', views:'FEATURE', mat:'4 Books', sys:SYS.SPC}},
    {k:'spc40', inst:'SPC', paper:'Paper 1', fac:['CA Tejas Suchak'], batch:'regular', pricing:SPC_SINGLE, freeFT:'spc47',
      info:{lectures:'99', duration:'152', validity:'12m', views:'FEATURE', mat:'2 Books', sys:SYS.SPC}},
    {k:'spc41', inst:'SPC', paper:'Paper 2', fac:['CA Ankita Patni'], batch:'regular', pricing:SPC_SINGLE, freeFT:'spc48',
      info:{lectures:'95', duration:'150', validity:'12m', views:'FEATURE', mat:'2 Books', sys:SYS.SPC}},
    {k:'spc42', inst:'SPC', paper:'Paper 2', fac:['CA Indresh Gandhi'], batch:'regular', pricing:SPC_SINGLE, freeFT:'spc49',
      info:{lectures:'93', duration:'130', validity:'12m', views:'FEATURE', mat:'4 Books', sys:SYS.SPC}},
    {k:'spc43', inst:'SPC', paper:'Paper 3', fac:['CA Vinod Reddy'], batch:'regular', pricing:SPC_SINGLE, freeFT:'spc50',
      info:{lectures:'100', duration:'200', validity:'12m', views:'FEATURE', mat:'3 Books', sys:SYS.SPC}},
    {k:'spc44', inst:'SPC', paper:'Paper 3', fac:['CA Pranav Popat'], batch:'regular', pricing:SPC_SINGLE, freeFT:'spc51',
      info:{lectures:'84', duration:'152', validity:'12m', views:'FEATURE', mat:'3 Books', sys:SYS.SPC}},
    {k:'spc45', inst:'SPC', paper:'Paper 4', fac:['CA Swapnil Patni','CA Adarsh Joshi'], batch:'regular', pricing:SPC_SINGLE,
      info:{lectures:'84', duration:'150', validity:'12m', views:'FEATURE', mat:'3 Books', sys:SYS.SPC}},
    {k:'spc46', inst:'SPC', paper:'Paper 1', fac:['CA Anand Bhangariya'], batch:'fasttrack', pricing:{fixed:fx(2999, 4999, 40)},
      info:{lectures:'74', duration:'109', validity:'6m', views:'Unlimited', mat:'3 Books', sys:SYS.SPC}},
    {k:'spc47', inst:'SPC', paper:'Paper 1', fac:['CA Tejas Suchak'], batch:'fasttrack', pricing:{fixed:fx(2999, 4999, 40)},
      info:{lectures:'60', duration:'130', validity:'6m', views:'Unlimited', mat:'2 Books', sys:SYS.SPC}},
    {k:'spc48', inst:'SPC', paper:'Paper 2', fac:['CA Ankita Patni'], batch:'fasttrack', pricing:{fixed:fx(2999, 4999, 40)},
      info:{lectures:'76', duration:'102', validity:'6m', views:'Unlimited', mat:'3 Books', sys:SYS.SPC}},
    {k:'spc49', inst:'SPC', paper:'Paper 2', fac:['CA Indresh Gandhi'], batch:'fasttrack', pricing:{fixed:fx(2999, 4999, 40)},
      info:{lectures:'50', duration:'85', validity:'6m', views:'Unlimited', mat:'2 Books', sys:SYS.SPC}},
    {k:'spc50', inst:'SPC', paper:'Paper 3', fac:['CA Vinod Reddy'], batch:'fasttrack', pricing:{fixed:fx(2999, 4999, 40)},
      info:{lectures:'50', duration:'100', validity:'6m', views:'Unlimited', mat:'NA', sys:SYS.SPC}},
    {k:'spc51', inst:'SPC', paper:'Paper 3', fac:['CA Pranav Popat'], batch:'fasttrack', pricing:{fixed:fx(2999, 4999, 40)},
      info:{lectures:'42', duration:'95', validity:'6m', views:'Unlimited', mat:'3 Books', sys:SYS.SPC}},
    {k:'spc52', inst:'SPC', paper:'Paper 2', fac:['CA Ankita Patni'], batch:'writing', pricing:{fixed:fx(599, 2599, 77)},
      info:{lectures:'---', duration:'---', validity:'3m', views:'2', mat:'NA', sys:SYS.SPC}}
  ],
  combos: [].concat(
    /* ---------- BB Virtuals: Fast-track combos ---------- */
    comboRows('bbft2', 'BB', 'fasttrack', combinations(BB_FT_SUBJECTS, 2), {fixed:fx(6300, 7000, 10)}),
    comboRows('bbft3', 'BB', 'fasttrack', combinations(BB_FT_SUBJECTS, 3), {fixed:fx(8925, 10500, 15)}),
    comboRows('bbft4', 'BB', 'fasttrack', combinations(BB_FT_SUBJECTS, 4), {fixed:fx(9999, 12999, 23)}),
    /* ---------- BB Virtuals: Regular combos ---------- */
    comboRows('bbc14', 'BB', 'regular', [['bb3','bb6','bb8']],        {fixed:fx(13500, 15000, 10)}),
    comboRows('bbc15', 'BB', 'regular', [['bb3','bb6','bb10']],       {fixed:fx(13050, 14500, 10)}),
    comboRows('bbc16', 'BB', 'regular', [['bb3','bb10']],             {fixed:fx(8500, 9500, 11)}),
    comboRows('bbc17', 'BB', 'regular', [['bb1','bb3','bb6']],        {fixed:fx(13050, 14500, 10)}),
    comboRows('bbc18', 'BB', 'regular', [['bb1','bb3','bb10']],       {fixed:fx(12150, 13500, 10)}),
    comboRows('bbc19', 'BB', 'regular', [['bb1','bb3','bb8']],        {fixed:fx(12600, 14000, 10)}),
    comboRows('bbc20', 'BB', 'regular', [['bb1','bb10']],             {fixed:fx(7000, 8000, 13)}),
    comboRows('bbc21', 'BB', 'regular', [['bb1','bb3','bb6','bb8']],  {fixed:fx(16499, 18999, 13)}),
    comboRows('bbc22', 'BB', 'regular', [['bb1','bb3','bb6','bb10']], {fixed:fx(15999, 18499, 14)}),
    /* ---------- Vsmart Academy ---------- */
    comboRows('vsc25', 'VS', 'regular',   [['vs23','vs24']],                     {attempt:[fx(8999), fx(9249)]}),
    comboRows('vsc30', 'VS', 'fasttrack', [['vs26','vs29']],                     {attempt:[fx(4999), fx(5499)]}),
    comboRows('vsc31', 'VS', 'regular',   [['vs23','vs27','vs28','vs24']],       {attempt:[fx(17999), fx(18499)]}),
    comboRows('vsc32', 'VS', 'regular',   [['vs27','vs28']],                     {attempt:[fx(9999), fx(10249)]}),
    /* ---------- SPC: one from each subject (every possible mix) ---------- */
    comboRows('spcc', 'SPC', 'regular',
      crossPick([['spc39','spc40'], ['spc41','spc42'], ['spc43','spc44'], ['spc45']]),
      SPC_COMBO_PRICES)
  )
},

'CMA|Foundation': {
  singles: [
    {k:'ekf1', inst:'EK', paper:'Paper 1', fac:['CS Satish Baheti'],  batch:'regular', pricing:{fixed:fx(3500)},
      info:{lectures:'---', duration:'---', validity:'6m', views:'Unlimited', mat:'Included', sys:SYS.CMAF}},
    {k:'ekf2', inst:'EK', paper:'Paper 2', fac:['CA Sneha Budhia'],   batch:'regular', pricing:{fixed:fx(3500)},
      info:{lectures:'---', duration:'---', validity:'6m', views:'Unlimited', mat:'Included', sys:SYS.CMAF}},
    {k:'ekf3', inst:'EK', paper:'Paper 3', fac:['CA Pranay Gangan'],  batch:'regular', pricing:{fixed:fx(3500)},
      info:{lectures:'---', duration:'---', validity:'6m', views:'Unlimited', mat:'Included', sys:SYS.CMAF}},
    {k:'ekf4', inst:'EK', paper:'Paper 4', fac:['CA Simran Rajani'],  batch:'regular', pricing:{fixed:fx(3500)},
      info:{lectures:'---', duration:'---', validity:'6m', views:'Unlimited', mat:'Included', sys:SYS.CMAF}}
  ],
  combos: []
},

'CMA|Intermediate': {
  singles: [
    /* ---------- Ekatvam Academy ---------- */
    {k:'e1',  inst:'EK', paper:'Paper 7B', fac:['CA Vishal Bhattad'], batch:'regular', pricing:{fixed:fx(7999)},
      info:{lectures:'40', duration:'130', validity:'Unlimited upto 2yrs', views:'1.5', mat:'1. GST Regular Module\n2. GST Questionnaire\n3. Chart Book', sys:SYS.ALLDEV}},
    {k:'e2',  inst:'EK', paper:'Paper 7A', fac:['CA Vijay Sarda'], batch:'regular',
      pricing:{axis:{key:'views', opts:[['1.5', fx(8000)], ['2', fx(10000)]]}},
      info:{lectures:'65', duration:'150-170', validity:'Unlimited', views:'1.5/2', mat:'Regular Module 1, QnA Book, Add. Book', sys:SYS.EK}},
    {k:'e3',  inst:'EK', paper:'Paper 8', fac:['CA Pranay Gangan'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(5000)], ['12m', fx(7000)]]}},
      info:{lectures:'70', duration:'120', validity:'6m/12m', views:'Unlimited', mat:'Regular Book, MRP Book (Questionnaire)', sys:SYS.EK}},
    {k:'e4',  inst:'EK', paper:'Paper 7B', fac:['CA Karan Satija'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(4000)], ['12m', fx(6000)]]}},
      info:{lectures:'60', duration:'120', validity:'6m/12m', views:'Unlimited', mat:'Concise Book, MRP Book (Questionnaire)', sys:SYS.EK}},
    {k:'e5',  inst:'EK', paper:'Paper 5', fac:['CS Satish Baheti'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(5000)], ['12m', fx(7000)]]}},
      info:{lectures:'59', duration:'130', validity:'6m/12m', views:'Unlimited', mat:'Concept Book & Questionbank', sys:SYS.EK}},
    {k:'e6',  inst:'EK', paper:'Paper 6', fac:['CA Sneha Budhia'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(5000)], ['12m', fx(7000)]]}},
      info:{lectures:'60-65', duration:'120-130', validity:'6m/12m', views:'Unlimited', mat:'Concept Book & Questionbank', sys:SYS.EK}},
    {k:'e7',  inst:'EK', paper:'Paper 9A', fac:['CA Pranay Gangan'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(2500)], ['12m', fx(3500)]]}},
      info:{lectures:'50', duration:'85', validity:'6m/12m', views:'Unlimited', mat:'Concise Book, MRP Book (Questionnaire)', sys:SYS.EK}},
    {k:'e8',  inst:'EK', paper:'Paper 9B', fac:['CA Simran Rajani'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(2000)], ['12m', fx(3000)]]}},
      info:{lectures:'20', duration:'40', validity:'6m/12m', views:'Unlimited', mat:'Concise Book, MRP Book (Questionnaire)', sys:SYS.EK}},
    {k:'e10', inst:'EK', paper:'Paper 10', fac:['CA CMA Abhimanyyu Agarrwal'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['Std', fx(3999)], ['6m', fx(6400)], ['12m', fx(7300)]]}},
      info:{lectures:'66+39', duration:'110+66', validity:'Standard/6m/12m', views:'Unlimited', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'e11', inst:'EK', paper:'Paper 10', fac:['CA Sneha Budhia'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(5000)], ['12m', fx(7000)]]}},
      info:{lectures:'60', duration:'120', validity:'6m/12m', views:'Unlimited', mat:'Module 1 - Corporate Accounts\nModule 2 - Auditing', sys:SYS.EK}},
    {k:'e12', inst:'EK', paper:'Paper 11', fac:['CA Utkarsh Mehta'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(4000)], ['12m', fx(5000)]]}},
      info:{lectures:'65', duration:'130', validity:'6m/12m', views:'Unlimited', mat:'Regular Book, MRP Book (Questionnaire)', sys:SYS.EK}},
    {k:'e13', inst:'EK', paper:'Paper 6', fac:['CA CMA Abhimanyyu Agarrwal'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['Std', fx(3999)], ['6m', fx(6400)], ['12m', fx(7300)]]}},
      info:{lectures:'145', duration:'250', validity:'Standard/6m/12m', views:'Unlimited', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'e14', inst:'EK', paper:'Paper 12', fac:['CA Satish Jalan'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(7999)], ['12m', fx(8999)]]}},
      info:{lectures:'---', duration:'---', validity:'6m/12m', views:'Unlimited', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'e15', inst:'EK', paper:'Paper 8', fac:['CA CMA Ashutosh Lata'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(6000)], ['12m', fx(7000)]]}},
      info:{lectures:'85', duration:'170', validity:'6m/12m', views:'Unlimited', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'e16', inst:'EK', paper:'Paper 12', fac:['CA CMA Ashutosh Lata'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(6000)], ['12m', fx(7000)]]}},
      info:{lectures:'75', duration:'150', validity:'6m/12m', views:'Unlimited', mat:'Hard Copy Notes', sys:SYS.EK}},
    {k:'e17', inst:'EK', paper:'Paper 8', fac:['CA Satish Jalan'], batch:'regular',
      pricing:{axis:{key:'validity', opts:[['6m', fx(8999)], ['12m', fx(9999)]]}},
      info:{lectures:'---', duration:'---', validity:'6m/12m', views:'Unlimited', mat:'Included', sys:SYS.EK}},
    {k:'e18', inst:'EK', paper:'Paper 7B', fac:['CA Yashvant Mangal'], batch:'regular', pricing:{fixed:fx(4499)},
      info:{lectures:'95', duration:'---', validity:'12m', views:'Unlimited', mat:'1 Volume of Concept Book, 1 Reboot Questionnaire & Express Chart Book', sys:SYS.EK}},
    {k:'e25', inst:'EK', paper:'Paper 5', fac:['CS Satish Baheti'], batch:'fasttrack',
      pricing:{axis:{key:'validity', opts:[['6m', fx(3500)], ['12m', fx(5000)]]}},
      info:{lectures:'40', duration:'80', validity:'6m/12m', views:'Unlimited', mat:'Concept Book, Questionnaire', sys:SYS.EK}},
    {k:'e26', inst:'EK', paper:'Paper 6', fac:['CA Sneha Budhia'], batch:'fasttrack', pricing:{fixed:fx(3500)},
      info:{lectures:'40', duration:'80', validity:'6m', views:'Unlimited', mat:'Concept Book, Questionnaire', sys:SYS.EK}},
    {k:'e27', inst:'EK', paper:'Paper 10', fac:['CA Sneha Budhia'], batch:'fasttrack',
      pricing:{axis:{key:'validity', opts:[['6m', fx(3500)], ['12m', fx(5000)]]}},
      info:{lectures:'50', duration:'100', validity:'6m/12m', views:'Unlimited', mat:'Module 1 - Corporate Accounts\nModule 2 - Auditing', sys:SYS.EK}},

    /* ---------- Vsmart Academy ---------- */
    {k:'v39', inst:'VS', paper:'Paper 7B', fac:['CA Vishal Bhattad'], batch:'fasttrack', pricing:{fixed:fx(4499)},
      info:{lectures:'40', duration:'---', validity:'Unlimited upto 2yrs', views:'1.5', mat:'1. GST Regular Module\n2. GST Questionnaire\n3. Chart Book', sys:SYS.ALLDEV}},
    {k:'v40', inst:'VS', paper:'Paper 7A', fac:['CA Vijay Sarda'], batch:'fasttrack', pricing:{fixed:fx(4999)},
      info:{lectures:'35', duration:'90-100', validity:'12m', views:'1.5', mat:'Hard Copy Note', sys:SYS.EK}},
    {k:'v41a', inst:'VS', paper:'Paper 7B', fac:['CA Amol Jain'], batch:'fasttrack', pricing:{attempt:[fx(1499), fx(1999)]},
      info:{lectures:'30', duration:'75', validity:'Till Exam', views:'1.5', mat:'Question Bank and Revision Chart Book', sys:SYS.ALLDEV}},
    {k:'v42', inst:'VS', paper:'Paper 12', fac:['CA Ranjan Periwal'], batch:'regular', pricing:{fixed:fx(7300)},
      info:{lectures:'54', duration:'108', validity:'12m', views:'2', mat:'1 Exhaustive Multicoloured Books', sys:SYS.ALLDEV}},
    {k:'v43', inst:'VS', paper:'Paper 8', fac:['CA Ranjan Periwal'], batch:'regular', pricing:{fixed:fx(8649)},
      info:{lectures:'96', duration:'195', validity:'12m', views:'2', mat:'2 Exhaustive Multicoloured Books', sys:SYS.ALLDEV}},
    {k:'v44', inst:'VS', paper:'Paper 11', fac:['CA Ranjan Periwal'], batch:'regular', pricing:{fixed:fx(7300)},
      info:{lectures:'66', duration:'130', validity:'12m', views:'2', mat:'1 Exhaustive Multicoloured Books', sys:SYS.ALLDEV}},

    /* ---------- BB Virtuals ---------- */
    {k:'b45', inst:'BB', paper:'Paper 7A', fac:['CA Bhanwar Borana'], batch:'regular', pricing:{fixed:fx(7999, 8999, 11)},
      info:{lectures:'65', duration:'162-165', validity:'1y', views:'1.5', mat:'1 Compact Theory Book\n1 Compiler Q&A Book\n1 MCQ', sys:SYS.BB}},
    {k:'b46', inst:'BB', paper:'Paper 7B', fac:['CA Amit Mahajan'], batch:'regular', pricing:{fixed:fx(4999, 6999, 29)},
      info:{lectures:'35-40', duration:'115', validity:'1y', views:'1.5', mat:'1 Rapider (Study Material)\n1 Q&A Book\n1 Pocket Book\n(Concept Notes will be Handwritten in Class Itself for Best Understanding)', sys:SYS.BB}},
    {k:'b47', inst:'BB', paper:'Paper 7A', fac:['CA Bhanwar Borana'], batch:'fasttrack', pricing:{attempt:[fx(2999, 5999, 50), fx(4999, 5999, 16)]},
      info:{lectures:'---', duration:'100', validity:'9m', views:'1.5', mat:'1 Compact Theory Book\n1 Compiler Q&A Book\n1 MCQ', sys:SYS.BB}},
    {k:'b49', inst:'BB', paper:'Paper 7B', fac:['CA Raj Kumar'], batch:'regular', pricing:{fixed:fx(6300)},
      info:{lectures:'50', duration:'120', validity:'12m', views:'1.5', mat:'Hard Copy Books', sys:SYS.BBV}},
    {k:'b50', inst:'BB', paper:'Paper 7B', fac:['CA Raj Kumar'], batch:'fasttrack', pricing:{fixed:fx(6300)},
      info:{lectures:'37', duration:'100', validity:'12m', views:'1.5', mat:'Hard Copy Books', sys:SYS.BBV}},
    {k:'b53', inst:'BB', paper:'Paper 12', fac:['CA Satish Jalan','CMA Rahil Singhal'], batch:'regular', pricing:{fixed:fx(6999)},
      info:{lectures:'85', duration:'170', validity:'Till Exam', views:'Unlimited', mat:'English (Hard Copy)', sys:SYS.JAL}},
    {k:'b54', inst:'BB', paper:'Paper 8', fac:['CA Satish Jalan','CMA Rahil Singhal'], batch:'regular', pricing:{fixed:fx(8999)},
      info:{lectures:'85', duration:'170', validity:'Till Exam', views:'Unlimited', mat:'English (Hard Copy)', sys:SYS.JAL}},
    {k:'b55', inst:'BB', paper:'Paper 5', fac:['CA Shivangi Agrawal'], batch:'regular', pricing:{fixed:fx(5949, 7499, 21)},
      info:{lectures:'---', duration:'160', validity:'---', views:'Unlimited', mat:'Total 6 Books\n2 Detailed Books (Black & White)\n1 Chart Books (Coloured)\n2 Question Bank (Black & White)\n1 Test Series (Black & White)', sys:SYS.SHIV}}
  ],
  combos: [].concat(
    /* ---------- Ekatvam Academy ---------- */
    comboRows('ec9',  'EK', 'regular', [['e7','e8']],                 {axis:{key:'validity', opts:[['6m', fx(4000)], ['12m', fx(6500)]]}}),
    comboRows('ec19', 'EK', 'regular', [['e11','e7','e8']],           {fixed:fx(8550)},  {fix:{validity:'6m'}}),
    comboRows('ec20', 'EK', 'regular', [['e12','e7','e8']],           {fixed:fx(7650)},  {fix:{validity:'6m'}}),
    comboRows('ec21', 'EK', 'regular', [['e5','e6','e3']],            {fixed:fx(13500)}, {fix:{validity:'6m'}}),
    comboRows('ec22', 'EK', 'regular', [['e2','e5']],                 {fixed:fx(11700)}, {fix:{validity:'Standard', views:'Standard'}}),
    comboRows('ec23', 'EK', 'regular', [['e2','e3']],                 {fixed:fx(11700)}, {fix:{validity:'Standard', views:'Standard'}}),
    comboRows('ec24', 'EK', 'regular', [['e2','e6']],                 {fixed:fx(11700)}, {fix:{validity:'Standard', views:'Standard'}}),
    comboRows('ec29', 'EK', 'regular', [['e1','e2']],                 {fixed:fx(13000)}, {fix:{views:'1.5'}}),
    comboRows('ec30', 'EK', 'regular', [['e5','e6','e2','e4','e3','e7','e8','e11','e14']],
      {axis:{key:'validity', opts:[['6m', fx(44458.20)], ['12m', fx(56788.20)]]}}, {group:'Both Groups'}),
    comboRows('ec31', 'EK', 'regular', [['e7','e8','e11','e14']],
      {axis:{key:'validity', opts:[['6m', fx(20158.20)], ['12m', fx(25288.20)]]}}, {group:'Group 2'}),
    comboRows('ec32', 'EK', 'regular', [['e7','e8','e11','e12']],     {fixed:fx(12150)}, {fix:{validity:'6m'}, group:'Group 2'}),
    comboRows('ec33', 'EK', 'regular', [['e5','e6','e2','e4','e3']],
      {axis:{key:'validity', opts:[['6m', fx(24300)], ['12m', fx(31500)]]}}, {group:'Group 1'}),
    comboRows('ec34', 'EK', 'regular', [['e11','e12']],               {fixed:fx(8100)},  {fix:{validity:'6m'}}),
    comboRows('ec35', 'EK', 'regular', [['e2','e5','e4']],            {fixed:fx(15300)}, {fix:{validity:'6m'}}),
    comboRows('ec36', 'EK', 'regular', [['e2','e4']],                 {fixed:fx(10000)}, {fix:{validity:'Standard', views:'Standard'}}),
    comboRows('ec37', 'EK', 'regular', [['e7','e8','e11','e12','e14']],
      {axis:{key:'validity', opts:[['6m', fx(17729.10)], ['12m', fx(23129.10)]]}}, {group:'Group 2'}),
    comboRows('ec38', 'EK', 'regular', [['e2','e18']],                {fixed:fx(10350)}, {fix:{validity:'Standard', views:'Standard'}}),
    /* ---------- Vsmart Academy ---------- */
    comboRows('vc41', 'VS', 'fasttrack', [['v39','v40']],             {fixed:fx(12999)}),
    /* ---------- BB Virtuals (two of them mix lectures of different institutes) ---------- */
    comboRows('bc48',  'BB', 'regular',   [['b45','b46']],            {fixed:fx(11699, 12999, 10)}),
    comboRows('bc51',  'BB', 'regular',   [['b45','b49']],            {fixed:fx(12825, 14250, 10)}),
    comboRows('bc52',  'BB', 'regular',   [['b45','e1']],             {fixed:fx(13999, 15999, 13)}),
    comboRows('bc52a', 'BB', 'fasttrack', [['b47','v39']],            {fixed:fx(5499, 5999, 8)})
  )
}
};

/* ============================================================
   BUILDING THE CARDS OF A CURATED EXAM
   Order (no filters): all Regular lectures first, then Fast-track, then Writing Practice.
   Inside each of these: our own faculties on top, then the associate institutes in the order set
   above — and inside every institute the single lectures first, then its combos.
   ============================================================ */
const SPC_GURUKUL_KEY = 'spcc-spc39-spc41-spc44-spc45';   // the one SPC combo that also has the Offline Face to Face programme
const CATALOG_CACHE = {};
function getCatalog(course, level){
  const key = course + '|' + level;
  if(!CATALOG_CACHE[key]) CATALOG_CACHE[key] = buildCatalog(course, level);
  return CATALOG_CACHE[key];
}
function isCurated(course, level){ return !!CURATED[course + '|' + level]; }
function curatedPaper(course, level, no){
  return ((COURSES[course] || {})[level] || []).find(pp => pp.no === no) || null;
}

function makeCuratedSingle(course, level, def, ord){
  const paper = curatedPaper(course, level, def.paper) || { no:def.paper, name:def.paper, group:'' };
  const facs = def.fac.slice();
  const examLabel = getShortExamLabel(course, level);
  const p = {
    id: slugify([course, level, def.k].join(' ')), key:def.k,
    category:'single', course, level, examLabel, examFull:getExamLabelSafe(course, level),
    batch:def.batch, group:paper.group || '', subjects:[paper.name], faculties:facs,
    institute:def.inst, multi:facs.length > 1,
    items:[{ paperNo:paper.no, paperName:paper.name, faculty:facs.join(' + '), institute:def.inst, key:def.k }],
    paperNo:paper.no, def:def, pricing:def.pricing || null, ord:ord
  };
  p.title = examLabel + ' ' + paper.name + ' ' + BATCH_TYPES[def.batch].label + ' Lectures by ' + facs.join(' & ');
  applyCardPrice(p);
  return p;
}

function makeCuratedCombo(course, level, def, byKey, ord){
  const parts = def.parts.map(k => byKey[k]).filter(Boolean);
  if(parts.length < 2) return null;
  const examLabel = getShortExamLabel(course, level);
  const facs = [];
  parts.forEach(pt => pt.faculties.forEach(f => { if(!facs.some(x => normName(x) === normName(f))) facs.push(f); }));
  let pricing = def.pricing;
  if(def.k === SPC_GURUKUL_KEY) pricing = Object.assign({}, pricing, { programmes:SPC_GURUKUL });
  const p = {
    id: slugify([course, level, def.k].join(' ')), key:def.k,
    category:'combo', course, level, examLabel, examFull:getExamLabelSafe(course, level),
    batch:def.batch, group:def.group || '', subjects:parts.map(pt => pt.subjects[0]), faculties:facs,
    institute:def.inst, multi:false,
    items:parts.map(pt => pt.items[0]),
    paperNo:parts[0].paperNo, def:def, pricing:pricing, parts:def.parts.slice(), partProducts:parts, ord:ord
  };
  p.title = examLabel + ' ' + (def.group ? def.group + ' ' : '') + BATCH_TYPES[def.batch].label + ' Lectures_' + facs.map(facultyInitials).join('_');
  applyCardPrice(p);
  return p;
}

function buildCuratedCatalog(course, level){
  const spec = CURATED[course + '|' + level];
  const papers = COURSES[course][level] || [];
  const list = [];
  let ord = 0;

  /* our own faculties: Regular lectures only, prices left blank */
  const own = [];
  papers.forEach((paper, pIdx) => paper.faculty.forEach(fac => {
    const t = facultyTier(fac);
    if(t.tier === 0) own.push({ paper, pIdx, fac, idx:t.idx });
  }));
  own.sort((a, b) => (a.idx - b.idx) || (a.pIdx - b.pIdx));
  own.forEach(e => {
    const p = makeSingleProduct(course, level, e.paper, e.fac, 'regular');
    p.institute = 'AP'; p.items[0].institute = 'AP'; p.ord = ord++;
    list.push(p);
  });

  const byKey = {};
  spec.singles.forEach(d => { byKey[d.k] = makeCuratedSingle(course, level, d, ord++); list.push(byKey[d.k]); });
  (spec.combos || []).forEach(d => {
    const c = makeCuratedCombo(course, level, d, byKey, ord++);
    if(c) list.push(c);
  });

  const batchRank = { regular:0, fasttrack:1, writing:2 };
  list.sort((a, b) =>
    (batchRank[a.batch] - batchRank[b.batch]) ||
    (instituteRank(course, a.institute) - instituteRank(course, b.institute)) ||
    ((a.category === 'combo' ? 1 : 0) - (b.category === 'combo' ? 1 : 0)) ||
    (a.ord - b.ord)
  );
  list.forEach((p, i) => { p.rank = i; });
  return list;
}

/* ============================================================
   PRICES — every product has a "pricing" description:
     {fixed:V}                      one price
     {attempt:[V1, V2]}             V1 = upcoming attempt, V2 = every later attempt
     {axis:{key, opts:[[value, V]]}}  the buyer also picks a validity or a number of views
     {feature:{Silver:V, ...}}      Swapnil Patni Classes features (+ optional programmes for Offline Face to Face)
   V = {price, mrp, disc}. We show exactly the figures typed in the product sheet.
   ============================================================ */
function pricingVariants(p){
  const pr = p.pricing;
  if(!pr) return [];
  const out = [];
  if(pr.fixed) out.push(Object.assign({}, pr.fixed));
  if(pr.attempt) pr.attempt.forEach((v, i) => out.push(Object.assign({ slot:i }, v)));
  if(pr.axis) pr.axis.opts.forEach(o => out.push(Object.assign({ axisVal:o[0] }, o[1])));
  if(pr.feature) Object.keys(pr.feature).forEach(f => out.push(Object.assign({ feature:f }, pr.feature[f])));
  if(pr.programmes) Object.keys(pr.programmes).forEach(n => out.push(Object.assign({ programme:n }, pr.programmes[n])));
  return out;
}

/* the variants that are still possible: with no selection (card) or after the visitor's choices so far */
function variantsFor(p, sel, forCard){
  let vs = pricingVariants(p);
  const pr = p.pricing || {};
  if(forCard){
    if(pr.feature) return vs.filter(v => v.feature === 'Silver');     // cards show the Silver price
    return vs.filter(v => !v.programme);
  }
  sel = sel || {};
  const offline = !!(pr.programmes && sel.mode === OFFLINE_MODE);
  vs = vs.filter(v => offline ? !!v.programme : !v.programme);
  if(offline){
    if(sel.programme) vs = vs.filter(v => v.programme === sel.programme);
    return vs;
  }
  if(pr.attempt && sel.attemptIdx !== undefined && sel.attemptIdx !== null && sel.attemptIdx >= 0){
    vs = vs.filter(v => v.slot === (sel.attemptIdx === 0 ? 0 : 1));
  }
  if(pr.axis && sel.axisVal) vs = vs.filter(v => v.axisVal === sel.axisVal);
  if(pr.feature && sel.feature) vs = vs.filter(v => v.feature === sel.feature);
  return vs;
}

/* lowest–highest price, and the discount shown only when EVERY possible price is really discounted */
function priceSummary(vs){
  if(!vs || !vs.length) return { lo:null, hi:null, mrp:null, discLo:0, discHi:0, ranged:false, discRanged:false };
  const prices = vs.map(v => v.price);
  const lo = Math.min.apply(null, prices), hi = Math.max.apply(null, prices);
  const withDisc = vs.filter(v => v.mrp && v.disc > 0 && v.price < v.mrp);
  let mrp = null, discLo = 0, discHi = 0;
  if(withDisc.length === vs.length){
    const mrps = withDisc.map(v => v.mrp);
    mrp = mrps.every(x => x === mrps[0]) ? mrps[0] : null;
    const ds = withDisc.map(v => v.disc);
    discLo = Math.min.apply(null, ds); discHi = Math.max.apply(null, ds);
  }
  return { lo:lo, hi:hi, mrp:mrp, discLo:discLo, discHi:discHi, ranged:lo !== hi, discRanged:discLo !== discHi };
}

function applyCardPrice(p){
  const s = priceSummary(variantsFor(p, null, true));
  p.cardPrice = s;
  p.mrp = s.mrp; p.discount = s.discLo; p.price = s.lo;
}

/* the one-line texts used by the card and the product page */
function rupeeText(n){ return formatRupees(n); }
function priceRangeText(s){
  if(s.lo === null || s.lo === undefined) return '---';
  return s.ranged ? (formatRupees(s.lo) + ' - ' + formatRupees(s.hi)) : formatRupees(s.lo);
}
function discountText(s){
  if(!(s.discLo > 0)) return '';
  return s.discRanged ? (s.discLo + '% - ' + s.discHi + '% off') : (s.discLo + '% off');
}

/* Which choices decide the price (and so must be made before "Add to Cart")? */
function pricingAxes(p, sel){
  const pr = p.pricing || {};
  const out = [];
  const offline = !!(pr.programmes && sel && sel.mode === OFFLINE_MODE);
  if(pr.feature && !offline) out.push('feature');
  if(pr.axis && !offline) out.push('axis');
  if(offline) out.push('programme');
  return out;
}

/* ============================================================
   RULES THAT DEPEND ON WHO TEACHES + WHICH BATCH
   ============================================================ */
const FACULTY_WITH_BOOK_CHOICE = "Prof. Abanindra Sahu";
function getProductRules(product, sel){
  sel = sel || {};
  const facs = product.faculties || [];
  const allFirst = facs.length > 0 && facs.every(f => facultyTier(f).tier === 0);
  const hasBookFaculty = facs.some(f => normName(f) === normName(FACULTY_WITH_BOOK_CHOICE));
  let books = BOOK_PREFERENCES.slice();
  if(allFirst) books = hasBookFaculty ? ["Hard Copy","Without Books"] : ["Without Books"];
  let modes = allFirst ? [OFFLINE_MODE] : MODES.slice();
  if(product.batch === 'fasttrack') modes = FASTTRACK_MODES.slice();          // fast-track: Online Google Drive Recorded only
  const pr = product.pricing || {};
  if(pr.feature){
    if(!pr.programmes) modes = modes.filter(m => m !== OFFLINE_MODE);         // Offline Face to Face only for the SPC Gurukul combo
    const f = sel.feature || 'Silver';
    books = (sel.mode === OFFLINE_MODE) ? ['E-Book','Hard Copy'] : (f === 'Silver' ? ['E-Book'] : ['E-Book','Hard Copy']);
  }
  return { books:books, modes:modes };
}

/* Platinum (Regular, Swapnil Patni Classes): the same lectures' Fast-track product comes free */
function platinumFreeProducts(p){
  const pr = p.pricing || {};
  if(!pr.feature || p.batch !== 'regular') return [];
  const cat = getCatalog(p.course, p.level);
  const keys = p.category === 'combo' ? (p.parts || []) : [p.key];
  const out = [];
  keys.forEach(k => {
    const part = cat.find(x => x.key === k);
    const ft = part && part.def && part.def.freeFT ? cat.find(x => x.key === part.def.freeFT) : null;
    if(ft) out.push(ft);
  });
  return out;
}

/* ============================================================
   PRODUCT INFO ROWS (units are always written out in full)
   ============================================================ */
function plural(n, one, many){ return n + ' ' + (Number(n) === 1 ? one : many); }
function fmtLectures(v){
  v = String(v === undefined || v === null ? '' : v).trim();
  if(!v || v === '-' || v === '---') return '---';
  return plural(v, 'Lecture', 'Lectures');
}
function fmtDuration(v){
  v = String(v === undefined || v === null ? '' : v).trim();
  if(!v || v === '-' || v === '---') return '---';
  const m = v.match(/^(\d+(?:\.\d+)?)\s*m$/i);
  if(m) return plural(m[1], 'month', 'months');
  return v + ' Hours';
}
function validityToken(tok){
  tok = String(tok).trim();
  let m = tok.match(/^(\d+(?:\.\d+)?)\s*m(?:onths?)?$/i);
  if(m) return { text:plural(m[1], 'month', 'months'), timed:true };
  m = tok.match(/^(\d+(?:\.\d+)?)\s*(?:y|yr|yrs|year|years)$/i);
  if(m) return { text:plural(m[1], 'year', 'years'), timed:true };
  if(/^std$/i.test(tok)) return { text:'Standard', timed:false };
  m = tok.match(/^unlimited\s*upto\s*(\d+)\s*(?:y|yr|yrs|years?)$/i);
  if(m) return { text:'Unlimited upto ' + plural(m[1], 'year', 'years'), timed:false };
  if(/^till+\s*exam$/i.test(tok)) return { text:'Till Exam', timed:false };
  return { text:tok, timed:false };
}
function fmtValidity(v){
  v = String(v === undefined || v === null ? '' : v).trim();
  if(!v || v === '-' || v === '---') return '---';
  const toks = v.split('/').map(validityToken);
  if(toks.every(t => t.timed)) return toks.map(t => t.text).join(' / ') + ' from the date of activation';
  return toks.map(t => t.timed ? (t.text + ' from the date of activation') : t.text).join(' / ');
}
function fmtViews(v){
  v = String(v === undefined || v === null ? '' : v).trim();
  if(!v || v === '-' || v === '---') return '---';
  const toks = v.split('/').map(t => t.trim());
  if(toks.every(t => /^\d+(\.\d+)?$/.test(t))) return toks.join(' / ') + (toks.length === 1 && Number(toks[0]) === 1 ? ' view' : ' views');
  return toks.map(t => /^unlimited$/i.test(t) ? 'Unlimited views' : (/^\d+(\.\d+)?$/.test(t) ? plural(t, 'view', 'views') : t)).join(' / ');
}
function axisLabel(axisKey, val){
  if(axisKey === 'validity') return validityToken(val).text;
  if(axisKey === 'views') return fmtViews(val);
  return String(val);
}

/* the info of ONE lecture (a single product, or one lecture inside a combo) — sel/comboDef adjust the things the buyer picks */
function curatedInfoFor(part, sel, comboDef){
  const d = (part.def && part.def.info) || {};
  sel = sel || {};
  const pr = part.pricing || {};
  const fix = (comboDef && comboDef.fix) || {};
  let validity = d.validity, views = d.views;

  /* things the buyer chooses on a single product */
  if(!comboDef && pr.axis && sel.axisVal){
    if(pr.axis.key === 'validity') validity = sel.axisVal;
    if(pr.axis.key === 'views') views = sel.axisVal;
  }
  /* things fixed by / chosen on a combo apply to the lectures inside it that have a choice */
  if(comboDef){
    const myAxis = pr.axis ? pr.axis.key : null;
    const comboAxis = comboDef.pricing && comboDef.pricing.axis ? comboDef.pricing.axis.key : null;
    if(myAxis === 'validity' || /\//.test(String(d.validity || ''))){
      if(comboAxis === 'validity' && sel.axisVal) validity = sel.axisVal;
      else if(fix.validity) validity = fix.validity;
    }
    if(myAxis === 'views' || /\//.test(String(d.views || ''))){
      if(fix.views) views = fix.views;
    }
  }
  let viewsText;
  if(views === 'FEATURE') viewsText = FEATURE_VIEWS[sel.feature || 'Silver'] + ' views';
  else viewsText = fmtViews(views);
  const str = x => (x === undefined || x === null || String(x).trim() === '') ? '---' : String(x);
  return {
    language: 'Hindi-English Mix',
    lectures: fmtLectures(d.lectures),
    duration: fmtDuration(d.duration),
    validity: fmtValidity(validity),
    view: viewsText,
    studyMaterial: str(d.mat),
    systemRequirement: str(d.sys)
  };
}

/* the "products inside" of a card: the card itself for a single, the lectures it is made of for a combo */
function getProductParts(p){
  return (p.category === 'combo' && p.partProducts) ? p.partProducts : [p];
}

/* ============================================================
   WHAT THE ADMIN SEES: which institute a purchased lecture belongs to
   ============================================================ */
let _facInst = null;
function instituteOfFaculty(course, level, name){
  if(!_facInst){
    _facInst = {};
    Object.keys(CURATED).forEach(key => (CURATED[key].singles || []).forEach(d => {
      const k = key + '|' + normName(d.fac.join(' + '));
      if(!_facInst[k]) _facInst[k] = d.inst;
      d.fac.forEach(f => { const k2 = key + '|' + normName(f); if(!_facInst[k2]) _facInst[k2] = d.inst; });
    }));
  }
  return _facInst[course + '|' + level + '|' + normName(name)] || '';
}
function instituteOfLine(it){
  let code = it.institute || '';
  if(!code && it.productId && it.course && it.level && isCurated(it.course, it.level)){
    const p = getCatalog(it.course, it.level).find(x => x.id === it.productId);
    if(p) code = p.institute;
  }
  if(!code) code = instituteOfFaculty(it.course, it.level, it.faculty || '');
  if(!code && facultyTier(String(it.faculty || '').split(' + ')[0]).tier === 0) code = 'AP';
  return code ? (INSTITUTES[code] || code) : 'Not tagged';
}
/* the order the "Associate Institutes" list follows (CMA lists use the CMA order, everything else the CA order) */
function instituteNameOrder(course){
  return (INSTITUTE_ORDER[course] || INSTITUTE_ORDER.CA).map(c => INSTITUTES[c]);
}

/* the extra words saved with an order line (features, validity / views, programme) */
function lectureExtras(it){
  const bits = [];
  if(it.features) bits.push('with the ' + it.features + ' feature (' + (FEATURE_VIEWS[it.features] || '') + ')');
  if(it.programme) bits.push('in the programme ' + it.programme);
  if(it.axisChoice && it.axisKey) bits.push((it.axisKey === 'validity' ? 'validity ' : '') + axisLabel(it.axisKey, it.axisChoice));
  if(it.freeWith) bits.push('(free with the Platinum feature)');
  return bits.length ? (', ' + bits.join(', ')) : '';
}

/* ============================================================
   TABLE 0 — COMBOS  (several lectures sold together)
   ------------------------------------------------------------
   Add one row per combo. Each row lists the papers and the faculty for each paper.
   Example (remove the // to switch it on):
   // {course:'CA', level:'Intermediate', group:'Group 1', batch:'regular',
   //  items:[ {paperNo:'Paper 1', faculty:'CA Aakash Kandoi'}, {paperNo:'Paper 2', faculty:'CA Shubham Singhal'},
   //          {paperNo:'Paper 3A', faculty:'CA Bhanwar Borana'}, {paperNo:'Paper 3B', faculty:'CA Vishal Bhattad'} ],
   //  mrp:33999, discount:10},
   Combos appear after the single cards, under the "Combo" category filter.
   ============================================================ */
const COMBO_TABLE = [
];

function buildCombos(course, level){
  const papers = (COURSES[course] && COURSES[course][level]) || [];
  const out = [];
  COMBO_TABLE.forEach(row=>{
    if(row.course !== course || row.level !== level) return;
    const batch = row.batch === 'fasttrack' ? 'fasttrack' : 'regular';
    const items = [];
    (row.items || []).forEach(it=>{
      const paper = papers.find(pp => pp.no === it.paperNo);
      if(paper) items.push({ paperNo:paper.no, paperName:paper.name, faculty:it.faculty });
    });
    if(items.length < 2) return;
    const examLabel = getShortExamLabel(course, level);
    const facs = [];
    items.forEach(it => { if(facs.indexOf(it.faculty) === -1) facs.push(it.faculty); });
    const p = {
      id: slugify([course, level, 'combo', row.group || '', batch, items.map(i => i.paperNo + ' ' + i.faculty).join(' ')].join(' ')),
      category:'combo',
      course, level, examLabel,
      examFull: getExamLabelSafe(course, level),
      batch,
      group: row.group || '',
      subjects: items.map(i => i.paperName),
      faculties: facs,
      items,
      paperNo: items[0].paperNo
    };
    p.title = examLabel + ' ' + (row.group ? row.group + ' ' : '') + BATCH_TYPES[batch].label + ' Lectures_' +
      facs.map(facultyInitials).join('_');
    const mrp = Number(row.mrp) > 0 ? Number(row.mrp) : null;
    const cprice = Number(row.price) > 0 ? Number(row.price) : (mrp ? computeDiscountedPrice(mrp, Number(row.discount) || 0) : null);
    p.pricing = (cprice > 0) ? { fixed:{ price:cprice, mrp:mrp, disc:Number(row.discount) || 0 } } : null;
    applyCardPrice(p);
    out.push(p);
  });
  return out;
}

/* ============================================================
   TABLE 1 — PRICES   (fill this in when you have the prices)
   ------------------------------------------------------------
   One row per price. A row can be as general or as specific as you like:
     course, level, paperNo, faculty, batch ('regular' / 'fasttrack')
   Anything you leave out counts as "any". The MOST SPECIFIC matching row wins.
   mrp = the full price (always ending in 9, e.g. 9999)   discount = % off (e.g. 10)

   Examples (remove the // to switch one on):
   // {course:'CA', level:'Intermediate', paperNo:'Paper 1', mrp:9999, discount:10},                         // every faculty, both batches
   // {course:'CA', level:'Intermediate', paperNo:'Paper 1', batch:'fasttrack', mrp:6999, discount:28},       // only the fast-track batch
   // {course:'CA', level:'Intermediate', paperNo:'Paper 1', faculty:'CA Aakash Kandoi', batch:'regular', mrp:9999, discount:10},
   (Combo prices are typed directly inside the combo row above.)
   ============================================================ */
const PRICE_TABLE = [
];

/* Plain arithmetic (no "9" endings any more): price = MRP minus the discount, rounded to a whole rupee.
   A price row may also carry the final  price:  typed directly — then that exact figure is used. */
function computeDiscountedPrice(mrp, discountPct){
  mrp = Number(mrp);
  const d = Number(discountPct) || 0;
  if(!(mrp > 0)) return null;
  if(d <= 0) return mrp;
  return Math.round(mrp * (100 - d) / 100);
}

function findBestRow(table, ctx){
  let best = null, bestScore = -1;
  table.forEach(r=>{
    let score = 0, ok = true;
    if(r.id !== undefined && r.id !== '*'){
      if(r.id === ctx.id) score += 10; else ok = false;
    }
    ['course','level','paperNo','faculty','batch','type','option'].forEach(k=>{
      if(r[k] === undefined || r[k] === '*') return;
      const a = k === 'faculty' ? normName(r[k]) : String(r[k]).toLowerCase();
      const b = k === 'faculty' ? normName(ctx[k]) : String(ctx[k]).toLowerCase();
      if(a === b) score++; else ok = false;
    });
    if(ok && score > bestScore){ best = r; bestScore = score; }
  });
  return best;
}

/* returns {mrp, discount, price} — all null while no price has been entered yet */
function getPriceInfo(product){
  if(product.category === 'combo'){
    return { mrp:product.mrp, discount:product.discount, price:product.price };
  }
  const ctx = {
    id: product.id, course: product.course, level: product.level,
    paperNo: product.paperNo, faculty: product.faculties[0], batch: product.batch
  };
  const row = findBestRow(PRICE_TABLE, ctx);
  if(!row || !(Number(row.mrp) > 0)) return { mrp:null, discount:null, price:null };
  const discount = Number(row.discount) || 0;
  return { mrp:Number(row.mrp), discount, price:(Number(row.price) > 0 ? Number(row.price) : computeDiscountedPrice(row.mrp, discount)) };
}

/* 1,23,456 style (Indian grouping); paise only when the amount really has them (e.g. 44,458.20) */
function formatRupees(n){
  if(n === null || n === undefined || isNaN(n)) return '---';
  n = Number(n);
  const whole = Math.abs(n - Math.round(n)) < 0.005;
  return '₹' + (whole ? Math.round(n).toLocaleString('en-IN') : n.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 }));
}

/* ============================================================
   COUPONS (empty for now)
   Add codes like:   SAVE500: {type:'flat', value:500},   WELCOME5: {type:'percent', value:5},
   The coupon is taken off the already-discounted price.
   ============================================================ */
const COUPONS = {
};

function applyCouponToPrice(code, price){
  const key = String(code || '').trim().toUpperCase();
  const c = COUPONS[key];
  if(!key) return { ok:false, message:'Please enter a coupon code.' };
  if(!c) return { ok:false, message:'This coupon code is not valid.' };
  if(price === null || price === undefined) return { ok:false, message:'Price is not available yet, so a coupon cannot be applied.' };
  let off = c.type === 'percent' ? Math.round(price * c.value / 100) : Number(c.value);
  off = Math.min(Math.max(off, 0), price);
  return { ok:true, code:key, off, finalPrice: price - off, message:'Coupon ' + key + ' applied — you save ' + formatRupees(off) + '.' };
}

/* ============================================================
   TABLE 2 — PRODUCT INFO  (the 7-row table on the product page)
   Same matching rules as the price table. Anything missing shows "---".
   Example:
   // {course:'CA', level:'Intermediate', paperNo:'Paper 1', batch:'regular',
   //  info:{ language:'Hinglish', lectures:'120', duration:'180 Hours', validity:'Till May 2027 attempt',
   //         view:'2 views (each lecture)', studyMaterial:'Soft copy (PDF)', systemRequirement:'Android / iOS / Windows' }},
   ============================================================ */
const PRODUCT_INFO_ROWS = [
  { key:'language',          label:'Language' },
  { key:'lectures',          label:'No. of lectures' },
  { key:'duration',          label:'Duration' },
  { key:'validity',          label:'Validity' },
  { key:'view',              label:'View' },
  { key:'studyMaterial',     label:'Study Material' },
  { key:'systemRequirement', label:'System Requirement' }
];
const PRODUCT_INFO_TABLE = [
];
function getProductInfo(product){
  const ctx = {
    id: product.id, course: product.course, level: product.level,
    paperNo: product.paperNo, faculty: product.faculties[0], batch: product.batch
  };
  const row = findBestRow(PRODUCT_INFO_TABLE, ctx);
  return (row && row.info) ? row.info : {};
}

/* ============================================================
   TABLE 3 — FACULTY INFO (shown in the "Faculty Info" tab)
   Example:
   // "CA Aakash Kandoi": { about:"A few lines about the faculty…", experience:"10+ years", qualification:"CA, B.Com" },
   ============================================================ */
const FACULTY_INFO = {
};
function getFacultyInfo(name){
  const k = normName(name);
  for(const key in FACULTY_INFO){
    if(normName(key) === k) return FACULTY_INFO[key];
  }
  return null;
}

/* Faculty photos: put a file called  images/faculty/<name>.webp  in the GitHub repo, where <name>
   is the faculty name in small letters with hyphens, e.g. "CA Aakash Kandoi" -> ca-aakash-kandoi.png
   (a .jpg also works). Until a photo exists, the photo area on the card simply stays blank. */
function facultyPhotoPath(name, ext){
  return 'images/faculty/' + slugify(name) + '.' + (ext || 'webp');
}

/* ============================================================
   TEST SERIES — "AMBITION SERIES"
   ============================================================ */
const AMBITION_SERIES_NAME = 'AMBITION SERIES';

/* Subjects offered in the Subject Wise test series, per exam level.
   (Papers that are two halves of one subject are shown as one subject, e.g. Taxation.) */
const TS_SUBJECTS = {
  'CA|Foundation': [
    {name:'P1: Principles and Practice of Accounting'}, {name:'P2: Business Laws'},
    {name:'P3: Quantitative Aptitude'}, {name:'P4: Business Economics'}
  ],
  'CA|Intermediate': [
    {name:'P1: Advanced Accounting', group:'Group 1'}, {name:'P2: Corporate & Other Laws', group:'Group 1'},
    {name:'P3: Taxation (3A: Income Tax Law, 3B: Goods and Service Tax)', group:'Group 1'},
    {name:'P4: Cost and Management Accounting', group:'Group 2'}, {name:'P5: Auditing and Ethics', group:'Group 2'},
    {name:'P6: Financial Management & Strategic Management (6A: Financial Management, 6B: Strategic Management)', group:'Group 2'}
  ],
  'CA|Final': [
    {name:'P1: Financial Reporting', group:'Group 1'}, {name:'P2: Advanced Financial Management', group:'Group 1'},
    {name:'P3: Advanced Auditing, Assurance & Professional Ethics', group:'Group 1'},
    {name:'P4: Direct Tax Laws & International Taxation', group:'Group 2'}, {name:'P5: Indirect Tax Laws', group:'Group 2'}
  ],
  'CMA|Foundation': [
    {name:'P1: Fundamentals of Business Laws and Business Communication'}, {name:'P2: Fundamentals of Financial and Cost Accounting'},
    {name:'P3: Fundamentals of Business Mathematics and Statistics'}, {name:'P4: Fundamentals of Business Economics and Management'}
  ],
  'CMA|Intermediate': [
    {name:'P5: Business Laws and Ethics', group:'Group 1'}, {name:'P6: Financial Accounting', group:'Group 1'},
    {name:'P7: Taxation (7A: Direct Taxation, 7B: Indirect Taxation)', group:'Group 1'}, {name:'P8: Cost Accounting', group:'Group 1'},
    {name:'P9: Operations Management and Strategic Management', group:'Group 2'}, {name:'P10: Corporate Accounting and Auditing', group:'Group 2'},
    {name:'P11: Financial Management and Business Data Analytics', group:'Group 2'}, {name:'P12: Management Accounting', group:'Group 2'}
  ],
  'CMA|Final': [
    {name:'P13: Corporate and Economic Laws', group:'Group 1'}, {name:'P14: Strategic Financial Management', group:'Group 1'},
    {name:'P15: Direct Tax Laws and International Taxation', group:'Group 1'}, {name:'P16: Strategic Cost Management', group:'Group 1'},
    {name:'P17: Cost and Management Audit', group:'Group 2'}, {name:'P18: Corporate Financial Reporting', group:'Group 2'},
    {name:'P19: Indirect Tax Laws and Practice', group:'Group 2'}, {name:'P20A: Strategic Performance Management and Business Valuation', group:'Group 2'}
  ]
};
function getTSSubjects(course, level){ return TS_SUBJECTS[course + '|' + level] || []; }
function tsHasGroups(level){ return level !== 'Foundation'; }
function tsIsValidExam(course, level){
  return (course === 'CA' || course === 'CMA') && (level === 'Foundation' || level === 'Intermediate' || level === 'Final');
}

/* The two cards shown for an exam level */
function getTSTypes(course, level){
  return tsHasGroups(level)
    ? [ { key:'group',   label:'Group Wise' },   { key:'subject', label:'Subject Wise' } ]
    : [ { key:'all',     label:'All Subjects' }, { key:'subject', label:'Subject Wise' } ];
}
function makeTSProduct(course, level, typeKey){
  const type = getTSTypes(course, level).find(t => t.key === typeKey);
  if(!type) return null;
  const examLabel = getShortExamLabel(course, level);
  return {
    id:'ts-' + slugify(course + ' ' + level + ' ' + typeKey),
    course, level, typeKey, typeLabel:type.label,
    examLabel, examFull:getExamLabelSafe(course, level),
    title: examLabel + ' Ambition Series – ' + type.label
  };
}

/* ============================================================
   TABLE 4 — TEST SERIES PRICES
   One row per price. Fields:  course, level, type ('group' / 'subject' / 'all'), option, mrp, discount
     option for Group Wise   : 'Group 1' / 'Group 2' / 'Both Groups'
     option for Subject Wise : the number of subjects, e.g. 2
   Leave 'option' out to use one price for every option. The most specific row wins.
   Examples (remove the // to switch one on):
   // {course:'CA', level:'Intermediate', type:'group', option:'Group 1', mrp:2999, discount:10},
   // {course:'CA', level:'Intermediate', type:'subject', option:2, mrp:1999, discount:0},
   // {course:'CA', level:'Foundation', type:'all', mrp:2499, discount:20},
   ============================================================ */
const TS_PRICE_TABLE = [
];
function getTSPriceInfo(product, option){
  const ctx = { course:product.course, level:product.level, type:product.typeKey, option:(option === undefined || option === null) ? '' : option };
  // a row without "option" matches every option; a row with one must match exactly
  let best = null, bestScore = -1;
  TS_PRICE_TABLE.forEach(r=>{
    if(String(r.course).toLowerCase() !== String(ctx.course).toLowerCase()) return;
    if(String(r.level).toLowerCase() !== String(ctx.level).toLowerCase()) return;
    if(String(r.type).toLowerCase() !== String(ctx.type).toLowerCase()) return;
    let score = 0;
    if(r.option !== undefined && r.option !== '*'){
      if(String(r.option).toLowerCase() !== String(ctx.option).toLowerCase()) return;
      score = 1;
    }
    if(score > bestScore){ best = r; bestScore = score; }
  });
  if(!best || !(Number(best.mrp) > 0)) return { mrp:null, discount:null, price:null };
  const discount = Number(best.discount) || 0;
  return { mrp:Number(best.mrp), discount, price:(Number(best.price) > 0 ? Number(best.price) : computeDiscountedPrice(best.mrp, discount)) };
}
