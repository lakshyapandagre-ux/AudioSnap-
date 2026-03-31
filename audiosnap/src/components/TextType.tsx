import { useState, useEffect } from 'react';

interface TextTypeProps {
  text?: string;
  texts?: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  loop?: boolean;
  showCursor?: boolean;
}

export default function TextType({
  text = '',
  texts = [],
  typingSpeed = 45,
  deletingSpeed = 20,
  pauseDuration = 2500,
  loop = false,
  showCursor = false,
}: TextTypeProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  
  // Use texts array if provided, fallback to single text string
  const contentArray = texts.length > 0 ? texts : [text];
  
  // Blink cursor
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    if (!showCursor) return;
    const timeout2 = setTimeout(() => setBlink((prev) => !prev), 500);
    return () => clearTimeout(timeout2);
  }, [blink, showCursor]);

  useEffect(() => {
    if (index === contentArray.length && !loop) return;

    // Check if finished typing current string
    if (subIndex === contentArray[index].length + 1 && !reverse) {
      if (!loop && index === contentArray.length - 1) {
        return; // Finished all text, no loop
      }
      const timeoutID = setTimeout(() => setReverse(true), pauseDuration);
      return () => clearTimeout(timeoutID);
    }
    
    // Check if finished deleting
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % contentArray.length);
      return;
    }

    // Typing/deleting interval
    const timeout = setTimeout(
      () => {
        setDisplayedText(contentArray[index].substring(0, subIndex));
        setSubIndex((prev) => prev + (reverse ? -1 : 1));
      },
      reverse ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [
    subIndex,
    index,
    reverse,
    contentArray,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    loop
  ]);

  return (
    <>
      <span dangerouslySetInnerHTML={{ __html: displayedText.replace(/\n/g, '<br/>') }} />
      {showCursor && (
        <span
          style={{
            opacity: blink ? 1 : 0,
            transition: 'opacity 0.1s ease-in-out',
            marginLeft: '2px',
          }}
        >
          |
        </span>
      )}
    </>
  );
}
