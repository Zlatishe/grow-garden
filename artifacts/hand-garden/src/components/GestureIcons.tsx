import { Sprout, Flower2, Leaf } from 'lucide-react';

const CREAM = '#E9E8D5';

interface IconProps {
  size?: number;
  opacity?: number;
}

export function VineGrowIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return <Sprout size={size} color={CREAM} strokeWidth={1.5} opacity={opacity} />;
}

export function FlowerBloomIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return <Flower2 size={size} color={CREAM} strokeWidth={1.5} opacity={opacity} />;
}

export function LeafSproutIcon({ size = 36, opacity = 0.7 }: IconProps) {
  return <Leaf size={size} color={CREAM} strokeWidth={1.5} opacity={opacity} />;
}
