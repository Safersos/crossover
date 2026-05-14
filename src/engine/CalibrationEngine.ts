export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface Question {
  id: string;
  fractionA: Fraction;
  fractionB: Fraction;
  level: 1 | 2 | 3;
  theEasyWay: string;
  theFastWay: string;
  isScaryVariant: boolean;
  correctAnswer: 'A' | 'B' | 'EQUAL';
}

export interface EngineState {
  questions: Question[];
  heatmap: ('correct' | 'incorrect' | null)[];
  currentStats: number[];
  bottleneckFound: boolean;
  currentIndex: number;
}

// Utility for RNG
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateId = () => Math.random().toString(36).substr(2, 9);

function generateLevel1(): Question {
  const sameNumerator = Math.random() > 0.5;
  let fractionA: Fraction, fractionB: Fraction;
  let theEasyWay = '', theFastWay = '';

  if (sameNumerator) {
    const num = randInt(2, 5);
    const denA = randInt(3, 9);
    let denB = randInt(3, 9);
    while (denB === denA) denB = randInt(3, 9);
    
    fractionA = { numerator: num, denominator: denA };
    fractionB = { numerator: num, denominator: denB };
    theEasyWay = "Imagine two pizzas of the exact same size. If you cut one into fewer slices, each slice is bigger! So the fraction with the smaller bottom number is larger.";
    theFastWay = "Same numerators? The one with the smaller denominator is the larger value.";
  } else {
    const den = randInt(3, 9);
    const numA = randInt(1, den - 1);
    let numB = randInt(1, den - 1);
    while (numB === numA) numB = randInt(1, den - 1);
    
    fractionA = { numerator: numA, denominator: den };
    fractionB = { numerator: numB, denominator: den };
    theEasyWay = "The slices are the exact same size. If you have more slices, you have more pizza. Look at the top number!";
    theFastWay = "Same denominators? The larger numerator means the larger value.";
  }

  const valA = fractionA.numerator / fractionA.denominator;
  const valB = fractionB.numerator / fractionB.denominator;
  const correctAnswer = valA > valB ? 'A' : valA < valB ? 'B' : 'EQUAL';

  return { id: generateId(), fractionA, fractionB, level: 1, theEasyWay, theFastWay, isScaryVariant: false, correctAnswer };
}

function generateLevel2(): Question {
  let denA = randInt(5, 11);
  let numA = Math.floor(denA / 2) - 1;
  if (numA < 1) { denA = 7; numA = 2; }
  
  let denB = randInt(5, 11);
  let numB = Math.ceil(denB / 2) + 1;
  if (numB >= denB) { denB = 9; numB = 6; }

  const flip = Math.random() > 0.5;
  const fractionA = flip ? { numerator: numB, denominator: denB } : { numerator: numA, denominator: denA };
  const fractionB = flip ? { numerator: numA, denominator: denA } : { numerator: numB, denominator: denB };

  const theEasyWay = "Compare both to one-half. One of them is clearly less than half, and the other is more than half!";
  const theFastWay = "Use 1/2 as a benchmark to avoid finding a common denominator.";
  
  const valA = fractionA.numerator / fractionA.denominator;
  const valB = fractionB.numerator / fractionB.denominator;
  const correctAnswer = valA > valB ? 'A' : valA < valB ? 'B' : 'EQUAL';

  return { id: generateId(), fractionA, fractionB, level: 2, theEasyWay, theFastWay, isScaryVariant: false, correctAnswer };
}

function generateLevel3(): Question {
  const primes = [7, 11, 13];
  let denA = primes[Math.floor(Math.random() * primes.length)];
  let denB = randInt(5, 9);
  if (denB === 7) denB = 8;
  
  let numA = randInt(2, denA - 1);
  let numB = Math.round((numA / denA) * denB);
  if (numB === 0) numB = 1;
  if (numB >= denB) numB = denB - 1;
  
  if (numA * denB === numB * denA) numA += 1;

  const theEasyWay = "These are very close and hard to visualize perfectly. We have to mathematically prove which is bigger using common denominators.";
  const theFastWay = "Cross multiply! (Top-left x Bottom-right) vs (Top-right x Bottom-left). The side with the bigger product is the bigger fraction.";
  
  const valA = numA / denA;
  const valB = numB / denB;
  const correctAnswer = valA > valB ? 'A' : valA < valB ? 'B' : 'EQUAL';

  return { id: generateId(), fractionA: { numerator: numA, denominator: denA }, fractionB: { numerator: numB, denominator: denB }, level: 3, theEasyWay, theFastWay, isScaryVariant: false, correctAnswer };
}

function makeScaryBigNumber(q: Question): Question {
  const scaleA = randInt(10, 50) * 10;
  const scaleB = randInt(10, 50) * 10;
  return {
    ...q,
    id: generateId(),
    fractionA: { numerator: q.fractionA.numerator * scaleA, denominator: q.fractionA.denominator * scaleA },
    fractionB: { numerator: q.fractionB.numerator * scaleB, denominator: q.fractionB.denominator * scaleB },
    isScaryVariant: true,
    theEasyWay: "Don't let the big numbers scare you! Simplify them by crossing out the common trailing zeros, and you'll see it's an easy comparison.",
    theFastWay: "Simplify first. Cross off common trailing zeros on top and bottom, then compare as normal."
  };
}

export class CalibrationEngine {
  public state: EngineState;
  private primeFailCount: Record<number, number> = { 7: 0, 11: 0, 13: 0 };

  constructor() {
    this.state = {
      questions: [],
      heatmap: new Array(15).fill(null),
      currentStats: new Array(15).fill(0),
      bottleneckFound: false,
      currentIndex: 0
    };
    this.generateBaseline();
  }

  private generateBaseline() {
    const q: Question[] = [];
    // Phase 1: Logic Check (Q1-Q4)
    for (let i = 0; i < 4; i++) q.push(generateLevel1());
    // Phase 2: Estimation (Q5-Q8)
    for (let i = 4; i < 8; i++) q.push(generateLevel2());
    // Phase 3: Stress Test (Q9-Q15)
    for (let i = 8; i < 15; i++) q.push(generateLevel3());
    this.state.questions = q;
  }

  public submitAnswer(isCorrect: boolean, responseTimeMs: number) {
    const idx = this.state.currentIndex;
    if (idx >= 15) return;

    this.state.heatmap[idx] = isCorrect ? 'correct' : 'incorrect';
    this.state.currentStats[idx] = responseTimeMs;
    const currentQ = this.state.questions[idx];

    // Prime Denominator Bottleneck Tracker
    if (!isCorrect && currentQ.level === 3) {
      const primes = [7, 11, 13];
      const denoms = [currentQ.fractionA.denominator, currentQ.fractionB.denominator];
      
      denoms.forEach(d => {
        primes.forEach(p => {
          if (d % p === 0) {
            this.primeFailCount[p]++;
            if (this.primeFailCount[p] >= 2) {
              this.state.bottleneckFound = true;
            }
          }
        });
      });
    }

    // Adaptive: Subtle Down-Level
    if (!isCorrect && currentQ.level === 3 && idx + 1 < 15) {
      const fallbackLevel = Math.random() > 0.5 ? generateLevel1() : generateLevel2();
      this.state.questions[idx + 1] = makeScaryBigNumber(fallbackLevel);
    }

    // Adaptive: Speed Metric
    if (isCorrect && responseTimeMs < 10000 && idx + 1 < 15) {
      let phaseEnd = 14;
      if (idx <= 3) phaseEnd = 3;
      else if (idx <= 7) phaseEnd = 7;
      
      // If they answer extremely fast, skip the next question in the phase to accelerate them
      if (idx + 1 < phaseEnd) {
        this.state.heatmap[idx + 1] = 'correct'; // auto-pass the skipped question
        this.state.currentStats[idx + 1] = 1000;
        this.state.currentIndex++; 
      }
    }

    this.state.currentIndex++;
  }
}
