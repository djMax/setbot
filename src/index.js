import cv from 'opencv';
import Promise from 'bluebird';
import colorNamer from 'color-namer';
import solver from './solver';
import * as util from './util';

const cardWindow = new cv.NamedWindow('Card Window', [360, 440]);
const originalWindow = new cv.NamedWindow('Game Window', 0);

export function show(window, image, msg, block) {
  // console.log(msg);
  window.show(image);
  if (block) {
    window.blockingWaitKey(0, block === true ? 2500 : block);
  }
}

async function runSet() {
  const cardDetails = [];
  const image = await Promise.promisify(cv.readImage)(process.argv[2] || './tests/sample.jpg');

  const original = image.clone();

  // show(originalWindow, image, 'Original image');

  image.convertGrayscale();
  image.gaussianBlur([1, 1]);
  // show(originalWindow, image, 'Grayscale and blur', 5000);

  const thresh = image.threshold(180, 250, 'Binary');
  show(originalWindow, thresh, 'Applied threshold', 5000);

  //show(originalWindow, image, 'Original image', 5000);

  const contours = thresh.findContours(cv.Constants.RETR_TREE);

  const cards = util.sortContoursByArea(contours).slice(0, 12);
  /*
  for (const c of util.sortContoursByArea(contours).slice(0, 30)) {
    const fresh = original.clone();
    fresh.drawContour(contours, c.ix, [255, 255, 255], -1, 8);
    show(originalWindow, fresh, c, 20000);
  }
  */

  cards.map(c => thresh.drawContour(contours, c.ix, [255, 255, 255], 4, 8, 0, [0, 0]));

  cards.map((c, ix) => {
    // Find the approximate card rectangle
    const peri = contours.arcLength(c.ix, true);
    contours.approxPolyDP(c.ix, 0.02 * peri, true);
    const rect = contours.minAreaRect(c.ix);

    const withSpots = original.clone();
    const approxRect = util.rotatePoints(rect.points);
    util.rectPoint(withSpots, approxRect[0], 4, [0, 255, 0]);
    util.rectPoint(withSpots, approxRect[1], 4, [255, 0, 0]);
    util.rectPoint(withSpots, approxRect[2], 4, [0, 0, 255]);
    util.rectPoint(withSpots, approxRect[3], 4, [0, 255, 255]);
    show(originalWindow, withSpots, 'Original image');

    // Transform to a proper rectangle based on the card aspect ratio
    const transform = thresh.getPerspectiveTransform(
      util.flatPoints(approxRect),
      [0, 0, 399, 0, 399, 499, 0, 499]);

    const warpedImage = original.clone();
    warpedImage.warpPerspective(transform, 400, 500, [255, 255, 255]);

    const cardImage = warpedImage.crop(20, 30, warpedImage.width() - 40, warpedImage.height() - 60);
    // show(cardWindow, cardImage, 'Cropped image', 1000);

    const contourCard = cardImage.clone();
    contourCard.convertGrayscale();
    contourCard.gaussianBlur([1, 1]);
    const cardThresh = contourCard.threshold(175, 255, 'Binary');
    // show(cardWindow, cardThresh, 'Rectangularized', true);

    const cardContours = cardThresh.findContours(cv.Constants.RETR_TREE);
    const sortedShapes = util.sortContoursByArea(cardContours);
    let shapeCount = 0;
    const thisShape = cardImage.clone();
    const mask = cv.Matrix.Zeros(cardImage.height(), cardImage.width(), cv.Constants.CV_8UC1);

    let sumCorners = 0;
    for (const s of sortedShapes) {
      // Hierarchy is [Next, Previous, First_Child, Parent]
      const h = cardContours.hierarchy(s.ix);
      if (h[3] === 0) {
        const peri = cardContours.arcLength(s.ix, true);
        cardContours.approxPolyDP(s.ix, 0.005 * peri, true);
        sumCorners += cardContours.cornerCount(s.ix);
        shapeCount += 1;
        thisShape.drawContour(cardContours, s.ix, [0, 255, 0], -1, 8, 0);
        mask.drawContour(cardContours, s.ix, [255], -1, 8, 0);
      }
    }
    const masked = new cv.Matrix(cardImage.height(), cardImage.width(), cv.Constants.CV_8UC3, [0, 0, 0]);
    cardImage.copyWithMask(masked, mask);

    let shapeType;
    if (sumCorners / shapeCount < 9) {
      shapeType = 'Diamonds';
    } else if (sumCorners / shapeCount < 16) {
      shapeType = 'Oval';
    } else {
      shapeType = 'Tilde';
    }

    const buf = masked.getData();
    let zero = 0;
    let nonzero = 0;
    let white = 0;
    let sumNonZero = [0, 0, 0];
    for (let ix = 0; ix < buf.byteLength; ix += 3) {
      if (buf[ix] === 0 && buf[ix + 1] === 0 && buf[ix + 2] === 0) {
        zero++;
      } else if (buf[ix] > 180 && buf[ix + 1] > 180 && buf[ix + 2] > 180) {
        white++;
      } else {
        sumNonZero[0] += buf[ix];
        sumNonZero[1] += buf[ix + 1];
        sumNonZero[2] += buf[ix + 2];
        nonzero++;
      }
    }
    zero = Math.floor(zero / shapeCount);
    white = Math.floor(white / shapeCount);
    const realNonZero = nonzero;
    nonzero = Math.floor(nonzero / shapeCount);
    // console.error('ZERO', zero, 'NONZERO', nonzero, 'WHITE', white);

    const shapeThresholds = {
      Diamonds: {
        solid: 150,
        hashed: 8000,
      },
      Oval: {
        solid: 250,
        hashed: 21250,
      },
      Tilde: {
        solid: 250,
        hashed: 13000,
      },
    };

    let fill;
    if (white < shapeThresholds[shapeType].solid) {
      fill = 'Solid';
    } else if (white < shapeThresholds[shapeType].hashed) {
      fill = 'Hashed';
    } else {
      fill = 'Blank';
    }
    const r = Math.floor(sumNonZero[2] / realNonZero);
    const g = Math.floor(sumNonZero[1] / realNonZero);
    const b = Math.floor(sumNonZero[0] / realNonZero);

    let color;
    if (r - g > 40 && r - b > 40) {
      color = 'Red';
    } else if (g - r > 30) {
      color = 'Green';
    } else {
      color = 'Purple';
    }

/* Idea: maybe compare the non shape card bg mean to the shape mean
    masked.convertGrayscale();
    console.log(masked.mean()[0], masked.meanStdDev().stddev.getData());
    */

    console.log(`That card is ${shapeCount} ${fill} ${color} ${shapeType} ${white}`);
    if (shapeCount >= 1 && shapeCount <= 3) {
      cardDetails.push({
        color,
        fill,
        shape: shapeType,
        count: shapeCount,
        corner: approxRect[0],
      });
    }
    // show(cardWindow, thisShape, 'Showing outlines', 2500);
    // show(cardWindow, mask, 'Showing mask', 2500);
    show(cardWindow, masked, 'Showing shapes only ', 2500);
  });

  cardDetails.sort((c1, c2) => {
    if (Math.abs(c2.corner.y - c1.corner.y) < 50) {
      return c1.corner.x - c2.corner.x;
    }
    return c2.corner.y - c1.corner.y;
  });

  // thresh.save('./tests/out.jpg');
  // show(originalWindow, thresh, 'Contours');

  solver(cardDetails);
}

runSet().then(() => {
  console.log('Bye');
});
