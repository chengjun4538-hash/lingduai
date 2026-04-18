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

import { useState, useEffect } from 'react';
import defaultSiteConfig from '../../config/defaultSiteConfig';

// 模块级缓存，避免重复 fetch
let _cached = null;
let _promise = null;

const isPlainObject = (value) =>
  Object.prototype.toString.call(value) === '[object Object]';

const getCacheBuster = () => Math.floor(Date.now() / 60000);

const mergeSiteConfig = (baseConfig, overrideConfig) => {
  if (!isPlainObject(baseConfig)) {
    return isPlainObject(overrideConfig)
      ? mergeSiteConfig({}, overrideConfig)
      : overrideConfig;
  }
  if (!isPlainObject(overrideConfig)) {
    return baseConfig;
  }

  const merged = { ...baseConfig };
  Object.keys(overrideConfig).forEach((key) => {
    const baseValue = baseConfig[key];
    const overrideValue = overrideConfig[key];
    merged[key] =
      isPlainObject(baseValue) && isPlainObject(overrideValue)
        ? mergeSiteConfig(baseValue, overrideValue)
        : overrideValue;
  });
  return merged;
};

const fetchDatabaseSiteConfig = async () => {
  try {
    const response = await fetch(
      `/api/home_page_content?_=${getCacheBuster()}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    const rawConfig =
      typeof payload?.data === 'string' ? payload.data.trim() : '';
    if (!payload?.success || rawConfig === '') {
      return null;
    }
    const parsed = JSON.parse(rawConfig);
    if (!isPlainObject(parsed)) {
      console.warn('[useSiteConfig] 数据库站点配置不是 JSON 对象，已忽略');
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn(
      '[useSiteConfig] 加载数据库站点配置失败，已回退到内置配置:',
      err,
    );
    return null;
  }
};

export const resetSiteConfigCache = () => {
  _cached = null;
  _promise = null;
};

/**
 * 读取站点配置的 React Hook。
 * 优先读取数据库中的 HomePageContent JSON 配置，再与前端内置默认配置合并。
 * 首次调用发起网络请求，后续调用直接返回内存缓存。
 * 返回 null 表示尚未加载完成，返回 {} 表示加载失败（静默降级）。
 */
export const useSiteConfig = () => {
  const [config, setConfig] = useState(_cached);

  useEffect(() => {
    if (_cached !== null) {
      setConfig(_cached);
      return;
    }
    if (!_promise) {
      _promise = fetchDatabaseSiteConfig()
        .then((databaseConfig) => {
          const embeddedConfig = mergeSiteConfig({}, defaultSiteConfig);
          const data = databaseConfig
            ? mergeSiteConfig(embeddedConfig, databaseConfig)
            : embeddedConfig;
          _cached = data;
          return data;
        })
        .catch((err) => {
          console.warn('[useSiteConfig] 加载站点配置失败:', err);
          _cached = {};
          return {};
        });
    }
    _promise.then(setConfig);
  }, []);

  return config;
};
