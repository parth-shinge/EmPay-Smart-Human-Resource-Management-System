import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover' | 'inViewHover' | 'click';
  clickMode?: 'once' | 'toggle';
}

const styles = {
  wrapper: { display: 'inline-block', whiteSpace: 'pre-wrap' as const },
  srOnly: {
    position: 'absolute' as const, width: '1px', height: '1px',
    padding: 0, margin: '-1px', overflow: 'hidden',
    clip: 'rect(0,0,0,0)', border: 0
  }
};

export default function DecryptedText({
  text, speed = 50, maxIterations = 10, sequential = false,
  revealDirection = 'start', useOriginalCharsOnly = false,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
  className = '', parentClassName = '', encryptedClassName = '',
  animateOn = 'hover', clickMode = 'once', ...props
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set<number>());
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(animateOn !== 'click');
  const [direction, setDirection] = useState('forward');
  const containerRef = useRef<HTMLSpanElement>(null);
  const orderRef = useRef<number[]>([]);
  const pointerRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableChars = useMemo(() =>
    useOriginalCharsOnly
      ? Array.from(new Set(text.split(''))).filter(c => c !== ' ')
      : characters.split(''),
    [useOriginalCharsOnly, text, characters]
  );

  const shuffleText = useCallback((originalText: string, currentRevealed: Set<number>) =>
    originalText.split('').map((char, i) => {
      if (char === ' ') return ' ';
      if (currentRevealed.has(i)) return originalText[i];
      return availableChars[Math.floor(Math.random() * availableChars.length)];
    }).join(''),
    [availableChars]
  );

  const fillAllIndices = useCallback(() => {
    const s = new Set<number>();
    for (let i = 0; i < text.length; i++) s.add(i);
    return s;
  }, [text]);

  const triggerDecrypt = useCallback(() => {
    if (sequential) { orderRef.current = []; pointerRef.current = 0; }
    setRevealedIndices(new Set());
    setDirection('forward');
    setIsAnimating(true);
  }, [sequential]);

  const encryptInstantly = useCallback(() => {
    const emptySet = new Set<number>();
    setRevealedIndices(emptySet);
    setDisplayText(shuffleText(text, emptySet));
    setIsDecrypted(false);
  }, [text, shuffleText]);

  useEffect(() => {
    if (!isAnimating) return;
    let currentIteration = 0;
    intervalRef.current = setInterval(() => {
      setRevealedIndices(prev => {
        if (direction === 'forward') {
          if (!sequential) {
            setDisplayText(shuffleText(text, prev));
            currentIteration++;
            if (currentIteration >= maxIterations) {
              clearInterval(intervalRef.current!);
              setIsAnimating(false);
              setDisplayText(text);
              setIsDecrypted(true);
            }
            return prev;
          }
          if (prev.size < text.length) {
            const next = new Set(prev);
            next.add(prev.size);
            setDisplayText(shuffleText(text, next));
            return next;
          } else {
            clearInterval(intervalRef.current!);
            setIsAnimating(false);
            setIsDecrypted(true);
            return prev;
          }
        }
        return prev;
      });
    }, speed);
    return () => clearInterval(intervalRef.current!);
  }, [isAnimating, text, speed, maxIterations, sequential, shuffleText, direction]);

  useEffect(() => {
    if (animateOn !== 'view' && animateOn !== 'inViewHover') return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          triggerDecrypt();
          setHasAnimated(true);
        }
      });
    }, { threshold: 0.1 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [animateOn, hasAnimated, triggerDecrypt]);

  useEffect(() => {
    if (animateOn === 'click') encryptInstantly();
    else { setDisplayText(text); setIsDecrypted(true); }
    setRevealedIndices(new Set());
  }, [animateOn, text, encryptInstantly]);

  const animateProps = animateOn === 'hover'
    ? {
        onMouseEnter: () => { if (!isAnimating) { setRevealedIndices(new Set()); setIsDecrypted(false); setDirection('forward'); setIsAnimating(true); } },
        onMouseLeave: () => { clearInterval(intervalRef.current!); setIsAnimating(false); setRevealedIndices(new Set()); setDisplayText(text); setIsDecrypted(true); }
      }
    : animateOn === 'click'
      ? { onClick: () => { if (!isDecrypted) triggerDecrypt(); } }
      : {};

  return (
    <motion.span className={parentClassName} ref={containerRef} style={styles.wrapper} {...animateProps} {...(props as any)}>
      <span style={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {displayText.split('').map((char, index) => {
          const isRevealed = revealedIndices.has(index) || (!isAnimating && isDecrypted);
          return (
            <span key={index} className={isRevealed ? className : encryptedClassName}>
              {char}
            </span>
          );
        })}
      </span>
    </motion.span>
  );
}
