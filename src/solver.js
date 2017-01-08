function isEqual(prop, val) {
  return (c) => (c[prop] === val);
}

function isNotEqual(prop, val1, val2) {
  return (c) => (c[prop] !== val1 && c[prop] !== val2);
}

function getMatcher(prop, c1, c2) {
  if (c1[prop] === c2[prop]) {
    return isEqual(prop, c1[prop]);
  }
  return isNotEqual(prop, c1[prop], c2[prop]);
}

export default function solve(cards) {
  const template = {};

  for (let i1 = 0; i1 < cards.length; i1 += 1) {
    for (let i2 = i1 + 1; i2 < cards.length; i2 += 1) {
      const finder = ['color', 'fill', 'shape', 'count']
        .map(p => getMatcher(p, cards[i1], cards[i2]));
      for (let i3 = i2 + 1; i3 < cards.length; i3 += 1) {
        if (finder.every(m => m(cards[i3]))) {
          console.log('SET!');
          [i1, i2, i3].map(i => cards[i]).map(c =>
            console.log(`  ${c.count} ${c.fill} ${c.color} ${c.shape}`));
        }
      }
    }
  }
}