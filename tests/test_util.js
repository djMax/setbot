import tap from 'tap';
import * as util from '../src/util';

tap.test('Should sort points', (t) => {
  const arr = [
    { x: 84, y: 147 },
    { x: 74, y: 16 },
    { x: 154, y: 9 },
    { x: 165, y: 141 },
  ];
  console.log(arr);
  const p = util.rotatePoints(arr);
  console.log(p);
  t.end();
});