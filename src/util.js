import cv from 'opencv';

function distance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2)
  );
}

export function rotatePoints(points) {
  points.sort((p1, p2) => (p1.x - p2.x));
  const leftMost = points.slice(0, 2);
  const rightMost = points.slice(2, 4);

  const [topLeft, bottomLeft] = leftMost.sort((p1, p2) => (p1.y - p2.y));

  // The bottom right is the one furthest from the top left
  if (distance(topLeft, rightMost[0]) > distance(topLeft, rightMost[1])) {
    return [topLeft, rightMost[1], rightMost[0], bottomLeft];
  }
  return [topLeft, rightMost[0], rightMost[1], bottomLeft];
}

export function flatPoints(points) {
  const output = [];
  for (const p of points) {
    output.push(p.x);
    output.push(p.y);
  }
  return output;
}

export function floor(points) {
  const output = [];
  for (const p of points) {
    output.push({
      x: Math.floor(p.x),
      y: Math.floor(p.y),
    });
  }
  return output;
}

export function rectPoint(image, p, size, color) {
  image.rectangle(
    [p.x - size / 2, p.y - size / 2],
    [size, size],
    color, 2);
}

export function sortContoursByArea(contours) {
  const sorter = [];
  for (let c = 0; c < contours.size(); ++c) {
    sorter.push({
      ix: c,
      area: contours.area(c),
    });
  }
  return sorter.sort((a, b) => (b.area - a.area));
}

function componentToHex(c) {
  var hex = Math.round(c).toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
