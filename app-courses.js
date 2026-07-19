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

function getAttemptsFor(course, level){
  if(course === 'CA' && level === 'Final') return generateAttempts([10,4], 6);   // Nov, May
  if(course === 'CMA' && level === 'Final') return generateAttempts([5,11], 5);  // Jun, Dec — 5 attempts
  if(course === 'CMA') return generateAttempts([5,11], 3);                       // Jun, Dec — 3 attempts (Foundation/Inter)
  if(course === 'CS' && level === 'CSEET') return generateAttempts([1,5,9], 4);  // Feb, Jun, Oct — 4 attempts
  if(course === 'CS' && level === 'Executive') return generateAttempts([5,11], 3); // Jun, Dec — 3 attempts
  if(course === 'CS' && level === 'Professional') return generateAttempts([5,11], 5); // Jun, Dec — 5 attempts
  return generateAttempts([0,4,8], 4);                                          // Jan, May, Sep
}

const CLASS_TYPES = ["Regular","Fast-track","Exam Oriented","Revision Classes"];
const MODES = ["Offline Face to Face","Online Live","Online Google Drive","Online Pen Drive"];

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

document.getElementById('facultyOtherConfirm').addEventListener('click', confirmFacultyOtherDialog);
document.getElementById('facultyOtherCancel').addEventListener('click', cancelFacultyOtherDialog);
document.getElementById('facultyOtherInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter'){
    e.preventDefault();
    confirmFacultyOtherDialog();
  }
});

const COURSES = {
CA: {
  Foundation: [
    {no:"Paper 1", name:"Principles and Practice of Accounting", faculty:["CA Nitin Goel","CA Hardik Manchanda","CA Anshul Agrawal","CA Parag Gupta","CA Anand Bhangariya","CA Tejas Suchak","CA Avinash Sancheti","CA Manish Mahajan","CA Parveen Sharma","CA Rishabh Rohra"]},
    {no:"Paper 2", name:"Business Laws", faculty:["Prof. Abanindra Sahu","CA Darshan Khare","CA Ankita Patni","CA Deepika Rathi","CA Indresh Gandhi","CS Arjun Chhabra","CA Sahil Grover","CA Gurpreet Singh","CA Shivangi Agrawal","CA Lovely Dhingra"]},
    {no:"Paper 3", name:"Quantitative Aptitude", faculty:["CA Pranav Popat","CA Nishant Kumar","CA Vinod Reddy","CA Aman Khedia","Prof. Akash Agrawal","CS Vaibhav Chitlangia","CA Navneet Mundhra","Prof. Raj Awate","Prof. Mayank Maheshwari","Anurag Chauhan"]},
    {no:"Paper 4", name:"Business Economics", faculty:["Prof. Akhilesh Daga","CA Harshad Jaju","CA Mohnish Vora","CA Hardik Manchanda","CA Sanchit Grover","CA Parag Gupta","CA Aakansha Arora","CA Divya Agarwal","CA Vijay Sarda","Prof. Love Kaushik"]}
  ],
  Intermediate: [
    {no:"Paper 1", name:"Advanced Accounting", group:"Group 1", faculty:["CA Parveen Sharma","CA Rohit Sethi","CA Anand Bhangariya","CA Jai Chawla","CA Chiranjeev Jain","CA Abhishek Zaware","CA Aakash Kandoi","CA Parveen Jindal","CA Tejas Suchak","CA Nitin Goel"]},
    {no:"Paper 2", name:"Corporate & Other Laws", group:"Group 1", faculty:["CA Shubham Singhal","CA Darshan Khare","CA Harsh Gupta","CA Ankita Patni","CA Amit Popli","CA Siddharth Agarwal","CA Abhishek Bansal","CS Arjun Chhabra","CA Mohit Agarwal","CA Shivangi Agrawal"]},
    {no:"Paper 3A", name:"Income Tax Law", group:"Group 1", faculty:["CA Bhanwar Borana","CA Vijay Sarda","CA Vijender Aggarwal","CA Vivek Gaba","CA Aarish Khan","CA Yash Khandelwal","CA Shirish Vyas","CA Subodh Shah","CA Neeraj Arora","CA Amit Mahajan"]},
    {no:"Paper 3B", name:"Goods and Service Tax", group:"Group 1", faculty:["CA Vishal Bhattad","CA Raj Kumar","CA Yashvant Mangal","CA Vijender Aggarwal","CA Vivek Gaba","CA Jasmeet Singh","CA Arpita Tulsyan","CA Aarish Khan","CMA Tharun Raj","CA Pooja Kamdar Date"]},
    {no:"Paper 4", name:"Cost and Management Accounting", group:"Group 2", faculty:["CA Parag Gupta","CA Harshad Jaju","CA Purushottam Aggarwal","CA Ashish Kalra","CA Namit Arora","CA Pranav Popat","CA R.K. Mehta","CA Rahul Garg","CA Ranjan Periwal","CA Darshan Chandaliya"]},
    {no:"Paper 5", name:"Auditing and Ethics", group:"Group 2", faculty:["CA Shubham Keswani","CA Neeraj Arora","CA Kapil Goyal","CA Rishabh Jain","CA Pankaj Garg","CA Surbhi Bansal","CA Harshad Jaju","CA Sarthak Jain","CA Amit Popli","CA Mohit Agarwal"]},
    {no:"Paper 6A", name:"Financial Management", group:"Group 2", faculty:["CA Aaditya Jain","CFA Sanjay Saraf","CA Namit Arora","CA Nitin Guru","CA Swapnil Patni","CA Ranjan Periwal","CA Rahul Garg","CA Sanjay Khemka","CA Ashish Kalra","CA Abhishek Zaware"]},
    {no:"Paper 6B", name:"Strategic Management", group:"Group 2", faculty:["Prof. Sonali Jain","CA Ashish Kalra","CA Namit Arora","CA Sanjay Khemka","CA Aaditya Jain","CA Rishabh Jain","CA CS Siddharth Agarwal","CA Neeraj Arora","CA Swapnil Patni","CA Mayank Saraf","CA Mrugesh Madlani"]}
  ],
  Final: [
    {no:"Paper 1", name:"Financial Reporting", group:"Group 1", faculty:["CA Praveen Sharma","CA Parveen Jindal","CA Aakash Kandoi","CA Sarthak Jain","CA Pratik Jagati","CA Chiranjeev Jain","CA Jai Chawla","CA Avinash Sancheti","CA Suraj Lakhotia","CA Sumit Sarda"]},
    {no:"Paper 2", name:"Advanced Financial Management", group:"Group 1", faculty:["CFA Sanjay Saraf","CA Aaditya Jain","CA Ajay Agarwal","CA Mayank Kothari","CA Sankalp Kanstiya","CA Nitin Guru","CA Nagendra Sah","Prof. Archana Khetan","CA Praveen Khatod","CA Abhishek Zaware"]},
    {no:"Paper 3", name:"Advanced Auditing, Assurance & Professional Ethics", group:"Group 1", faculty:["CA Shubham Keswani","CA Pankaj Garg","CA Harshad Jaju","CA Pradnya Mundada","CA Kapil Goyal","CA Neeraj Arora","CA Abhishek Bansal","CA Amit Tated","CA Aarti Lahoti","CA Sarthak Jain"]},
    {no:"Paper 4", name:"Direct Tax Laws & International Taxation", group:"Group 2", faculty:["CA Bhanwar Borana","CA Vijay Sarda","CA Yash Khandelwal","CA Atul Agarwal","CA Shubham Singhal","CA Vinod Gupta","CA Aarish Khan","CA Punarvas Jayakumar","CA Shirish Vyas","CA Durgesh Singh"]},
    {no:"Paper 5", name:"Indirect Tax Laws", group:"Group 2", faculty:["CA Vishal Bhattad","CA Raj Kumar","CA Ramesh Soni","CA Yashvant Mangal","CA Akshansh Garg","CA Riddhi Baghmar","CA Arpita Tulsyan","CA Brindavan Giri","CA Nikunj Goenka","CA Amit Jain"]}
  ]
},
CMA: {
  Foundation: [
    {no:"Paper 1", name:"Fundamentals of Business Laws and Business Communication", faculty:["Prof. Abanindra Sahu","CA Shivangi Agrawal","CA Amit Bachhawat","CS Arjun Chhabra","CA Raghav Goel","CA Ruchika Saboo","CA Siddharth Agarwal","CA CS Mohit Agarwal","CA Shivam Palan","CA CS Jaspreet Singh Johar"]},
    {no:"Paper 2", name:"Fundamentals of Financial and Cost Accounting", faculty:["CA CMA Santosh Kumar","CA CMA Abhimanyu Agarwal","CA Avinash Sancheti","CA Ranjan Periwal","CA Yashvardhan Saboo","CA Sudarshan Agrawal","CA Parveen Sharma","CA Raj K Agrawal","CA Sarthak Jain","Prof. Navneet Mundhra"]},
    {no:"Paper 3", name:"Fundamentals of Business Mathematics and Statistics", faculty:["Prof. Mayank Agarwal","CA Pranav Chandak","CA Ashish Kedia","CA Raj K Agrawal","Prof. Deepack Sir","Prof. Navneet Mundhra","Prof. Sandeep Giri","CA Nitin Guru","Prof. Vinit Kumar","CA Sanjay Khemka"]},
    {no:"Paper 4", name:"Fundamentals of Business Economics and Management", faculty:["CA Harshad Jaju","CA Priyanka Saxena","Prof. Sandeep Giri","Prof. Vinit Kumar","CA Yashvardhan Saboo","Prof. Kundu Sir","CA Amit Tated","Prof. Archana Khetan","CA Sarthak Jain","CA CS Mohit Agarwal"]}
  ],
  Intermediate: [
    {no:"Paper 5", name:"Business Laws and Ethics", group:"Group 1", faculty:["Prof. Abanindra Sahu","CS Arjun Chhabra","CA Shivangi Agrawal","CA CS Divya Agarwal","CA Sudhir Sachdeva","CA Amit Bachhawat","CA Shivam Palan","Prof. Hemangi Kothari","CA CS Mohit Agarwal","CA Abhishek Bansal"]},
    {no:"Paper 6", name:"Financial Accounting", group:"Group 1", faculty:["CA CMA Santosh Kumar","CA CS Avinash Sancheti","CA Bishnu Kedia","CA CMA Abhimanyu Agarwal","CA Ranjan Periwal","CA Raj K Agrawal","CA Avinash Lala","CA Ayush Tibrewal","CA Sudarshan Agrawal","CA Parveen Sharma"]},
    {no:"Paper 7A", name:"Direct Taxation", group:"Group 1", faculty:["CA Bhanwar Borana","CA Vijay Sarda","CA Yash Khandelwal","CA Jaspreet Singh Johar","CA Aarish Khan","CA Vinod Gupta","CA Sahil Jain","CA Pranav Chandak","CA Vivek Gaba","Prof. Vivek Soni"]},
    {no:"Paper 7B", name:"Indirect Taxation", group:"Group 1", faculty:["CA Vishal Bhattad","CA Raj Kumar","CA Ramesh Soni","CA Yashvant Mangal","CA Nikunj Goenka","CA Akshansh Garg","CA Riddhi Baghmar","CA Arpita Tulsyan","CA Amit Jain","CA Brindavan Giri"]},
    {no:"Paper 8", name:"Cost Accounting", group:"Group 1", faculty:["CA Satish Jalan","CA Ranjan Periwal","CA Purushottam Aggarwal","CMA Sumit Rastogi","CA Nitin Guru","CA Sankalp Kanstiya","CA Raj K Agrawal","CA Namit Arora","CA Sachin Gupta","CA Dani Khandelwal"]},
    {no:"Paper 9", name:"Operations Management and Strategic Management", group:"Group 2", faculty:["CA Mayank Saraf","CA CS Divya Agarwal","CA Amit Tated","CMA Akshay Sen","Prof. Sandeep Giri","CA Sanjay Khemka","CA Nitin Guru","Prof. J.S. Malhotra","Prof. Vinit Kumar","CA Harshad Jaju"]},
    {no:"Paper 10", name:"Corporate Accounting and Auditing", group:"Group 2", faculty:["Prof. Abanindra Sahu","CA CS Avinash Sancheti","CA Bishnu Kedia","CA CMA Abhimanyu Agarwal","CA Satish Sureka","CA Raghav Goel","CA Karthik Iyer","CA Sarthak Jain","Prof. Hemangi Kothari","CA Pankaj Garg"]},
    {no:"Paper 11", name:"Financial Management and Business Data Analytics", group:"Group 2", faculty:["CA Ranjan Periwal","CA Satish Jalan","CA Satish Sureka","CA Gourav Kabra","CA Sanjay Khemka","CA Aditya Jain","Prof. Raj Awate","CA Nitin Guru","CFA Sanjay Saraf","CA Mayank Kothari"]},
    {no:"Paper 12", name:"Management Accounting", group:"Group 2", faculty:["CA Ranjan Periwal","CA Satish Jalan","CA Namit Arora","CMA Sumit Rastogi","CA Purushottam Aggarwal","CA Sankalp Kanstiya","CA Sachin Gupta","CA Raj K Agrawal","CA Dani Khandelwal","CA Ashish Kalra"]}
  ],
  Final: [
    {no:"Paper 13", name:"Corporate and Economic Laws", group:"Group 1", faculty:["Prof. Abanindra Sahu","CS Arjun Chhabra","CA Shivangi Agrawal","CA Amit Popli","CA Amit Bachhawat","CA CS Mohit Agarwal","CA Shivam Palan","CA CS Jaspreet Singh Johar","CA Abhishek Bansal","CA Siddharth Agarwal"]},
    {no:"Paper 14", name:"Strategic Financial Management", group:"Group 1", faculty:["CFA Sanjay Saraf","CA Aditya Jain","CA Ranjan Periwal","CA Satish Jalan","CA Gourav Kabra","CA Mayank Kothari","CA Nitin Guru","CA Sankalp Kanstiya","CA Ashish Kalra","CA Praveen Khatod"]},
    {no:"Paper 15", name:"Direct Tax Laws and International Taxation", group:"Group 1", faculty:["CA Bhanwar Borana","CA Vijay Sarda","CA Yash Khandelwal","CA Atul Agarwal","CA Shubham Singhal","CA Vinod Gupta","CA Aarish Khan","CA Punarvas Jayakumar","CA Shirish Vyas","CA Durgesh Singh"]},
    {no:"Paper 16", name:"Strategic Cost Management", group:"Group 1", faculty:["CA Satish Jalan","CA Ranjan Periwal","CA Sankalp Kanstiya","CA Purushottam Aggarwal","CA Nitin Guru","CA Namit Arora","CA Sachin Gupta","CA Dani Khandelwal","CA Ashish Kalra","CMA Sumit Rastogi"]},
    {no:"Paper 17", name:"Cost and Management Audit", group:"Group 2", faculty:["CMA Sumit Rastogi","CA Ranjan Periwal","CA Satish Jalan","CA Sankalp Kanstiya","CA Purushottam Aggarwal","CA Nitin Guru","CA Namit Arora","CA Sachin Gupta","CA Dani Khandelwal","CA Ashish Kalra"]},
    {no:"Paper 18", name:"Corporate Financial Reporting", group:"Group 2", faculty:["CA Parveen Sharma","CA CS Avinash Sancheti","CA Sarthak Jain","CA Parveen Jindal","CA Aakash Kandoi","CA Pratik Jagati","CA Jai Chawla","CA Abhimanyu Agarwal","CA Raj K Agrawal","CA Ranjan Periwal"]},
    {no:"Paper 19", name:"Indirect Tax Laws and Practice", group:"Group 2", faculty:["CA Vishal Bhattad","CA Raj Kumar","CA Ramesh Soni","CA Yashvant Mangal","CA Akshansh Garg","CA Riddhi Baghmar","CA Arpita Tulsyan","CA Brindavan Giri","CA Nikunj Goenka","CA Amit Jain"]},
    {no:"Paper 20A", name:"Strategic Performance Management and Business Valuation", group:"Group 2", faculty:["CFA Sanjay Saraf","CA Ranjan Periwal","CA Satish Jalan","CA Gourav Kabra","CA Sanjay Khemka","CA Aditya Jain","CA Nitin Guru","CA Sankalp Kanstiya","CA Namit Arora","CA Purushottam Aggarwal"]}
  ]
},
CS: {
  CSEET: [
    {no:"Paper 1", name:"Business Communication", faculty:["CA CS Mohit Agarwal","CS Shubham Modi","CA CS Divya Agarwal","CS Alok Jha","CS Muskan Gupta","Prof. Sameer Gupte","Prof. Ishan Gupta","CA Shivangi Agrawal","Prof. Yashika Vardhan","CS Jaspreet Singh Johar"]},
    {no:"Paper 2", name:"Legal Aptitude and Logical Reasoning", faculty:["CS Arjun Chhabra","CS Shubham Modi","CA CS Mohit Agarwal","CA Sudhir Sachdeva","CS Alok Jha","Prof. Nitin Bharadwaj","CS Vaibhav Chitlangia","CA Shivam Palan","CS Vikas Vohra","CS Amit Vohra"]},
    {no:"Paper 3", name:"Economic and Business Environment", faculty:["CA Harshad Jaju","CS Shubham Modi","CA CS Divya Agarwal","Prof. Sandeep Giri","CS Mayank Saraf","Prof. Vinit Kumar","CA Amit Tated","CS Muskan Gupta","Prof. Yashika Vardhan","CA Raj K Agrawal"]},
    {no:"Paper 4", name:"Current Affairs and Quantitative Aptitude", faculty:["Prof. Mayank Agarwal","CS Shubham Modi","CA Pranav Chandak","Prof. Navneet Mundhra","Prof. Deepack Sir","CS Vaibhav Chitlangia","Prof. Sandeep Giri","CS Vikas Vohra","Prof. Vinit Kumar","CA Sanjay Khemka"]}
  ],
  Executive: [
    {no:"Paper 1", name:"Jurisprudence, Interpretation and General Laws (JIGL)", group:"Group 1", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CA Sudhir Sachdeva","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]},
    {no:"Paper 2", name:"Company Law and Practice", group:"Group 1", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CA Sudhir Sachdeva","CS Shubham Modi","CS Alok Jha","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra","CA Shivangi Agrawal"]},
    {no:"Paper 3", name:"Setting Up of Business, Industrial and Labour Laws (SBILL)", group:"Group 1", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CA Sudhir Sachdeva","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]},
    {no:"Paper 4", name:"Corporate Accounting and Financial Management (CAFM)", group:"Group 1", faculty:["CA CS Avinash Sancheti","CA Ranjan Periwal","CA Satish Jalan","CA CMA Santosh Kumar","CA CMA Abhimanyu Agarwal","CA Sarthak Jain","CA Nitin Guru","Prof. Raj Awate","CA Ashish Kalra","CA Gourav Kabra"]},
    {no:"Paper 5", name:"Capital Market and Securities Laws (CMSL)", group:"Group 2", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CS Shubham Modi","CS Alok Jha","CA Sanjay Khemka","CFA Sanjay Saraf","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]},
    {no:"Paper 6", name:"Economic, Commercial and Intellectual Property Laws (ECIPL)", group:"Group 2", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CS Shubham Modi","CA Sudhir Sachdeva","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]},
    {no:"Paper 7", name:"Tax Laws and Practice (TLP)", group:"Group 2", faculty:["CA Bhanwar Borana","CA Vishal Bhattad","CA Vijay Sarda","CA Nikunj Goenka","CA Jaspreet Singh Johar","CA Raj Kumar","CA Ramesh Soni","CA Yashvant Mangal","CA Vivek Gaba","CA Aarish Khan"]}
  ],
  Professional: [
    {no:"Paper 1", name:"Environmental, Social and Governance (ESG) – Principles and Practice", group:"Group 1", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra","CA Shivangi Agrawal"]},
    {no:"Paper 2", name:"Drafting, Pleadings and Appearances", group:"Group 1", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CA Sudhir Sachdeva","CS Shubham Modi","CS Alok Jha","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra","CS Devendra Subhash"]},
    {no:"Paper 3", name:"Compliance Management, Audit and Due Diligence", group:"Group 1", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra","CS Pankaj Garg"]},
    {no:"Paper 5", name:"Strategic Management and Corporate Finance", group:"Group 2", faculty:["CFA Sanjay Saraf","CA Aditya Jain","CA Ranjan Periwal","CA Satish Jalan","CA Gourav Kabra","CA Mayank Kothari","CA Nitin Guru","CA Sankalp Kanstiya","CA Ashish Kalra","CS Amit Vohra"]},
    {no:"Paper 6", name:"Corporate Restructuring, Valuation and Insolvency", group:"Group 2", faculty:["CS Arjun Chhabra","CA CS Mohit Agarwal","CS Amit Vohra","CFA Sanjay Saraf","CS Shubham Modi","CS Alok Jha","CA CS Divya Agarwal","CS Anoop Jain","CS Tushar Pahade","CS Vikas Vohra"]}
  ]
}
};

/* ============================================================
   STATE
   ============================================================ */
let currentCourse = null;
let currentLevel = null;

const tableWrap = document.getElementById('tableWrap');
const paperTableBody = document.getElementById('paperTableBody');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const noSelectionMsg = document.getElementById('noSelectionMsg');
const coursesHeading = document.getElementById('coursesHeading');
const coursesSub = document.getElementById('coursesSub');

/**
 * Course + level now come from the Courses nav dropdown, via URL query
 * params (e.g. courses.html?course=CA&level=Foundation), instead of
 * on-page buttons.
 */
function initCoursesFromURL(){
  const params = new URLSearchParams(window.location.search);
  const urlCourse = params.get('course');
  const urlLevel = params.get('level');
  const mbaPanel = document.getElementById('mbaPanelSection');

  if(urlCourse === 'MBA'){
    coursesHeading.textContent = 'MBA Guidance';
    coursesSub.textContent = "Talk to us about exams, universities, and timelines — free of charge.";
    noSelectionMsg.classList.add('hidden');
    tableWrap.classList.add('hidden');
    if(mbaPanel) mbaPanel.classList.remove('hidden');
    return;
  }
  if(mbaPanel) mbaPanel.classList.add('hidden');

  const validCourse = urlCourse === 'CA' || urlCourse === 'CMA' || urlCourse === 'CS';
  const validCALevel = (urlCourse === 'CA' || urlCourse === 'CMA') && (urlLevel === 'Foundation' || urlLevel === 'Intermediate' || urlLevel === 'Final');
  const validCSLevel = urlCourse === 'CS' && (urlLevel === 'CSEET' || urlLevel === 'Executive' || urlLevel === 'Professional');
  const validLevel = validCALevel || validCSLevel;

  if(validCourse && validLevel){
    currentCourse = urlCourse;
    currentLevel = urlLevel;
    coursesHeading.textContent = getExamLabel(urlCourse, urlLevel);
    coursesSub.textContent = 'Select the papers you need, fill in every field, and add them to your cart.';
    noSelectionMsg.classList.add('hidden');
    renderTable();
    tableWrap.classList.remove('hidden');
  } else {
    noSelectionMsg.classList.remove('hidden');
    tableWrap.classList.add('hidden');
  }
}
initCoursesFromURL();

const mbaBookBtnEl = document.getElementById('mbaBookBtn');
if(mbaBookBtnEl){
  mbaBookBtnEl.addEventListener('click', ()=>{
    if(!requireAuthOrPrompt()) return;
    pendingCounsellingType = 'mba';
    document.getElementById('counsellingDetailsTitle').textContent = 'MBA Counselling Request';
    document.getElementById('cdExamField').classList.add('hidden');
    document.getElementById('cdExam').removeAttribute('required');
    document.getElementById('counsellingDetailsForm').reset();
    document.getElementById('cdWordCount').textContent = '0';
    openOverlay('counsellingDetailsOverlay');
  });
}

function renderTable(){
  const papers = COURSES[currentCourse][currentLevel];
  paperTableBody.innerHTML = '';
  let lastGroup = null;
  papers.forEach((paper, idx)=>{
    if(paper.group && paper.group !== lastGroup){
      lastGroup = paper.group;
      const gRow = document.createElement('tr');
      gRow.className='group-row';
      gRow.innerHTML = `<td colspan="7">${paper.group}</td>`;
      paperTableBody.appendChild(gRow);
    }
    const row = document.createElement('tr');
    row.className='paper-row disabled';
    row.dataset.idx = idx;

    const facultyOptions = paper.faculty.map(f=>`<option value="${f}">${f}</option>`).join('') + `<option value="__other__">Other (please specify)</option>`;
    const attemptOptions = getAttemptsFor(currentCourse, currentLevel).map(a=>`<option value="${a}">${a}</option>`).join('');
    const typeOptions = CLASS_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('');
    const modeOptions = MODES.map(m=>`<div class="mode-option" data-value="${m}"><span class="mode-num"></span><span class="mode-text">${m}</span></div>`).join('');
    const modeList = `<div class="mode-list disabled"><div class="mode-hint">Choose according to your preference; only the available mode will be provided.</div>${modeOptions}</div>`;

    row.innerHTML = `
      <td class="chk-cell"><input type="checkbox" class="row-enable"></td>
      <td>${paper.no}</td>
      <td class="paper-name"><b>${paper.name}</b></td>
      <td>
        <select class="f-faculty" disabled><option value="" selected disabled>Select faculty</option>${facultyOptions}</select>
        <input type="text" class="f-faculty-other hidden" disabled placeholder="Type faculty name">
      </td>
      <td><select class="f-attempt" disabled><option value="" selected disabled>Select attempt</option>${attemptOptions}</select></td>
      <td><select class="f-type" disabled><option value="" selected disabled>Select type</option>${typeOptions}</select></td>
      <td>${modeList}</td>
    `;
    paperTableBody.appendChild(row);
  });
  attachRowLogic();
  checkOrderReady();
}

function attachRowLogic(){
  paperTableBody.querySelectorAll('.paper-row').forEach(row=>{
    const enableChk = row.querySelector('.row-enable');
    const selects = row.querySelectorAll('select');
    const facultySelect = row.querySelector('.f-faculty');
    const facultyOther = row.querySelector('.f-faculty-other'); // hidden data store, not shown to user
    const modeOptions = row.querySelectorAll('.mode-option');
    const modeList = row.querySelector('.mode-list');

    const otherOptionEl = facultySelect.querySelector('option[value="__other__"]');

    enableChk.addEventListener('change',()=>{
      const on = enableChk.checked;
      row.classList.toggle('disabled', !on);
      selects.forEach(s=>{ s.disabled = !on; if(!on) s.value=''; });
      facultyOther.value = '';
      otherOptionEl.textContent = OTHER_LABEL;
      if(!on) resetModeOptions(modeOptions);
      modeOptions.forEach(m=>{ m.dataset.enabled = on ? 'true' : 'false'; });
      modeList.classList.toggle('disabled', !on);
      checkOrderReady();
    });

    facultySelect.addEventListener('change',()=>{
      if(facultySelect.value === '__other__'){
        openFacultyOtherDialog(facultySelect, facultyOther, otherOptionEl);
      } else {
        facultyOther.value = '';
        otherOptionEl.textContent = OTHER_LABEL;
        checkOrderReady();
      }
    });

    selects.forEach(s=>s.addEventListener('change',checkOrderReady));
    modeOptions.forEach(opt=>{
      opt.addEventListener('click',()=>{
        if(modeList.classList.contains('disabled')) return;
        toggleModeOption(opt, modeOptions);
        checkOrderReady();
      });
    });
  });
}

function resetModeOptions(modeOptions){
  modeOptions.forEach(m=>{
    m.classList.remove('selected');
    m.dataset.order = '';
    m.querySelector('.mode-num').textContent = '';
  });
}

function toggleModeOption(opt, allOptions){
  if(opt.classList.contains('selected')){
    // deselect, then re-sequence remaining selections so numbers stay 1,2,3...
    const removedOrder = parseInt(opt.dataset.order, 10);
    opt.classList.remove('selected');
    opt.dataset.order = '';
    opt.querySelector('.mode-num').textContent = '';
    allOptions.forEach(m=>{
      if(m.classList.contains('selected')){
        const o = parseInt(m.dataset.order, 10);
        if(o > removedOrder){
          m.dataset.order = o - 1;
          m.querySelector('.mode-num').textContent = o - 1;
        }
      }
    });
  } else {
    const selectedCount = [...allOptions].filter(m=>m.classList.contains('selected')).length;
    const nextOrder = selectedCount + 1;
    opt.classList.add('selected');
    opt.dataset.order = nextOrder;
    opt.querySelector('.mode-num').textContent = nextOrder;
  }
}

function checkOrderReady(){
  const rows = [...paperTableBody.querySelectorAll('.paper-row')];
  const enabledRows = rows.filter(r=>r.querySelector('.row-enable').checked);
  let ready = enabledRows.length > 0;
  enabledRows.forEach(row=>{
    const faculty = row.querySelector('.f-faculty').value;
    const facultyOtherVal = row.querySelector('.f-faculty-other').value.trim();
    const attempt = row.querySelector('.f-attempt').value;
    const type = row.querySelector('.f-type').value;
    const anyMode = row.querySelectorAll('.mode-option.selected').length > 0;
    const facultyValid = faculty && (faculty !== '__other__' || facultyOtherVal.length > 0);
    if(!facultyValid || !attempt || !type || !anyMode) ready = false;
  });
  placeOrderBtn.disabled = !ready;
}

placeOrderBtn.addEventListener('click',()=>{
  if(placeOrderBtn.disabled) return;
  addTablePapersToCart();
});

function collectSelectedPapers(){
  const rows = [...paperTableBody.querySelectorAll('.paper-row')];
  const selected = [];
  rows.forEach(row=>{
    if(!row.querySelector('.row-enable').checked) return;
    const paperNo = row.children[1].textContent.trim();
    const paperName = row.querySelector('.paper-name b').textContent.trim();
    let faculty = row.querySelector('.f-faculty').value;
    if(faculty === '__other__'){
      const customName = row.querySelector('.f-faculty-other').value.trim();
      faculty = customName ? customName : 'Other';
    }
    const attempt = row.querySelector('.f-attempt').value;
    const typeOfClass = row.querySelector('.f-type').value;
    const modeOfClass = [...row.querySelectorAll('.mode-option.selected')]
      .sort((a,b) => parseInt(a.dataset.order,10) - parseInt(b.dataset.order,10))
      .map(m => m.dataset.order + ') ' + m.dataset.value)
      .join(', ');
    selected.push({kind:'classPaper', course: currentCourse, level: currentLevel, paperNo, paperName, faculty, attempt, typeOfClass, modeOfClass});
  });
  return selected;
}

function addTablePapersToCart(){
  if(!requireAuthOrPrompt()) return;
  const newItems = collectSelectedPapers();
  if(newItems.length === 0) return;
  cartItems = cartItems.concat(newItems);
  saveCartToFirestore().then(()=>{
    updateCartBadge();
    renderTable(); // reset the table's selections
    openCart();
  });
}
