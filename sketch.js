const suggestions = [
  'Do your homework',
  'Cook a meal',
  'Go to sleep',
  'Go for a walk',
  'Drink a glass of water',
  'Tidy up your room',
  'Read a book',
  'Listen to some music',
  'Get some exercise',
  'Message a friend',
  'Clean up your desk',
  'Take a warm shower',
  'Watch a movie',
  'Do some stretching',
  'Try a new recipe',
  'Get some sunshine'
];

const choices = [];
let lastShakeAt = -1000;

const BLOW_THRESHOLD = 0.25;
const FILL_SPEED = 0.6; // cards filled per second
const DRAIN_SPEED = 0.25; // cards drained per second

let mic;
let amplitude;
let fillAmount = 0; // 0..4, one unit per option

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  lockGestures();
  setShakeThreshold(18);

  mic = new p5.AudioIn();
  amplitude = new p5.Amplitude();
  mic.disconnect();
  mic.connect(amplitude);

  enablePermissionsTap(['sensors', 'mic'], 'Tap to enable motion + microphone');
}

function draw() {
  background(21, 24, 39);
  updateBlow();
  drawBackdrop();
  drawHeader();
  drawChoices();
}

function updateBlow() {
  if (!window.micOpen || !amplitude || choices.length !== 4) return;
  const level = amplitude.getLevel();
  if (level > BLOW_THRESHOLD) {
    fillAmount = constrain(fillAmount + (deltaTime / 1000) * FILL_SPEED, 0, 4);
  } else {
    fillAmount = constrain(fillAmount - (deltaTime / 1000) * DRAIN_SPEED, 0, 4);
  }
}

function drawBackdrop() {
  noStroke();
  fill(91, 79, 153, 35);
  circle(width * 0.92, height * 0.08, min(width, height) * 0.65);
  fill(71, 133, 143, 25);
  circle(width * 0.04, height * 0.82, min(width, height) * 0.52);
}

function drawHeader() {
  const left = getLayout().left;
  fill(175, 166, 222);
  textAlign(LEFT, TOP);
  textSize(13);
  text('SHAKE FOR A LITTLE PLAN', left, 36);

  fill(250, 248, 255);
  textSize(min(34, width * 0.09));
  text('What shall we do today?', left, 61);

  fill(191, 190, 211);
  textSize(15);
  let hint;
  if (!window.sensorsEnabled) {
    hint = 'Enable motion + mic, then shake to start';
  } else if (choices.length < 4) {
    hint = 'Shake your phone to draw a random activity';
  } else {
    hint = 'Blow into the microphone to fill your choices';
  }
  text(hint, left, 108);

  const countText = `${choices.length} / 4`;
  textAlign(RIGHT, CENTER);
  textSize(14);
  fill(202, 195, 238);
  text(countText, width - left, 30);

  // Four progress dots showing how many draws are left
  for (let i = 0; i < 4; i++) {
    fill(i < choices.length ? color(255, 190, 125) : color(255, 255, 255, 55));
    circle(width - left - 6 - i * 17, 56, 8);
  }
}

function drawChoices() {
  const layout = getLayout();
  const startY = layout.startY;
  const gap = layout.gap;

  for (let i = 0; i < 4; i++) {
    const y = startY + i * (layout.cardH + gap);
    const isFilled = i < choices.length;
    const age = isFilled ? millis() - choices[i].createdAt : 0;
    const pop = isFilled ? constrain(age / 220, 0, 1) : 1;
    const cardW = layout.cardW * (isFilled ? lerp(0.94, 1, pop) : 1);
    const cardX = (width - cardW) / 2;

    noStroke();
    fill(0, 0, 0, isFilled ? 38 : 16);
    rect(cardX, y + 5, cardW, layout.cardH, 18);

    let baseColor;
    if (isFilled) {
      baseColor = [
        [255, 222, 188],
        [198, 229, 222],
        [220, 210, 247],
        [248, 211, 218]
      ][i];
      fill(baseColor[0], baseColor[1], baseColor[2]);
    } else {
      fill(255, 255, 255, 13);
      stroke(255, 255, 255, 35);
      strokeWeight(1);
    }
    rect(cardX, y, cardW, layout.cardH, 18);

    // Water fill: darkened layer rises from the bottom, one option at a time (bottom card first)
    const cardFill = constrain(fillAmount - (3 - i), 0, 1);
    if (isFilled && cardFill > 0) {
      const darkFactor = 0.65;
      const waterH = layout.cardH * cardFill;
      const waterY = y + layout.cardH - waterH;

      const dc = drawingContext;
      dc.save();
      roundedRectClip(dc, cardX, y, cardW, layout.cardH, 18);
      noStroke();
      fill(baseColor[0] * darkFactor, baseColor[1] * darkFactor, baseColor[2] * darkFactor);
      rect(cardX, waterY, cardW, waterH);
      dc.restore();
    }

    noStroke();
    textAlign(LEFT, CENTER);
    if (isFilled) {
      fill(104, 91, 124);
      textSize(12);
      text(`OPTION 0${i + 1}`, cardX + 18, y + layout.cardH * 0.32);
      fill(39, 37, 53);
      textSize(layout.optionTextSize);
      text(choices[i].text, cardX + 18, y + layout.cardH * 0.68);
      fill(77, 69, 99, 140);
      textAlign(RIGHT, CENTER);
      textSize(20);
      text('✦', cardX + cardW - 24, y + layout.cardH / 2);
    } else {
      fill(210, 208, 224, 125);
      textSize(14);
      text(i === choices.length && choices.length < 4 ? 'Shake to draw an activity' : 'Waiting for a draw…', cardX + 18, y + layout.cardH / 2);
      fill(210, 208, 224, 100);
      textAlign(RIGHT, CENTER);
      textSize(13);
      text(`0${i + 1}`, cardX + cardW - 18, y + layout.cardH / 2);
    }
  }
}

function roundedRectClip(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.clip();
}

function getLayout() {
  const left = min(28, width * 0.07);
  const cardW = min(width - left * 2, 520);
  const startY = height / 4;
  const gap = 12;
  const cardH = (height - startY - 24 - gap * 3) / 4;
  return {
    left,
    cardW,
    cardH,
    gap,
    startY,
    optionTextSize: min(22, width * 0.06)
  };
}

function deviceShaken() {
  if (!window.sensorsEnabled || choices.length >= 4) return;

  // Avoid one long shake counting as multiple draws
  const now = millis();
  if (now - lastShakeAt < 1000) return;
  lastShakeAt = now;

  const remaining = suggestions.filter((item) => !choices.some((choice) => choice.text === item));
  if (remaining.length === 0) return;

  const picked = random(remaining);
  choices.push({ text: picked, createdAt: now });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
