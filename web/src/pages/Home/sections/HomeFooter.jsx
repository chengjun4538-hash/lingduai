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

import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Youtube, Github, Mail } from 'lucide-react';

/* -------------------- 自定义 SVG 图标 -------------------- */

/** Discord 官方图标 */
const DiscordIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor'>
    <path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
  </svg>
);

/** 微信图标 */
const WechatIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor'>
    <path d='M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-3.898-6.348-7.597-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.746 4.14 6.826 4.14.802 0 1.684-.094 2.617-.3a.71.71 0 0 1 .579.086l1.573.924a.285.285 0 0 0 .139.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.063-6.122zm-3.89 3.361c.532 0 .964.441.964.983a.963.963 0 0 1-.964.983.963.963 0 0 1-.965-.983c0-.542.432-.983.965-.983zm4.844 0c.533 0 .964.441.964.983a.963.963 0 0 1-.964.983.963.963 0 0 1-.965-.983c0-.542.431-.983.965-.983z' />
  </svg>
);

/* -------------------- 微信二维码弹出框 -------------------- */

const WechatPopup = ({ qrcode, label }) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = () => {
    clearTimeout(timerRef.current);
    setVisible(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setVisible(false), 150);
  };

  return (
    <div className='relative' onMouseEnter={show} onMouseLeave={hide}>
      <button
          className='w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer border-none bg-transparent'
        aria-label={label || '微信'}
      >
        <WechatIcon size={18} />
      </button>
      {visible && (
        <div
          className='absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50'
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          {/* 箭头 */}
          <div className='absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0'
            style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1f2937' }}
          />
          <div className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 shadow-2xl'>
            <img
              src={qrcode}
              alt='微信二维码'
              className='w-32 h-32 rounded-lg object-contain'
            />
            <p className='text-xs text-zinc-500 text-center mt-2'>扫码添加微信</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------- 社交图标映射 -------------------- */

const SOCIAL_ICONS = {
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  github: Github,
  email: Mail,
  mail: Mail,
  discord: DiscordIcon,
};

/* -------------------- 单个社交链接图标按钮 -------------------- */

const SocialLink = ({ item }) => {
  const { type, url, label, qrcode } = item;

  // 微信特殊处理（弹出二维码）
  if ((type === 'wechat' || type === 'weixin') && qrcode) {
    return <WechatPopup qrcode={qrcode} label={label} />;
  }

  // 邮件链接
  const href = type === 'email' || type === 'mail'
    ? (url?.startsWith('mailto:') ? url : `mailto:${url}`)
    : url;

  const IconComp = SOCIAL_ICONS[type?.toLowerCase()] || null;

  if (!IconComp) return null;

  return (
    <a
      href={href}
      target={href?.startsWith('mailto:') ? undefined : '_blank'}
      rel='noopener noreferrer'
      aria-label={label || type}
      className='w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all duration-200'
    >
      <IconComp size={18} />
    </a>
  );
};

/* -------------------- 页脚链接列 -------------------- */

const FooterColumn = ({ column }) => {
  return (
    <div className='min-w-[120px]'>
      <h4 className='text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4'>
        {column.title}
      </h4>
      <ul className='space-y-3'>
        {(column.links || []).map((link, idx) => {
          const isExternal = link.external || link.url?.startsWith('http') || link.url?.startsWith('mailto:');
          if (isExternal) {
            return (
              <li key={idx}>
                <a
                  href={link.url}
                  target={link.url?.startsWith('mailto:') ? undefined : '_blank'}
                  rel='noopener noreferrer'
                  className='text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors duration-200'
                >
                  {link.label}
                </a>
              </li>
            );
          }
          return (
            <li key={idx}>
              <Link
                to={link.url || '#'}
                className='text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors duration-200'
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

/* -------------------- 主页脚组件 -------------------- */

/**
 * HomeFooter — 首页富媒体页脚
 *
 * config 结构（来自 site-config.json 的 footer 字段）：
 * {
 *   copyright: "© 2026 My Company. 保留所有权利。",
 *   socials: [
 *     { type: "twitter", url: "https://x.com/...", label: "Twitter" },
 *     { type: "youtube", url: "https://youtube.com/...", label: "YouTube" },
 *     { type: "discord", url: "https://discord.gg/...", label: "Discord" },
 *     { type: "github",  url: "https://github.com/...", label: "GitHub" },
 *     { type: "email",   url: "hi@example.com",         label: "邮箱" },
 *     { type: "wechat",  qrcode: "https://cdn.example.com/qr.png", label: "微信" }
 *   ],
 *   columns: [
 *     {
 *       title: "热门产品",
 *       links: [
 *         { label: "GPT-4o",   url: "/pricing" },
 *         { label: "Claude 4", url: "/pricing" }
 *       ]
 *     },
 *     {
 *       title: "公司",
 *       links: [
 *         { label: "关于我们", url: "/about" },
 *         { label: "联系我们", url: "mailto:hi@example.com", external: true }
 *       ]
 *     }
 *   ]
 * }
 */
const HomeFooter = ({ config }) => {
  const {
    copyright = '',
    socials = [],
    columns = [],
    newApiLink = true,
  } = config || {};

  return (
    <footer
      className='border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#050505]'
    >
      <div className='max-w-[1200px] mx-auto px-6 pt-12 pb-8'>
        {/* 主要内容区 */}
        <div className='flex flex-col md:flex-row md:justify-between gap-10 mb-10'>
          {/* 左侧：版权 + 社交图标 */}
          <div className='flex flex-col gap-5'>
            {copyright && (
              <p className='text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed'>
                {copyright}
              </p>
            )}
            {socials.length > 0 && (
              <div className='flex items-center gap-1 flex-wrap'>
                {socials.map((item, idx) => (
                  <SocialLink key={idx} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* 右侧：链接列 */}
          {columns.length > 0 && (
            <div className='flex flex-wrap gap-10 md:gap-14'>
              {columns.map((col, idx) => (
                <FooterColumn key={idx} column={col} />
              ))}
            </div>
          )}
        </div>

        {/* 底部分隔线 + New API 来源 */}
        <div className='border-t border-zinc-200 dark:border-zinc-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3'>
          <p className='text-xs text-zinc-400 dark:text-zinc-600'>
            {copyright ? '' : `© ${new Date().getFullYear()} All rights reserved.`}
          </p>
          {newApiLink !== false && (
            <p className='text-xs text-zinc-400 dark:text-zinc-600'>
              Powered by{' '}
              <a
                href='https://github.com/QuantumNous/new-api'
                target='_blank'
                rel='noopener noreferrer'
                className='text-zinc-500 hover:text-zinc-300 transition-colors'
              >
                New API
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
