/* ============================================================
   SHARED CARD PIECES
   Used by the Lectures page, the Test Series page, and the full-page Cart / My Orders.
   Needs app-coursedata.js to be loaded before it.
   ============================================================ */

function esc(s){
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* the "<" back icon used on every back button */
const ICON_BACK = '<svg class="ic-back" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>';

function isLoggedIn(){
  return !!(typeof auth !== 'undefined' && auth.currentUser && currentUserProfile);
}

/* ============================================================
   FACULTY PHOTOS — until a photo exists the photo area simply stays blank
   ============================================================ */
document.addEventListener('error', (e)=>{
  const img = e.target;
  if(!(img instanceof HTMLImageElement) || !img.classList.contains('pc-face')) return;
  const step = img.dataset.ext || 'webp';
  if(step === 'webp'){
    img.dataset.ext = 'png';
    img.src = facultyPhotoPath(img.dataset.fac, 'png');
  } else if(step === 'png'){
    img.dataset.ext = 'jpg';
    img.src = facultyPhotoPath(img.dataset.fac, 'jpg');
  } else {
    img.dataset.ext = 'none';
    img.classList.add('pc-face-off');
  }
}, true);

function faceImg(name, cls){
  return '<img class="pc-face ' + cls + '" data-fac="' + esc(name) + '" data-ext="webp" src="' + esc(facultyPhotoPath(name, 'webp')) +
    '" alt="" loading="lazy" decoding="async">';
}

/* ============================================================
   FITS THE TEXT ON EVERY POSTER — measures the real text and shrinks it until it fits its box
   ============================================================ */
/* Where each faculty photo starts on its left side (row by row, in poster units "cqw", one value per 1cqw going down the photo,
   in tenths; 999 = nobody there). It lets a short subject name stretch wider and grow bigger — exactly as far as the photo allows. */
const FACE_EDGE = {"ca-abhishek-zaware":[999,999,999,656,637,620,612,606,599,596,596,596,597,599,596,595,595,596,599,604,606,607,609,613,621,628,608,576,546,537,529,524,516,511,506,499,496,492,485,478,470,462,455,446,436,432,427,422,421,424,425,428,433,441,470,528,531,531,532,532,531,529,528,528,528],"ca-adarsh-joshi":[999,999,999,648,622,607,595,587,585,583,582,582,585,587,589,592,589,588,589,594,598,602,603,610,615,621,626,626,618,589,561,528,508,504,501,493,491,486,482,478,474,472,470,466,466,462,459,455,452,448,446,445,443,442,441,440,440,440,441,442,443,446,450,463,502],"ca-aman-kedia":[999,999,999,650,622,614,607,602,595,594,594,594,594,595,599,601,602,602,607,610,611,619,624,626,615,585,558,531,508,506,503,499,496,494,491,486,484,483,479,476,476,474,471,469,468,465,462,460,458,458,456,454,452,451,451,452,453,454,456,456,456,462,460,460,463],"ca-amit-mahajan":[999,999,999,652,636,621,613,609,603,601,599,598,598,598,598,600,595,595,597,597,597,599,608,611,615,621,622,614,599,569,541,507,488,482,478,474,471,467,463,462,459,456,456,453,453,452,447,444,445,445,443,441,431,425,425,429,421,418,418,424,433,434,437,441,446],"ca-amol-jain":[999,999,999,663,640,618,602,597,595,592,589,590,593,597,597,599,593,592,592,595,597,600,606,609,613,618,621,615,609,580,549,521,492,474,471,471,470,465,459,456,452,450,446,444,443,442,442,440,432,430,430,430,428,427,425,424,422,422,422,422,422,422,422,424,424],"ca-anand-bhangariya":[999,999,999,644,634,620,608,601,597,595,585,584,580,575,564,561,561,566,569,574,566,559,558,556,555,564,580,575,570,560,537,515,486,464,440,433,430,427,425,424,420,420,420,419,416,416,416,416,416,416,416,416,416,416,416,416,416,416,417,417,418,418,418,420,422],"ca-ankita-patni":[999,999,999,646,627,615,607,600,595,590,588,585,582,582,580,578,578,577,577,577,575,574,574,574,576,575,575,576,573,542,517,514,506,499,493,490,485,482,478,476,472,470,468,465,463,462,460,458,456,455,453,451,451,448,445,443,441,440,437,436,436,437,437,437,436],"ca-bhanwar-borana":[999,999,999,649,614,602,596,593,593,592,592,592,592,594,594,584,584,585,588,595,601,602,611,612,614,611,597,581,559,524,493,482,478,477,477,474,474,477,479,480,479,479,479,479,480,482,482,483,485,488,491,493,496,501,504,508,511,516,521,526,530,526,524,522,417],"ca-cma-abhimanyyu-agarrwal":[999,999,999,655,628,608,593,586,580,576,574,574,574,572,573,575,578,582,584,587,589,593,595,596,599,606,612,621,623,614,607,580,562,541,519,508,503,498,491,485,482,477,473,468,462,457,450,443,436,428,420,416,416,416,416,416,416,416,416,416,416,416,416,416,422],"ca-cma-ashutosh-lata":[999,999,999,650,629,624,620,606,602,599,598,599,599,600,602,602,604,606,608,612,615,615,619,623,618,576,555,542,533,525,519,515,508,504,501,497,495,494,491,489,486,485,484,482,479,477,473,471,468,466,463,460,457,455,453,452,451,450,450,448,447,447,447,451,452],"ca-hardik-manchanda":[999,999,999,652,633,621,611,602,596,596,596,597,603,606,601,594,594,594,598,601,604,618,621,622,621,612,601,583,559,528,503,491,488,485,483,482,480,479,478,477,477,476,473,473,476,473,473,473,473,473,473,473,474,476,477,478,480,481,483,486,490,495,502,514,511],"ca-indresh-gandhi":[999,999,999,635,607,595,586,580,574,572,572,572,572,575,575,576,576,573,574,575,576,578,580,581,588,594,599,604,609,609,608,604,585,573,563,548,529,509,488,468,448,442,430,422,418,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,417],"ca-karan-satija":[999,999,999,647,624,613,604,600,598,596,596,597,599,600,600,593,590,590,590,593,596,597,604,606,609,597,576,535,504,486,480,477,469,467,464,458,457,454,450,447,442,441,437,433,430,426,422,421,416,416,416,416,416,416,416,416,416,416,416,417,424,452,478,482,479],"ca-manish-tardeja":[999,999,999,656,627,615,608,603,599,598,597,598,599,599,598,597,597,598,602,607,612,615,620,624,624,620,609,599,569,543,517,506,505,502,498,497,494,492,489,484,482,477,473,469,465,460,457,452,448,445,445,445,445,445,445,445,448,452,456,463,531,529,526,525,523],"ca-mohnish-vora":[999,999,999,655,616,598,585,578,575,574,574,573,573,573,573,573,573,574,575,576,573,573,576,576,581,583,583,584,585,590,595,601,604,599,589,562,547,505,491,481,470,465,460,454,447,444,440,436,431,429,422,420,417,416,416,416,416,416,416,416,416,416,416,416,416],"ca-parag-gupta":[999,999,999,658,624,611,604,604,598,592,592,593,593,595,598,599,601,597,598,597,597,600,604,615,623,628,634,632,620,600,576,552,525,502,492,489,489,488,488,485,485,482,479,478,477,473,472,468,466,463,459,455,454,452,452,450,448,445,443,442,440,439,436,437,439],"ca-pranav-popat":[999,999,999,646,623,612,602,593,585,582,580,580,580,581,582,585,588,590,589,589,593,596,600,603,612,621,626,632,638,647,635,623,604,588,569,561,554,546,541,538,535,532,529,528,526,524,519,515,512,511,511,508,503,502,502,502,501,498,496,496,496,502,502,501,501],"ca-pranay-gangan":[999,999,999,634,618,610,602,597,595,595,595,595,595,595,597,597,598,600,602,604,611,614,612,600,584,554,528,492,474,472,472,469,465,462,452,451,447,443,437,433,429,425,420,416,416,416,416,416,416,416,416,416,416,416,416,416,416,427,442,462,479,503,509,508,507],"ca-raj-kumar":[999,999,999,665,623,612,608,604,600,598,598,600,602,604,604,606,610,612,614,616,621,626,632,628,618,599,580,563,554,545,537,533,530,528,525,524,522,520,518,515,511,508,504,498,498,495,491,490,489,489,488,489,491,492,490,492,497,509,512,515,519,523,532,536,540],"ca-ranjan-periwal":[999,999,999,644,609,586,577,568,561,554,552,552,551,550,550,549,550,551,555,557,560,557,558,561,564,569,571,570,570,572,583,587,590,596,602,610,619,635,642,649,653,655,641,627,614,602,590,580,569,559,550,543,540,536,534,533,532,530,529,528,528,528,528,528,528],"ca-satish-jalan":[999,999,999,646,619,610,601,597,593,593,592,592,592,593,593,597,598,600,600,602,603,606,607,612,619,624,632,637,633,620,601,585,569,552,533,526,523,521,519,517,515,512,511,510,508,506,505,503,501,498,496,493,490,488,484,481,479,476,474,474,477,480,484,491,498],"ca-shivangi-agrawal":[999,999,999,659,634,621,609,599,593,587,582,576,573,568,566,563,562,557,556,556,556,556,556,557,558,559,557,551,551,548,543,538,521,504,478,446,426,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416],"ca-simran-rajani":[999,999,999,644,628,618,611,604,598,594,590,588,585,583,581,581,580,577,576,576,576,576,577,581,578,576,572,569,564,560,548,537,532,525,522,519,516,516,514,505,499,497,494,494,490,489,485,483,480,478,476,473,469,465,465,467,468,468,468,469,469,471,473,476,480],"ca-sneha-budhia":[999,999,999,661,637,623,616,609,602,597,592,588,584,581,577,573,573,571,568,564,561,557,552,549,546,538,531,522,512,503,480,478,476,473,471,469,469,466,464,462,458,457,455,455,455,455,456,456,455,454,454,453,451,451,451,451,452,453,457,462,467,479,504,501,498],"ca-swapnil-patni":[999,999,999,649,624,607,600,595,594,593,593,594,596,595,595,596,586,586,588,594,598,601,602,608,610,613,619,623,621,608,597,583,567,550,536,522,508,496,484,480,474,471,468,465,464,462,460,460,459,458,457,456,456,455,454,453,452,450,447,444,442,441,457,458,458],"ca-tejas-suchak":[999,999,999,639,626,615,607,603,600,600,598,597,597,597,596,597,599,602,606,608,610,612,618,619,613,607,596,575,554,529,494,474,471,470,467,464,462,457,453,450,447,444,441,438,436,433,432,430,427,425,421,419,418,416,416,416,416,416,416,416,416,417,426,438,452],"ca-utkarsh-mehta":[999,999,999,649,628,615,607,602,601,599,598,602,606,606,608,607,607,607,608,610,611,625,629,634,634,624,610,589,559,530,509,505,504,502,497,495,492,489,484,480,480,477,476,471,467,465,464,464,465,463,460,460,459,454,453,453,447,447,452,453,453,454,456,458,457],"ca-vijay-sarda":[999,999,999,666,645,616,611,606,602,600,598,598,600,602,596,596,597,599,600,600,607,611,613,608,578,522,478,472,468,467,468,465,462,458,455,452,448,446,444,442,440,438,437,437,436,434,434,434,434,434,434,437,438,439,442,446,451,457,466,469,468,468,467,467,466],"ca-vinod-reddy":[999,999,999,661,618,609,604,599,592,593,599,600,600,604,604,607,607,607,610,608,609,612,610,616,628,623,604,568,537,523,518,514,509,506,502,498,494,492,490,488,486,486,485,485,486,488,489,491,491,491,492,493,497,504,506,508,512,518,522,521,521,521,521,521,523],"ca-vishal-bhattad":[999,999,999,654,632,619,610,606,599,596,594,594,594,595,596,597,593,594,597,600,601,602,603,613,619,612,596,545,514,493,488,485,483,483,482,482,481,477,470,469,467,464,460,456,454,454,454,454,454,455,456,456,458,464,476,494,520,521,521,520,518,516,515,510,507],"ca-yashvant-mangal":[999,999,999,638,627,618,603,600,598,592,586,584,584,588,597,600,603,602,602,602,601,602,615,619,624,628,623,609,530,502,496,493,492,491,489,488,486,484,484,480,477,478,476,472,466,465,467,467,467,467,468,469,470,473,476,479,486,498,519,517,515,512,510,506,502],"cma-rahil-singhal":[999,999,999,651,615,598,592,590,588,583,575,570,569,568,568,568,568,571,569,569,570,571,573,576,581,589,594,597,594,588,582,572,567,562,537,516,502,470,436,421,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416,416],"cs-arjun-chhabra":[999,999,999,641,615,602,595,590,587,584,583,583,584,587,590,595,596,596,596,596,596,595,595,595,597,601,609,613,621,586,564,556,550,546,543,541,538,538,538,537,536,535,534,533,530,528,523,519,518,518,518,463,457,455,452,451,448,452,458,458,466,481,490,489,489],"cs-satish-baheti":[999,999,999,661,630,619,608,598,596,595,595,595,596,596,597,595,594,595,597,599,599,612,616,622,627,620,611,590,572,550,525,502,490,490,490,492,492,488,484,482,478,472,471,471,474,473,473,474,473,472,469,467,466,466,466,466,462,459,460,458,456,456,457,459,460],"prof-a-sourav-patro":[999,999,999,677,628,614,606,598,594,593,595,597,600,603,604,606,598,598,600,600,600,600,613,616,621,626,623,616,607,586,560,531,507,488,483,480,479,477,476,473,473,473,473,473,473,473,473,473,473,473,473,473,473,473,473,473,473,473,476,478,481,485,489,494,504],"prof-abanindra-sahu":[999,999,999,652,623,613,607,602,596,595,592,590,590,593,596,596,594,594,595,597,597,597,607,611,618,621,596,575,514,484,478,474,474,474,474,471,468,460,459,452,451,441,440,437,430,426,420,418,416,416,416,416,416,416,416,416,416,419,425,432,458,483,488,484,482],"prof-abhisek-mahapatro":[999,999,999,661,624,613,602,596,590,588,588,589,592,598,599,597,598,600,602,601,602,603,604,608,613,620,613,596,574,548,516,495,491,489,483,480,477,473,471,469,467,464,464,462,459,459,457,456,455,454,454,454,454,455,456,457,459,462,464,467,471,479,510,512,509],"prof-akash-agrawal":[999,999,999,640,618,603,592,587,586,583,583,584,586,590,590,594,597,597,597,599,602,604,606,613,618,624,634,628,612,588,569,549,541,535,533,532,530,530,530,528,528,525,524,525,524,522,520,520,520,518,515,512,510,508,507,507,502,499,497,497,494,493,490,488,485],"prof-g-b-joshi":[999,999,999,636,612,603,598,594,590,585,584,585,586,589,590,592,590,594,595,596,599,599,607,613,620,627,632,627,621,599,582,562,543,529,514,502,493,492,491,491,491,491,490,488,488,488,486,484,482,480,479,477,474,472,471,470,469,468,466,465,464,463,462,459,458],"prof-prateek-nanda":[999,999,999,639,619,609,601,599,601,599,601,601,601,601,602,598,598,599,601,602,602,606,609,612,616,622,630,634,622,599,575,543,522,515,510,507,502,497,492,489,486,483,480,477,473,468,464,458,455,451,447,444,442,440,440,441,442,444,445,448,453,464,497,541,538],"prof-suvraprasad-tripathy":[999,999,999,641,627,620,610,604,600,597,598,599,599,601,599,599,602,606,606,606,613,618,622,627,623,613,594,570,542,511,496,493,490,486,485,483,481,479,477,477,477,473,473,474,473,473,474,476,476,477,479,480,484,486,490,494,497,503,507,511,518,528,528,524,521]};
/* for a faculty whose photo is not uploaded yet (or has no outline here): the tightest outline of all photos, so a photo added later can never touch the text */
const FACE_EDGE_DEFAULT = (function(){
  const keys = Object.keys(FACE_EDGE); const out = [];
  for(let r = 0; r < 65; r++){ let m = 999; keys.forEach(k => { if(FACE_EDGE[k][r] < m) m = FACE_EDGE[k][r]; }); out.push(m); }
  return out;
})();
const FACE_GEO = { x0:41.6, y0:24.6, gap:2.6, textLeft:5, rectLeft:51 };   // photo box, safe gap to the person, text start, red rectangle
function faceEdgeMin(prof, top, bottom){
  let m = 99;
  for(let y = Math.floor(top - FACE_GEO.y0); y <= Math.ceil(bottom - FACE_GEO.y0); y++){
    if(y < 0) continue;
    const v = prof[Math.min(y, prof.length - 1)] / 10;
    if(v < m) m = v;
  }
  return m;
}

function fitPosterText(root){
  const SINGLE = [16, 15.2, 14.4, 13.6, 12.9, 12.2, 11.6, 11, 10.4, 9.8, 9.2, 8.7, 8.2, 7.7, 7.2, 6.7, 6.3, 5.9, 5.5, 5.1, 4.7, 4.4, 4.1, 3.8];   // compact font: the subject name takes the largest size that fits
  const NAME2  = [10, 9, 8.1, 7.3, 6.6, 6, 5.4, 4.9, 4.4, 4];            // subject of a card with several faculties
  const COMBO  = [6.6, 5.8, 5, 4.4, 3.8, 3.4, 3];
  const BADGE  = [6.2, 5.8, 5.4, 5, 4.6, 4.2, 3.8, 3.4, 3.1, 2.8, 2.5];     // the exam name at the top-left must stay on ONE row
  /* nothing may be cut: the width must hold, and the height too (the tiny extra the letters' own boxes need is allowed) */
  const fits = el => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + Math.max(2, parseFloat(getComputedStyle(el).fontSize) * 0.12);

  /* 1) exam names first (width only) — so they are never squeezed by a subject that has not been sized yet */
  root.querySelectorAll('.pc-badge').forEach(el => {
    if(el.dataset.fit === '1' || !el.offsetWidth) return;
    for(let i = 0; i < BADGE.length; i++){
      el.style.fontSize = BADGE[i] + 'cqw';
      if(el.scrollWidth <= el.clientWidth + 1) break;
    }
    el.dataset.fit = '1';
  });

  /* 2) subject names */
  root.querySelectorAll('.pc-subject, .pc-csubject').forEach(el => {
    if(el.dataset.fit === '1') return;
    if(!el.offsetWidth) return;                           // not on screen yet
    const poster = el.closest('.pc-poster');
    const panel = el.closest('.pc-panel');
    const face = (panel && poster && poster.classList.contains('pc-single') && !poster.classList.contains('pc-ts')) ? panel.querySelector('.pc-face-main') : null;

    if(el.classList.contains('pc-subject') && face){
      /* lecture card with one faculty: the widest, biggest text that still keeps clear of the person */
      const prof = FACE_EDGE[slugify(face.dataset.fac || '')] || FACE_EDGE_DEFAULT;
      const widths = [34, 36, 38, 40, 42, 44, 46, 48];
      const u = poster.clientWidth / 100;
      let done = false;
      for(let i = 0; i < SINGLE.length && !done; i++){
        for(let k = 0; k < widths.length; k++){
          el.style.fontSize = SINGLE[i] + 'cqw';
          el.style.maxWidth = widths[k] + 'cqw';
          if(!fits(el)) continue;
          if(widths[k] === 34){ done = true; break; }
          const pr = panel.getBoundingClientRect(), r = el.getBoundingClientRect();
          const allowed = Math.min(faceEdgeMin(prof, (r.top - pr.top) / u, (r.bottom - pr.top) / u) - FACE_GEO.gap, FACE_GEO.rectLeft) - FACE_GEO.textLeft;
          if(widths[k] <= allowed + 0.01){ done = true; break; }
        }
      }
      if(!done){ el.style.fontSize = SINGLE[SINGLE.length - 1] + 'cqw'; el.style.maxWidth = '34cqw'; }
    } else {
      const sizes = el.classList.contains('pc-csubject-name') ? NAME2 : (el.classList.contains('pc-csubject') ? COMBO : SINGLE);
      for(let i = 0; i < sizes.length; i++){
        el.style.fontSize = sizes[i] + 'cqw';
        if(fits(el)) break;
      }
    }
    el.dataset.fit = '1';
  });
}
function refitAllPosters(){
  document.querySelectorAll('[data-fit]').forEach(el => { delete el.dataset.fit; });
  fitPosterText(document);
}
if(document.fonts && document.fonts.ready){ document.fonts.ready.then(refitAllPosters); }
if(document.fonts && document.fonts.load){ document.fonts.load('800 16px "Barlow Condensed"').then(refitAllPosters).catch(()=>{}); }   // measure again once the compact font has arrived
window.addEventListener('load', refitAllPosters);

/* ============================================================
   POSTERS (the picture part of every card)
   ============================================================ */
function toneStyle(p){
  const t = getCardTone(p.course, p.level, p.batch);
  return '--ta:' + t[0] + ';--tb:' + t[1];
}

function lectureTagHTML(p){
  // both tags are written on two rows so they never stretch towards the faculty photo
  if(p.batch === 'writing') return '<span class="pc-lectag">Writing<br>Practice</span>';
  if(p.batch === 'revision') return '<span class="pc-lectag">Revision<br>Lectures</span>';
  return p.batch === 'fasttrack'
    ? '<span class="pc-lectag">Fast-track<br>Lectures</span>'
    : '<span class="pc-lectag">Regular<br>Lectures</span>';
}

function posterSingleHTML(p){
  const subject = p.subjects[0];
  const fac = p.faculties[0];
  return '<div class="pc-poster pc-single pc-tone" style="' + toneStyle(p) + '">' +
    '<div class="pc-panel">' +
      '<span class="pc-rect"></span>' +
      faceImg(fac, 'pc-face-main') +
      '<div class="pc-left">' +
        '<div class="pc-badge">' + esc(p.examLabel) + '</div>' +
        (CARD_TAGLINE ? '<div class="pc-tagline">' + esc(CARD_TAGLINE) + '</div>' : '') +
        (p.group ? '<div class="pc-group">' + esc(p.group) + '</div>' : '') +
        '<div class="pc-paperno">' + esc(paperLabel(p.paperNo)) + '</div>' +
        '<div class="pc-subject">' + esc(subject) + '</div>' +
        '<div class="pc-facname">' + esc(fac) + '</div>' +
      '</div>' +
      lectureTagHTML(p) +
    '</div>' +
  '</div>';
}

/* Combos — and single lectures taught by SEVERAL faculties — use this layout.
   Only one photo per faculty (a faculty teaching two subjects of a combo appears once).
   A single lecture never says "combo": it shows its paper number instead. */
function posterComboHTML(p){
  const isCombo = p.category === 'combo';
  const short = isCombo ? p.subjects.map(getSubjectShort).join(' + ') : p.subjects[0];
  const faces = p.faculties.slice(0, 8);
  const many = faces.length > 5;
  const tiles = faces.map(f => '<div class="pc-tile">' + faceImg(f, 'pc-face-tile') + '</div>').join('');
  const pill = isCombo ? (p.group ? (p.group + ' COMBO') : 'COMBO') : paperLabel(p.paperNo);
  return '<div class="pc-poster pc-combo pc-tone" style="' + toneStyle(p) + '">' +
    '<div class="pc-cpanel">' +
      '<div class="pc-ctitle">' + esc(p.examFull) + '</div>' +
      '<span class="pc-gpill">' + esc(pill) + '</span>' +
      (CARD_TAGLINE ? '<div class="pc-ctag">' + esc(CARD_TAGLINE) + '</div>' : '') +
    '</div>' +
    '<div class="pc-cinner' + (many ? ' pc-cinner-many' : '') + '">' +
      '<div class="pc-tiles pc-tiles-' + Math.min(faces.length, 5) + (many ? ' pc-tiles-many' : '') + '">' + tiles + '</div>' +
      '<div class="pc-csubject' + (isCombo ? '' : ' pc-csubject-name') + '">' + esc(short) + '</div>' +
      '<span class="pc-clectag">' + esc(BATCH_TYPES[p.batch].tag) + '</span>' +
    '</div>' +
  '</div>';
}

function posterHTML(p){
  return (p.category === 'combo' || (p.faculties && p.faculties.length > 1)) ? posterComboHTML(p) : posterSingleHTML(p);
}

/* Test Series poster (a test-paper picture instead of a faculty photo) */
const TS_ILLUS =
  '<svg class="pc-ts-illus" viewBox="0 0 120 150" aria-hidden="true">' +
    '<rect x="12" y="8" width="96" height="134" rx="10" fill="#fff"/>' +
    '<g fill="none" stroke="#AE1029" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M26 40 l5 5 9-10"/><path d="M26 72 l5 5 9-10"/><path d="M26 104 l5 5 9-10"/>' +
    '</g>' +
    '<g stroke="#2B2823" stroke-width="5" stroke-linecap="round" opacity=".75">' +
      '<line x1="52" y1="40" x2="94" y2="40"/><line x1="52" y1="72" x2="94" y2="72"/><line x1="52" y1="104" x2="86" y2="104"/>' +
    '</g>' +
  '</svg>';

function tsPosterHTML(p){
  return '<div class="pc-poster pc-single pc-ts">' +
    '<div class="pc-panel">' +
      '<span class="pc-rect"></span>' + TS_ILLUS +
      '<div class="pc-left">' +
        '<div class="pc-badge">' + esc(p.examLabel) + '</div>' +
        '<div class="pc-tagline">TEST SERIES</div>' +
        '<div class="pc-subject">' + esc(AMBITION_SERIES_NAME) + '</div>' +
      '</div>' +
      '<span class="pc-lectag">' + esc(p.typeLabel) + '</span>' +
    '</div>' +
  '</div>';
}

/* Counselling request (free) poster, shown in the cart / orders */
function counsellingPosterHTML(item){
  return '<div class="pc-poster pc-single pc-ts">' +
    '<div class="pc-panel">' +
      '<span class="pc-rect"></span>' + TS_ILLUS +
      '<div class="pc-left">' +
        '<div class="pc-badge">' + esc((item && item.examOrCourse) ? item.examOrCourse : 'COUNSELLING') + '</div>' +
        '<div class="pc-tagline">FREE</div>' +
        '<div class="pc-subject">COUNSELLING</div>' +
      '</div>' +
      '<span class="pc-lectag">Free<br>Session</span>' +
    '</div>' +
  '</div>';
}

/* ============================================================
   PRODUCT PAGE PIECES (shared by the product page and the cart "Product Details" view)
   ============================================================ */
/* Language shown in Product Info: our own faculties teach in Odia-English Mix, every other faculty in Hindi-English Mix */
function productLanguage(p){
  const facs = p.faculties || [];
  return (facs.length > 0 && facs.every(f => facultyTier(f).tier === 0)) ? 'Odia-English Mix' : 'Hindi-English Mix';
}
function multiline(s){ return esc(s).replace(/\n/g, '<br>'); }
function infoTableHTML(rows){
  return '<table class="pv-table"><tbody>' +
    rows.map(r => '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + multiline(r[1] === undefined || r[1] === '' ? '---' : r[1]) + '</td></tr>').join('') +
  '</tbody></table>';
}

/* sel = what the visitor has chosen so far (features, validity / views, mode…) — the rows follow the choice */
function productInfoTableHTML(p, sel){
  sel = sel || {};
  if(p.pricing && p.pricing.programmes && sel.mode === OFFLINE_MODE) return infoTableHTML(OFFLINE_INFO_ROWS);
  if(p.def){
    const parts = getProductParts(p);
    return parts.map(part => {
      const info = curatedInfoFor(part, sel, p.category === 'combo' ? p.def : null);
      const rows = PRODUCT_INFO_ROWS.map(r => [r.label, info[r.key]]);
      const head = parts.length > 1
        ? '<h4 class="pv-part-h">' + esc(paperLabel(part.paperNo) + ' — ' + part.subjects[0]) + '<span>' + esc(part.faculties.join(' & ')) + '</span></h4>'
        : '';
      return head + infoTableHTML(rows);
    }).join('');
  }
  const info = getProductInfo(p);
  const lang = productLanguage(p);
  return infoTableHTML(PRODUCT_INFO_ROWS.map(r => [r.label, r.key === 'language' ? lang : (info[r.key] || '---')]));
}

function facultyInfoHTML(p){
  return p.faculties.map(name => {
    const info = getFacultyInfo(name);
    const extra = [];
    if(info && info.qualification) extra.push('<div><b>Qualification:</b> ' + esc(info.qualification) + '</div>');
    if(info && info.experience) extra.push('<div><b>Experience:</b> ' + esc(info.experience) + '</div>');
    return '<div class="pv-fac">' +
      '<div class="pv-fac-ph">' + faceImg(name, 'pv-fac-img') + '</div>' +
      '<div class="pv-fac-text"><h4>' + esc(name) + '</h4>' +
      '<p>' + esc((info && info.about) ? info.about : 'Faculty information will be updated soon.') + '</p>' + extra.join('') + '</div>' +
    '</div>';
  }).join('');
}

function termsHTML(){
  return '<h4 class="pv-terms-h">Cancellation/ Refund Policy</h4>' +
    '<ul class="pv-terms">' +
      '<li>Course once purchased cannot be cancelled &amp; fees are non-refundable.</li>' +
      '<li>Subscribed Courses cannot be changed with another course.</li>' +
      '<li>The course is non-transferable.</li>' +
    '</ul>';
}

/* the three tabs (Product Info / Faculty Info / Terms & Conditions) */
function productTabsHTML(p, sel){
  return '<div class="pv-tabs-wrap">' +
    '<div class="pv-tabs" role="tablist">' +
      '<button type="button" role="tab" class="pv-tab active" data-tab="info" aria-selected="true">Product Info</button>' +
      '<button type="button" role="tab" class="pv-tab" data-tab="faculty" aria-selected="false">Faculty Info</button>' +
      '<button type="button" role="tab" class="pv-tab" data-tab="terms" aria-selected="false">Terms &amp; Conditions</button>' +
    '</div>' +
    '<div class="pv-panel" data-panel="info">' + productInfoTableHTML(p, sel) + '</div>' +
    '<div class="pv-panel hidden" data-panel="faculty">' + facultyInfoHTML(p) + '</div>' +
    '<div class="pv-panel hidden" data-panel="terms">' + termsHTML() + '</div>' +
  '</div>';
}

function wireProductTabs(root){
  root.querySelectorAll('.pv-tab').forEach(tab => {
    tab.addEventListener('click', ()=>{
      root.querySelectorAll('.pv-tab').forEach(t => {
        const on = t === tab;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      root.querySelectorAll('.pv-panel').forEach(panel => {
        panel.classList.toggle('hidden', panel.dataset.panel !== tab.dataset.tab);
      });
    });
  });
}

/* ============================================================
   EXAM CHOOSER — shown on Lectures / Test Series when no exam has been picked yet.
   Step 1: CA / CMA / CS / MBA.   Step 2: the other options fade away and the levels slide in.
   opts = { target:'courses.html', courses:['CA','CMA','CS','MBA'], title:'…' }
   ============================================================ */
const CHOOSER_INFO = {
  CA:  { name:'CA',  sub:'Chartered Accountancy' },
  CMA: { name:'CMA', sub:'Cost & Management Accountancy' },
  CS:  { name:'CS',  sub:'Company Secretary' },
  MBA: { name:'MBA', sub:'MBA Guidance & Counselling' }
};
const CHOOSER_LEVELS = {
  CA:  [ ['Foundation','Foundation'], ['Intermediate','Intermediate'], ['Final','Final'] ],
  CMA: [ ['Foundation','Foundation'], ['Intermediate','Intermediate'], ['Final','Final'] ],
  CS:  [ ['CSEET','CSEET'], ['Executive','Executive'], ['Professional','Professional'] ]
};

function buildExamChooser(container, opts){
  const courses = opts.courses;
  const title = opts.title || 'Choose your requirement';
  container.innerHTML =
    '<div class="xc">' +
      '<h2 class="xc-title" id="xcTitle">' + esc(title) + '</h2>' +
      '<p class="xc-sub" id="xcSub">Pick the exam you are preparing for.</p>' +
      '<div class="xc-options" id="xcOptions">' +
        courses.map(c =>
          '<button type="button" class="xc-opt" data-course="' + c + '">' +
            '<span class="xc-opt-name">' + esc(CHOOSER_INFO[c].name) + '</span>' +
            '<span class="xc-opt-sub">' + esc(CHOOSER_INFO[c].sub) + '</span>' +
          '</button>'
        ).join('') +
      '</div>' +
      '<div class="xc-levels" id="xcLevels"></div>' +
      '<button type="button" class="xc-back hidden" id="xcBack">' + ICON_BACK + ' Choose a different option</button>' +
    '</div>';

  const optionsEl = container.querySelector('#xcOptions');
  const levelsEl = container.querySelector('#xcLevels');
  const backBtn = container.querySelector('#xcBack');
  const subEl = container.querySelector('#xcSub');
  const titleEl = container.querySelector('#xcTitle');

  function pick(course){
    if(course === 'MBA'){
      window.location.href = opts.target + '?course=MBA';
      return;
    }
    optionsEl.classList.add('xc-picked');
    optionsEl.querySelectorAll('.xc-opt').forEach(b => {
      b.classList.toggle('is-picked', b.dataset.course === course);
      b.classList.toggle('is-gone', b.dataset.course !== course);
    });
    titleEl.textContent = 'Choose your ' + course + ' level';
    subEl.textContent = 'Tap a level to continue.';
    levelsEl.innerHTML = CHOOSER_LEVELS[course].map((lv, i) =>
      '<a class="xc-level" style="animation-delay:' + (260 + i * 110) + 'ms" href="' + opts.target + '?course=' + course + '&level=' + lv[0] + '">' +
        '<span class="xc-level-name">' + esc(course + ' ' + lv[1]) + '</span>' +
        '<span class="xc-level-arrow" aria-hidden="true">→</span>' +
      '</a>'
    ).join('');
    levelsEl.classList.add('is-open');
    backBtn.classList.remove('hidden');
  }

  function reset(){
    levelsEl.classList.remove('is-open');
    levelsEl.innerHTML = '';
    backBtn.classList.add('hidden');
    optionsEl.classList.remove('xc-picked');
    optionsEl.querySelectorAll('.xc-opt').forEach(b => { b.classList.remove('is-picked'); b.classList.remove('is-gone'); });
    titleEl.textContent = title;
    subEl.textContent = 'Pick the exam you are preparing for.';
  }

  optionsEl.addEventListener('click', (e)=>{
    const b = e.target.closest('.xc-opt');
    if(!b || b.classList.contains('is-picked')) return;
    pick(b.dataset.course);
  });
  backBtn.addEventListener('click', reset);
}
