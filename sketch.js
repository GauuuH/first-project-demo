// ---- Word banks ----
// Each category is a list of short fill-in words that read well after its title.
const wordBanks = {
  what: [
    'cook a meal',
    'go for a walk',
    'read a book',
    'watch a movie',
    'listen to music',
    'do your homework',
    'tidy your room',
    'drink some water',
    'get some exercise',
    'message a friend',
    'clean your desk',
    'take a shower',
    'do some stretching',
    'try a new recipe',
    'get some sunshine',
    'call your family',
    'write in a journal',
    'draw a picture',
    'play a game',
    'dance to a song',
    'learn a new word',
    'bake some cookies',
    'water the plants',
    'organize your photos',
    'take a nap',
    'do a puzzle',
    'ride a bike',
    'swim some laps',
    'sing a song',
    'make a smoothie',
    'walk the dog',
    'feed the birds',
    'watch the sunset',
    'stargaze tonight',
    'plant some seeds',
    'meditate quietly',
    'write a letter',
    'make a playlist',
    'try yoga',
    'go for a run',
    'paint something',
    'fold the laundry',
    'plan your week',
    'learn a joke',
    'make a card',
    'rearrange your room',
    'practice an instrument',
    'build something'
  ],

  who: [
    'a friend',
    'your best friend',
    'your family',
    'your mom',
    'your dad',
    'your sibling',
    'your grandparent',
    'a neighbor',
    'a classmate',
    'a coworker',
    'a teacher',
    'a stranger',
    'a pen pal',
    'your roommate',
    'a cousin',
    'an old friend',
    'someone new',
    'your partner',
    'a teammate',
    'a mentor',
    'your pet',
    'a little kid',
    'a teenager',
    'an elder',
    'a hero',
    'an artist',
    'a scientist',
    'a musician',
    'an athlete',
    'a chef',
    'a gardener',
    'a traveler',
    'a storyteller',
    'a volunteer',
    'a study buddy',
    'a gym buddy',
    'your whole squad',
    'a book club',
    'a club member',
    'a community group',
    'your favorite person',
    'a new acquaintance',
    'a neighbor kid',
    'yourself'
  ],

  where: [
    'the park',
    'the beach',
    'the library',
    'the museum',
    'the mall',
    'a cafe',
    'a restaurant',
    'the cinema',
    'the zoo',
    'the aquarium',
    'a garden',
    'the mountains',
    'the forest',
    'a lake',
    'the river',
    'the rooftop',
    'your backyard',
    'the kitchen',
    'the living room',
    'your bedroom',
    'the gym',
    'the pool',
    'a playground',
    'the stadium',
    'a concert hall',
    'the theater',
    'a bookstore',
    'the bakery',
    'a farmers market',
    'the train station',
    'the airport',
    'a hotel',
    'the city center',
    'the countryside',
    'a campsite',
    'an island',
    'a castle',
    'the fair',
    'a festival',
    'a workshop',
    'the classroom',
    'the office',
    'a coworking space',
    'the arcade',
    'a bowling alley',
    'the ice rink',
    'a hiking trail',
    'a secret spot'
  ],

  when: [
    'this morning',
    'this afternoon',
    'tonight',
    'tomorrow',
    'this weekend',
    'next week',
    'next month',
    'right now',
    'later today',
    'at sunrise',
    'at noon',
    'at sunset',
    'at midnight',
    'after school',
    'after work',
    'before breakfast',
    'after lunch',
    'before bed',
    'on Monday',
    'on Tuesday',
    'on Wednesday',
    'on Thursday',
    'on Friday',
    'on Saturday',
    'on Sunday',
    'in the spring',
    'in the summer',
    'in the fall',
    'in the winter',
    'on a rainy day',
    'on a sunny day',
    'during the holidays',
    'on your birthday',
    'once a week',
    'every morning',
    'every evening',
    'when you are free',
    'after you finish',
    'before it rains',
    'at the weekend',
    'during lunch',
    'in the evening',
    'bright and early',
    'late at night',
    'as soon as possible',
    'some day soon',
    'next Friday',
    'when the time is right'
  ]
};

// How each category presents itself.
const categoryInfo = {
  what: { label: 'WHAT', title: 'What shall we do today?', color: [186, 168, 240] },
  who: { label: 'WHO', title: 'Who shall we spend time with?', color: [255, 190, 125] },
  where: { label: 'WHERE', title: 'Where shall we go today?', color: [122, 205, 190] },
  when: { label: 'WHEN', title: 'When shall we do it?', color: [245, 178, 195] }
};

const choices = [];
let lastShakeAt = -1000;

const BLOW_THRESHOLD = 0.05;
const FILL_SPEED = 0.6; // cards filled per second

let category = 'what'; // randomly assigned on page load
let mic;
let amplitude;
let fillAmount = 0; // 0..4, one unit per option
let selectedIndex = -1;
let blowing = false; // whether a blow has started
let blowEndedAt = -1; // when the last blow ended, for the freeze/select delay
let micPromptShown = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  lockGestures();
  setShakeThreshold(18);

  // The four conditions are assigned randomly the moment the page loads.
  category = random(['what', 'who', 'where', 'when']);

  mic = new p5.AudioIn();
  amplitude = new p5.Amplitude();
  mic.disconnect();
  mic.connect(amplitude);

  // Motion first (for shaking). Microphone is requested later, once, before blowing.
  enablePermissionsTap(['sensors'], 'Tap to enable motion, then shake to draw');
}

function draw() {
  background(21, 24, 39);
  updateBlow();
  drawBackdrop();
  drawHeader();
  drawChoices();
  drawStartOverButton();
}

function updateBlow() {
  if (selectedIndex >= 0) return; // frozen once an option is selected
  if (!window.micOpen || !amplitude || choices.length !== 4) return;

  const level = amplitude.getLevel();
  if (level > BLOW_THRESHOLD) {
    blowing = true;
    blowEndedAt = -1;
    fillAmount = constrain(fillAmount + (deltaTime / 1000) * FILL_SPEED, 0, 4);
    return;
  }

  // Not blowing right now. Only act if a blow has already started.
  if (!blowing) return;

  // The blow has stopped: freeze the water and, after a short grace period,
  // automatically select the option at the current level. No draining.
  if (blowEndedAt < 0) blowEndedAt = millis();
  if (fillAmount >= 0.1 && millis() - blowEndedAt > 400) {
    selectedIndex = cardAtWaterLevel();
  }
}

function cardAtWaterLevel() {
  if (fillAmount <= 0) return -1;
  return constrain(4 - ceil(fillAmount), 0, 3);
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
  const info = categoryInfo[category];

  fill(175, 166, 222);
  textAlign(LEFT, TOP);
  textSize(12);
  text('SHAKE FOR A LITTLE PLAN', left, 28);

  drawCategoryBadge(info, left, 46);

  // Big title, shrunk to fit so long titles never overflow.
  drawFitTitle(info.title, left, 78);

  fill(191, 190, 211);
  textSize(14);
  let hint;
  if (!window.sensorsEnabled) {
    hint = 'Enable motion, then shake to draw';
  } else if (choices.length < 4) {
    hint = `Shake to draw a ${info.label} word`;
  } else if (selectedIndex >= 0) {
    hint = 'Option selected — start over to try again';
  } else {
    hint = 'Blow once to pick your option';
  }
  textAlign(LEFT, TOP);
  text(hint, left, 118);

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

function drawCategoryBadge(info, x, y) {
  textSize(12);
  const w = textWidth(info.label) + 22;
  const h = 22;
  noStroke();
  fill(info.color[0], info.color[1], info.color[2], 55);
  rect(x, y, w, h, 11);
  fill(info.color[0], info.color[1], info.color[2]);
  textAlign(CENTER, CENTER);
  text(info.label, x + w / 2, y + h / 2);
}

function drawFitTitle(str, x, y) {
  const maxW = width - x * 2;
  let size = min(34, width * 0.09);
  textSize(size);
  while (size > 15 && textWidth(str) > maxW) {
    size -= 1;
    textSize(size);
  }
  fill(250, 248, 255);
  textAlign(LEFT, TOP);
  text(str, x, y);
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
      textAlign(RIGHT, CENTER);
      if (i === selectedIndex) {
        fill(255, 255, 255, 235);
        textSize(22);
        text('✓', cardX + cardW - 24, y + layout.cardH / 2);
      } else {
        fill(77, 69, 99, 140);
        textSize(20);
        text('✦', cardX + cardW - 24, y + layout.cardH / 2);
      }
    } else {
      fill(210, 208, 224, 125);
      textSize(14);
      text(i === choices.length && choices.length < 4 ? 'Shake to draw a word' : 'Waiting for a draw…', cardX + 18, y + layout.cardH / 2);
      fill(210, 208, 224, 100);
      textAlign(RIGHT, CENTER);
      textSize(13);
      text(`0${i + 1}`, cardX + cardW - 18, y + layout.cardH / 2);
    }

    // Selected highlight border
    if (isFilled && i === selectedIndex) {
      noFill();
      stroke(255, 255, 255, 230);
      strokeWeight(4);
      rect(cardX, y, cardW, layout.cardH, 18);
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
  const startY = max(height / 4, 150);
  const gap = 12;
  const cardH = (height - startY - 64 - gap * 3) / 4;
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

  // Draw only from the assigned category.
  const bank = wordBanks[category];
  const remaining = bank.filter((item) => !choices.some((choice) => choice.text === item));
  if (remaining.length === 0) return;

  const picked = random(remaining);
  choices.push({ text: picked, createdAt: now });

  // Once all four words are drawn, request the microphone exactly once,
  // so the user can blow to pick their option.
  if (choices.length === 4 && !window.micEnabled && !micPromptShown) {
    micPromptShown = true;
    enableMicTap('Tap to enable microphone, then blow once');
  }
}

function mousePressed() {
  // After a selection, only the "Start over" button responds
  if (selectedIndex >= 0) {
    const b = getStartOverButton();
    if (mouseX >= b.x && mouseX <= b.x + b.w && mouseY >= b.y && mouseY <= b.y + b.h) {
      resetSketch();
    }
  }
  return false;
}

function resetSketch() {
  // A fresh round gets a fresh random condition too.
  category = random(['what', 'who', 'where', 'when']);
  choices.length = 0;
  fillAmount = 0;
  selectedIndex = -1;
  lastShakeAt = -1000;
  blowing = false;
  blowEndedAt = -1;
}

function getStartOverButton() {
  const w = 190;
  const h = 44;
  return { x: (width - w) / 2, y: height - 56, w, h };
}

function drawStartOverButton() {
  if (selectedIndex < 0) return;
  const b = getStartOverButton();
  noStroke();
  fill(255, 255, 255, 26);
  rect(b.x, b.y, b.w, b.h, 22);
  stroke(255, 255, 255, 80);
  strokeWeight(1);
  rect(b.x, b.y, b.w, b.h, 22);
  noStroke();
  fill(245, 230, 255);
  textAlign(CENTER, CENTER);
  textSize(15);
  text('Start over', width / 2, b.y + b.h / 2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
