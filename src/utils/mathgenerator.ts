export interface MathOption {
  value: number;
  isCorrect: boolean;
}

export interface MathQuestion {
  text: string;
  options: MathOption[];
}

export function generateMathQuestion(level: 'Alpha' | 'Beta'): MathQuestion {
  if (level === 'Alpha') {
    return generateAlphaQuestion();
  } else {
    return generateBetaQuestion();
  }
}

function generateAlphaQuestion(): MathQuestion {
  let var1 = Math.floor(Math.random() * 15) + 1;
  let var2 = Math.floor(Math.random() * 15) + 1;

  const isAddition = Math.random() > 0.5;

  if (!isAddition && var1 < var2) {
    let temp = var1;
    var1 = var2;
    var2 = temp;
  }

  const correctAnswer = isAddition ? (var1 + var2) : (var1 - var2);
  const operator = isAddition ? '+' : '-';

  let wrong1 = correctAnswer + Math.floor(Math.random() * 3) + 1;
  if (wrong1 === correctAnswer) wrong1 += 1;

  const options: MathOption[] = [
    { value: correctAnswer, isCorrect: true },
    { value: wrong1, isCorrect: false }
  ];

  options.sort(() => Math.random() - 0.5);

  return {
    text: `${var1} ${operator} ${var2} = ?`,
    options
  };
}

function generateBetaQuestion(): MathQuestion {
  const isMultiplication = Math.random() > 0.5;
  let var1, var2, correctAnswer, operator;

  if (isMultiplication) {
    var1 = Math.floor(Math.random() * 10) + 2;
    var2 = Math.floor(Math.random() * 10) + 2;
    correctAnswer = var1 * var2;
    operator = '×';
  } else {
    var2 = Math.floor(Math.random() * 9) + 2;
    correctAnswer = Math.floor(Math.random() * 10) + 2;
    var1 = correctAnswer * var2;
    operator = '÷';
  }

  let wrong1 = correctAnswer + Math.floor(Math.random() * 4) + 1;
  let wrong2 = Math.max(1, correctAnswer - (Math.floor(Math.random() * 4) + 1));

  if (wrong1 === wrong2) wrong1 += 1;
  if (wrong1 === correctAnswer) wrong1 += 2;
  if (wrong2 === correctAnswer) wrong2 -= 1;

  const options: MathOption[] = [
    { value: correctAnswer, isCorrect: true },
    { value: wrong1, isCorrect: false },
    { value: wrong2, isCorrect: false }
  ];

  options.sort(() => Math.random() - 0.5);

  return {
    text: `${var1} ${operator} ${var2} = ?`,
    options
  };
}
