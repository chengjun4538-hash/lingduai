/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import React, { useMemo } from 'react';

/**
 * APIMart 风格彩色浮动粒子背景组件
 * 使用纯 CSS 动画，无 canvas，性能好
 */
const PARTICLE_COLORS = [
  '#3c77f6', // 蓝
  '#22c55e', // 绿
  '#ec4899', // 粉
  '#f97316', // 橙
  '#a855f7', // 紫
  '#06b6d4', // 青
  '#eab308', // 黄
  '#ef4444', // 红
  '#3c77f6', // 蓝 (加权)
  '#a855f7', // 紫 (加权)
];

const ANIMATIONS = ['float-1', 'float-2', 'float-3', 'float-4', 'float-5'];

// 生成确定性的粒子配置（用种子避免每次 render 都不同）
function generateParticles(count = 30) {
  const particles = [];
  // 使用固定的配置避免 hydration 不一致
  const configs = [
    { x: 8,  y: 15, size: 5, anim: 0, dur: 8 },
    { x: 18, y: 72, size: 4, anim: 1, dur: 11 },
    { x: 32, y: 38, size: 6, anim: 2, dur: 9 },
    { x: 45, y: 85, size: 3, anim: 3, dur: 13 },
    { x: 55, y: 22, size: 5, anim: 4, dur: 7 },
    { x: 68, y: 60, size: 4, anim: 0, dur: 12 },
    { x: 78, y: 10, size: 6, anim: 1, dur: 10 },
    { x: 88, y: 45, size: 3, anim: 2, dur: 8 },
    { x: 95, y: 80, size: 5, anim: 3, dur: 15 },
    { x: 12, y: 55, size: 4, anim: 4, dur: 9 },
    { x: 25, y: 92, size: 3, anim: 0, dur: 11 },
    { x: 40, y: 5,  size: 5, anim: 1, dur: 14 },
    { x: 60, y: 95, size: 4, anim: 2, dur: 8 },
    { x: 72, y: 30, size: 6, anim: 3, dur: 10 },
    { x: 82, y: 68, size: 3, anim: 4, dur: 12 },
    { x: 92, y: 18, size: 5, anim: 0, dur: 9 },
    { x: 5,  y: 35, size: 4, anim: 1, dur: 13 },
    { x: 48, y: 50, size: 3, anim: 2, dur: 7 },
    { x: 35, y: 78, size: 5, anim: 3, dur: 11 },
    { x: 65, y: 42, size: 4, anim: 4, dur: 16 },
    { x: 15, y: 88, size: 3, anim: 0, dur: 9 },
    { x: 52, y: 12, size: 6, anim: 1, dur: 12 },
    { x: 75, y: 55, size: 4, anim: 2, dur: 8 },
    { x: 22, y: 28, size: 5, anim: 3, dur: 14 },
    { x: 85, y: 90, size: 3, anim: 4, dur: 10 },
    { x: 42, y: 62, size: 4, anim: 0, dur: 11 },
    { x: 58, y: 75, size: 5, anim: 1, dur: 9 },
    { x: 3,  y: 65, size: 3, anim: 2, dur: 13 },
    { x: 97, y: 35, size: 4, anim: 3, dur: 8 },
    { x: 30, y: 48, size: 5, anim: 4, dur: 10 },
  ];

  for (let i = 0; i < Math.min(count, configs.length); i++) {
    const cfg = configs[i];
    particles.push({
      id: i,
      left: `${cfg.x}%`,
      top: `${cfg.y}%`,
      width: `${cfg.size}px`,
      height: `${cfg.size}px`,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      animation: `${ANIMATIONS[cfg.anim]} ${cfg.dur}s ease-in-out infinite`,
      // 每个粒子错开启动时间
      animationDelay: `${(i * 0.5) % 8}s`,
      opacity: 0.7,
    });
  }
  return particles;
}

const FloatingParticles = ({ count = 28 }) => {
  const particles = useMemo(() => generateParticles(count), [count]);

  return (
    <div
      aria-hidden='true'
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.width,
            height: p.height,
            borderRadius: '50%',
            background: p.color,
            animation: p.animation,
            animationDelay: p.animationDelay,
            opacity: p.opacity,
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
