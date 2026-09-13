import type React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';

export interface SoundSightMarkProps { size?: number; className?: string }

export const SoundSightMark: React.FC<SoundSightMarkProps> = ({ size = 36 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityRole="image" accessibilityLabel="SoundSight">
    <Defs><ClipPath id="ss-clip"><Circle cx="60" cy="61" r="50" /></ClipPath></Defs>
    <Path d="M13 45 A51 51 0 0 1 107 45" fill="none" stroke="#247CA8" strokeWidth="14" strokeLinecap="butt" />
    <G clipPath="url(#ss-clip)">
      <Path d="M1 49 C22 59 35 26 57 25 C76 24 77 57 96 51 C107 47 116 52 123 60 L123 121 L1 121 Z" fill="#D9F3FC" opacity={0.96} />
      <Path d="M0 57 C23 67 37 35 59 34 C78 33 80 66 99 59 C109 55 117 60 124 68 L124 121 L0 121 Z" fill="#86D8F2" opacity={0.9} />
      <Path d="M0 66 C23 76 40 45 61 44 C81 44 83 76 102 68 C112 64 119 69 125 77 L125 121 L0 121 Z" fill="#55C2E8" opacity={0.82} />
      <Path d="M0 76 C25 87 41 57 63 56 C84 55 87 87 106 78 C115 74 121 80 126 88 L126 121 L0 121 Z" fill="#247CA8" opacity={0.9} />
      <Path d="M0 88 C27 99 45 70 66 70 C88 69 91 100 110 91 C118 87 123 93 127 100 L127 122 L0 122 Z" fill="#062C45" />
      <Path d="M0 99 C29 108 48 84 69 84 C91 83 96 109 114 101 C121 98 126 103 129 109 L129 123 L0 123 Z" fill="#021E32" />
      <Path d="M1 49 C22 59 35 26 57 25 C76 24 77 57 96 51 C107 47 116 52 123 60" fill="none" stroke="#F7FBFD" strokeWidth="1.6" />
      <Path d="M0 57 C23 67 37 35 59 34 C78 33 80 66 99 59 C109 55 117 60 124 68" fill="none" stroke="#C6E8F5" strokeWidth="1.3" />
      <Path d="M0 66 C23 76 40 45 61 44 C81 44 83 76 102 68 C112 64 119 69 125 77" fill="none" stroke="#C6E8F5" strokeWidth="1.1" opacity={0.78} />
      <Path d="M0 76 C25 87 41 57 63 56 C84 55 87 87 106 78 C115 74 121 80 126 88" fill="none" stroke="#55C2E8" strokeWidth="1" opacity={0.72} />
    </G>
  </Svg>
);
