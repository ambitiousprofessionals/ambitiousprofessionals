function addCounsellingToCart(examOrCourse, whatWantToKnow){
  if(!requireAuthOrPrompt()) return;
  cartItems.push({ kind:'counselling', examOrCourse: examOrCourse, whatWantToKnow: whatWantToKnow });
  saveCartToFirestore().then(()=>{
    updateCartBadge();
    openCart();
  });
}

/* ============================================================
   COUNSELLING ENTRY POINTS (MBA panel + general strip)
   ============================================================ */
let pendingCounsellingType = null; // 'mba' | 'general'

document.getElementById('mbaBookBtn').addEventListener('click', ()=>{
  if(!requireAuthOrPrompt()) return;
  pendingCounsellingType = 'mba';
  document.getElementById('counsellingDetailsTitle').textContent = 'MBA Counselling Request';
  document.getElementById('cdExamField').classList.add('hidden');
  document.getElementById('cdExam').removeAttribute('required');
  document.getElementById('counsellingDetailsForm').reset();
  document.getElementById('cdWordCount').textContent = '0';
  openOverlay('counsellingDetailsOverlay');
});

document.getElementById('generalCounselBtn').addEventListener('click', ()=>{
  if(!requireAuthOrPrompt()) return;
  pendingCounsellingType = 'general';
  document.getElementById('counsellingDetailsTitle').textContent = 'Free Counselling Request';
  document.getElementById('cdExamField').classList.remove('hidden');
  document.getElementById('cdExam').setAttribute('required','required');
  document.getElementById('counsellingDetailsForm').reset();
  document.getElementById('cdWordCount').textContent = '0';
  openOverlay('counsellingDetailsOverlay');
});

document.getElementById('counsellingDetailsForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const examOrCourse = pendingCounsellingType === 'mba' ? 'MBA' : document.getElementById('cdExam').value.trim();
  const whatWantToKnow = document.getElementById('cdExtra').value.trim();
  closeOverlay('counsellingDetailsOverlay');
  addCounsellingToCart(examOrCourse, whatWantToKnow);
});

wireWordCount('cdExtra','cdWordCount',200);
