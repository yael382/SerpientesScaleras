export interface Challenge {
  id: string;
  category: 'geometria' | 'fracciones' | 'aritmetica';
  /** Segundos que tiene el jugador para responder este reto */
  timeLimit: number;
  /** Texto plano (sin HTML) */
  question: string;
  /** HTML enriquecido con fracciones, íconos y formato de pregunta */
  htmlQuestion: string;
  correctAnswer: number;
  explanation: string;
  options: { value: number; isCorrect: boolean }[];
}

// ─── Iconos por tipo ────────────────────────────────────────────────────────
const ICONS: Record<string, string> = {
  geometria:    '📐',
  fracciones:   '🍕',
  aritmetica:   '🧮',
  rectangulo:   '▭',
  triangulo:    '△',
  perimetro:    '🔷',
  cubo:         '🎲',
  pastel:       '🎂',
  listones:     '🎀',
  alcancia:     '🪙',
  canicas:      '🔵',
  filas:        '💺',
  reparto:      '✏️',
  trescuartos:  '🍰',
  doble:        '✖️',
  volumen:      '📦',
  porcentaje:   '💯',
  pentagono:    '⬠',
  trapecio:     '📏',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Fracción matemática apilada con línea divisoria real (sin sup/sub). */
function frac(num: number, den: number): string {
  return `<span class="frac" role="math" aria-label="${num} entre ${den}"><span class="frac-num">${num}</span><span class="frac-den">${den}</span></span>`;
}

/** Envuelve el cuerpo en la tarjeta de reto con ícono y badge. */
function card(id: string, category: Challenge['category'], body: string): string {
  const icon  = ICONS[id] ?? ICONS[category];
  const label = category === 'geometria'  ? 'Geometría'
              : category === 'fracciones' ? 'Fracciones'
              : 'Aritmética';
  return `
<div class="challenge-card">
  <div class="challenge-header">
    <span class="challenge-icon">${icon}</span>
    <span class="challenge-badge">${label}</span>
  </div>
  <p class="challenge-body">${body}</p>
</div>`;
}

/** Fisher-Yates shuffle in-place. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Genera un entero aleatorio en [min, max]. */
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Genera n opciones únicas alrededor de correctAnswer. */
function generateOptions(correctAnswer: number, count: number): { value: number; isCorrect: boolean }[] {
  const values = new Set<number>([correctAnswer]);
  let retries = 0;
  while (values.size < count && retries < 80) {
    retries++;
    const offset = rnd(1, 8);
    const val = Math.random() > 0.5 ? correctAnswer + offset : correctAnswer - offset;
    if (val > 0) values.add(val);
  }
  let fallback = correctAnswer + 1;
  while (values.size < count) {
    if (!values.has(fallback)) values.add(fallback);
    fallback++;
  }
  return shuffle(Array.from(values).map(val => ({ value: val, isCorrect: val === correctAnswer })));
}

// ─── Tipos de reto ────────────────────────────────────────────────────────────
type Generator = (optionsCount: number) => Challenge;

// ══════════════════════════════════════════════════════════════════════════════
// 5TO GRADO
// ══════════════════════════════════════════════════════════════════════════════

// 1. Rectángulo – área
const makeRectangulo: Generator = (n) => {
  const base  = rnd(4, 20);
  const alt   = rnd(3, 15);
  const correct = base * alt;
  return {
    id: 'rectangulo', category: 'geometria', timeLimit: 60,
    question: `Un rectángulo mide ${base} cm de base y ${alt} cm de altura. ¿Cuál es su área?`,
    htmlQuestion: card('rectangulo', 'geometria',
      `Un rectángulo mide <strong>${base} cm</strong> de base y <strong>${alt} cm</strong> de altura.
       <br><em>¿Cuál es su área total?</em>`),
    correctAnswer: correct,
    explanation: `Base × altura: ${base} × ${alt} = ${correct} cm²`,
    options: generateOptions(correct, n),
  };
};

// 2. Perímetro cuadrado
const makePerimetro: Generator = (n) => {
  const lado = rnd(4, 25);
  const correct = lado * 4;
  return {
    id: 'perimetro', category: 'geometria', timeLimit: 60,
    question: `Un terreno cuadrado mide ${lado} m de cada lado. ¿Cuántos metros de cerca necesitamos?`,
    htmlQuestion: card('perimetro', 'geometria',
      `Un terreno <strong>cuadrado</strong> mide <strong>${lado} m</strong> de cada lado.
       <br><em>¿Cuántos metros de cerca necesitamos para rodearlo?</em>`),
    correctAnswer: correct,
    explanation: `4 lados × ${lado} m = ${correct} m`,
    options: generateOptions(correct, n),
  };
};

// 3. Pastel – fracción 1/2
const makePastel: Generator = (n) => {
  const total = rnd(2, 10) * 2; // siempre par
  const correct = total / 2;
  return {
    id: 'pastel', category: 'fracciones', timeLimit: 60,
    question: `Cortaron un pastel en ${total} rebanadas. Los invitados se comieron la mitad. ¿Cuántas rebanadas quedaron?`,
    htmlQuestion: card('pastel', 'fracciones',
      `Cortaron un pastel en <strong>${total} rebanadas</strong> iguales.
       Los invitados se comieron ${frac(1, 2)} del pastel.
       <br><em>¿Cuántas rebanadas quedaron?</em>`),
    correctAnswer: correct,
    explanation: `${total} ÷ 2 = ${correct} rebanadas`,
    options: generateOptions(correct, n),
  };
};

// 4. Listón – fracción 1/3
const makeListon: Generator = (n) => {
  const mult = rnd(1, 8);
  const total = mult * 3;
  const correct = total / 3;
  return {
    id: 'listones', category: 'fracciones', timeLimit: 60,
    question: `Un listón mide ${total} cm. Cortamos 1/3 para hacer un moño. ¿De cuántos cm quedó el moño?`,
    htmlQuestion: card('listones', 'fracciones',
      `Un listón mide <strong>${total} cm</strong>.
       Cortamos ${frac(1, 3)} del listón para hacer un moño.
       <br><em>¿De cuántos centímetros quedó el moño?</em>`),
    correctAnswer: correct,
    explanation: `${total} ÷ 3 = ${correct} cm`,
    options: generateOptions(correct, n),
  };
};

// 5. Filas – multiplicación
const makeFilas: Generator = (n) => {
  const filas  = rnd(6, 18);
  const sillas = rnd(5, 15);
  const correct = filas * sillas;
  return {
    id: 'filas', category: 'aritmetica', timeLimit: 60,
    question: `En el auditorio hay ${filas} filas con ${sillas} sillas cada una. ¿Cuántas personas caben en total?`,
    htmlQuestion: card('filas', 'aritmetica',
      `En el auditorio hay <strong>${filas} filas</strong> de sillas,
       y cada fila tiene <strong>${sillas} sillas</strong>.
       <br><em>¿Cuántas personas caben en total?</em>`),
    correctAnswer: correct,
    explanation: `${filas} × ${sillas} = ${correct} personas`,
    options: generateOptions(correct, n),
  };
};

// 6. Reparto – división
const makeReparto: Generator = (n) => {
  const alumnos  = [4, 5, 6, 8, 10][rnd(0, 4)];
  const porAlum  = rnd(4, 15);
  const total    = alumnos * porAlum;
  return {
    id: 'reparto', category: 'aritmetica', timeLimit: 60,
    question: `Un maestro tiene ${total} lápices y los reparte en partes iguales entre ${alumnos} alumnos. ¿Cuántos le tocan a cada uno?`,
    htmlQuestion: card('reparto', 'aritmetica',
      `Un maestro tiene <strong>${total} lápices</strong> y los reparte en partes iguales
       entre <strong>${alumnos} alumnos</strong>.
       <br><em>¿Cuántos lápices le tocan a cada alumno?</em>`),
    correctAnswer: porAlum,
    explanation: `${total} ÷ ${alumnos} = ${porAlum} lápices`,
    options: generateOptions(porAlum, n),
  };
};

// 7. Tres cuartos – fracción 3/4 (NUEVO 5to)
const makeTresCuartos: Generator = (n) => {
  const mult  = rnd(2, 10);
  const total = mult * 4;
  const tres  = mult * 3;
  return {
    id: 'trescuartos', category: 'fracciones', timeLimit: 60,
    question: `Una pizza tiene ${total} rebanadas. Si nos comimos 3/4 de la pizza, ¿cuántas rebanadas nos comimos?`,
    htmlQuestion: card('trescuartos', 'fracciones',
      `Una pizza tiene <strong>${total} rebanadas</strong>.
       Nos comimos ${frac(3, 4)} de la pizza.
       <br><em>¿Cuántas rebanadas nos comimos?</em>`),
    correctAnswer: tres,
    explanation: `3/4 de ${total}: (${total} ÷ 4) × 3 = ${mult} × 3 = ${tres} rebanadas`,
    options: generateOptions(tres, n),
  };
};

// 8. Doble / mitad – problema verbal (NUEVO 5to)
const makeDoble: Generator = (n) => {
  const base   = rnd(5, 50);
  const doble  = base * 2;
  const esDoble = Math.random() > 0.5;
  const correct = esDoble ? doble : base;
  const pregunta = esDoble
    ? `Ana tiene ${base} estampas. Su hermano tiene el doble. ¿Cuántas estampas tiene su hermano?`
    : `Luis tiene ${doble} cartas. Su amigo tiene la mitad. ¿Cuántas cartas tiene su amigo?`;
  const cuerpo = esDoble
    ? `Ana tiene <strong>${base} estampas</strong>. Su hermano tiene <strong>el doble</strong>.
       <br><em>¿Cuántas estampas tiene el hermano?</em>`
    : `Luis tiene <strong>${doble} cartas</strong>. Su amigo tiene <strong>la mitad</strong>.
       <br><em>¿Cuántas cartas tiene el amigo?</em>`;
  return {
    id: 'doble', category: 'aritmetica', timeLimit: 60,
    question: pregunta,
    htmlQuestion: card('doble', 'aritmetica', cuerpo),
    correctAnswer: correct,
    explanation: esDoble ? `${base} × 2 = ${doble}` : `${doble} ÷ 2 = ${base}`,
    options: generateOptions(correct, n),
  };
};

// ══════════════════════════════════════════════════════════════════════════════
// 6TO GRADO
// ══════════════════════════════════════════════════════════════════════════════

// 1. Triángulo – área
const makeTriangulo: Generator = (n) => {
  const base   = rnd(3, 12) * 2; // par para área entera
  const altura = rnd(3, 14);
  const correct = (base * altura) / 2;
  return {
    id: 'triangulo', category: 'geometria', timeLimit: 60,
    question: `Un triángulo tiene base de ${base} cm y altura de ${altura} cm. ¿Cuál es su área?`,
    htmlQuestion: card('triangulo', 'geometria',
      `Un triángulo tiene base de <strong>${base} cm</strong> y altura de <strong>${altura} cm</strong>.
       <br><em>¿Cuál es su área?</em>`),
    correctAnswer: correct,
    explanation: `(${base} × ${altura}) ÷ 2 = ${correct} cm²`,
    options: generateOptions(correct, n),
  };
};

// 2. Cubo – área total
const makeCubo: Generator = (n) => {
  const cara  = rnd(3, 20);
  const correct = cara * 6;
  return {
    id: 'cubo', category: 'geometria', timeLimit: 60,
    question: `Un cubo tiene 6 caras iguales de ${cara} cm² cada una. ¿Cuál es el área total del cubo?`,
    htmlQuestion: card('cubo', 'geometria',
      `Un cubo tiene <strong>6 caras iguales</strong> de <strong>${cara} cm²</strong> cada una.
       <br><em>¿Cuál es el área total del cubo?</em>`),
    correctAnswer: correct,
    explanation: `6 × ${cara} = ${correct} cm²`,
    options: generateOptions(correct, n),
  };
};

// 3. Alcancía – fracción 1/4
const makeAlcancia: Generator = (n) => {
  const mult     = rnd(2, 12);
  const total    = mult * 4;
  const gasta    = mult;
  const correct  = total - gasta;
  return {
    id: 'alcancia', category: 'fracciones', timeLimit: 60,
    question: `Ahorré $${total}. Gasté 1/4 en un juguete. ¿Cuánto dinero me queda?`,
    htmlQuestion: card('alcancia', 'fracciones',
      `Ahorré <strong>$${total}</strong> y gasté ${frac(1, 4)} en un juguete.
       <br><em>¿Cuánto dinero me queda?</em>`),
    correctAnswer: correct,
    explanation: `Gasté $${gasta} (${frac(1,4)} de $${total}). Quedan: $${total} − $${gasta} = $${correct}`,
    options: generateOptions(correct, n),
  };
};

// 4. Canicas – fracción 1/4
const makeCanicas: Generator = (n) => {
  const mult    = rnd(2, 12);
  const total   = mult * 4;
  const correct = mult;
  return {
    id: 'canicas', category: 'fracciones', timeLimit: 60,
    question: `Un frasco tiene ${total} canicas. Si 1/4 son azules y las demás son verdes, ¿cuántas canicas azules hay?`,
    htmlQuestion: card('canicas', 'fracciones',
      `Un frasco tiene <strong>${total} canicas</strong>.
       ${frac(1, 4)} son de color <strong style="color:#60a5fa">azul</strong> 🔵 y el resto son verdes.
       <br><em>¿Cuántas canicas azules hay?</em>`),
    correctAnswer: correct,
    explanation: `${total} ÷ 4 = ${correct} canicas azules`,
    options: generateOptions(correct, n),
  };
};

// 5. Volumen de caja (NUEVO 6to)
const makeVolumen: Generator = (n) => {
  const largo  = rnd(2, 10);
  const ancho  = rnd(2, 8);
  const alto   = rnd(2, 6);
  const correct = largo * ancho * alto;
  return {
    id: 'volumen', category: 'geometria', timeLimit: 60,
    question: `Una caja mide ${largo} cm de largo, ${ancho} cm de ancho y ${alto} cm de alto. ¿Cuál es su volumen?`,
    htmlQuestion: card('volumen', 'geometria',
      `Una caja mide <strong>${largo} cm</strong> de largo,
       <strong>${ancho} cm</strong> de ancho y <strong>${alto} cm</strong> de alto.
       <br><em>¿Cuál es su volumen?</em>`),
    correctAnswer: correct,
    explanation: `Largo × Ancho × Alto: ${largo} × ${ancho} × ${alto} = ${correct} cm³`,
    options: generateOptions(correct, n),
  };
};

// 6. Porcentaje simple 10% / 25% / 50% (NUEVO 6to)
const makePorcentaje: Generator = (n) => {
  const pcts = [
    { pct: 10,  frac_n: 1, frac_d: 10, div: 10 },
    { pct: 25,  frac_n: 1, frac_d: 4,  div: 4  },
    { pct: 50,  frac_n: 1, frac_d: 2,  div: 2  },
    { pct: 20,  frac_n: 1, frac_d: 5,  div: 5  },
  ];
  const { pct, frac_n, frac_d, div } = pcts[rnd(0, pcts.length - 1)];
  const mult    = rnd(2, 20);
  const total   = mult * div;
  const correct = mult * frac_n;
  return {
    id: 'porcentaje', category: 'aritmetica', timeLimit: 60,
    question: `¿Cuánto es el ${pct}% de ${total}?`,
    htmlQuestion: card('porcentaje', 'aritmetica',
      `Una tienda tiene <strong>${total} artículos</strong> en oferta con el <strong>${pct}% de descuento</strong>.
       <br><em>¿Cuántos artículos tienen descuento?</em>`),
    correctAnswer: correct,
    explanation: `${pct}% de ${total} = ${total} × ${frac_n}/${frac_d} = ${correct}`,
    options: generateOptions(correct, n),
  };
};

// 7. Paralelogramo – área (NUEVO 6to)
const makeParalelogramo: Generator = (n) => {
  const base   = rnd(4, 20);
  const altura = rnd(3, 12);
  const correct = base * altura;
  return {
    id: 'rectangulo', category: 'geometria', timeLimit: 60,
    question: `Un paralelogramo tiene base de ${base} cm y altura de ${altura} cm. ¿Cuál es su área?`,
    htmlQuestion: card('rectangulo', 'geometria',
      `Un <strong>paralelogramo</strong> tiene base de <strong>${base} cm</strong>
       y altura de <strong>${altura} cm</strong>.
       <br><em>¿Cuál es su área?</em>`),
    correctAnswer: correct,
    explanation: `Base × altura: ${base} × ${altura} = ${correct} cm²`,
    options: generateOptions(correct, n),
  };
};

// 8. Reparto en 6to
const makeReparto6: Generator = (n) => {
  const equipos  = [3, 4, 5, 6, 7, 8][rnd(0, 5)];
  const porEquipo = rnd(3, 20);
  const total    = equipos * porEquipo;
  return {
    id: 'reparto', category: 'aritmetica', timeLimit: 60,
    question: `Se repartieron ${total} libros en partes iguales entre ${equipos} equipos. ¿Cuántos libros le tocaron a cada equipo?`,
    htmlQuestion: card('reparto', 'aritmetica',
      `Se repartieron <strong>${total} libros</strong> en partes iguales entre <strong>${equipos} equipos</strong>.
       <br><em>¿Cuántos libros le tocaron a cada equipo?</em>`),
    correctAnswer: porEquipo,
    explanation: `${total} ÷ ${equipos} = ${porEquipo} libros`,
    options: generateOptions(porEquipo, n),
  };
};

// ─── Listas de generadores ────────────────────────────────────────────────────

const generators5to: Generator[] = [
  makeRectangulo,
  makePerimetro,
  makePastel,
  makeListon,
  makeFilas,
  makeReparto,
  makeTresCuartos,
  makeDoble,
];

const generators6to: Generator[] = [
  makeTriangulo,
  makeCubo,
  makeAlcancia,
  makeCanicas,
  makeFilas,
  makeReparto6,
  makeVolumen,
  makePorcentaje,
  makeParalelogramo,
];

// ─── Pool sin repeticiones ────────────────────────────────────────────────────

/**
 * Pool que garantiza que todos los tipos de reto aparecen antes de repetirse.
 * Usa Fisher-Yates para mezclar y evita que el mismo tipo aparezca dos veces seguidas.
 */
export class ChallengePool {
  private queue: number[] = [];
  private lastIdx: number = -1;
  private readonly gens: Generator[];
  private readonly count: number;

  constructor(grade: '5to' | '6to', optionsCount: number = 3) {
    this.gens  = grade === '5to' ? generators5to : generators6to;
    this.count = optionsCount;
    this.refill();
  }

  private refill(): void {
    const indices = Array.from({ length: this.gens.length }, (_, i) => i);
    shuffle(indices);
    // Evita que el mismo tipo quede al inicio justo después del último
    if (this.lastIdx !== -1 && indices[0] === this.lastIdx && indices.length > 1) {
      [indices[0], indices[1]] = [indices[1], indices[0]];
    }
    this.queue = indices;
  }

  /** Devuelve el siguiente reto. Nunca repite el mismo tipo dos veces seguidas
   *  y garantiza que todos los tipos aparezcan una vez por ciclo. */
  next(): Challenge {
    if (this.queue.length === 0) this.refill();
    const idx = this.queue.shift()!;
    this.lastIdx = idx;
    return this.gens[idx](this.count);
  }

  /** Restablece el pool (útil al empezar una nueva partida). */
  reset(): void {
    this.lastIdx = -1;
    this.queue   = [];
    this.refill();
  }
}

// ─── Compatibilidad hacia atrás ───────────────────────────────────────────────

/** @deprecated Usa ChallengePool para evitar repeticiones. */
export function generateRandomChallenge(grade: '5to' | '6to', optionsCount: number = 3): Challenge {
  const gens = grade === '5to' ? generators5to : generators6to;
  return gens[Math.floor(Math.random() * gens.length)](optionsCount);
}
