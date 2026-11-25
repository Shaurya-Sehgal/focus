import navy from '../assets/focus-logo-navy.png';
import white from '../assets/focus-logo-white.png';

// Cropped from focusLogo.JPG with the original motion blur kept; 360×124 px source.
export function Logo({ tone = 'navy', className }: { tone?: 'navy' | 'white'; className?: string }) {
  return (
    <img
      src={tone === 'navy' ? navy : white}
      width={360}
      height={124}
      alt="focus."
      className={className}
    />
  );
}
