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

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useEffect, useRef, useState } from 'react';

/**
 * ScrollReveal — 滚动入场动画包裹组件
 * 当元素进入视口时，触发从下方淡入的动画效果（类似 APIMart 各 Section 滚动进场）
 *
 * @param {string}  direction - 'up' | 'down' | 'left' | 'right'（入场方向，默认 up）
 * @param {number}  delay     - 延迟毫秒，默认 0
 * @param {number}  threshold - IntersectionObserver 触发阈值，默认 0.1
 * @param {string}  className - 额外 className
 */
const ScrollReveal = ({
  children,
  direction = 'up',
  delay = 0,
  threshold = 0.1,
  className = '',
}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 检查动画偏好
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const directionMap = {
    up:    'translateY(30px)',
    down:  'translateY(-30px)',
    left:  'translateX(-30px)',
    right: 'translateX(30px)',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0)' : directionMap[direction] || directionMap.up,
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
