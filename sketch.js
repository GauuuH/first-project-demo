const suggestions = [
  '去写作业',
  '去做饭',
  '去睡觉',
  '去散步',
  '去喝一杯水',
  '去收拾房间',
  '去读一本书',
  '去听听音乐',
  '去做些运动',
  '去给朋友发消息',
  '去整理一下桌面',
  '去洗个热水澡',
  '去看一部电影',
  '去做几分钟拉伸',
  '去学一道新菜',
  '去晒晒太阳'
];

const choices = [];
let lastShakeAt = -1000;
let resetButton = { x: 0, y: 0, w: 0, h: 0 };

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('sans-serif');
  lockGestures();
  setShakeThreshold(18);
  enableSensorTap('轻触屏幕，开启摇一摇抽选');
}

function draw() {
  background(21, 24, 39);
  drawBackdrop();
  drawHeader();
  drawChoices();
  drawFooter();
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
  text('今天，做点什么？', left, 61);

  fill(191, 190, 211);
  textSize(15);
  const hint = window.sensorsEnabled
    ? '摇一摇手机，随机抽取一个小行动'
    : '开启手机动作权限后，摇一摇开始抽选';
  text(hint, left, 108);

  const countText = `${choices.length} / 4`;
  textAlign(RIGHT, CENTER);
  textSize(14);
  fill(202, 195, 238);
  text(countText, width - left, 45);

  // 四个进度点，直观看到还可以抽几次
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
      text(i === choices.length && choices.length < 4 ? '摇一摇，抽取一个行动' : '等待抽取…', cardX + 18, y + layout.cardH / 2);
      fill(210, 208, 224, 100);
      textAlign(RIGHT, CENTER);
      textSize(13);
      text(`0${i + 1}`, cardX + cardW - 18, y + layout.cardH / 2);
    }
  }
}

function drawFooter() {
  const layout = getLayout();
  const buttonW = min(190, layout.cardW);
  const buttonH = 44;
  const buttonY = min(height - 66, layout.startY + 4 * (layout.cardH + layout.gap) - layout.gap + 18);
  resetButton = {
    x: (width - buttonW) / 2,
    y: buttonY,
    w: buttonW,
    h: buttonH
  };

  const complete = choices.length === 4;
  textAlign(CENTER, CENTER);
  textSize(13);
  fill(complete ? color(255, 204, 150) : color(177, 177, 199));
  text(complete ? '四个灵感都收集好了！' : '最多摇四次 · 每个行动都不重复', width / 2, buttonY - 17);

  noStroke();
  fill(255, 255, 255, choices.length ? 24 : 12);
  rect(resetButton.x, resetButton.y, resetButton.w, resetButton.h, 22);
  fill(choices.length ? 245 : 170, choices.length ? 230 : 170, choices.length ? 255 : 190);
  textSize(14);
  text(choices.length ? '重新开始' : '等待摇一摇', width / 2, resetButton.y + buttonH / 2);
}

function getLayout() {
  const left = min(28, width * 0.07);
  const cardW = min(width - left * 2, 520);
  const compact = height < 680;
  const startY = compact ? 151 : 164;
  const gap = compact ? 8 : 13;
  const cardH = constrain((height - startY - 124 - gap * 3) / 4, 48, 76);
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

  // 避免一次持续晃动被连续识别成多次
  const now = millis();
  if (now - lastShakeAt < 650) return;
  lastShakeAt = now;

  const remaining = suggestions.filter((item) => !choices.some((choice) => choice.text === item));
  if (remaining.length === 0) return;

  const picked = random(remaining);
  choices.push({ text: picked, createdAt: now });
}

function mousePressed() {
  const insideButton = mouseX >= resetButton.x && mouseX <= resetButton.x + resetButton.w
    && mouseY >= resetButton.y && mouseY <= resetButton.y + resetButton.h;

  if (insideButton && choices.length > 0) {
    choices.length = 0;
    lastShakeAt = -1000;
  }
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
