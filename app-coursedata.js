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
const LECTURE_ATTEMPT_COUNT = { 'CA|Foundation':3, 'CMA|Foundation':2, 'CS|CSEET':3 };
/* The TEST SERIES list always shows only the next 2 attempts */
const TEST_SERIES_ATTEMPT_COUNT = 2;

function getAttemptsFor(course, level, forTestSeries){
  const list = allAttemptsFor(course, level);
  if(forTestSeries) return list.slice(0, TEST_SERIES_ATTEMPT_COUNT);
  const n = LECTURE_ATTEMPT_COUNT[course + '|' + level];
  return n ? list.slice(0, n) : list;
}

const CLASS_TYPES = ["Regular","Fast-track"];
const BOOK_PREFERENCES = ["Hard Copy","Soft Copy","Without Books"];
const MODES = ["Offline Face to Face","Online Google Drive Live + Recorded","Online Google Drive Recorded","Online Pen Drive Recorded"];

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
    {no:"Paper 1", name:"Principles and Practice of Accounting", faculty:["Prof. Suvraprasad Tripathy","CA Hardik Manchanda","CA Anshul Agrawal","CA Parag Gupta","CA Anand Bhangariya","CA Tejas Suchak","CA Avinash Sancheti","CA Manish Mahajan","CA Rishabh Rohra"]},
    {no:"Paper 2", name:"Business Laws", faculty:["Prof. Abanindra Sahu","CA Ankita Patni","CA Indresh Gandhi","CS Arjun Chhabra","CA Gurpreet Singh","CA Shivangi Agrawal"]},
    {no:"Paper 3", name:"Quantitative Aptitude", faculty:["Prof. SP Praveen K Rao","CA Pranav Popat","CA Nishant Kumar","CA Vinod Reddy","CA Aman Khedia","Prof. Akash Agrawal","CS Vaibhav Chitlangia","CA Navneet Mundhra","Prof. Raj Awate","Prof. Mayank Maheshwari","Anurag Chauhan"]},
    {no:"Paper 4", name:"Business Economics", faculty:["Prof. Prateek Nanda","Prof. Akhilesh Daga","CA Harshad Jaju","CA Mohnish Vora","CA Hardik Manchanda","CA Sanchit Grover","CA Parag Gupta","CA Aakansha Arora","CA Divya Agarwal","CA Vijay Sarda","Prof. Love Kaushik"]}
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
    {no:"Paper 1", name:"Fundamentals of Business Laws and Business Communication", faculty:["Prof. Abanindra Sahu","CA Shivangi Agrawal","CA Amit Bachhawat","CS Arjun Chhabra","CA Raghav Goel","CA Ruchika Saboo","CA Siddharth Agarwal","CA CS Jaspreet Singh Johar"]},
    {no:"Paper 2", name:"Fundamentals of Financial and Cost Accounting", faculty:["Prof. Suvraprasad Tripathy","CA CMA Santosh Kumar","CA CMA Abhimanyu Agarwal","CA Avinash Sancheti","CA Ranjan Periwal","CA Yashvardhan Saboo","CA Sudarshan Agrawal","CA Raj K Agrawal","CA Sarthak Jain","Prof. Navneet Mundhra"]},
    {no:"Paper 3", name:"Fundamentals of Business Mathematics and Statistics", faculty:["Prof. SP Praveen K Rao","Prof. Mayank Agarwal","CA Pranav Chandak","CA Ashish Kedia","CA Raj K Agrawal","Prof. Deepack Sir","Prof. Navneet Mundhra","Prof. Sandeep Giri","CA Nitin Guru","Prof. Vinit Kumar","CA Sanjay Khemka"]},
    {no:"Paper 4", name:"Fundamentals of Business Economics and Management", faculty:["Prof. Prateek Nanda","CA Harshad Jaju","CA Priyanka Saxena","Prof. Sandeep Giri","Prof. Vinit Kumar","CA Yashvardhan Saboo","Prof. Kundu Sir","CA Amit Tated","Prof. Archana Khetan","CA Sarthak Jain"]}
  ],
  Intermediate: [
    {no:"Paper 5", name:"Business Laws and Ethics", group:"Group 1", faculty:["Prof. Abanindra Sahu","CS Arjun Chhabra","CA Shivangi Agrawal","CA CS Divya Agarwal","CA Sudhir Sachdeva","CA Amit Bachhawat","Prof. Hemangi Kothari","CA Abhishek Bansal"]},
    {no:"Paper 6", name:"Financial Accounting", group:"Group 1", faculty:["Prof. Abhisek Mahaptro","CA Sneha Budhia","CA CMA Santosh Kumar","CA CS Avinash Sancheti","CA Bishnu Kedia","CA CMA Abhimanyu Agarwal","CA Ranjan Periwal","CA Raj K Agrawal","CA Avinash Lala","CA Ayush Tibrewal","CA Sudarshan Agrawal","CA Parveen Sharma"]},
    {no:"Paper 7A", name:"Direct Taxation", group:"Group 1", faculty:["Prof. Aayush Dash","CA Bhanwar Borana","CA Vijay Sarda","CA Yash Khandelwal","CA Jaspreet Singh Johar","CA Vinod Gupta","CA Sahil Jain","CA Pranav Chandak","CA Vivek Gaba","Prof. Vivek Soni"]},
    {no:"Paper 7B", name:"Indirect Taxation", group:"Group 1", faculty:["Prof. Aayush Dash","CA Vishal Bhattad","CA Raj Kumar","CA Ramesh Soni","CA Yashvant Mangal","CA Nikunj Goenka","CA Akshansh Garg","CA Riddhi Baghmar","CA Amit Jain","CA Brindavan Giri"]},
    {no:"Paper 8", name:"Cost Accounting", group:"Group 1", faculty:["CA Pranay Gangan","Prof. A. Sourav Patro","CA Satish Jalan","CA Ranjan Periwal","CA Purushottam Aggarwal","CMA Sumit Rastogi","CA Nitin Guru","CA Sankalp Kanstiya","CA Raj K Agrawal","CA Namit Arora","CA Sachin Gupta","CA Dani Khandelwal"]},
    {no:"Paper 9", name:"Operations Management and Strategic Management", group:"Group 2", faculty:["Prof. A. Sourav Patro","CA Mayank Saraf","CA CS Divya Agarwal","CA Amit Tated","CMA Akshay Sen","Prof. Sandeep Giri","CA Sanjay Khemka","CA Nitin Guru","Prof. J.S. Malhotra","Prof. Vinit Kumar","CA Harshad Jaju"]},
    {no:"Paper 10", name:"Corporate Accounting and Auditing", group:"Group 2", faculty:["Prof. Abanindra Sahu","CA CS Avinash Sancheti","CA Bishnu Kedia","CA CMA Abhimanyu Agarwal","CA Satish Sureka","CA Raghav Goel","CA Karthik Iyer","CA Sarthak Jain","Prof. Hemangi Kothari","CA Pankaj Garg"]},
    {no:"Paper 11", name:"Financial Management and Business Data Analytics", group:"Group 2", faculty:["Prof. Abhisek Mahaptro","CA Ranjan Periwal","CA Satish Jalan","CA Satish Sureka","CA Gourav Kabra","CA Sanjay Khemka","CA Aditya Jain","Prof. Raj Awate","CA Nitin Guru","CFA Sanjay Saraf","CA Mayank Kothari"]},
    {no:"Paper 12", name:"Management Accounting", group:"Group 2", faculty:["Prof. A. Sourav Patro","CA Ranjan Periwal","CA Satish Jalan","CA Namit Arora","CMA Sumit Rastogi","CA Purushottam Aggarwal","CA Sankalp Kanstiya","CA Sachin Gupta","CA Raj K Agrawal","CA Dani Khandelwal","CA Ashish Kalra"]}
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
  regular:   { key:'regular',   label:'Regular',    tag:'Regular Lectures' },
  fasttrack: { key:'fasttrack', label:'Fast-track', tag:'Fast-track Lectures' }
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
  return (t && t[batch]) || ['#EAE8E4','#D2CFC8'];
}

/* the small line shown under the exam name on every card — set to '' to hide it */
const CARD_TAGLINE = 'NEW RECORDED';

/* Faculty shown first (in this exact order) — then the second list — then everyone else.
   Names are matched ignoring capital letters and full stops, so "Prof. A. Sourav Patro"
   and "Prof. A Sourav Patro" are treated as the same person. */
const FACULTY_ORDER_FIRST = [
  "Prof. Abanindra Sahu","Prof. Abhishek Mahapatro","Prof. A. Sourav Patro","Prof. Suvraprasad Tripathy",
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

/* The one faculty from the first list who still offers hard-copy books */
const FACULTY_WITH_BOOK_CHOICE = "Prof. Abanindra Sahu";

/* Rules that depend on who teaches the product (first-list faculty):
   - Mode of Class is only "Offline Face to Face"
   - Book Preference is only "Without Books" (Prof. Abanindra Sahu: "Hard Copy" or "Without Books")
   Everyone else: Hard Copy / Soft Copy / Without Books, and all three modes. */
function getProductRules(product){
  const facs = product.faculties || [];
  const allFirst = facs.length > 0 && facs.every(f => facultyTier(f).tier === 0);
  const hasBookFaculty = facs.some(f => normName(f) === normName(FACULTY_WITH_BOOK_CHOICE));
  let books = BOOK_PREFERENCES.slice();
  if(allFirst) books = hasBookFaculty ? ["Hard Copy","Without Books"] : ["Without Books"];
  return {
    books: books,
    modes: allFirst ? ["Offline Face to Face"] : MODES.slice()
  };
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
  "Operations Management and Strategic Management":"OM & SM", "Corporate Accounting and Auditing":"CAA",
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
  first.forEach(e  => seq.push({ e, batch:'regular' }));                                          // 1) regular cards of the first list
  second.forEach(e => { seq.push({ e, batch:'regular' }); seq.push({ e, batch:'fasttrack' }); }); // 2) regular + fast-track, one by one
  first.forEach(e  => seq.push({ e, batch:'fasttrack' }));                                        // 3) fast-track cards of the first list
  others.forEach(e => { seq.push({ e, batch:'regular' }); seq.push({ e, batch:'fasttrack' }); }); // 4) everyone else

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
  p.mrp = pr.mrp; p.discount = pr.discount; p.price = pr.price;
  return p;
}

function getExamLabelSafe(course, level){
  return (course === 'CS' && level === 'CSEET') ? 'CSEET' : (course + ' ' + level);
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
    p.mrp = mrp;
    p.discount = mrp ? (Number(row.discount) || 0) : null;
    p.price = mrp ? computeDiscountedPrice(mrp, p.discount) : null;
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

/* The 9s rule: the MRP (e.g. 9999) is treated as the round figure above it (10000),
   the discount is taken off that (10% -> 9000), the result is rounded DOWN to the nearest
   50 and written as a 9-ending figure (-> 8999). */
function computeDiscountedPrice(mrp, discountPct){
  mrp = Number(mrp);
  const d = Number(discountPct) || 0;
  if(!(mrp > 0)) return null;
  if(d <= 0) return mrp;
  const whole = mrp + 1;
  const discountedWhole = whole * (100 - d) / 100;
  const rounded = Math.floor(discountedWhole / 50) * 50;
  return Math.max(rounded - 1, 0);
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
  return { mrp:Number(row.mrp), discount, price:computeDiscountedPrice(row.mrp, discount) };
}

function formatRupees(n){
  if(n === null || n === undefined || isNaN(n)) return '---';
  return '₹' + Number(n).toLocaleString('en-IN');
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

/* Faculty photos: put a file called  images/faculty/<name>.png  in the GitHub repo, where <name>
   is the faculty name in small letters with hyphens, e.g. "CA Aakash Kandoi" -> ca-aakash-kandoi.png
   (a .jpg also works). Until a photo exists, the photo area on the card simply stays blank. */
function facultyPhotoPath(name, ext){
  return 'images/faculty/' + slugify(name) + '.' + (ext || 'png');
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
  return { mrp:Number(best.mrp), discount, price:computeDiscountedPrice(best.mrp, discount) };
}
