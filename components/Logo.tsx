import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 32 }: LogoProps) {
  return (
    <Image
      src="/images/logo.png"
      alt="ViloAi Logo"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}
