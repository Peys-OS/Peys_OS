import confetti from "canvas-confetti";

export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

export function fireBurst() {
  confetti({
    particleCount: 200,
    angle: 90,
    spread: 180,
    origin: { y: 0.6 },
  });
}

export function fireConfettiShower() {
  const end = Date.now() + 1500;
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}
