import type { ComponentProps } from 'react';
import Image from 'next/image';
import LogoSvg from './all-medical-logo.svg';

// The props for the Logo component should be compatible with a standard SVG element
export function Logo(props: Partial<ComponentProps<typeof Image>>) {
  const { width = 100, height = 100, ...rest } = props;
  return (
    <Image
      src={LogoSvg}
      alt="All Medical Logo"
      width={width}
      height={height}
      priority // Ensures the logo loads quickly
      {...rest}
    />
  );
}
