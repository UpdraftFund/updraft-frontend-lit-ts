export const shortNum = function(n: string | number, p=3, e=p-3) {
  n = Number(n);
  if (n === 0) return '0';

  let ans;
  const absn = Math.abs(n);

  if (absn < Math.pow(10, -1 * p) || absn >= 10 ** 18 ){
   ans = n.toExponential(Math.max(e, 0));
  }
  else if (absn < 1){
   ans = n.toFixed(p);
  }
  else {
   const suffixes = ['', 'K', 'M', 'B', 'T', 'Q'];
   const index = Math.floor(Math.log10(absn) / 3);
   const scaled = n / 10 ** (index * 3);
   ans = scaled.toPrecision(p) + suffixes[index];
  }
  ans = ans.replace(/\.0+(\D|$)/,'$1');
  return ans.replace(/(\.\d*?)0+(\D|$)/,'$1$2');
}