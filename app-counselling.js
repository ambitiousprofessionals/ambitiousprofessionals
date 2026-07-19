/* ============================================================
   COUNSELLING PAGE — general "Book a Free Counselling" trigger
   (MBA's trigger now lives on the Courses page's app-courses.js;
   both share the counselling-cart logic in app-common.js)
   ============================================================ */
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
