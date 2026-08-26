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
      gRow.innerHTML = `<td colspan="8">${paper.group}</td>`;
      gRow.style.animationDelay = (idx * 35) + 'ms';
      paperTableBody.appendChild(gRow);
    }
    const row = document.createElement('tr');
    row.className='paper-row disabled';
    row.dataset.idx = idx;
    row.style.animationDelay = (idx * 35) + 'ms';

    const facultyOptions = paper.faculty.map(f=>`<option value="${f}">${f}</option>`).join('') + `<option value="__other__">Other (please specify)</option>`;
    const attemptOptions = getAttemptsFor(currentCourse, currentLevel).map(a=>`<option value="${a}">${a}</option>`).join('');
    const typeOptions = CLASS_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('');
    const bookOptions = BOOK_PREFERENCES.map(b=>`<option value="${b}">${b}</option>`).join('');
    const modeSelectOptions = MODES.map(m=>`<option value="${m}">${m}</option>`).join('');

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
      <td><select class="f-book" disabled><option value="" selected disabled>Select preference</option>${bookOptions}</select></td>
      <td><select class="f-mode" disabled><option value="" selected disabled>Select mode</option>${modeSelectOptions}</select></td>
    `;
    paperTableBody.appendChild(row);
  });
  attachRowLogic();
  attachHoverOpenSelectsIn(paperTableBody);
  checkOrderReady();
}

function attachRowLogic(){
  paperTableBody.querySelectorAll('.paper-row').forEach(row=>{
    const enableChk = row.querySelector('.row-enable');
    const selects = row.querySelectorAll('select');
    const facultySelect = row.querySelector('.f-faculty');
    const facultyOther = row.querySelector('.f-faculty-other'); // hidden data store, not shown to user

    const otherOptionEl = facultySelect.querySelector('option[value="__other__"]');

    enableChk.addEventListener('change',()=>{
      const on = enableChk.checked;
      row.classList.toggle('disabled', !on);
      selects.forEach(s=>{ s.disabled = !on; if(!on) s.value=''; });
      facultyOther.value = '';
      otherOptionEl.textContent = OTHER_LABEL;
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
  });
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
    const bookPreference = row.querySelector('.f-book').value;
    const mode = row.querySelector('.f-mode').value;
    const facultyValid = faculty && (faculty !== '__other__' || facultyOtherVal.length > 0);
    if(!facultyValid || !attempt || !type || !bookPreference || !mode) ready = false;
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
    const bookPreference = row.querySelector('.f-book').value;
    const modeOfClass = row.querySelector('.f-mode').value;
    selected.push({kind:'classPaper', course: currentCourse, level: currentLevel, paperNo, paperName, faculty, attempt, typeOfClass, bookPreference, modeOfClass});
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
    flashAddedToCart(placeOrderBtn);
  });
}
