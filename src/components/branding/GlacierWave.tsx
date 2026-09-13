import type React from 'react';
import Svg, { Path } from 'react-native-svg';

interface GlacierWaveProps { height?: number; placement?: 'top' | 'bottom'; opacity?: number }

/** Layered SoundSight landscape: asymmetric glacier mass, translucent depth, contour edges. */
export const GlacierWave: React.FC<GlacierWaveProps> = ({ height = 180, placement = 'bottom', opacity = 1 }) => (
  <Svg width="100%" height={height} viewBox="0 0 390 180" pointerEvents="none" style={{ opacity, transform: [{ rotate: placement === 'top' ? '180deg' : '0deg' }] }}>
    <Path d="M0 180V91 C38 84 62 58 95 63 C128 68 144 112 178 105 C215 97 220 34 262 28 C301 23 326 81 355 72 C371 67 382 61 390 64V180Z" fill="#05263D" />
    <Path d="M0 180V101 C40 92 65 68 98 72 C132 77 149 120 183 113 C220 105 225 46 264 39 C304 33 327 89 358 81 C373 77 383 70 390 73V180Z" fill="#07334F" opacity={0.96} />
    <Path d="M0 180V112 C41 102 69 78 103 83 C136 88 155 128 190 121 C225 114 233 57 270 50 C308 43 332 99 361 92 C375 88 384 82 390 85V180Z" fill="#0B466D" opacity={0.9} />
    <Path d="M0 180V123 C44 112 73 88 108 94 C141 99 162 137 197 130 C232 122 241 68 276 61 C313 54 337 109 365 103 C377 100 385 94 390 97V180Z" fill="#17688F" opacity={0.82} />
    <Path d="M0 180V134 C46 122 78 100 113 105 C147 111 168 145 204 139 C239 132 249 80 282 73 C317 66 341 119 368 114 C380 111 386 106 390 109V180Z" fill="#247CA8" opacity={0.72} />
    <Path d="M0 180V145 C50 133 82 112 118 117 C152 122 176 154 211 148 C246 142 258 93 289 86 C322 78 346 130 372 125 C382 123 388 118 390 121V180Z" fill="#39A5CF" opacity={0.55} />
    <Path d="M0 180V155 C53 145 88 124 123 129 C158 134 182 162 218 157 C253 152 267 106 296 99 C327 91 351 140 375 136 C384 134 389 130 390 132V180Z" fill="#55C2E8" opacity={0.35} />
    <Path d="M0 180V164 C58 155 93 138 129 142 C164 147 190 170 225 166 C260 162 277 120 303 113 C332 105 356 151 378 147 C386 146 389 142 390 144V180Z" fill="#C6E8F5" opacity={0.16} />

    <Path d="M0 91 C38 84 62 58 95 63 C128 68 144 112 178 105 C215 97 220 34 262 28 C301 23 326 81 355 72 C371 67 382 61 390 64" fill="none" stroke="#55C2E8" strokeWidth="1.4" opacity={0.9} />
    <Path d="M0 101 C40 92 65 68 98 72 C132 77 149 120 183 113 C220 105 225 46 264 39 C304 33 327 89 358 81 C373 77 383 70 390 73" fill="none" stroke="#247CA8" strokeWidth="1.2" opacity={0.8} />
    <Path d="M0 112 C41 102 69 78 103 83 C136 88 155 128 190 121 C225 114 233 57 270 50 C308 43 332 99 361 92 C375 88 384 82 390 85" fill="none" stroke="#55C2E8" strokeWidth="1.1" opacity={0.68} />
    <Path d="M0 123 C44 112 73 88 108 94 C141 99 162 137 197 130 C232 122 241 68 276 61 C313 54 337 109 365 103 C377 100 385 94 390 97" fill="none" stroke="#C6E8F5" strokeWidth="1" opacity={0.58} />
    <Path d="M0 134 C46 122 78 100 113 105 C147 111 168 145 204 139 C239 132 249 80 282 73 C317 66 341 119 368 114 C380 111 386 106 390 109" fill="none" stroke="#55C2E8" strokeWidth="0.9" opacity={0.48} />
    <Path d="M0 145 C50 133 82 112 118 117 C152 122 176 154 211 148 C246 142 258 93 289 86 C322 78 346 130 372 125 C382 123 388 118 390 121" fill="none" stroke="#C6E8F5" strokeWidth="0.8" opacity={0.34} />
  </Svg>
);
