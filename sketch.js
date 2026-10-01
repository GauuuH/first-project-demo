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

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  lockGestures();
  setShakeThreshold(18);
  enableSensorTap('Tap the screen to enable shake-to-pick');
}

function draw() {
  background(21, 24, 39);
  drawBackdrop();
  drawHeader();
  drawChoices();
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
  const hint = window.sensorsEnabled
    ? 'Shake your phone to draw a random activity'
    : 'Enable motion access, then shake to start';
  text(hint, left, 108);

  const countText = `${choices.length} / 4`;
  textAlign(RIGHT, CENTER);
  textSize(14);
  fill(202, 195, 238);
  text(countText, width - left, 45);

  // Four progress dots showing how many draws are left
  for (let i = 0; i < 4; i++) {
    fill(i < choices.length ? color(255, 190, 125) : color(255, 255, 255, 55));
    circle(width - left - 6 - i * 17, 71, 8);
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

    if (isFilled) {
      const palette = [
        [255, 222, 188],
        [198, 229, 222],
        [220, 210, 247],
        [248, 211, 218]
      ][i];
      fill(palette[0], palette[1], palette[2]);
    } else {
      fill(255, 255, 255, 13);
      stroke(255, 255, 255, 35);
      strokeWeight(1);
    }
    rect(cardX, y, cardW, layout.cardH, 18);

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

function getLayout() {
  const left = min(28, width * 0.07);
  const cardW = min(width - left * 2, 520);
  const compact = height < 680;
  const startY = compact ? 151 : 164;
  const gap = compact ? 8 : 13;
  const cardH = constrain((height - startY - 28 - gap * 3) / 4, 48, 76);
  return {
    left,
    cardW,
    cardH,
    gap,
    startY,
    optionTextSize: min(21, width * 0.058)
  };
}

function deviceShaken() {
  if (!window.sensorsEnabled || choices.length >= 4) return;

  // Avoid one long shake counting as multiple draws
  const now = millis();
  if (now - lastShakeAt < 650) return;
  lastShakeAt = now;

  const remaining = suggestions.filter((item) => !choices.some((choice) => choice.text === item));
  if (remaining.length === 0) return;

  const picked = random(remaining);
  choices.push({ text: picked, createdAt: now });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
