export function ifQuietFor(nowtime, prevtime, minutes) {
  let diff = prevtime - nowtime;
  if (diff > minutes * 60 * 1000) {
    return true;
  } else {
    return false;
  }
}