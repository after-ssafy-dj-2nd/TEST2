export function toggleActiveKeyword($target, activeIndex, moveToPosition = null) {
  $target[activeIndex].classList.toggle('active');
  moveToPosition ? $target[activeIndex + moveToPosition].classList.toggle('active') : null;
}