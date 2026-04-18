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

import React, { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { getFooterHTML, getLogo, getSystemName } from '../../helpers';
import { StatusContext } from '../../context/Status';
import { footerConfig } from '../../pages/Home/homeConfig';
import { IconGithubLogo } from '@douyinfe/semi-icons';

const FooterBar = () => {
  const { t } = useTranslation();
  const [footer, setFooter] = useState(getFooterHTML());
  const systemName = getSystemName();
  const logo = getLogo();
  const [statusState] = useContext(StatusContext);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const footer_html = localStorage.getItem('footer_html');
    if (footer_html) {
      setFooter(footer_html);
    }
  }, []);

  /* 自定义 footer HTML（管理员通过后台配置）优先展示 */
  if (footer) {
    return (
      <footer className='border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 py-4 px-6'>
        <div className='max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4'>
          <div
            className='custom-footer na-cb6feafeb3990c78 text-sm text-zinc-500'
            dangerouslySetInnerHTML={{ __html: footer }}
          />
          <div className='text-sm text-zinc-500 flex-shrink-0'>
            <span>{t('设计与开发由')} </span>
            <a
              href='https://github.com/QuantumNous/new-api'
              target='_blank'
              rel='noopener noreferrer'
              className='text-green-500 hover:text-green-400 font-medium transition-colors'
            >
              New API
            </a>
          </div>
        </div>
      </footer>
    );
  }

  /* 默认精简页脚 — 只保留版权行 */
  return (
    <footer className='border-t border-zinc-800 bg-zinc-950'>
      <div className='max-w-[1100px] mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4'>
        <p className='text-xs text-zinc-400'>
          © {currentYear} {systemName}. {t('版权所有')}
        </p>
        <div className='flex items-center gap-4'>
          <a
            href='https://github.com/QuantumNous/new-api'
            target='_blank'
            rel='noopener noreferrer'
            className='text-zinc-400 hover:text-white transition-colors'
            aria-label='GitHub'
          >
            <IconGithubLogo size='small' />
          </a>
          <span className='text-xs text-zinc-400'>
            {t('设计与开发由')}{' '}
            <a
              href='https://github.com/QuantumNous/new-api'
              target='_blank'
              rel='noopener noreferrer'
              className='text-indigo-400 hover:text-indigo-300 transition-colors'
            >
              New API
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default FooterBar;
