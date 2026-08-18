/* ============================================================
   FOUNDER PHOTO COLOR MATCH
   Samples the founder's photo (roughly where his blazer/shirt is)
   and applies that color as a CSS variable to the decorative shape
   behind the photo — so if the photo is ever swapped for a new one,
   the shape's color updates automatically without editing any CSS.
   ============================================================ */
function applyFounderPhotoColor(imgEl, targetEl) {
  if (!imgEl || !targetEl) return;
  function extract() {
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 60;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0, 60, 60);
      // Sample a horizontal strip in the lower-middle area — where clothing
      // usually sits in a seated portrait photo like this one.
      var data = ctx.getImageData(10, 33, 40, 12).data;
      var r = 0, g = 0, b = 0, n = 0;
      for (var i = 0; i < data.length; i += 4) {
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      targetEl.style.setProperty('--founder-color', 'rgb(' + r + ',' + g + ',' + b + ')');
    } catch (e) {
      // If sampling fails for any reason, the CSS fallback color still applies.
    }
  }
  if (imgEl.complete && imgEl.naturalWidth > 0) extract();
  else imgEl.addEventListener('load', extract);
}

document.querySelectorAll('.founder-color-target').forEach(function (target) {
  var img = target.querySelector('img');
  applyFounderPhotoColor(img, target);
});
