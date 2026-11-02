"use client";

import { useState } from "react";

type SiteCount = { name: string; count: number };
type KeyRow = {
  id: string;
  name: string;
  mask: string;
  createdAt: string;
  status: string;
};
type SiteRow = {
  id: string;
  siteName: string;
  domain: string;
  createdAt: string;
};

type ModalKind = "today" | "total" | "keys" | "sites" | null;

export function OverviewStats(props: {
  todayLabel: string;
  todayTotal: number;
  todayBySite: SiteCount[];
  allTotal: number;
  allBySite: SiteCount[];
  keys: KeyRow[];
  sites: SiteRow[];
  siteCount: number;
}) {
  const [modal, setModal] = useState<ModalKind>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button type="button" onClick={() => setModal("today")} className="stat-card">
          <p className="stat-label">今日发件量</p>
          <p className="stat-value text-slate-900">{props.todayTotal}</p>
          <p className="stat-hint">点按查看明细</p>
        </button>
        <button type="button" onClick={() => setModal("total")} className="stat-card">
          <p className="stat-label">累计发件</p>
          <p className="stat-value text-slate-900">{props.allTotal}</p>
          <p className="stat-hint">点按查看明细</p>
        </button>
        <button type="button" onClick={() => setModal("keys")} className="stat-card">
          <p className="stat-label">生效密钥</p>
          <p className="stat-value text-emerald-600">
            {props.keys.filter((k) => k.status === "active").length}
          </p>
          <p className="stat-hint">点按查看明细</p>
        </button>
        <button type="button" onClick={() => setModal("sites")} className="stat-card">
          <p className="stat-label">网站数量</p>
          <p className="stat-value text-sky-600">{props.siteCount}</p>
          <p className="stat-hint">点按查看明细</p>
        </button>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
          onClick={() => setModal(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {modal === "today" && (
              <>
                <h3 className="text-lg font-bold text-slate-900">今日发件 · {props.todayLabel}</h3>
                <ul className="mt-4 space-y-2">
                  {props.todayBySite.length === 0 && (
                    <li className="text-sm text-slate-500">今日暂无发件</li>
                  )}
                  {props.todayBySite.map((s) => (
                    <li
                      key={s.name}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">{s.name}</span>
                      <span className="text-slate-600">{s.count} 条</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">
                  总计：今日总发件量 {props.todayTotal}
                </p>
              </>
            )}

            {modal === "total" && (
              <>
                <h3 className="text-lg font-bold text-slate-900">累计发件（成立以来）</h3>
                <ul className="mt-4 space-y-2">
                  {props.allBySite.length === 0 && (
                    <li className="text-sm text-slate-500">暂无记录</li>
                  )}
                  {props.allBySite.map((s) => (
                    <li
                      key={s.name}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">{s.name}</span>
                      <span className="text-slate-600">{s.count} 条</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-900">
                  总发件量：{props.allTotal}
                </p>
              </>
            )}

            {modal === "keys" && (
              <>
                <h3 className="text-lg font-bold text-slate-900">生效密钥</h3>
                <ul className="mt-4 space-y-2">
                  {props.keys.length === 0 && (
                    <li className="text-sm text-slate-500">暂无密钥</li>
                  )}
                  {props.keys.map((k) => (
                    <li key={k.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <p className="font-medium text-slate-900">{k.name}</p>
                      <p className="font-mono text-xs text-slate-500">{k.mask}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(k.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {modal === "sites" && (
              <>
                <h3 className="text-lg font-bold text-slate-900">网站数量</h3>
                <ul className="mt-4 space-y-2">
                  {props.sites.length === 0 && props.keys.length === 0 && (
                    <li className="text-sm text-slate-500">暂无绑定网站，可在「设置」添加</li>
                  )}
                  {props.sites.map((s) => (
                    <li key={s.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <p className="font-medium text-slate-900">{s.siteName}</p>
                      <p className="text-xs text-slate-500">{s.domain}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(s.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </li>
                  ))}
                  {props.sites.length === 0 &&
                    props.keys.map((k) => (
                      <li key={k.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                        <p className="font-medium text-slate-900">{k.name}</p>
                        <p className="text-xs text-slate-500">来自 API 密钥昵称</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(k.createdAt).toLocaleString("zh-CN")}
                        </p>
                      </li>
                    ))}
                </ul>
              </>
            )}

            <button
              type="button"
              className="btn-secondary mt-5 w-full"
              onClick={() => setModal(null)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
