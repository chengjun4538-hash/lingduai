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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import SkeletonWrapper from '../components/SkeletonWrapper';
import { useSiteConfig } from '../../../hooks/common/useSiteConfig';

/* ─── 通用下拉菜单容器 ────────────────────────────── */
/* 面板通过 React Portal 挂载到 document.body，避免 header 的
   backdrop-filter compositing 层将 position:absolute 子元素裁剪到 header 高度内 */
const NavDropdown = ({ label, children, isMobile }) => {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const closeTimer = useRef(null);

  /* 计算面板 fixed 定位坐标（相对视口） */
  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
      transform: 'translateX(-50%)',
    });
  }, []);

  /* open 时计算坐标，并监听 resize / scroll */
  useEffect(() => {
    if (!open) return;
    calcPos();
    window.addEventListener('resize', calcPos);
    window.addEventListener('scroll', calcPos, true);
    return () => {
      window.removeEventListener('resize', calcPos);
      window.removeEventListener('scroll', calcPos, true);
    };
  }, [open, calcPos]);

  /* 点击区域以外自动关闭 */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        !e.target.closest('.nav-dropdown-panel')
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    clearTimeout(closeTimer.current);
    setOpen(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  }, [isMobile]);

  const handlePanelEnter = useCallback(() => {
    if (isMobile) return;
    clearTimeout(closeTimer.current);
  }, [isMobile]);

  /* 面板通过 Portal 渲染到 body，使用 position: fixed 定位 */
  const panel = open
    ? createPortal(
        <div
          className='nav-dropdown-panel nav-dropdown-panel-open'
          style={panelStyle}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children}
        </div>,
        document.body,
      )
    : null;

  return (
    <div
      className='nav-dropdown'
      ref={wrapRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={btnRef}
        className='nav-link-btn'
        onClick={() => isMobile && setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          size={13}
          className={`nav-chevron ${open ? 'nav-chevron-open' : ''}`}
        />
      </button>
      {panel}
    </div>
  );
};

/* ─── 模型下拉内容 ────────────────────────────────── */
const ModelDropdownContent = ({ models, viewAllPath }) => (
  <div className='nav-model-dropdown'>
    <div className='nav-model-grid'>
      {models.map((m) => {
        // 支持外部 URL（url 字段）和内部路由（path 字段）
        const isExternal = m.url && m.url.startsWith('http');
        const content = (
          <>
            <div className='nav-model-name-row'>
              <span className='nav-model-name'>{m.name}</span>
              {m.badge && <span className='nav-model-badge'>{m.badge}</span>}
            </div>
            <span className='nav-model-provider'>{m.provider}</span>
            {m.description && (
              <span className='nav-model-desc'>{m.description}</span>
            )}
          </>
        );
        return isExternal ? (
          <a
            key={m.name}
            href={m.url}
            target='_blank'
            rel='noopener noreferrer'
            className='nav-model-item'
          >
            {content}
          </a>
        ) : (
          <Link
            key={m.name}
            to={m.url || m.path || '/console'}
            className='nav-model-item'
          >
            {content}
          </Link>
        );
      })}
    </div>
    {viewAllPath && (
      <div className='nav-model-footer'>
        <Link to={viewAllPath} className='nav-model-view-all'>
          查看全部模型 →
        </Link>
      </div>
    )}
  </div>
);

/* ─── 关于我们下拉内容 ────────────────────────────── */
const AboutDropdownContent = ({ items }) => (
  <div className='nav-about-dropdown'>
    {items.map((item) =>
      item.external ? (
        <a
          key={item.label}
          href={item.url}
          target='_blank'
          rel='noopener noreferrer'
          className='nav-about-item'
        >
          {item.label}
        </a>
      ) : (
        <Link key={item.label} to={item.url} className='nav-about-item'>
          {item.label}
        </Link>
      ),
    )}
  </div>
);

/* ─── 主导航组件 ──────────────────────────────────── */
const Navigation = ({ isMobile, isLoading, userState, docsLink }) => {
  const siteConfig = useSiteConfig();
  const nav = siteConfig?.nav;

  const consoleTarget = userState?.user ? '/console' : '/login';
  const docsUrl = nav?.docs?.url || docsLink || '';

  const navLinkClass =
    'flex-shrink-0 flex items-center gap-1 font-medium rounded-md transition-colors duration-200 px-3 py-2 hover:text-zinc-900 dark:hover:text-white text-zinc-600 dark:text-zinc-300 text-sm';

  const renderContent = () => {
    if (!nav) return null;

    return (
      <>
        {/* 控制台 */}
        <Link to={consoleTarget} className={navLinkClass}>
          {nav.console?.label ?? '控制台'}
        </Link>

        {/* 对话 */}
        {nav.chat?.models?.length > 0 && (
          <NavDropdown label={nav.chat.label ?? '对话'} isMobile={isMobile}>
            <ModelDropdownContent
              models={nav.chat.models}
              viewAllPath={nav.chat.viewAllPath}
            />
          </NavDropdown>
        )}

        {/* 图像 */}
        {nav.image?.models?.length > 0 && (
          <NavDropdown label={nav.image.label ?? '图像'} isMobile={isMobile}>
            <ModelDropdownContent
              models={nav.image.models}
              viewAllPath={nav.image.viewAllPath}
            />
          </NavDropdown>
        )}

        {/* 视频 */}
        {nav.video?.models?.length > 0 && (
          <NavDropdown label={nav.video.label ?? '视频'} isMobile={isMobile}>
            <ModelDropdownContent
              models={nav.video.models}
              viewAllPath={nav.video.viewAllPath}
            />
          </NavDropdown>
        )}

        {/* 文档 */}
        {docsUrl && (
          <a
            href={docsUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={navLinkClass}
          >
            {nav.docs?.label ?? '文档'}
          </a>
        )}

        {/* 关于我们 */}
        {nav.about?.items?.length > 0 && (
          <NavDropdown label={nav.about.label ?? '关于我们'} isMobile={isMobile}>
            <AboutDropdownContent items={nav.about.items} />
          </NavDropdown>
        )}
      </>
    );
  };

  return (
    <nav className='flex flex-1 items-center gap-0 lg:gap-1 mx-2 md:mx-4 overflow-visible'>
      <SkeletonWrapper
        loading={isLoading || siteConfig === null}
        type='navigation'
        count={5}
        width={60}
        height={16}
        isMobile={isMobile}
      >
        {renderContent()}
      </SkeletonWrapper>
    </nav>
  );
};

export default Navigation;
