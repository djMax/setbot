import cv from 'opencv';
import Promise from 'bluebird';

const namedWindow = new cv.NamedWindow('Display Window', 0);

function show(image, msg) {
  console.log(msg);
  namedWindow.show(image);
  namedWindow.blockingWaitKey(0, 10000);
}

function flatPoints(points) {
  const output = [];
  for (const p of points) {
    output.push(p.x);
    output.push(p.y);
  }
  return output;
}

async function runSet() {
  const image = await Promise.promisify(cv.readImage)('./tests/sample.jpg');
  const original = image.clone();

  image.convertGrayscale();
  image.gaussianBlur([1, 1]);
  // show(image, 'Grayscale and blur');

  const thresh = image.threshold(120, 250, 'Binary');
  // show(thresh, 'Applied threshold');

  const contours = thresh.findContours();

  const sorter = [];
  for (var c = 0; c < contours.size(); ++c) {
    sorter.push({
      ix: c,
      area: contours.area(c),
    });
  }
  const cards = sorter.sort((a,b) => (b.area - a.area)).slice(0, 12);
  cards.map(c => thresh.drawContour(contours, c.ix, [255, 255, 255], 4, 8, 0, [0, 0]));

  cards.map((c) => {
    const peri = contours.arcLength(c.ix, true);
    contours.approxPolyDP(c.ix, 0.02*peri, true);
    const rect = contours.minAreaRect(c.ix);
    console.error('CARD RECT', flatPoints(rect.points));
    const transform = thresh.getPerspectiveTransform(
      flatPoints(rect.points),
      [0, 0, 249, 0, 249, 249, 0, 249]);
    console.error('TRANSFORM', transform);
    const cardImage = original.clone();
    cardImage.warpPerspective(transform, 250, 250, [255, 255, 255]);
    show(cardImage, 'Rectangularized');
  });

  // thresh.save('./tests/out.jpg');
  show(thresh, 'Contours');
}

runSet().then(() => {
  console.log('Bye');
});
