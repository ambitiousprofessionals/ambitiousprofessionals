/* ============================================================
   TEST SERIES PAGE
   ============================================================ */
let selectedIndividualPapers = [];

document.getElementById('tsExam').addEventListener('change', ()=>{
  const val = document.getElementById('tsExam').value;
  const parts = val.split('|');
  const course = parts[0];
  const level = parts[1];
  const attemptSelect = document.getElementById('tsAttempt');
  attemptSelect.innerHTML = '<option value="" selected disabled>Select attempt</option>' +
    getAttemptsFor(course, level).map(a=>`<option value="${a}">${a}</option>`).join('');
  attemptSelect.disabled = false;
  resetAttemptingForward();
});

document.getElementById('tsAttempt').addEventListener('change', ()=>{
  document.getElementById('tsAttemptingFor').disabled = false;
  resetAttemptingForward();
});

document.getElementById('tsAttemptingFor').addEventListener('change', ()=>{
  const val = document.getElementById('tsAttemptingFor').value;
  if(val === 'Individual Papers'){
    openIndividualPapersDialog();
  } else {
    document.getElementById('tsIndividualSummary').classList.add('hidden');
    selectedIndividualPapers = [];
    document.getElementById('tsTypeSection').classList.remove('hidden');
  }
});

function resetAttemptingForward(){
  const attemptingFor = document.getElementById('tsAttemptingFor');
  attemptingFor.value = '';
  document.getElementById('tsTypeSection').classList.add('hidden');
  document.getElementById('tsIndividualSummary').classList.add('hidden');
  selectedIndividualPapers = [];
  document.querySelectorAll('.ts-type-card').forEach(c=>c.classList.remove('selected'));
  updateTsAddToCartState();
}

function openIndividualPapersDialog(){
  const parts = document.getElementById('tsExam').value.split('|');
  const papers = COURSES[parts[0]][parts[1]];
  const container = document.getElementById('tsPapersChecklist');
  container.innerHTML = papers.map(p =>
    `<label style="display:flex;align-items:center;gap:10px;font-size:13.5px;">
      <input type="checkbox" class="ts-paper-chk" value="${p.no}: ${p.name}">
      ${p.no}: ${p.name}
    </label>`
  ).join('');
  container.querySelectorAll('.ts-paper-chk').forEach(chk=>{
    chk.addEventListener('change', ()=>{
      const any = [...container.querySelectorAll('.ts-paper-chk')].some(c=>c.checked);
      document.getElementById('tsConfirmPapersBtn').disabled = !any;
    });
  });
  document.getElementById('tsConfirmPapersBtn').disabled = true;
  openOverlay('tsIndividualPapersOverlay');
}

document.getElementById('tsConfirmPapersBtn').addEventListener('click', ()=>{
  const checked = [...document.querySelectorAll('.ts-paper-chk')].filter(c=>c.checked).map(c=>c.value);
  selectedIndividualPapers = checked;
  closeOverlay('tsIndividualPapersOverlay');
  const summary = document.getElementById('tsIndividualSummary');
  summary.textContent = 'Selected papers: ' + checked.join(', ');
  summary.classList.remove('hidden');
  document.getElementById('tsTypeSection').classList.remove('hidden');
});

document.querySelectorAll('.ts-type-card').forEach(card=>{
  card.addEventListener('click', ()=>{
    document.querySelectorAll('.ts-type-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    updateTsAddToCartState();
  });
});

function updateTsAddToCartState(){
  const selected = document.querySelector('.ts-type-card.selected');
  document.getElementById('tsAddToCartBtn').disabled = !selected;
}

document.getElementById('tsAddToCartBtn').addEventListener('click', ()=>{
  if(!requireAuthOrPrompt()) return;
  const parts = document.getElementById('tsExam').value.split('|');
  const examToAppear = getExamLabel(parts[0], parts[1]);
  const attempt = document.getElementById('tsAttempt').value;
  const attemptingForRaw = document.getElementById('tsAttemptingFor').value;
  const attemptingFor = attemptingForRaw === 'Individual Papers' ? selectedIndividualPapers.join(', ') : attemptingForRaw;
  const selectedCard = document.querySelector('.ts-type-card.selected');
  if(!selectedCard) return;
  const testSeriesType = selectedCard.dataset.type;

  cartItems.push({ kind:'testSeries', examToAppear, attempt, attemptingFor, testSeriesType });
  saveCartToFirestore().then(()=>{
    updateCartBadge();
    flashAddedToCart(document.getElementById('tsAddToCartBtn'));
    resetTestSeriesForm();
  });
});

function resetTestSeriesForm(){
  document.getElementById('tsExam').value = '';
  document.getElementById('tsAttempt').innerHTML = '<option value="" selected disabled>Select exam first</option>';
  document.getElementById('tsAttempt').disabled = true;
  document.getElementById('tsAttemptingFor').disabled = true;
  resetAttemptingForward();
}
