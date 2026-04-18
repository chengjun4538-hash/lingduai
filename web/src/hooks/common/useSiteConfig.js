import { useState, useEffect } from 'react';

// 模块级缓存，避免重复 fetch
let _cached = null;
let _promise = null;

/**
 * 读取 /public/site-config.json 的 React Hook。
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
      _promise = fetch('/site-config.json?_=' + Math.floor(Date.now() / 60000)) // 1 分钟缓存
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((data) => {
          _cached = data;
          return data;
        })
        .catch((err) => {
          console.warn('[useSiteConfig] 加载 site-config.json 失败:', err);
          _cached = {};
          return {};
        });
    }
    _promise.then(setConfig);
  }, []);

  return config;
};
